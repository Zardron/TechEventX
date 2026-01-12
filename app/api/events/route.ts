import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import User from "@/database/user.model";
import Organizer from "@/database/organizer.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { handleImageUpload } from "@/lib/cloudinary";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();

        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch (error) {
            return handleApiError(error);
        }

        const imageSource = formData.get('imageSource') as string;
        let imageUrl: string;

        if (imageSource === 'url') {
            // Handle image URL
            const providedUrl = formData.get('imageUrl') as string;
            if (!providedUrl || typeof providedUrl !== 'string' || providedUrl.trim().length === 0) {
                return NextResponse.json(
                    { message: 'Image URL is required' },
                    { status: 400 }
                );
            }

            // Validate URL format
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
            // Handle file upload
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

        event.image = imageUrl;

        const tags = JSON.parse(formData.get('tags') as string);
        const agenda = JSON.parse(formData.get('agenda') as string);

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        return handleSuccessResponse('Event Created Successfully', { event: createdEvent }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function GET() {
    try {
        await connectDB();

        // Only fetch published events for public display
        const events = await Event.find().sort({ createdAt: -1 });

        // Populate organizer names for all events
        const eventsWithOrganizerNames = await Promise.all(
            events.map(async (event) => {
                const eventObj = event.toObject();

                // Get organizerId from event (this references a User with role='organizer')
                // Logic: Get User → Get User's organizerId → Find Organizer that matches
                if (eventObj.organizerId) {
                    try {
                        // Convert organizerId to ObjectId for query
                        const userId = eventObj.organizerId instanceof mongoose.Types.ObjectId
                            ? eventObj.organizerId
                            : new mongoose.Types.ObjectId(String(eventObj.organizerId));

                        // Step 1: Get the logged user (organizer) from event.organizerId
                        const user = await User.findOne({
                            _id: userId,
                            deleted: { $ne: true }
                        });

                        if (user && user.organizerId) {
                            // Step 2: Get the organizerId from the user
                            // Step 3: Check the organizer collection to find organizer that matches the organizerId of user
                            const organizer = await Organizer.findOne({
                                _id: user.organizerId,
                                deleted: { $ne: true }
                            });

                            if (organizer) {
                                // Use the Organizer's name
                                eventObj.organizer = organizer.name;
                            } else {
                                // Fallback to user name if organizer not found
                                eventObj.organizer = user.name;
                            }
                        } else if (user) {
                            // Fallback to user name if user doesn't have organizerId
                            eventObj.organizer = user.name;
                        } else {
                            // Backward compatibility: If user not found, try to find Organizer directly
                            // (in case event.organizerId points directly to Organizer in old data)
                            const organizer = await Organizer.findOne({
                                _id: userId,
                                deleted: { $ne: true }
                            });

                            if (organizer) {
                                eventObj.organizer = organizer.name;
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching organizer for event:", eventObj._id, error);
                    }
                }

                return eventObj;
            })
        );

        return handleSuccessResponse('Events Fetched Successfully', { events: eventsWithOrganizerNames });
    } catch (error) {
        return handleApiError(error);
    }
}
