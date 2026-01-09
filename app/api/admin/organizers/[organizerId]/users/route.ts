import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Organizer from "@/database/organizer.model";
import Event from "@/database/event.model";
import Booking from "@/database/booking.model";
import mongoose from "mongoose";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ organizerId: string }> }
): Promise<NextResponse> {
    try {
        await connectDB();

        // Verify token
        const tokenPayload = verifyToken(req);

        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized - Invalid or missing token" },
                { status: 401 }
            );
        }

        // Get user to check if they are admin (exclude soft-deleted users)
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

        // Check if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        const { organizerId } = await params;

        if (!organizerId) {
            return NextResponse.json(
                { message: "Organizer ID is required" },
                { status: 400 }
            );
        }

        // Validate organizerId format
        if (!mongoose.Types.ObjectId.isValid(organizerId)) {
            return NextResponse.json(
                { message: "Invalid organizer ID format" },
                { status: 400 }
            );
        }

        // Find the organizer to get the organizer name
        const organizer = await Organizer.findOne({
            _id: organizerId,
            deleted: { $ne: true }
        });

        if (!organizer) {
            return NextResponse.json(
                { message: "Organizer not found" },
                { status: 404 }
            );
        }

        // Find all users associated with this organizer by organizerId
        const organizerObjectId = new mongoose.Types.ObjectId(organizerId);
        const usersByOrganizerId = await User.find({
            organizerId: organizerObjectId,
            deleted: { $ne: true }
        }).select('-password').sort({ createdAt: -1 });

        // Find all events organized by this organizer (by name match)
        const events = await Event.find({
            organizer: organizer.name
        });

        // Get all event IDs
        const eventIds = events.map(event => event._id);

        // Find all bookings for these events
        const bookings = await Booking.find({
            eventId: { $in: eventIds }
        });

        // Get unique emails from bookings
        const bookingEmails = [...new Set(bookings.map(booking => booking.email))];

        // Find all users who have booked events for this organizer (exclude soft-deleted users)
        const usersByBookings = bookingEmails.length > 0
            ? await User.find({
                email: { $in: bookingEmails },
                deleted: { $ne: true }
            }).select('-password').sort({ createdAt: -1 })
            : [];

        // Combine all users and remove duplicates
        const allUserIds = new Set<string>();
        const allUsers: any[] = [];

        // Add users by organizerId first (these are directly associated)
        usersByOrganizerId.forEach(user => {
            const userId = user._id.toString();
            if (!allUserIds.has(userId)) {
                allUserIds.add(userId);
                allUsers.push(user);
            }
        });

        // Add users who booked events (if not already in the list)
        usersByBookings.forEach(user => {
            const userId = user._id.toString();
            if (!allUserIds.has(userId)) {
                allUserIds.add(userId);
                allUsers.push(user);
            }
        });

        // Sort by createdAt descending
        allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return handleSuccessResponse("Users fetched successfully", allUsers);
    } catch (error) {
        return handleApiError(error);
    }
}

