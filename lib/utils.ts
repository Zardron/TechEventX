import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server"

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

// Convert 24-hour time format (HH:MM) to 12-hour format with AM/PM
export function formatTimeWithAMPM(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return time; // Return original if invalid format
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12; // Convert 0 to 12 for midnight

  return `${twelveHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Convert date from YYYY-MM-DD format to "Month Day, Year" format
export function formatDateToReadable(date: string): string {
  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return date; // Return original if invalid date
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return dateObj.toLocaleDateString('en-US', options);
  } catch {
    return date; // Return original if parsing fails
  }
}