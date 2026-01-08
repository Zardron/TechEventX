// Client-safe formatting utilities
// This file should not import any Node.js-only modules (like fs, path, etc.)

// Function to format organizer count in tiers
// 5-9: "5+", 10-19: "10+", 20-29: "20+", etc.
export function formatOrganizerCount(count: number): string {
    if (count < 5) {
        return "5+";
    } else if (count < 10) {
        return "5+";
    } else if (count < 20) {
        return "10+";
    } else {
        // Round down to nearest 10 for counts >= 20
        const rounded = Math.floor(count / 10) * 10;
        return `${rounded}+`;
    }
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

// Convert Date object or time string (HH:MM) to 12-hour format with AM/PM
export function formatDateTo12Hour(date: Date | string): string {
    let hours: number;
    let minutes: number;

    if (typeof date === 'string') {
        // Handle time string format (HH:MM)
        const [h, m] = date.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) {
            return date; // Return original if invalid format
        }
        hours = h;
        minutes = m;
    } else {
        // Handle Date object
        if (isNaN(date.getTime())) {
            return ''; // Return empty string if invalid date
        }
        hours = date.getHours();
        minutes = date.getMinutes();
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

