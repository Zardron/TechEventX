import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        // Verify token
        const tokenPayload = verifyToken(req);

        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized - Invalid or missing token" },
                { status: 401 }
            );
        }

        // Get user to check if they are admin (exclude soft-deleted users)
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

        // Check if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        // Get unique organizers from events
        const uniqueOrganizers = await Event.distinct('organizer');
        
        // Sort alphabetically
        const sortedOrganizers = uniqueOrganizers.sort();

        return handleSuccessResponse("Organizers fetched successfully", sortedOrganizers);
    } catch (error) {
        return handleApiError(error);
    }
}

