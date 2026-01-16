import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Transaction from "@/database/transaction.model";
import Payout from "@/database/payout.model";
import Event from "@/database/event.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get payment history and available balance
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

        // Only organizers can access this
        if (user.role !== 'organizer' && user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Organizer access required" },
                { status: 403 }
            );
        }

        // Get organizer ID
        let organizerId;
        if (user.role === 'admin') {
            const { searchParams } = new URL(req.url);
            organizerId = searchParams.get('organizerId');
            if (!organizerId) {
                return NextResponse.json(
                    { message: "Organizer ID required for admin access" },
                    { status: 400 }
                );
            }
        } else {
            if (!user.organizerId) {
                return NextResponse.json(
                    { message: "Organizer not found for this user" },
                    { status: 404 }
                );
            }
            organizerId = user.organizerId.toString();
        }

        // Get organizer's events
        const mongoose = await import('mongoose');
        const events = await Event.find({
            organizerId: organizerId
        });

        if (events.length === 0) {
            // Return empty data if no events found
            return handleSuccessResponse("Payment data retrieved successfully", {
                availableBalance: 0,
                totalEarned: 0,
                totalPaid: 0,
                pendingBalance: 0,
                payouts: [],
                paymentRequests: [],
                transactions: [],
                unpaidTransactionCount: 0,
            });
        }

        const eventIds = events.map(e => e._id);

        // Get all transactions for organizer's events (include pending and completed)
        // We'll filter by status later if needed, but show all successful payments
        const transactions = await Transaction.find({
            eventId: { $in: eventIds },
            status: { $in: ['completed', 'pending'] } // Include pending as they might be paid but not yet marked complete
        });

        // Calculate available balance (organizer revenue from unpaid transactions)
        const payouts = await Payout.find({
            organizerId: organizerId,
            status: { $in: ['pending', 'processing', 'completed'] }
        });

        const paidTransactionIds = new Set();
        payouts.forEach((payout: any) => {
            payout.transactionIds.forEach((id: any) => {
                paidTransactionIds.add(id.toString());
            });
        });

        const unpaidTransactions = transactions.filter((t: any) => 
            !paidTransactionIds.has(t._id.toString())
        );

        const availableBalance = unpaidTransactions.reduce((sum, t) => sum + (t.organizerRevenue || 0), 0);
        const totalEarned = transactions.reduce((sum, t) => sum + (t.organizerRevenue || 0), 0);
        const totalPaid = payouts
            .filter((p: any) => p.status === 'completed')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Get payment history (payment requests)
        const payoutHistory = await Payout.find({
            organizerId: organizerId
        })
            .populate('processedBy', 'name email')
            .sort({ createdAt: -1 });

        const formattedPayouts = payoutHistory.map((payout: any) => ({
            id: payout._id.toString(),
            type: 'payment_request',
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status,
            paymentMethod: payout.paymentMethod,
            requestedAt: payout.requestedAt,
            processedAt: payout.processedAt,
            processedBy: payout.processedBy ? {
                id: payout.processedBy._id.toString(),
                name: payout.processedBy.name,
            } : null,
            failureReason: payout.failureReason,
            createdAt: payout.createdAt,
        }));

        // Get all transactions (individual event payments)
        // Include both completed and pending statuses
        // Note: Pending transactions are for manual payments that haven't been confirmed yet
        const allTransactions = await Transaction.find({
            eventId: { $in: eventIds },
            status: { $in: ['completed', 'pending'] },
            amount: { $gt: 0 } // Only show transactions with amount > 0 (exclude free events)
        })
            .populate('eventId', 'title slug')
            .populate('userId', 'name email')
            .populate('bookingId', 'ticketNumber')
            .sort({ createdAt: -1 });

        const formattedTransactions = allTransactions
            .filter((transaction: any) => {
                // Filter out free events (amount = 0) unless they have organizerRevenue
                if (transaction.amount === 0 && !transaction.organizerRevenue) {
                    return false;
                }
                return true;
            })
            .map((transaction: any) => {
                // Calculate organizer revenue if not set (for backward compatibility)
                const organizerRevenue = transaction.organizerRevenue ?? (transaction.amount - (transaction.platformFee || 0));
                
                return {
                    id: transaction._id.toString(),
                    type: 'event_payment',
                    amount: organizerRevenue > 0 ? organizerRevenue : transaction.amount, // Show organizer revenue, fallback to total amount
                    totalAmount: transaction.amount,
                    currency: transaction.currency,
                    status: transaction.status || 'completed',
                    paymentMethod: transaction.paymentMethod,
                    event: transaction.eventId ? {
                        id: transaction.eventId._id?.toString() || transaction.eventId.toString(),
                        title: transaction.eventId.title || 'Unknown Event',
                        slug: transaction.eventId.slug || null,
                    } : null,
                    attendee: transaction.userId ? {
                        id: transaction.userId._id?.toString() || transaction.userId.toString(),
                        name: transaction.userId.name || 'Unknown',
                        email: transaction.userId.email || 'N/A',
                    } : null,
                    booking: transaction.bookingId ? {
                        id: transaction.bookingId._id?.toString() || transaction.bookingId.toString(),
                        ticketNumber: transaction.bookingId.ticketNumber || null,
                    } : null,
                    platformFee: transaction.platformFee || 0,
                    discountAmount: transaction.discountAmount || 0,
                    createdAt: transaction.createdAt,
                    paidAt: transaction.createdAt, // Use createdAt as paidAt for transactions
                };
            });

        // Combine payment requests and transactions, sorted by date (newest first)
        const allPayments = [...formattedPayouts, ...formattedTransactions].sort((a, b) => {
            const dateA = a.createdAt || a.requestedAt || a.paidAt;
            const dateB = b.createdAt || b.requestedAt || b.paidAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        return handleSuccessResponse("Payment data retrieved successfully", {
            availableBalance,
            totalEarned,
            totalPaid,
            pendingBalance: totalEarned - totalPaid - availableBalance,
            payouts: allPayments,
            paymentRequests: formattedPayouts,
            transactions: formattedTransactions,
            unpaidTransactionCount: unpaidTransactions.length,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST - Request a payment
export async function POST(req: NextRequest): Promise<NextResponse> {
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

        // Only organizers can request payments
        if (user.role !== 'organizer') {
            return NextResponse.json(
                { message: "Forbidden - Organizer access required" },
                { status: 403 }
            );
        }

        if (!user.organizerId) {
            return NextResponse.json(
                { message: "Organizer not found for this user" },
                { status: 404 }
            );
        }

        const { amount, paymentMethod, accountDetails } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { message: "Valid amount is required" },
                { status: 400 }
            );
        }

        if (!paymentMethod) {
            return NextResponse.json(
                { message: "Payment method is required" },
                { status: 400 }
            );
        }

        // Get organizer's events
        const events = await Event.find({
            organizerId: user.organizerId
        });

        const eventIds = events.map(e => e._id);

        // Get unpaid transactions
        const transactions = await Transaction.find({
            eventId: { $in: eventIds },
            status: 'completed'
        });

        const payouts = await Payout.find({
            organizerId: user.organizerId,
            status: { $in: ['pending', 'processing', 'completed'] }
        });

        const paidTransactionIds = new Set();
        payouts.forEach((payout: any) => {
            payout.transactionIds.forEach((id: any) => {
                paidTransactionIds.add(id.toString());
            });
        });

        const unpaidTransactions = transactions.filter((t: any) => 
            !paidTransactionIds.has(t._id.toString())
        );

        const availableBalance = unpaidTransactions.reduce((sum, t) => sum + (t.organizerRevenue || 0), 0);

        // Validate amount doesn't exceed available balance
        if (amount > availableBalance) {
            return NextResponse.json(
                { message: `Requested amount exceeds available balance of ${(availableBalance / 100).toFixed(2)}` },
                { status: 400 }
            );
        }

        // Check minimum payment amount (e.g., 1000 cents = $10)
        const minimumPayment = 1000; // 10.00 in cents
        if (amount < minimumPayment) {
            return NextResponse.json(
                { message: `Minimum payment amount is ${(minimumPayment / 100).toFixed(2)}` },
                { status: 400 }
            );
        }

        // Select transactions to include (up to requested amount)
        let remainingAmount = amount;
        const selectedTransactions: any[] = [];
        
        for (const transaction of unpaidTransactions) {
            if (remainingAmount <= 0) break;
            const transactionRevenue = transaction.organizerRevenue || 0;
            if (transactionRevenue <= remainingAmount) {
                selectedTransactions.push(transaction._id);
                remainingAmount -= transactionRevenue;
            }
        }

        // Create payment request
        const payout = await Payout.create({
            organizerId: user.organizerId,
            amount,
            currency: 'php',
            status: 'pending',
            paymentMethod,
            accountDetails: accountDetails || {},
            transactionIds: selectedTransactions,
            requestedAt: new Date(),
        });

        return handleSuccessResponse("Payment request created successfully", {
            payout: {
                id: payout._id.toString(),
                amount: payout.amount,
                status: payout.status,
                requestedAt: payout.requestedAt,
            }
        }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
