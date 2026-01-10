import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Transaction from "@/database/transaction.model";
import Event from "@/database/event.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get user's payment history
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

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        const query: any = { userId: user._id };
        if (status) {
            query.status = status;
        }

        // Get transactions
        const transactions = await Transaction.find(query)
            .populate('eventId', 'title slug image date')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(offset);

        // Get total count
        const total = await Transaction.countDocuments(query);

        // Format transactions
        const formattedTransactions = transactions.map((transaction: any) => ({
            id: transaction._id.toString(),
            eventId: transaction.eventId?._id.toString(),
            event: transaction.eventId ? {
                id: transaction.eventId._id.toString(),
                title: transaction.eventId.title,
                slug: transaction.eventId.slug,
                image: transaction.eventId.image,
                date: transaction.eventId.date,
            } : null,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            paymentMethod: transaction.paymentMethod,
            discountAmount: transaction.discountAmount || 0,
            refundAmount: transaction.refundAmount || 0,
            createdAt: transaction.createdAt,
            refundedAt: transaction.refundedAt,
        }));

        // Calculate summary
        const completedTransactions = transactions.filter((t: any) => t.status === 'completed');
        const totalSpent = completedTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const totalRefunded = transactions
            .filter((t: any) => t.status === 'refunded')
            .reduce((sum: number, t: any) => sum + (t.refundAmount || 0), 0);

        return handleSuccessResponse("Payment history retrieved successfully", {
            transactions: formattedTransactions,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
            summary: {
                totalSpent,
                totalRefunded,
                totalTransactions: total,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}

