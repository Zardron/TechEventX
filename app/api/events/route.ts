import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { handleApiError, handleImageUpload, handleSuccessResponse } from "@/lib/utils";

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

        const file = formData.get('image') as File;

        const uploadResult = await handleImageUpload(file, 'DevHub');

        if (!uploadResult.success) {
            return uploadResult.response;
        }

        event.image = uploadResult.url;

        const createdEvent = await Event.create(event);

        return handleSuccessResponse('Event Created Successfully', { event: createdEvent }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return handleSuccessResponse('Events Fetched Successfully', { events });
    } catch (error) {
        return handleApiError(error);
    }
}
