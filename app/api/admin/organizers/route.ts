import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Organizer from "@/database/organizer.model";

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
        const user = await User.findOne({
            _id: tokenPayload.id,
            deleted: { $ne: true }
        });

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

        // Get all organizers from the Organizer collection (exclude soft-deleted)
        const organizers = await Organizer.find({
            deleted: { $ne: true }
        }).sort({ name: 1 });

        // Format organizers for response
        const organizerData = organizers.map(org => ({
            id: org._id.toString(),
            name: org.name,
            description: org.description,
            logo: org.logo,
            website: org.website,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
        }));

        return handleSuccessResponse("Organizers fetched successfully", organizerData);
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
        const user = await User.findOne({
            _id: tokenPayload.id,
            deleted: { $ne: true }
        });

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

        const { name, email, password, fullName, description, logo, website } = await req.json();

        // Validate input
        if (!name || !name.trim()) {
            return NextResponse.json(
                { message: "Organizer name is required" },
                { status: 400 }
            );
        }

        if (!email || !email.trim()) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { message: "Password is required" },
                { status: 400 }
            );
        }

        if (!fullName || !fullName.trim()) {
            return NextResponse.json(
                { message: "Full name is required" },
                { status: 400 }
            );
        }

        // Check if organizer already exists (exclude soft-deleted organizers)
        const existingOrganizer = await Organizer.findOne({
            name: name.trim(),
            deleted: { $ne: true }
        });

        if (existingOrganizer) {
            return NextResponse.json(
                { message: "Organizer name is already taken" },
                { status: 409 }
            );
        }

        // Check if user with this email already exists (exclude soft-deleted users)
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

        // Create new organizer first
        let newOrganizer;
        try {
            newOrganizer = await Organizer.create({
                name: name.trim(),
                description: description?.trim() || undefined,
                logo: logo?.trim() || undefined,
                website: website?.trim() || undefined,
            });
        } catch (error) {
            return NextResponse.json(
                { message: "Failed to create organizer" },
                { status: 500 }
            );
        }

        // Ensure organizer is saved and we have the ID
        const organizerId = newOrganizer._id;

        // Create user account with organizer role
        let newUser;
        try {
            newUser = await User.create({
                name: fullName.trim(),
                email: email.toLowerCase().trim(),
                password: password, // Will be hashed automatically by the model
                role: 'organizer',
                organizerId: organizerId, // Explicitly set the organizerId
            });
        } catch (error) {
            // If user creation fails, delete the organizer to maintain consistency
            await Organizer.findByIdAndDelete(organizerId);
            throw error;
        }

        // Return organizer and user data
        const organizerData = {
            id: newOrganizer._id.toString(),
            name: newOrganizer.name,
            description: newOrganizer.description,
            logo: newOrganizer.logo,
            website: newOrganizer.website,
            createdAt: newOrganizer.createdAt,
            updatedAt: newOrganizer.updatedAt,
            user: {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                organizerId: newUser.organizerId?.toString(),
            },
        };

        return handleSuccessResponse("Organizer and account created successfully", organizerData, 201);
    } catch (error) {
        // Handle validation errors from mongoose
        if (error instanceof Error) {
            // Check if it's a validation error
            if (error.message.includes("Organizer name is already taken")) {
                return NextResponse.json(
                    { message: error.message },
                    { status: 409 }
                );
            }
            if (error.message.includes("validation failed") || error.message.includes("Name must") || error.message.includes("Email must")) {
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
                return NextResponse.json(
                    { message: "Organizer name is already taken" },
                    { status: 409 }
                );
            }
        }

        return handleApiError(error);
    }
}

