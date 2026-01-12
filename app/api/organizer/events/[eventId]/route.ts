import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Event from "@/database/event.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { handleImageUpload } from "@/lib/cloudinary";

// GET - Get single event
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
): Promise<NextResponse> {
    try {
        await connectDB();

        const { eventId } = await params;
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

        const event = await Event.findById(eventId);

        if (!event) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 }
            );
        }

        // Verify organizer owns the event
        // Handle both cases: event.organizerId can point to user._id OR user.organizerId
        if (user.role === 'organizer') {
            const eventOrganizerId = event.organizerId?.toString();
            const userId = user._id.toString();
            const userOrganizerId = user.organizerId?.toString();
            
            // Check if event belongs to user (either via user._id or user.organizerId)
            const ownsEvent = eventOrganizerId === userId || (userOrganizerId && eventOrganizerId === userOrganizerId);
            
            if (!ownsEvent) {
                return NextResponse.json(
                    { message: "Forbidden - You don't own this event" },
                    { status: 403 }
                );
            }
        }

        return handleSuccessResponse("Event retrieved successfully", {
            event: {
                id: event._id.toString(),
                title: event.title,
                slug: event.slug,
                description: event.description,
                overview: event.overview,
                image: event.image,
                venue: event.venue,
                location: event.location,
                date: event.date,
                time: event.time,
                mode: event.mode,
                audience: event.audience,
                agenda: event.agenda,
                tags: event.tags,
                status: event.status,
                capacity: event.capacity,
                availableTickets: event.availableTickets,
                isFree: event.isFree,
                price: event.price,
                currency: event.currency,
                waitlistEnabled: event.waitlistEnabled,
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH - Update event
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
): Promise<NextResponse> {
    try {
        await connectDB();

        const { eventId } = await params;
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

        const event = await Event.findById(eventId);

        if (!event) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 }
            );
        }

        // Verify organizer owns the event
        // Handle both cases: event.organizerId can point to user._id OR user.organizerId
        if (user.role === 'organizer') {
            const eventOrganizerId = event.organizerId?.toString();
            const userId = user._id.toString();
            const userOrganizerId = user.organizerId?.toString();
            
            // Check if event belongs to user (either via user._id or user.organizerId)
            const ownsEvent = eventOrganizerId === userId || (userOrganizerId && eventOrganizerId === userOrganizerId);
            
            if (!ownsEvent) {
                return NextResponse.json(
                    { message: "Forbidden - You don't own this event" },
                    { status: 403 }
                );
            }
        }

        const formData = await req.formData();
        const updateData: any = {};

        // Update basic fields
        if (formData.get('title')) updateData.title = formData.get('title');
        if (formData.get('description')) updateData.description = formData.get('description');
        if (formData.get('overview')) updateData.overview = formData.get('overview');
        if (formData.get('venue')) updateData.venue = formData.get('venue');
        if (formData.get('location')) updateData.location = formData.get('location');
        if (formData.get('date')) updateData.date = formData.get('date');
        if (formData.get('time')) updateData.time = formData.get('time');
        if (formData.get('mode')) updateData.mode = formData.get('mode');
        if (formData.get('audience')) updateData.audience = formData.get('audience');
        if (formData.get('tags')) updateData.tags = JSON.parse(formData.get('tags') as string);
        if (formData.get('agenda')) updateData.agenda = JSON.parse(formData.get('agenda') as string);
        if (formData.get('capacity')) updateData.capacity = parseInt(formData.get('capacity') as string);
        if (formData.get('isFree')) updateData.isFree = formData.get('isFree') === 'true';
        if (formData.get('price')) updateData.price = parseInt(formData.get('price') as string);
        if (formData.get('waitlistEnabled')) updateData.waitlistEnabled = formData.get('waitlistEnabled') === 'true';
        if (formData.get('status')) {
            updateData.status = formData.get('status');
            if (formData.get('status') === 'published' && !event.publishedAt) {
                updateData.publishedAt = new Date();
            }
        }
        if (formData.get('paymentMethods')) {
            try {
                updateData.paymentMethods = JSON.parse(formData.get('paymentMethods') as string);
            } catch {
                // Invalid JSON, skip
            }
        }
        if (formData.get('paymentDetails')) {
            try {
                updateData.paymentDetails = JSON.parse(formData.get('paymentDetails') as string);
            } catch {
                // Invalid JSON, skip
            }
        }

        // Handle image update
        const imageSource = formData.get('imageSource') as string;
        if (imageSource === 'url') {
            const imageUrl = formData.get('imageUrl') as string;
            if (imageUrl) {
                try {
                    new URL(imageUrl);
                    updateData.image = imageUrl;
                } catch {
                    return NextResponse.json(
                        { message: 'Invalid image URL format' },
                        { status: 400 }
                    );
                }
            }
        } else if (imageSource === 'file') {
            const file = formData.get('image') as File;
            if (file && file instanceof File) {
                const uploadResult = await handleImageUpload(file, 'TechEventX');
                if (!uploadResult.success) {
                    return uploadResult.response;
                }
                updateData.image = uploadResult.url;
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, { new: true });

        return handleSuccessResponse("Event updated successfully", { event: updatedEvent });
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Delete event
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
): Promise<NextResponse> {
    try {
        await connectDB();

        const { eventId } = await params;
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

        const event = await Event.findById(eventId);

        if (!event) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 }
            );
        }

        // Verify organizer owns the event
        // Handle both cases: event.organizerId can point to user._id OR user.organizerId
        if (user.role === 'organizer') {
            const eventOrganizerId = event.organizerId?.toString();
            const userId = user._id.toString();
            const userOrganizerId = user.organizerId?.toString();
            
            // Check if event belongs to user (either via user._id or user.organizerId)
            const ownsEvent = eventOrganizerId === userId || (userOrganizerId && eventOrganizerId === userOrganizerId);
            
            if (!ownsEvent) {
                return NextResponse.json(
                    { message: "Forbidden - You don't own this event" },
                    { status: 403 }
                );
            }
        }

        await Event.findByIdAndDelete(eventId);

        return handleSuccessResponse("Event deleted successfully");
    } catch (error) {
        return handleApiError(error);
    }
}

