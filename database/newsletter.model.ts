import mongoose, { Schema, Model, Document } from 'mongoose';

export interface INewsletter extends Document {
    email: string;
    subscribedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            unique: true,
            validate: {
                validator: (v: string) => {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Please enter a valid email address',
            },
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups
newsletterSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.Newsletter || mongoose.model<INewsletter>('Newsletter', newsletterSchema) as Model<INewsletter>;

