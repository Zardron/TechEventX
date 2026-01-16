import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Payout from "@/database/payout.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get all payment requests (admin only)
export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const tokenPayload = verifyToken(req);
        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

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

        // Only admins can access this
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        // Build query
        const query: any = {};
        if (status) {
            query.status = status;
        }

        // Get payments
        const payouts = await Payout.find(query)
            .populate('organizerId', 'name email')
            .populate('processedBy', 'name email')
            .sort({ createdAt: -1 });

        // Format payments
        const formattedPayouts = payouts.map((payout: any) => ({
            id: payout._id.toString(),
            organizer: payout.organizerId ? {
                id: payout.organizerId._id.toString(),
                name: payout.organizerId.name,
                email: payout.organizerId.email,
            } : null,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status,
            paymentMethod: payout.paymentMethod,
            accountDetails: payout.accountDetails,
            transactionIds: payout.transactionIds.map((id: any) => id.toString()),
            requestedAt: payout.requestedAt,
            processedAt: payout.processedAt,
            processedBy: payout.processedBy ? {
                id: payout.processedBy._id.toString(),
                name: payout.processedBy.name,
            } : null,
            failureReason: payout.failureReason,
            createdAt: payout.createdAt,
        }));

        // Calculate statistics
        const stats = {
            pending: formattedPayouts.filter((p: any) => p.status === 'pending').length,
            processing: formattedPayouts.filter((p: any) => p.status === 'processing').length,
            completed: formattedPayouts.filter((p: any) => p.status === 'completed').length,
            failed: formattedPayouts.filter((p: any) => p.status === 'failed').length,
            totalPendingAmount: formattedPayouts
                .filter((p: any) => p.status === 'pending')
                .reduce((sum, p) => sum + p.amount, 0),
            totalCompletedAmount: formattedPayouts
                .filter((p: any) => p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0),
        };

        return handleSuccessResponse("Payments retrieved successfully", {
            payouts: formattedPayouts,
            stats,
            count: formattedPayouts.length,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
