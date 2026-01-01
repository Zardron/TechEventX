import User from "@/database/user.model";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { verifyToken } from "@/lib/auth";

// Public route - Sign in (POST)
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const { email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

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

        return handleSuccessResponse("Login successful", { user: userData, token });
    } catch (error) {
        return handleApiError(error);
    }
}

// Protected route - Get current user (GET)
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

        // Find user by ID
        const user = await User.findById(tokenPayload.id);

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Return user data (excluding password)
        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        };

        return handleSuccessResponse("User retrieved successfully", { user: userData });
    } catch (error) {
        return handleApiError(error);
    }
}

