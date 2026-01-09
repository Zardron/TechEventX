import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IEvent extends Document {
    title: string;
    slug: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    agenda: string[];
    organizer: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Generate URL-friendly slug from title
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Normalize date to ISO format (YYYY-MM-DD)
const normalizeDate = (date: string): string => {
    try {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
            throw new Error('Invalid date format');
        }
        return parsed.toISOString().split('T')[0];
    } catch {
        throw new Error('Invalid date format');
    }
};

// Normalize time to 24-hour format (HH:MM)
const normalizeTime = (time: string): string => {
    const cleaned = time.trim().toUpperCase();

    const twelveHourMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (twelveHourMatch) {
        let hours = parseInt(twelveHourMatch[1], 10);
        const minutes = twelveHourMatch[2];
        const period = twelveHourMatch[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    const twentyFourHourMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
    if (twentyFourHourMatch) {
        const hours = parseInt(twentyFourHourMatch[1], 10).toString().padStart(2, '0');
        const minutes = twentyFourHourMatch[2];
        return `${hours}:${minutes}`;
    }

    throw new Error('Invalid time format. Expected HH:MM or HH:MM AM/PM');
};

const eventSchema = new Schema<IEvent>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Title cannot be empty',
            },
        },
        slug: {
            type: String,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Description cannot be empty',
            },
        },
        overview: {
            type: String,
            required: [true, 'Overview is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Overview cannot be empty',
            },
        },
        image: {
            type: String,
            required: [true, 'Image is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Image cannot be empty',
            },
        },
        venue: {
            type: String,
            required: [true, 'Venue is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Venue cannot be empty',
            },
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Location cannot be empty',
            },
        },
        date: {
            type: String,
            required: [true, 'Date is required'],
            trim: true,
        },
        time: {
            type: String,
            required: [true, 'Time is required'],
            trim: true,
        },
        mode: {
            type: String,
            required: [true, 'Mode is required'],
            trim: true,
            enum: {
                values: ['Virtual', 'Onsite', 'Hybrid'],
                message: 'Mode must be one of: Virtual, Onsite, Hybrid',
            },
        },
        audience: {
            type: String,
            required: [true, 'Audience is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Audience cannot be empty',
            },
        },
        agenda: {
            type: [String],
            required: [true, 'Agenda is required'],
            validate: {
                validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.every(item => item.trim().length > 0),
                message: 'Agenda must be a non-empty array of strings',
            },
        },
        organizer: {
            type: String,
            required: [true, 'Organizer is required'],
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0,
                message: 'Organizer cannot be empty',
            },
        },
        tags: {
            type: [String],
            required: [true, 'Tags is required'],
            validate: {
                validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.every(item => item.trim().length > 0),
                message: 'Tags must be a non-empty array of strings',
            },
        },
    },
    {
        timestamps: true,
    }
);

// Auto-generate slug and normalize date/time before saving
(eventSchema as any).pre('save', function (this: IEvent) {
    if (this.isModified('title') || !this.slug) {
        this.slug = generateSlug(this.title);
    }

    if (this.isModified('date')) {
        try {
            this.date = normalizeDate(this.date);
        } catch (error) {
            throw error instanceof Error ? error : new Error('Date normalization failed');
        }
    }

    if (this.isModified('time')) {
        try {
            this.time = normalizeTime(this.time);
        } catch (error) {
            throw error instanceof Error ? error : new Error('Time normalization failed');
        }
    }
});

// Unique index on slug for fast lookups
eventSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema) as Model<IEvent>;

