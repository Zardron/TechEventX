import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Event from "@/database/event.model";
import Booking from "@/database/booking.model";
import Organizer from "@/database/organizer.model";
import Subscription from "@/database/subscription.model";
import Plan from "@/database/plan.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { handleImageUpload } from "@/lib/cloudinary";
import mongoose from "mongoose";

// GET - Get organizer's events
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

        // Logic: Get user's organizerId, then find events where event.organizerId matches the Organizer
        // The event.organizerId should match user.organizerId (which points to the Organizer document)
        
        // Build query to match events
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
            console.log("🔵 Looking for events with organizerId (Organizer):", organizerId.toString());
        }
        
        // Also check for events where organizerId points directly to the User (backward compatibility)
        const userId = user._id instanceof mongoose.Types.ObjectId 
            ? user._id 
            : new mongoose.Types.ObjectId(user._id.toString());
        queryConditions.push({ organizerId: userId });
        console.log("🔵 Looking for events with organizerId (User):", userId.toString());
        
        const events = await Event.find({
            $or: queryConditions
        }).sort({ createdAt: -1 });
        
        console.log("🔵 Found events count:", events.length);

        // Get event IDs to query bookings
        const eventIds = events.map(e => e._id);

        // Count confirmed bookings for each event
        // Confirmed bookings are those with paymentStatus='confirmed' or no paymentStatus (free events)
        const confirmedBookingsCounts = await Booking.aggregate([
            {
                $match: {
                    eventId: { $in: eventIds },
                    $or: [
                        { paymentStatus: 'confirmed' },
                        { paymentStatus: { $exists: false } },
                        { paymentStatus: null }
                    ]
                }
            },
            {
                $group: {
                    _id: '$eventId',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map for quick lookup
        const bookingsMap = new Map(
            confirmedBookingsCounts.map(item => [item._id.toString(), item.count])
        );

        const eventsData = events.map(event => {
            const eventIdStr = event._id.toString();
            const confirmedBookings = bookingsMap.get(eventIdStr) || 0;
            
            return {
                id: eventIdStr,
                title: event.title,
                slug: event.slug,
                description: event.description,
                image: event.image,
                date: event.date,
                time: event.time,
                location: event.location,
                mode: event.mode,
                status: event.status,
                capacity: event.capacity,
                availableTickets: event.availableTickets,
                confirmedBookings: confirmedBookings, // Add confirmed bookings count
                isFree: event.isFree,
                price: event.price,
                paymentMethods: event.paymentMethods || [],
                paymentDetails: event.paymentDetails || {},
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
            };
        });

        return handleSuccessResponse("Events retrieved successfully", { events: eventsData });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST - Create a new event (organizer)
export async function POST(req: NextRequest): Promise<NextResponse> {
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

        const formData = await req.formData();
        const eventData = Object.fromEntries(formData.entries());

        // Handle image upload
        const imageSource = formData.get('imageSource') as string;
        let imageUrl: string;

        if (imageSource === 'url') {
            const providedUrl = formData.get('imageUrl') as string;
            if (!providedUrl || typeof providedUrl !== 'string' || providedUrl.trim().length === 0) {
                return NextResponse.json(
                    { message: 'Image URL is required' },
                    { status: 400 }
                );
            }
            try {
                new URL(providedUrl.trim());
                imageUrl = providedUrl.trim();
            } catch {
                return NextResponse.json(
                    { message: 'Invalid image URL format' },
                    { status: 400 }
                );
            }
        } else {
            const file = formData.get('image') as File;
            if (!file || !(file instanceof File)) {
                return NextResponse.json(
                    { message: 'Image file is required' },
                    { status: 400 }
                );
            }
            const uploadResult = await handleImageUpload(file, 'TechEventX');
            if (!uploadResult.success) {
                return uploadResult.response;
            }
            imageUrl = uploadResult.url;
        }

        const tags = JSON.parse(formData.get('tags') as string || '[]');
        const agenda = JSON.parse(formData.get('agenda') as string || '[]');
        const capacity = formData.get('capacity') ? parseInt(formData.get('capacity') as string) : undefined;
        const isFree = formData.get('isFree') === 'true';
        const price = formData.get('price') ? parseInt(formData.get('price') as string) : undefined;

        // Check event limit based on organizer's plan (admins bypass this check)
        if (user.role !== 'admin') {
            const subscription = await Subscription.findOne({
                userId: user._id,
                status: { $in: ['active', 'trialing'] }
            }).populate('planId');

            let maxEvents: number | null = null;
            if (subscription && subscription.planId) {
                const plan = subscription.planId as any;
                maxEvents = plan.features?.maxEvents ?? null;
            } else {
                // If no subscription, check for Free plan (default)
                const freePlan = await Plan.findOne({ name: 'Free', isActive: true });
                if (freePlan) {
                    maxEvents = freePlan.features?.maxEvents ?? null;
                }
            }

            // Count all events for this organizer (regardless of status)
            const eventCount = await Event.countDocuments({
                organizerId: user._id
            });

            // Check if organizer has reached their event limit
            if (maxEvents !== null && eventCount >= maxEvents) {
                return NextResponse.json(
                    { 
                        message: `You have reached your event limit of ${maxEvents} events. Please upgrade your plan to create more events.` 
                    },
                    { status: 403 }
                );
            }
        }

        // Get organizer name from Organizer model if user has organizerId, otherwise use user name
        let organizerName = user.name;
        if (user.organizerId) {
            const organizer = await Organizer.findById(user.organizerId);
            if (organizer) {
                organizerName = organizer.name;
            }
        }

        // Determine event status: publish free events immediately, keep paid events as draft
        const eventStatus = isFree ? 'published' : 'draft';
        const eventDataToCreate: any = {
            ...eventData,
            image: imageUrl,
            tags,
            agenda,
            organizerId: user._id,
            organizer: organizerName, // Use organizer name instead of full user name
            capacity,
            isFree,
            price: isFree ? undefined : price,
            currency: 'php',
            status: eventStatus,
            waitlistEnabled: formData.get('waitlistEnabled') === 'true',
        };

        // Only set publishedAt if event is being published
        if (eventStatus === 'published') {
            eventDataToCreate.publishedAt = new Date();
        }

        const event = await Event.create(eventDataToCreate);

        return handleSuccessResponse('Event created successfully', { event }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}

