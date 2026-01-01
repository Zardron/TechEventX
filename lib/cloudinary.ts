import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Handle Image Upload to Cloudinary
export async function handleImageUpload(
    file: File | null,
    folder: string = 'TechHub'
): Promise<{ success: true; url: string } | { success: false; response: NextResponse }> {
    if (!file) {
        return {
            success: false,
            response: NextResponse.json({ message: 'Image file is required' }, { status: 400 })
        };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: folder,
                },
                (error, result) => {
                    if (error) reject(error);
                    resolve(result as { secure_url: string });
                }
            ).end(buffer);
        });

        return {
            success: true,
            url: uploadResult.secure_url
        };
    } catch (error) {
        console.error('❌ Image Upload Error:', error);
        return {
            success: false,
            response: NextResponse.json(
                {
                    message: 'Failed to upload image',
                    error: error instanceof Error ? error.message : 'Unknown Error'
                },
                { status: 500 }
            )
        };
    }
}

