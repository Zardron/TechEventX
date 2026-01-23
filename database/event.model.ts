import mongoose, { Schema, Model, Document, Types } from 'mongoose';

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
    organizerId?: Types.ObjectId; // Reference to User with organizer role
    tags: string[];
    // Pricing & Capacity
    isFree: boolean;
    price?: number; // Price in cents (if single price)
    currency: string;
    capacity?: number; // Maximum attendees (null = unlimited)
    availableTickets?: number; // Calculated field
    waitlistEnabled: boolean;
    // Payment Methods
    paymentMethods?: string[]; // Array of enabled payment methods (e.g., ['card', 'gcash', 'bank_transfer', 'qr'])
    paymentDetails?: {
        bank?: {
            bankName: string;
            accountName: string;
            accountNumber: string;
        };
        gcash?: {
            name: string;
            number: string;
        };
        grabpay?: {
            name: string;
            number: string;
        };
        paymaya?: {
            name: string;
            number: string;
        };
        qr?: {
            qrCodeUrl: string;
        };
    };
    // Status
    status: 'draft' | 'pending_approval' | 'published' | 'cancelled' | 'postponed' | 'completed';
    publishedAt?: Date;
    approvedAt?: Date;
    approvedBy?: Types.ObjectId; // Admin who approved
    // Metadata
    views: number;
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
        organizerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        tags: {
            type: [String],
            required: [true, 'Tags is required'],
            validate: {
                validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.every(item => item.trim().length > 0),
                message: 'Tags must be a non-empty array of strings',
            },
        },
        // Pricing & Capacity
        isFree: {
            type: Boolean,
            default: true,
        },
        price: {
            type: Number,
            min: [0, 'Price cannot be negative'],
        },
        currency: {
            type: String,
            default: 'php',
            uppercase: true,
        },
        capacity: {
            type: Number,
            min: [1, 'Capacity must be at least 1'],
        },
        availableTickets: {
            type: Number,
            min: [0, 'Available tickets cannot be negative'],
        },
        waitlistEnabled: {
            type: Boolean,
            default: false,
        },
        // Payment Methods
        paymentMethods: {
            type: [String],
            default: [],
        },
        paymentDetails: {
            type: Schema.Types.Mixed,
            default: {},
        },
        // Status
        status: {
            type: String,
            enum: ['draft', 'pending_approval', 'published', 'cancelled', 'postponed', 'completed'],
            default: 'draft',
            index: true,
        },
        publishedAt: {
            type: Date,
        },
        approvedAt: {
            type: Date,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        // Metadata
        views: {
            type: Number,
            default: 0,
            min: [0, 'Views cannot be negative'],
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

// Indexes
eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ organizerId: 1, status: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ createdAt: -1 });

// Calculate available tickets before save
(eventSchema as any).pre('save', async function (this: IEvent) {
    if (this.capacity && this.isModified('capacity')) {
        // Calculate available tickets based on confirmed bookings only
        const Booking = mongoose.models.Booking;
        if (Booking) {
            // Only count confirmed bookings (or bookings without paymentStatus for free events)
            const confirmedBookingCount = await Booking.countDocuments({ 
                eventId: this._id,
                $or: [
                    { paymentStatus: 'confirmed' },
                    { paymentStatus: { $exists: false } }, // Free events don't have paymentStatus
                    { paymentStatus: null } // Handle null values
                ]
            });
            this.availableTickets = Math.max(0, (this.capacity || 0) - confirmedBookingCount);
        } else {
            this.availableTickets = this.capacity;
        }
    }
    
    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema) as Model<IEvent>;

