import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import User from './user.model';
import Plan from './plan.model';

export interface IOrganizerApplication extends Document {
    userId: Types.ObjectId;
    organizerName: string;
    companyName?: string;
    description: string;
    website?: string;
    phone?: string;
    address?: string;
    planId?: Types.ObjectId; // Plan they plan to purchase after approval
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: Types.ObjectId; // Admin who reviewed
    reviewedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const organizerApplicationSchema = new Schema<IOrganizerApplication>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        organizerName: {
            type: String,
            required: [true, 'Organizer name is required'],
            trim: true,
            maxlength: [100, 'Organizer name cannot exceed 100 characters'],
        },
        companyName: {
            type: String,
            trim: true,
            maxlength: [100, 'Company name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        website: {
            type: String,
            trim: true,
            validate: {
                validator: (v: string) => {
                    if (!v) return true; // Optional field
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'Website must be a valid URL',
            },
        },
        phone: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'Plan',
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
organizerApplicationSchema.index({ userId: 1, status: 1 });
organizerApplicationSchema.index({ status: 1, createdAt: -1 });

const OrganizerApplication = mongoose.models.OrganizerApplication || mongoose.model<IOrganizerApplication>('OrganizerApplication', organizerApplicationSchema);
export default OrganizerApplication;

