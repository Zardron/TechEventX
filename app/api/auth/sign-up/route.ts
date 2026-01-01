import User from "@/database/user.model";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const { name, email, password } = await req.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

        if (existingUser) {
            return NextResponse.json(
                { message: "Email is already registered" },
                { status: 409 }
            );
        }

        // Create new user (password will be hashed by the pre-save hook in the model)
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            role: 'user',
            password: password, // Will be hashed automatically by the model
        });

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json(
                { message: "JWT secret not configured" },
                { status: 500 }
            );
        }

        const token = jwt.sign(
            { id: user._id.toString() },
            jwtSecret,
            { expiresIn: "7d" }
        );

        // Return user data (excluding password) and token
        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        };

        return handleSuccessResponse(
            "Account created successfully",
            { user: userData, token },
            201
        );
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
        return handleApiError(error);
    }
}

