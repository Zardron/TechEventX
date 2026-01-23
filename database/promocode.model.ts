import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import Event from './event.model';
import User from './user.model';

export interface IPromoCode extends Document {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number; // Percentage (0-100) or fixed amount in cents
    usageLimit?: number; // Total number of times it can be used
    usedCount: number;
    validFrom: Date;
    validUntil: Date;
    eventId?: Types.ObjectId; // If null, applies to all events
    organizerId?: Types.ObjectId; // If null, applies to all organizers
    minPurchaseAmount?: number; // Minimum purchase amount in cents
    maxDiscountAmount?: number; // Maximum discount in cents (for percentage)
    isActive: boolean;
    createdBy?: Types.ObjectId; // Admin or organizer who created it
    createdAt: Date;
    updatedAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>(
    {
        code: {
            type: String,
            required: [true, 'Promo code is required'],
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: [true, 'Discount type is required'],
        },
        discountValue: {
            type: Number,
            required: [true, 'Discount value is required'],
            min: [0, 'Discount value cannot be negative'],
        },
        usageLimit: {
            type: Number,
            min: [1, 'Usage limit must be at least 1'],
        },
        usedCount: {
            type: Number,
            default: 0,
            min: [0, 'Used count cannot be negative'],
        },
        validFrom: {
            type: Date,
            required: [true, 'Valid from date is required'],
            default: Date.now,
        },
        validUntil: {
            type: Date,
            required: [true, 'Valid until date is required'],
        },
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            index: true,
        },
        organizerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        minPurchaseAmount: {
            type: Number,
            min: [0, 'Minimum purchase amount cannot be negative'],
        },
        maxDiscountAmount: {
            type: Number,
            min: [0, 'Maximum discount amount cannot be negative'],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Validate discount value based on type
promoCodeSchema.pre('save', function (this: IPromoCode) {
    if (this.discountType === 'percentage' && (this.discountValue < 0 || this.discountValue > 100)) {
        throw new Error('Percentage discount must be between 0 and 100');
    }
    if (this.discountType === 'fixed' && this.discountValue < 0) {
        throw new Error('Fixed discount cannot be negative');
    }
    if (this.validUntil <= this.validFrom) {
        throw new Error('Valid until date must be after valid from date');
    }
});

// Indexes
promoCodeSchema.index({ code: 1 }, { unique: true });
promoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
promoCodeSchema.index({ eventId: 1, isActive: 1 });
promoCodeSchema.index({ organizerId: 1, isActive: 1 });

const PromoCode = mongoose.models.PromoCode || mongoose.model<IPromoCode>('PromoCode', promoCodeSchema);
export default PromoCode;

