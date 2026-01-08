import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IOrganizer extends Document {
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    deleted?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const organizerSchema = new Schema<IOrganizer>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            unique: true,
            trim: true,
            validate: {
                validator: (v: string) => v.trim().length > 0 && v.trim().length <= 100,
                message: 'Name must be between 1 and 100 characters',
            },
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        logo: {
            type: String,
            trim: true,
            validate: {
                validator: function(v: string | undefined) {
                    if (!v || v.trim().length === 0) return true; // Optional field
                    // Basic URL validation
                    try {
                        new URL(v);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'Logo must be a valid URL',
            },
        },
        website: {
            type: String,
            trim: true,
            validate: {
                validator: function(v: string | undefined) {
                    if (!v || v.trim().length === 0) return true; // Optional field
                    // Basic URL validation
                    try {
                        new URL(v);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'Website must be a valid URL',
            },
        },
        deleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Validate name uniqueness before saving (excluding soft-deleted organizers)
(organizerSchema as any).pre('save', async function (this: IOrganizer) {
    if (this.isModified('name')) {
        try {
            // Exclude soft-deleted organizers from uniqueness check
            const existingOrganizer = await mongoose.models.Organizer?.findOne({
                name: this.name.trim(),
                deleted: { $ne: true },
            });
            if (existingOrganizer && existingOrganizer._id.toString() !== this._id.toString()) {
                throw new Error('Organizer name is already taken');
            }
        } catch (error) {
            throw error instanceof Error ? error : new Error('Failed to validate organizer name uniqueness');
        }
    }
});

// Indexes for fast lookups
organizerSchema.index({ name: 1 }, { unique: true });
organizerSchema.index({ deleted: 1 });

const Organizer = mongoose.models.Organizer || mongoose.model<IOrganizer>('Organizer', organizerSchema);
export default Organizer;

