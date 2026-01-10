import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPlatformSettings extends Document {
    platformFeePercentage: number; // Platform commission percentage (default: 5%)
    minimumPayoutAmount: number; // Minimum payout amount in cents (default: 1000 = $10)
    currency: string; // Default currency
    platformName: string;
    platformDescription: string;
    contactEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
    {
        platformFeePercentage: {
            type: Number,
            default: 5,
            min: 0,
            max: 100,
        },
        minimumPayoutAmount: {
            type: Number,
            default: 1000, // $10.00 in cents
            min: 0,
        },
        currency: {
            type: String,
            default: 'php',
            uppercase: true,
        },
        platformName: {
            type: String,
            default: 'TechEventX',
        },
        platformDescription: {
            type: String,
            default: 'Your premier destination for tech events and networking',
        },
        contactEmail: {
            type: String,
            default: 'contact@techeventx.com',
        },
        supportEmail: {
            type: String,
            default: 'support@techeventx.com',
        },
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        maintenanceMessage: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one settings document exists
platformSettingsSchema.index({}, { unique: true });

const PlatformSettings = mongoose.models.PlatformSettings || mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
export default PlatformSettings;

