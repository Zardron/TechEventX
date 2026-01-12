import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Subscription from './subscription.model';

export interface IPayment extends Document {
    subscriptionId?: Types.ObjectId;
    eventId?: Types.ObjectId; // For event payments
    bookingId?: Types.ObjectId; // Reference to booking
    userId: Types.ObjectId;
    amount: number; // Amount in cents
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'canceled';
    paymentMethod: 'card' | 'bank_transfer' | 'paypal' | 'gcash' | 'paymaya' | 'grabpay' | 'qr' | 'other';
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    receiptUrl?: string; // For manual payment receipts
    description?: string;
    metadata?: Record<string, any>;
    paidAt?: Date;
    refundedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        subscriptionId: {
            type: Schema.Types.ObjectId,
            ref: 'Subscription',
            index: true,
        },
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            index: true,
        },
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
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
            enum: ['pending', 'succeeded', 'failed', 'refunded', 'canceled'],
            required: [true, 'Status is required'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['card', 'bank_transfer', 'paypal', 'gcash', 'paymaya', 'grabpay', 'qr', 'other'],
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
        receiptUrl: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        paidAt: {
            type: Date,
        },
        refundedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index({ eventId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ userId: 1, eventId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });

const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;

