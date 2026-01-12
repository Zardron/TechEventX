import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import User from "@/database/user.model";
import Organizer from "@/database/organizer.model";
import { handleApiError, handleSlugValidation, handleEventNotFound, handleSuccessResponse } from "@/lib/utils";
import mongoose from "mongoose";

// Fetch event by slug
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        console.log("🔵 API CALLED: /api/events/[slug]");
        await connectDB();

        const { slug } = await params;
        console.log("🔵 Slug:", slug);

        handleSlugValidation(slug);

        const event = await Event.findOne({ slug });
        console.log("🔵 Event found:", !!event);

        const notFoundResponse = handleEventNotFound(event);
        if (notFoundResponse) return notFoundResponse;

        // Convert event to plain object to modify it
        const eventObj = event.toObject();

        console.log("Event organizerId:", eventObj.organizerId);
        console.log("Event organizer (before):", eventObj.organizer);

        // Get organizerId from event (this references a User with role='organizer')
        // Logic: Get User → Get User's organizerId → Find Organizer that matches
        if (eventObj.organizerId) {
            try {
                // Convert organizerId to ObjectId for query
                const userId = eventObj.organizerId instanceof mongoose.Types.ObjectId
                    ? eventObj.organizerId
                    : new mongoose.Types.ObjectId(String(eventObj.organizerId));

                console.log("Step 1: Looking for user (organizer) with _id:", userId.toString());

                // Step 1: Get the logged user (organizer) from event.organizerId
                const user = await User.findOne({
                    _id: userId,
                    deleted: { $ne: true }
                });

                if (user && user.organizerId) {
                    console.log("Step 2: User found, got organizerId:", user.organizerId.toString());
                    console.log("Step 3: Looking for organizer in organizer collection...");
                    
                    // Step 2: Get the organizerId from the user
                    // Step 3: Check the organizer collection to find organizer that matches the organizerId of user
                    const organizer = await Organizer.findOne({
                        _id: user.organizerId,
                        deleted: { $ne: true }
                    });

                    if (organizer) {
                        eventObj.organizer = organizer.name;
                        console.log(`✅ SUCCESS: Found organizer, updated name to "${organizer.name}"`);
                    } else {
                        // Fallback to user name if organizer not found
                        eventObj.organizer = user.name;
                        console.log(`⚠️ WARNING: Organizer not found, using user name: "${user.name}"`);
                    }
                } else if (user) {
                    // Fallback to user name if user doesn't have organizerId
                    eventObj.organizer = user.name;
                    console.log(`⚠️ WARNING: User has no organizerId, using user name: "${user.name}"`);
                } else {
                    // Backward compatibility: If user not found, try to find Organizer directly
                    // (in case event.organizerId points directly to Organizer in old data)
                    console.log("User not found, trying to find Organizer directly (backward compatibility)...");
                    const organizer = await Organizer.findOne({
                        _id: userId,
                        deleted: { $ne: true }
                    });

                    if (organizer) {
                        eventObj.organizer = organizer.name;
                        console.log(`✅ SUCCESS: Found organizer directly (backward compatibility), updated name to "${organizer.name}"`);
                    } else {
                        console.error(`❌ ERROR: Neither User nor Organizer found with _id: ${userId.toString()}`);
                    }
                }
            } catch (error) {
                console.error("❌ ERROR fetching organizer:", error);
            }
        } else {
            console.error("❌ ERROR: Event has no organizerId field");
        }

        console.log("Event organizer (after):", eventObj.organizer);

        return handleSuccessResponse('Event Fetched Successfully', { event: eventObj });
    } catch (error) {
        return handleApiError(error);
    }
}

// Update event by slug
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        await connectDB();

        const { slug } = await params;

        handleSlugValidation(slug);

        const event = await Event.findOne({ slug });

        const notFoundResponse = handleEventNotFound(event);
        if (notFoundResponse) return notFoundResponse;

        const formData = await req.formData();

        const eventData = Object.fromEntries(formData.entries());

        const updatedEvent = await Event.findOneAndUpdate({ slug }, eventData, { new: true });

        return handleSuccessResponse('Event Updated Successfully', { event: updatedEvent });
    } catch (error) {
        return handleApiError(error);
    }
}

// Delete event by slug
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        await connectDB();

        const { slug } = await params;

        handleSlugValidation(slug);

        const deletedEvent = await Event.findOneAndDelete({ slug });

        const notFoundResponse = handleEventNotFound(deletedEvent);
        if (notFoundResponse) return notFoundResponse;

        return handleSuccessResponse('Event Deleted Successfully', { event: deletedEvent });
    } catch (error) {
        return handleApiError(error);
    }
}   