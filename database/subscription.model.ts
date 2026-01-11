import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Plan from './plan.model';
import User from './user.model';

export interface ISubscription extends Document {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired';
    stripeSubscriptionId?: string; // Deprecated, use paymongoSubscriptionId
    stripeCustomerId?: string; // Deprecated, use paymongoCustomerId
    paymongoSubscriptionId?: string;
    paymongoCustomerId?: string;
    paymongoPaymentIntentId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
    trialEnd?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'Plan',
            required: [true, 'Plan ID is required'],
        },
        status: {
            type: String,
            enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired'],
            required: [true, 'Status is required'],
            default: 'trialing',
        },
        stripeSubscriptionId: {
            type: String,
            trim: true,
            sparse: true, // Allows multiple nulls but enforces uniqueness for non-null values
        },
        stripeCustomerId: {
            type: String,
            trim: true,
            index: true,
        },
        paymongoSubscriptionId: {
            type: String,
            trim: true,
            sparse: true,
        },
        paymongoCustomerId: {
            type: String,
            trim: true,
            index: true,
        },
        paymongoPaymentIntentId: {
            type: String,
            trim: true,
            index: true,
        },
        currentPeriodStart: {
            type: Date,
            required: [true, 'Current period start is required'],
        },
        currentPeriodEnd: {
            type: Date,
            required: [true, 'Current period end is required'],
        },
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false,
        },
        canceledAt: {
            type: Date,
        },
        trialEnd: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true, sparse: true });
subscriptionSchema.index({ paymongoSubscriptionId: 1 }, { unique: true, sparse: true });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Ensure one active subscription per user
subscriptionSchema.index({ userId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', subscriptionSchema);
export default Subscription;

