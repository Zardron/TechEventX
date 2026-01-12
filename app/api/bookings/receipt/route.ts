import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { handleImageUpload } from "@/lib/cloudinary";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

export async function POST(req: NextRequest): Promise<NextResponse> {
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

        const formData = await req.formData();
        const file = formData.get('receipt') as File;

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { message: 'Receipt file is required' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { message: 'Receipt must be an image file' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { message: 'Receipt file size must be less than 5MB' },
                { status: 400 }
            );
        }

        // Upload receipt to Cloudinary
        console.log('📤 Uploading receipt to Cloudinary...', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        });

        try {
            const uploadResult = await handleImageUpload(file, 'TechEventX/receipts');

            if (!uploadResult.success) {
                console.error('❌ Receipt upload failed');
                // Return the error response directly
                return uploadResult.response;
            }

            console.log('✅ Receipt uploaded successfully:', uploadResult.url);
            const response = handleSuccessResponse('Receipt uploaded successfully', {
                receiptUrl: uploadResult.url
            });
            console.log('📤 Sending response with receiptUrl:', uploadResult.url);
            return response;
        } catch (uploadError) {
            console.error('❌ Unexpected error during upload:', uploadError);
            return NextResponse.json(
                {
                    message: 'An unexpected error occurred during upload',
                    error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
                },
                { status: 500 }
            );
        }
    } catch (error) {
        return handleApiError(error);
    }
}

