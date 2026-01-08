import User from "@/database/user.model";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        // Verify token
        const tokenPayload = verifyToken(req);

        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized - Invalid or missing token" },
                { status: 401 }
            );
        }

        // Get user to check if they are admin (exclude soft-deleted users)
        const user = await User.findOne({ _id: tokenPayload.id, deleted: { $ne: true } });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        const users = await User.find({ deleted: { $ne: true } }).select('-password');


        return handleSuccessResponse("Users fetched successfully", users);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        // Verify token
        const tokenPayload = verifyToken(req);

        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized - Invalid or missing token" },
                { status: 401 }
            );
        }

        // Get user to check if they are admin (exclude soft-deleted users)
        const user = await User.findOne({ _id: tokenPayload.id, deleted: { $ne: true } });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        const { name, email, password, role } = await req.json();

        // Validate input
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { message: "Name, email, password, and role are required" },
                { status: 400 }
            );
        }

        // Normalize and validate role
        const normalizedRole = role?.toLowerCase().trim();
        if (!['admin', 'user', 'organizer'].includes(normalizedRole)) {
            return NextResponse.json(
                { message: "Role must be one of: admin, user, organizer" },
                { status: 400 }
            );
        }

        // Check if user already exists (exclude soft-deleted users)
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
            deleted: { $ne: true }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "Email is already registered" },
                { status: 409 }
            );
        }

        // Create new user (password will be hashed by the pre-save hook in the model)
        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            role: normalizedRole,
            password: password, // Will be hashed automatically by the model
        });

        // Return user data (excluding password)
        const userData = {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        };

        return handleSuccessResponse("User created successfully", userData, 201);
    } catch (error) {
        // Handle validation errors from mongoose
        if (error instanceof Error) {
            // Check if it's a validation error
            if (error.message.includes("Email is already registered")) {
                return NextResponse.json(
                    { message: error.message },
                    { status: 409 }
                );
            }
            if (error.message.includes("validation failed") || error.message.includes("Password must") || error.message.includes("Email must")) {
                return NextResponse.json(
                    { message: error.message },
                    { status: 400 }
                );
            }
        }
        
        // Handle Mongoose validation errors
        if (error && typeof error === 'object' && 'name' in error) {
            const mongooseError = error as any;
            if (mongooseError.name === 'ValidationError') {
                const validationErrors = mongooseError.errors || {};
                const errorMessages = Object.values(validationErrors)
                    .map((err: any) => err.message)
                    .join(', ');
                return NextResponse.json(
                    { message: `Validation error: ${errorMessages || mongooseError.message}` },
                    { status: 400 }
                );
            }
            // Handle duplicate key error (E11000)
            if (mongooseError.code === 11000) {
                const field = Object.keys(mongooseError.keyPattern || {})[0] || 'field';
                return NextResponse.json(
                    { message: `${field} is already registered` },
                    { status: 409 }
                );
            }
        }
        
        return handleApiError(error);
    }
}

// Helper function to verify admin access
export async function verifyAdminAccess(req: NextRequest) {
    const tokenPayload = verifyToken(req);

    if (!tokenPayload) {
        return { error: NextResponse.json({ message: "Unauthorized - Invalid or missing token" }, { status: 401 }), user: null };
    }

    await connectDB();
    const user = await User.findOne({ _id: tokenPayload.id, deleted: { $ne: true } });

    if (!user) {
        return { error: NextResponse.json({ message: "User not found" }, { status: 404 }), user: null };
    }

    if (user.role !== 'admin') {
        return { error: NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 }), user: null };
    }

    return { error: null, user };
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    try {
        const { error, user } = await verifyAdminAccess(req);
        if (error) return error;

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            );
        }

        // Prevent admin from deleting themselves
        if (user!._id.toString() === userId) {
            return NextResponse.json(
                { message: "You cannot delete your own account" },
                { status: 400 }
            );
        }

        const userToDelete = await User.findOne({ _id: userId, deleted: { $ne: true } });

        if (!userToDelete) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Soft delete: mark as deleted instead of removing from database
        userToDelete.deleted = true;
        await userToDelete.save();

        return handleSuccessResponse("User deleted successfully", {});
    } catch (error) {
        return handleApiError(error);
    }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    try {
        const { error, user } = await verifyAdminAccess(req);
        if (error) return error;

        const { userId, action } = await req.json();

        if (!userId || !action) {
            return NextResponse.json(
                { message: "User ID and action are required" },
                { status: 400 }
            );
        }

        // Prevent admin from banning/deleting themselves
        if (user!._id.toString() === userId) {
            return NextResponse.json(
                { message: "You cannot modify your own account" },
                { status: 400 }
            );
        }

        const userToUpdate = await User.findOne({ _id: userId, deleted: { $ne: true } });

        if (!userToUpdate) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (action === 'ban') {
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId },
                { banned: true },
                { new: true }
            );
            return handleSuccessResponse("User banned successfully", {
                id: updatedUser!._id.toString(),
                banned: updatedUser!.banned,
            });
        } else if (action === 'unban') {
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId },
                { banned: false },
                { new: true }
            );
            return handleSuccessResponse("User unbanned successfully", {
                id: updatedUser!._id.toString(),
                banned: updatedUser!.banned,
            });
        } else {
            return NextResponse.json(
                { message: "Invalid action. Use 'ban' or 'unban'" },
                { status: 400 }
            );
        }
    } catch (error) {
        return handleApiError(error);
    }
}