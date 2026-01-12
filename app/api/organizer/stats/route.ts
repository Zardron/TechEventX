import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Event from "@/database/event.model";
import Booking from "@/database/booking.model";
import Transaction from "@/database/transaction.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import mongoose from "mongoose";

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

        // Only organizers can access this
        if (user.role !== 'organizer' && user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Organizer access required" },
                { status: 403 }
            );
        }

        // Logic: Get user's organizerId, then find events where event.organizerId matches
        // Handle both cases:
        // 1. Events where organizerId = user.organizerId (events pointing to Organizer - current data structure)
        // 2. Events where organizerId = user._id (events pointing to User - backward compatibility)
        
        const queryConditions: any[] = [];
        
        // If user has organizerId, find events where organizerId matches the Organizer
        if (user.organizerId) {
            const organizerId = user.organizerId instanceof mongoose.Types.ObjectId
                ? user.organizerId
                : new mongoose.Types.ObjectId(user.organizerId.toString());
            queryConditions.push({ organizerId: organizerId });
        }
        
        // Also check for events where organizerId points directly to the User (backward compatibility)
        const userId = user._id instanceof mongoose.Types.ObjectId 
            ? user._id 
            : new mongoose.Types.ObjectId(user._id.toString());
        queryConditions.push({ organizerId: userId });
        
        // Get organizer's events
        const events = await Event.find({
            $or: queryConditions
        });

        const eventIds = events.map(e => e._id);

        // Get total bookings for organizer's events
        const bookings = await Booking.find({
            eventId: { $in: eventIds }
        });

        // Get revenue from transactions
        const transactions = await Transaction.find({
            eventId: { $in: eventIds },
            status: 'completed'
        });

        const totalRevenue = transactions.reduce((sum, t) => sum + (t.organizerRevenue || 0), 0);
        
        // Monthly revenue (current month)
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const monthlyTransactions = transactions.filter(t => 
            new Date(t.createdAt) >= currentMonth
        );
        const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + (t.organizerRevenue || 0), 0);

        // Upcoming events
        const today = new Date().toISOString().split('T')[0];
        const upcomingEvents = events.filter(e => e.date >= today && e.status === 'published');

        // Recent events (last 5)
        const recentEvents = events
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(e => ({
                id: e._id.toString(),
                title: e.title,
                date: e.date,
                bookings: bookings.filter(b => b.eventId.toString() === e._id.toString()).length,
                status: e.status,
            }));

        const stats = {
            totalEvents: events.length,
            upcomingEvents: upcomingEvents.length,
            totalBookings: bookings.length,
            totalRevenue,
            monthlyRevenue,
            recentEvents,
        };

        return handleSuccessResponse("Statistics retrieved successfully", stats);
    } catch (error) {
        return handleApiError(error);
    }
}

