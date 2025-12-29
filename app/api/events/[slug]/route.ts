import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { handleApiError, handleSlugValidation, handleEventNotFound, handleSuccessResponse } from "@/lib/utils";

// Fetch event by slug
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await connectDB();

        const { slug } = await params;

        handleSlugValidation(slug);

        const event = await Event.findOne({ slug });

        const notFoundResponse = handleEventNotFound(event);
        if (notFoundResponse) return notFoundResponse;

        return handleSuccessResponse('Event Fetched Successfully', { event });
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