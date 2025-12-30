"use server";

import Event from "@/database/event.model";
import connectDB from "../mongodb";

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        await connectDB();
        const event = await Event.findOne({ slug });

        const similarEvents = await Event.find({
            _id: { $ne: event?._id },
            tags: { $in: event?.tags },
        }).lean();

        return similarEvents.map((event) => ({
            ...event,
            _id: event._id.toString(),
            createdAt: event.createdAt?.toISOString(),
            updatedAt: event.updatedAt?.toISOString(),
        }));

    } catch (error) {
        return [];
    }
}