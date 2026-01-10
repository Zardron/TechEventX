import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import bcrypt from "bcryptjs";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get user profile
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
        }).select('-password');

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return handleSuccessResponse("Profile retrieved successfully", {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: (user as any).avatar,
                role: user.role,
                organizerId: user.organizerId?.toString(),
                banned: user.banned || false,
                notificationPreferences: user.notificationPreferences || {
                    emailBookingConfirmations: true,
                    emailEventReminders: true,
                    emailEventUpdates: true,
                    emailPromotions: true,
                    emailNewsletter: true,
                },
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT - Update user profile
export async function PUT(req: NextRequest): Promise<NextResponse> {
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

        const body = await req.json();
        const { name, currentPassword, newPassword, notificationPreferences } = body;

        // Update name if provided
        if (name !== undefined) {
            const trimmedName = name.trim();
            if (trimmedName.length === 0 || trimmedName.length > 100) {
                return NextResponse.json(
                    { message: "Name must be between 1 and 100 characters" },
                    { status: 400 }
                );
            }
            user.name = trimmedName;
        }

        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { message: "Current password is required to change password" },
                    { status: 400 }
                );
            }

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { message: "Current password is incorrect" },
                    { status: 400 }
                );
            }

            // Validate new password
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return NextResponse.json(
                    { message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)" },
                    { status: 400 }
                );
            }

            // Set new password (will be hashed by pre-save hook)
            user.password = newPassword;
        }

        // Update notification preferences if provided
        if (notificationPreferences) {
            user.notificationPreferences = {
                emailBookingConfirmations: notificationPreferences.emailBookingConfirmations ?? user.notificationPreferences?.emailBookingConfirmations ?? true,
                emailEventReminders: notificationPreferences.emailEventReminders ?? user.notificationPreferences?.emailEventReminders ?? true,
                emailEventUpdates: notificationPreferences.emailEventUpdates ?? user.notificationPreferences?.emailEventUpdates ?? true,
                emailPromotions: notificationPreferences.emailPromotions ?? user.notificationPreferences?.emailPromotions ?? true,
                emailNewsletter: notificationPreferences.emailNewsletter ?? user.notificationPreferences?.emailNewsletter ?? true,
            };
        }

        await user.save();

        return handleSuccessResponse("Profile updated successfully", {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

