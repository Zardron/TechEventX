import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { handleImageUpload } from "@/lib/cloudinary";

// POST - Upload user avatar
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

        const formData = await req.formData();
        const file = formData.get('avatar') as File;

        if (!file) {
            return NextResponse.json(
                { message: "Avatar file is required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { message: "File must be an image" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { message: "File size must be less than 5MB" },
                { status: 400 }
            );
        }

        // Upload to Cloudinary
        const uploadResult = await handleImageUpload(file, 'TechEventX/avatars');

        if (!uploadResult.success) {
            return uploadResult.response;
        }

        // Update user avatar
        (user as any).avatar = uploadResult.url;
        await user.save();

        return handleSuccessResponse("Avatar uploaded successfully", {
            avatar: uploadResult.url,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Remove user avatar
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

        // Remove avatar
        (user as any).avatar = undefined;
        await user.save();

        return handleSuccessResponse("Avatar removed successfully", {});
    } catch (error) {
        return handleApiError(error);
    }
}

