import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import User from './user.model';

export interface IPayout extends Document {
    organizerId: Types.ObjectId;
    amount: number; // Amount in cents
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    paymentMethod: 'bank_transfer' | 'paypal' | 'stripe_connect';
    accountDetails?: {
        bankName?: string;
        accountNumber?: string;
        accountHolderName?: string;
        paypalEmail?: string;
        stripeAccountId?: string;
    };
    transactionIds: Types.ObjectId[]; // Transactions included in this payout
    requestedAt: Date;
    processedAt?: Date;
    processedBy?: Types.ObjectId; // Admin who processed it
    failureReason?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const payoutSchema = new Schema<IPayout>(
    {
        organizerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Organizer ID is required'],
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
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            required: [true, 'Status is required'],
            default: 'pending',
            index: true,
        },
        paymentMethod: {
            type: String,
            enum: ['bank_transfer', 'paypal', 'stripe_connect'],
            required: [true, 'Payment method is required'],
        },
        accountDetails: {
            bankName: String,
            accountNumber: String,
            accountHolderName: String,
            paypalEmail: String,
            stripeAccountId: String,
        },
        transactionIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
        }],
        requestedAt: {
            type: Date,
            required: [true, 'Requested at date is required'],
            default: Date.now,
        },
        processedAt: {
            type: Date,
        },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        failureReason: {
            type: String,
            trim: true,
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
payoutSchema.index({ organizerId: 1, status: 1 });
payoutSchema.index({ status: 1, requestedAt: -1 });
payoutSchema.index({ requestedAt: -1 });

const Payout = mongoose.models.Payout || mongoose.model<IPayout>('Payout', payoutSchema);
export default Payout;

