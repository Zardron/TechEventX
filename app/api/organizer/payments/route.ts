import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Transaction from "@/database/transaction.model";
import Payout from "@/database/payout.model";
import Event from "@/database/event.model";
import Payment from "@/database/payment.model";
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
        // Use the same query logic as stats API to handle both cases:
        // 1. Events where organizerId = user.organizerId (events pointing to Organizer)
        // 2. Events where organizerId = user._id (events pointing to User - backward compatibility)
        const mongoose = await import('mongoose');
        const queryConditions: any[] = [];
        
        // If user has organizerId, find events where organizerId matches the Organizer
        if (user.organizerId) {
            const organizerIdObj = user.organizerId instanceof mongoose.Types.ObjectId
                ? user.organizerId
                : new mongoose.Types.ObjectId(user.organizerId.toString());
            queryConditions.push({ organizerId: organizerIdObj });
        }
        
        // Also check for events where organizerId points directly to the User (backward compatibility)
        const userId = user._id instanceof mongoose.Types.ObjectId 
            ? user._id 
            : new mongoose.Types.ObjectId(user._id.toString());
        queryConditions.push({ organizerId: userId });

        const events = await Event.find({
            $or: queryConditions
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

        // Debug logging
        console.log('🔍 Payments API Debug:');
        console.log('  Organizer ID:', organizerId);
        console.log('  Events found:', events.length);
        console.log('  Event IDs:', eventIds.map(id => id.toString()));

        // Get all payments for organizer's events (use Payment model like dashboard does)
        // Only count payments that have been confirmed (succeeded status)
        const payments = await Payment.find({
            eventId: { $in: eventIds },
            status: 'succeeded' // Only include confirmed payments (matching dashboard logic)
        });

        console.log('  Payments found:', payments.length);
        if (payments.length > 0) {
            console.log('  Sample payment:', {
                id: payments[0]._id.toString(),
                eventId: payments[0].eventId?.toString(),
                amount: payments[0].amount,
                status: payments[0].status
            });
        }

        // Get all transactions for organizer's events (to get organizerRevenue)
        const transactions = await Transaction.find({
            eventId: { $in: eventIds },
            status: { $in: ['completed', 'pending'] }
        });

        // Create a map of bookingId to transaction for quick lookup
        const transactionMap = new Map();
        transactions.forEach((t: any) => {
            if (t.bookingId) {
                transactionMap.set(t.bookingId.toString(), t);
            }
        });

        // Calculate revenue from payments (matching dashboard logic)
        // Use Payment records to calculate total revenue, then calculate organizer revenue
        const { calculateRevenue } = await import("@/lib/tickets");
        let totalEarned = 0;
        
        payments.forEach((payment: any) => {
            // Find corresponding transaction to get organizerRevenue
            const transaction = payment.bookingId 
                ? transactionMap.get(payment.bookingId.toString())
                : null;
            
            if (transaction && transaction.organizerRevenue) {
                // Use transaction's organizerRevenue if available
                totalEarned += transaction.organizerRevenue;
            } else {
                // If no transaction found, calculate organizer revenue from payment amount
                const { organizerRevenue } = calculateRevenue(payment.amount);
                totalEarned += organizerRevenue;
            }
        });

        // Calculate available balance (organizer revenue from unpaid payments)
        const payouts = await Payout.find({
            organizerId: organizerId,
            status: { $in: ['pending', 'processing', 'completed'] }
        });

        const paidTransactionIds = new Set();
        const paidPaymentIds = new Set();
        payouts.forEach((payout: any) => {
            if (payout.transactionIds && Array.isArray(payout.transactionIds)) {
                payout.transactionIds.forEach((id: any) => {
                    paidTransactionIds.add(id.toString());
                });
            }
            // Also track paid payment IDs if stored in payout
            if (payout.paymentIds && Array.isArray(payout.paymentIds)) {
                payout.paymentIds.forEach((id: any) => {
                    paidPaymentIds.add(id.toString());
                });
            }
        });

        // Calculate available balance from unpaid payments
        const unpaidPayments = payments.filter((p: any) => 
            !paidPaymentIds.has(p._id.toString())
        );

        let availableBalance = 0;
        unpaidPayments.forEach((payment: any) => {
            // Find corresponding transaction to get organizerRevenue
            const transaction = payment.bookingId 
                ? transactionMap.get(payment.bookingId.toString())
                : null;
            
            if (transaction && transaction.organizerRevenue && !paidTransactionIds.has(transaction._id.toString())) {
                availableBalance += transaction.organizerRevenue;
            } else if (!transaction) {
                // If no transaction found, calculate organizer revenue from payment amount
                const { organizerRevenue } = calculateRevenue(payment.amount);
                availableBalance += organizerRevenue;
            }
        });

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

        // Get all payments for payment history (use Payment records like dashboard)
        // Only show succeeded payments to match dashboard revenue calculation
        const allPaymentRecords = await Payment.find({
            eventId: { $in: eventIds },
            status: 'succeeded', // Only show confirmed payments (matching dashboard)
            amount: { $gt: 0 } // Only show payments with amount > 0 (exclude free events)
        })
            .populate('eventId', 'title slug')
            .populate('userId', 'name email')
            .populate('bookingId', 'ticketNumber')
            .sort({ createdAt: -1 });

        const formattedTransactions = allPaymentRecords
            .filter((payment: any) => {
                // Filter out free events (amount = 0)
                if (payment.amount === 0) {
                    return false;
                }
                return true;
            })
            .map((payment: any) => {
                // Find corresponding transaction for detailed info (platform fee, organizer revenue, etc.)
                const transaction = payment.bookingId 
                    ? transactionMap.get(payment.bookingId.toString())
                    : null;
                
                // Calculate organizer revenue
                let organizerRevenue = 0;
                let platformFee = 0;
                let discountAmount = 0;
                
                if (transaction) {
                    organizerRevenue = transaction.organizerRevenue ?? 0;
                    platformFee = transaction.platformFee || 0;
                    discountAmount = transaction.discountAmount || 0;
                } else {
                    // If no transaction found, calculate from payment amount
                    const { platformFee: calcPlatformFee, organizerRevenue: calcOrganizerRevenue } = calculateRevenue(payment.amount);
                    organizerRevenue = calcOrganizerRevenue;
                    platformFee = calcPlatformFee;
                    // Try to get discount from payment metadata
                    discountAmount = payment.metadata?.discountAmount || 0;
                }
                
                return {
                    id: payment._id.toString(),
                    type: 'event_payment',
                    amount: organizerRevenue > 0 ? organizerRevenue : payment.amount, // Show organizer revenue, fallback to payment amount
                    totalAmount: payment.amount,
                    currency: payment.currency,
                    status: 'completed', // Payment records with status 'succeeded' are completed
                    paymentMethod: payment.paymentMethod,
                    event: payment.eventId ? {
                        id: payment.eventId._id?.toString() || payment.eventId.toString(),
                        title: payment.eventId.title || 'Unknown Event',
                        slug: payment.eventId.slug || null,
                    } : null,
                    attendee: payment.userId ? {
                        id: payment.userId._id?.toString() || payment.userId.toString(),
                        name: payment.userId.name || 'Unknown',
                        email: payment.userId.email || 'N/A',
                    } : null,
                    booking: payment.bookingId ? {
                        id: payment.bookingId._id?.toString() || payment.bookingId.toString(),
                        ticketNumber: payment.bookingId.ticketNumber || null,
                    } : null,
                    platformFee: platformFee,
                    discountAmount: discountAmount,
                    createdAt: payment.createdAt,
                    paidAt: payment.paidAt || payment.createdAt,
                };
            });

        // Combine payment requests and transactions, sorted by date (newest first)
        const allPayments = [...formattedPayouts, ...formattedTransactions].sort((a, b) => {
            const dateA = a.createdAt || ('requestedAt' in a ? a.requestedAt : null) || ('paidAt' in a ? a.paidAt : null);
            const dateB = b.createdAt || ('requestedAt' in b ? b.requestedAt : null) || ('paidAt' in b ? b.paidAt : null);
            return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
        });

        const responseData = {
            data: {
                availableBalance,
                totalEarned,
                totalPaid,
                pendingBalance: totalEarned - totalPaid - availableBalance,
                payouts: allPayments,
                paymentRequests: formattedPayouts,
                transactions: formattedTransactions,
                unpaidTransactionCount: unpaidPayments.length,
            }
        };

        console.log('📤 Response data:', {
            availableBalance,
            totalEarned,
            totalPaid,
            payoutsCount: allPayments.length,
            transactionsCount: formattedTransactions.length,
        });

        return handleSuccessResponse("Payment data retrieved successfully", responseData);
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

        // Get organizer's events (use same query logic as GET method)
        const mongoose = await import('mongoose');
        const queryConditions: any[] = [];
        
        if (user.organizerId) {
            const organizerIdObj = user.organizerId instanceof mongoose.Types.ObjectId
                ? user.organizerId
                : new mongoose.Types.ObjectId(user.organizerId.toString());
            queryConditions.push({ organizerId: organizerIdObj });
        }
        
        const userId = user._id instanceof mongoose.Types.ObjectId 
            ? user._id 
            : new mongoose.Types.ObjectId(user._id.toString());
        queryConditions.push({ organizerId: userId });

        const events = await Event.find({
            $or: queryConditions
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
