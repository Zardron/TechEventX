import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Event from "@/database/event.model";
import Booking from "@/database/booking.model";
import Ticket from "@/database/ticket.model";
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

        if (user.role !== 'organizer' && user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Organizer access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        console.log(`🔍 Attendees API - Request received, eventId: ${eventId || 'none (all events)'}, user: ${user._id}, organizerId: ${user.organizerId || 'none'}`);

        let events;
        if (eventId && eventId.trim() !== '') {
            const event = await Event.findById(eventId);
            if (!event) {
                return NextResponse.json(
                    { message: "Event not found" },
                    { status: 404 }
                );
            }
            
            // Check if user owns this event (handle both User and Organizer references)
            if (user.role === 'organizer') {
                const userId = user._id instanceof mongoose.Types.ObjectId 
                    ? user._id 
                    : new mongoose.Types.ObjectId(user._id.toString());
                const userOrganizerId = user.organizerId ? (user.organizerId instanceof mongoose.Types.ObjectId 
                    ? user.organizerId 
                    : new mongoose.Types.ObjectId(user.organizerId.toString())) : null;
                
                const eventOrganizerId = event.organizerId ? (event.organizerId instanceof mongoose.Types.ObjectId 
                    ? event.organizerId 
                    : new mongoose.Types.ObjectId(event.organizerId.toString())) : null;
                
                // Check if event belongs to user (either directly or through organizerId)
                const ownsEvent = eventOrganizerId && (
                    eventOrganizerId.toString() === userId.toString() || 
                    (userOrganizerId && eventOrganizerId.toString() === userOrganizerId.toString())
                );
                
                if (!ownsEvent) {
                    return NextResponse.json(
                        { message: "Forbidden - You don't own this event" },
                        { status: 403 }
                    );
                }
            }
            events = [event];
        } else {
            // Build query to find events owned by this organizer (handle both User and Organizer references)
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
            
            events = await Event.find({
                $or: queryConditions
            });
        }

        // Handle empty events array
        if (events.length === 0) {
            console.log(`🔍 Attendees API - No events found for organizer`);
            return handleSuccessResponse("Attendees retrieved successfully", { attendees: [] });
        }

        const eventIds = events.map(e => {
            const id = e._id instanceof mongoose.Types.ObjectId 
                ? e._id 
                : new mongoose.Types.ObjectId(e._id.toString());
            return id;
        });

        console.log(`🔍 Attendees API - Found ${events.length} events, looking for bookings with eventIds:`, eventIds.map(id => id.toString()));

        // Get all bookings for these events, populate user info
        const bookings = await Booking.find({
            eventId: { $in: eventIds }
        })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

        console.log(`🔍 Attendees API - Found ${bookings.length} bookings for ${eventIds.length} events`);
        
        // Debug: Log first few bookings to see their eventIds
        if (bookings.length > 0) {
            console.log(`🔍 Sample booking eventIds:`, bookings.slice(0, 3).map(b => ({
                bookingId: b._id.toString(),
                eventId: b.eventId.toString(),
                email: b.email
            })));
        }

        // Get tickets for these bookings
        const bookingIds = bookings.map(b => b._id);
        const tickets = await Ticket.find({
            bookingId: { $in: bookingIds }
        });

        // Create a map of bookingId -> ticket
        const ticketMap = new Map();
        tickets.forEach(ticket => {
            ticketMap.set(ticket.bookingId.toString(), ticket);
        });

        // Format attendees
        const attendees = bookings.map(booking => {
            const ticket = ticketMap.get(booking._id.toString());
            const bookingUser = booking.userId as any;
            return {
                id: booking._id.toString(),
                bookingId: booking._id.toString(),
                name: bookingUser?.name || booking.email?.split('@')[0] || 'N/A',
                email: booking.email,
                ticketNumber: ticket?.ticketNumber,
                ticketStatus: ticket?.status || 'active',
                bookedAt: booking.createdAt,
                paymentStatus: booking.paymentStatus,
                receiptUrl: booking.receiptUrl,
                paymentMethod: booking.paymentMethod,
            };
        });

        return handleSuccessResponse("Attendees retrieved successfully", { attendees });
    } catch (error) {
        return handleApiError(error);
    }
}

