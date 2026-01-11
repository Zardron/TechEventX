    import mongoose, { Schema, Model, Document } from 'mongoose';
    import bcrypt from 'bcryptjs';

    export interface IUser extends Document {
        email: string;
        password: string;
        name: string;
        avatar?: string; // User avatar URL
        role: 'admin' | 'user' | 'organizer';
        organizerId?: mongoose.Types.ObjectId; // Reference to Organizer if role is 'organizer'
        stripeCustomerId?: string; // Stripe customer ID for payment processing (deprecated, use paymongoCustomerId)
        paymongoCustomerId?: string; // PayMongo customer ID for payment processing
        banned?: boolean;
        planId?: string;
        deleted?: boolean;
        notificationPreferences?: {
            emailBookingConfirmations: boolean;
            emailEventReminders: boolean;
            emailEventUpdates: boolean;
            emailPromotions: boolean;
            emailNewsletter: boolean;
        };
        createdAt: Date;
        updatedAt: Date;
        comparePassword(candidatePassword: string): Promise<boolean>;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Password validation: at least 8 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const userSchema = new Schema<IUser>(
        {
            email: {
                type: String,
                required: [true, 'Email is required'],
                unique: true,
                trim: true,
                lowercase: true,
                validate: {
                    validator: (v: string) => {
                        if (!v || v.trim().length === 0) return false;
                        return emailRegex.test(v);
                    },
                    message: 'Email must be a valid email address',
                },
            },
            password: {
                type: String,
                required: [true, 'Password is required'],
                validate: {
                    validator: (v: string) => {
                        if (!v || v.trim().length === 0) return false;
                        return passwordRegex.test(v);
                    },
                    message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
                },
            },
            name: {
                type: String,
                required: [true, 'Name is required'],
                trim: true,
                validate: {
                    validator: (v: string) => v.trim().length > 0 && v.trim().length <= 100,
                    message: 'Name must be between 1 and 100 characters',
                },
            },
            avatar: {
                type: String,
                trim: true,
            },
            role: {
                type: String,
                enum: ['admin', 'user', 'organizer'],
                required: [true, 'Role is required'],
            },
            organizerId: {
                type: Schema.Types.ObjectId,
                ref: 'Organizer',
            },
            stripeCustomerId: {
                type: String,
                trim: true,
                sparse: true,
                index: true,
            },
            paymongoCustomerId: {
                type: String,
                trim: true,
                sparse: true,
                index: true,
            },
            banned: {
                type: Boolean,
                default: false,
            },
            deleted: {
                type: Boolean,
                default: false,
            },
            notificationPreferences: {
                emailBookingConfirmations: {
                    type: Boolean,
                    default: true,
                },
                emailEventReminders: {
                    type: Boolean,
                    default: true,
                },
                emailEventUpdates: {
                    type: Boolean,
                    default: true,
                },
                emailPromotions: {
                    type: Boolean,
                    default: true,
                },
                emailNewsletter: {
                    type: Boolean,
                    default: true,
                },
            },
        },
        {
            timestamps: true,
        }
    );

    // Hash password before saving
    (userSchema as any).pre('save', async function (this: IUser) {
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified('password')) return;

        try {
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            const isAlreadyHashed = /^\$2[ayb]\$\d{2}\$/.test(this.password);

            if (!isAlreadyHashed) {
                // Hash password with cost factor of 10
                const saltRounds = 10;
                this.password = await bcrypt.hash(this.password, saltRounds);
            }
        } catch (error) {
            throw error instanceof Error ? error : new Error('Failed to hash password');
        }
    });

    // Validate email uniqueness before saving (additional check, though unique index handles this)
    (userSchema as any).pre('save', async function (this: IUser) {
        if (this.isModified('email')) {
            try {
                // Exclude soft-deleted users from uniqueness check
                const existingUser = await mongoose.models.User?.findOne({ 
                    email: this.email,
                    deleted: { $ne: true }
                });
                if (existingUser && existingUser._id.toString() !== this._id.toString()) {
                    throw new Error('Email is already registered');
                }
            } catch (error) {
                throw error instanceof Error ? error : new Error('Failed to validate email uniqueness');
            }
        }
    });

    // Method to compare password for login
    userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(candidatePassword, this.password);
        } catch (error) {
            return false;
        }
    };

    // Indexes for fast lookups
    userSchema.index({ email: 1 }, { unique: true });
    userSchema.index({ organizerId: 1 });

    const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
    export default User;
