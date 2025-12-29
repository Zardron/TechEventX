import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Handle API errors
export function handleApiError(error: unknown, status: number = 500) {
  console.error('❌ API Error:', error);
  return NextResponse.json(
    {
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown Error'
    },
    { status }
  );
}

// Handle Slug Validation
export function handleSlugValidation(slug: string) {
  if (!slug) {
    return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
  }
  return slug;
}

// Handle Form Data Validation
export function handleFormDataValidation(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  return data;
}

// Handle Event Not Found
export function handleEventNotFound(event: unknown) {
  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }
  return null;
}

// Handle Success Response
export function handleSuccessResponse(
  message: string,
  data?: Record<string, unknown> | unknown[],
  status: number = 200
): NextResponse {
  const response: { message: string;[key: string]: unknown } = { message };

  if (data) {
    // If data is an object, spread it into the response
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.assign(response, data);
    } else {
      // If data is an array or single value, include it with a generic key
      response.data = data;
    }
  }

  return NextResponse.json(response, { status });
}

// Handle Image Upload to Cloudinary
export async function handleImageUpload(
  file: File | null,
  folder: string = 'DevHub'
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