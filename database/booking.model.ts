import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Event from './event.model';

export interface IBooking extends Document {
    eventId: Types.ObjectId;
    userId: Types.ObjectId; // Reference to User
    email: string; // Kept for backward compatibility and guest bookings
    paymentStatus?: 'pending' | 'confirmed' | 'rejected'; // Payment status for paid events
    receiptUrl?: string; // URL to uploaded receipt
    paymentMethod?: string; // Selected payment method (e.g., 'gcash', 'bank_transfer', 'paymaya', 'grabpay')
    createdAt: Date;
    updatedAt: Date;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<IBooking>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event ID is required'],
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            validate: {
                validator: (v: string) => {
                    if (!v || v.trim().length === 0) return false;
                    return emailRegex.test(v);
                },
                message: 'Email must be a valid email address',
            },
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: undefined, // Only set for paid events
        },
        receiptUrl: {
            type: String,
            trim: true,
        },
        paymentMethod: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Validate event exists before saving booking
(bookingSchema as any).pre('save', async function (this: IBooking) {
    try {
        const event = await Event.findById(this.eventId);
        if (!event) {
            throw new Error(`Event with ID ${this.eventId} does not exist`);
        }
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to validate event reference');
    }
});

bookingSchema.index({ eventId: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1, userId: 1 }); // Compound index for checking duplicate bookings

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema) as Model<IBooking>;

