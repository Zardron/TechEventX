import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Payout from "@/database/payout.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// PATCH - Update payment status (admin only)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ payoutId: string }> }
): Promise<NextResponse> {
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

        // Only admins can process payments
        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        const { payoutId } = await params;
        const { status, failureReason } = await req.json();

        if (!status) {
            return NextResponse.json(
                { message: "Status is required" },
                { status: 400 }
            );
        }

        const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: "Invalid status" },
                { status: 400 }
            );
        }

        // Find payment
        const payout = await Payout.findById(payoutId);

        if (!payout) {
            return NextResponse.json(
                { message: "Payment not found" },
                { status: 404 }
            );
        }

        // Update payment
        payout.status = status;
        if (status === 'completed' || status === 'processing') {
            payout.processedAt = new Date();
            payout.processedBy = user._id;
        }
        if (status === 'failed' && failureReason) {
            payout.failureReason = failureReason;
        }
        if (status === 'cancelled') {
            payout.processedAt = new Date();
            payout.processedBy = user._id;
        }

        await payout.save();

        // Create notification for organizer
        const Notification = (await import("@/database/notification.model")).default;
        await Notification.create({
            userId: payout.organizerId,
            type: 'other',
            title: 'Payment Status Updated',
            message: `Your payment request of ${(payout.amount / 100).toFixed(2)} ${payout.currency.toUpperCase()} has been ${status}.`,
            link: `/organizer-dashboard/payments`,
            metadata: {
                payoutId: payout._id.toString(),
                status,
                amount: payout.amount,
            },
        });

        return handleSuccessResponse("Payment status updated successfully", {
            payout: {
                id: payout._id.toString(),
                status: payout.status,
                processedAt: payout.processedAt,
                processedBy: payout.processedBy?.toString(),
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}
