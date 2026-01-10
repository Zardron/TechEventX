import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Favorite from "@/database/favorite.model";
import Event from "@/database/event.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get user's favorite events
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

        const favorites = await Favorite.find({ userId: user._id })
            .populate('eventId')
            .sort({ createdAt: -1 });

        const favoriteEvents = favorites
            .filter((f: any) => f.eventId)
            .map((favorite: any) => {
                const event = favorite.eventId;
                return {
                    id: event._id.toString(),
                    title: event.title,
                    slug: event.slug,
                    description: event.description,
                    image: event.image,
                    date: event.date,
                    time: event.time,
                    location: event.location,
                    mode: event.mode,
                    price: event.price,
                    isFree: event.isFree,
                    status: event.status,
                    favoritedAt: favorite.createdAt,
                };
            });

        return handleSuccessResponse("Favorites retrieved successfully", {
            favorites: favoriteEvents,
            count: favoriteEvents.length,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST - Add event to favorites
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

        const { eventId } = await req.json();

        if (!eventId) {
            return NextResponse.json(
                { message: "Event ID is required" },
                { status: 400 }
            );
        }

        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 }
            );
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({
            userId: user._id,
            eventId: event._id,
        });

        if (existingFavorite) {
            return NextResponse.json(
                { message: "Event is already in favorites" },
                { status: 400 }
            );
        }

        // Create favorite
        const favorite = await Favorite.create({
            userId: user._id,
            eventId: event._id,
        });

        return handleSuccessResponse("Event added to favorites", {
            favorite: {
                id: favorite._id.toString(),
                eventId: event._id.toString(),
                createdAt: favorite.createdAt,
            }
        }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Remove event from favorites
export async function DELETE(req: NextRequest): Promise<NextResponse> {
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

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json(
                { message: "Event ID is required" },
                { status: 400 }
            );
        }

        // Remove favorite
        const favorite = await Favorite.findOneAndDelete({
            userId: user._id,
            eventId: eventId,
        });

        if (!favorite) {
            return NextResponse.json(
                { message: "Favorite not found" },
                { status: 404 }
            );
        }

        return handleSuccessResponse("Event removed from favorites", {});
    } catch (error) {
        return handleApiError(error);
    }
}

