import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Notification from "@/database/notification.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get user notifications
export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const tokenPayload = verifyToken(req);
        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await User.findOne({
            _id: tokenPayload.id,
            deleted: { $ne: true }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query
        const query: any = { userId: user._id };
        if (unreadOnly) {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        const unreadCount = await Notification.countDocuments({
            userId: user._id,
            read: false,
        });

        const formattedNotifications = notifications.map((notif: any) => ({
            id: notif._id.toString(),
            type: notif.type,
            title: notif.title,
            message: notif.message,
            link: notif.link,
            read: notif.read,
            readAt: notif.readAt,
            createdAt: notif.createdAt,
            metadata: notif.metadata,
        }));

        return handleSuccessResponse("Notifications retrieved successfully", {
            notifications: formattedNotifications,
            unreadCount,
            count: formattedNotifications.length,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const tokenPayload = verifyToken(req);
        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await User.findOne({
            _id: tokenPayload.id,
            deleted: { $ne: true }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const { notificationIds, markAllAsRead } = await req.json();

        if (markAllAsRead) {
            // Mark all as read
            await Notification.updateMany(
                { userId: user._id, read: false },
                { read: true, readAt: new Date() }
            );
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await Notification.updateMany(
                { _id: { $in: notificationIds }, userId: user._id },
                { read: true, readAt: new Date() }
            );
        } else {
            return NextResponse.json(
                { message: "notificationIds array or markAllAsRead flag is required" },
                { status: 400 }
            );
        }

        return handleSuccessResponse("Notifications marked as read", {});
    } catch (error) {
        return handleApiError(error);
    }
}

