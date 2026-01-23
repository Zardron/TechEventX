import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Booking from './booking.model';
import User from './user.model';
import Event from './event.model';

export interface ITransaction extends Document {
    bookingId: Types.ObjectId;
    userId: Types.ObjectId;
    eventId: Types.ObjectId;
    amount: number; // Amount in cents
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    paymentMethod: 'card' | 'bank_transfer' | 'paypal' | 'free';
    stripePaymentIntentId?: string; // Legacy Stripe support
    stripeChargeId?: string; // Legacy Stripe support
    paymongoPaymentIntentId?: string; // PayMongo payment intent ID
    refundAmount?: number; // Refunded amount in cents
    refundedAt?: Date;
    promoCodeId?: Types.ObjectId;
    discountAmount?: number; // Discount amount in cents
    taxAmount?: number; // Tax amount in cents
    platformFee?: number; // Platform commission in cents
    organizerRevenue?: number; // Organizer's revenue in cents
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
    {
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'Booking ID is required'],
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event ID is required'],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            default: 'php',
            uppercase: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
            required: [true, 'Status is required'],
            default: 'pending',
            index: true,
        },
        paymentMethod: {
            type: String,
            enum: ['card', 'bank_transfer', 'paypal', 'free'],
            required: [true, 'Payment method is required'],
        },
        stripePaymentIntentId: {
            type: String,
            trim: true,
            sparse: true,
        },
        stripeChargeId: {
            type: String,
            trim: true,
        },
        paymongoPaymentIntentId: {
            type: String,
            trim: true,
            sparse: true,
        },
        refundAmount: {
            type: Number,
            min: [0, 'Refund amount cannot be negative'],
        },
        refundedAt: {
            type: Date,
        },
        promoCodeId: {
            type: Schema.Types.ObjectId,
            ref: 'PromoCode',
        },
        discountAmount: {
            type: Number,
            min: [0, 'Discount amount cannot be negative'],
            default: 0,
        },
        taxAmount: {
            type: Number,
            min: [0, 'Tax amount cannot be negative'],
            default: 0,
        },
        platformFee: {
            type: Number,
            min: [0, 'Platform fee cannot be negative'],
            default: 0,
        },
        organizerRevenue: {
            type: Number,
            min: [0, 'Organizer revenue cannot be negative'],
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ eventId: 1 });
transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });
transactionSchema.index({ paymongoPaymentIntentId: 1 }, { unique: true, sparse: true });

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;

