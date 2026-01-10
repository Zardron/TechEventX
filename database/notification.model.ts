import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import User from './user.model';

export interface INotification extends Document {
    userId: Types.ObjectId;
    type: 'booking_confirmation' | 'event_reminder' | 'event_update' | 'event_cancelled' | 'payment_received' | 'subscription_expiring' | 'organizer_application_approved' | 'organizer_application_rejected' | 'system' | 'other';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    readAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        type: {
            type: String,
            enum: ['booking_confirmation', 'event_reminder', 'event_update', 'event_cancelled', 'payment_received', 'subscription_expiring', 'organizer_application_approved', 'organizer_application_rejected', 'system', 'other'],
            required: [true, 'Notification type is required'],
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        link: {
            type: String,
            trim: true,
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
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
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;

