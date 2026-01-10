import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import User from './user.model';
import Event from './event.model';

export interface IFavorite extends Document {
    userId: Types.ObjectId;
    eventId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
    {
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
    },
    {
        timestamps: true,
    }
);

// Ensure one favorite per user per event
favoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', favoriteSchema);
export default Favorite;

