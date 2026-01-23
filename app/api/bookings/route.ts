import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Booking from "@/database/booking.model";
import Event from "@/database/event.model";
import Ticket from "@/database/ticket.model";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Notification from "@/database/notification.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";

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

        // Get user to get their email (exclude soft-deleted users)
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

        // Find all bookings for this user (by userId, fallback to email for backward compatibility)
        const bookings = await Booking.find({ 
            $or: [
                { userId: user._id },
                { email: user.email } // Fallback for old bookings without userId
            ]
        })
            .populate('eventId')
            .sort({ createdAt: -1 });

        // Get all ticket numbers for these bookings
        const bookingIds = bookings.map((b: any) => b._id);
        const tickets = await Ticket.find({ bookingId: { $in: bookingIds } });
        const ticketMap = new Map();
        tickets.forEach((ticket: any) => {
            ticketMap.set(ticket.bookingId.toString(), ticket.ticketNumber);
        });

        // Format bookings with event details
        const formattedBookings = bookings.map((booking: any) => ({
            id: booking._id.toString(),
            eventId: booking.eventId._id.toString(),
            event: {
                id: booking.eventId._id.toString(),
                title: booking.eventId.title,
                slug: booking.eventId.slug,
                date: booking.eventId.date,
                time: booking.eventId.time,
                venue: booking.eventId.venue,
                location: booking.eventId.location,
                image: booking.eventId.image,
                mode: booking.eventId.mode,
            },
            ticketNumber: ticketMap.get(booking._id.toString()) || null,
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
            receiptUrl: booking.receiptUrl,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
        }));

        return handleSuccessResponse("Bookings retrieved successfully", { bookings: formattedBookings });
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

        // Get user to get their email (exclude soft-deleted users)
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

        // Validate user email
        if (!user.email || !user.email.trim()) {
            return NextResponse.json(
                { message: "User email is required. Please update your profile with a valid email address." },
                { status: 400 }
            );
        }

        // Get event slug from request body
        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            return NextResponse.json(
                { message: "Invalid request body. Please check your input." },
                { status: 400 }
            );
        }
        const { eventSlug, paymentIntentId, promoCode, paymentMethod, receiptUrl } = body;

        if (!eventSlug) {
            return NextResponse.json(
                { message: "Event slug is required" },
                { status: 400 }
            );
        }

        // Find event by slug
        const event = await Event.findOne({ slug: eventSlug });

        if (!event) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 }
            );
        }

        // Debug: Log event organizer info
        console.log(`📅 Event found: ${event.title} (${event._id}), organizerId: ${event.organizerId || 'NOT SET'}`);

        // Check if user already booked this event (by userId, fallback to email)
        // Use a more robust check to prevent duplicates, including checking for bookings created in the last few seconds
        const existingBooking = await Booking.findOne({
            eventId: event._id,
            $or: [
                { userId: user._id },
                { email: user.email } // Fallback for old bookings
            ]
        });

        if (existingBooking) {
            return NextResponse.json(
                { message: "You have already booked this event" },
                { status: 400 }
            );
        }

        // Additional check: if paymentIntentId is provided, check if a booking with this payment intent already exists
        // This prevents duplicate bookings from the same payment intent
        // Use both Transaction and Payment collections to catch duplicates
        if (paymentIntentId) {
            const Transaction = (await import("@/database/transaction.model")).default;
            const Payment = (await import("@/database/payment.model")).default;
            
            // Check transactions
            const existingTransaction = await Transaction.findOne({
                paymongoPaymentIntentId: paymentIntentId,
                eventId: event._id
            });

            if (existingTransaction && existingTransaction.bookingId) {
                const existingBookingByPayment = await Booking.findById(existingTransaction.bookingId);
                if (existingBookingByPayment) {
                    return NextResponse.json(
                        { message: "Booking already exists for this payment" },
                        { status: 400 }
                    );
                }
            }
            
            // Also check payments collection
            const existingPayment = await Payment.findOne({
                paymongoPaymentIntentId: paymentIntentId,
                eventId: event._id
            });
            
            if (existingPayment && existingPayment.bookingId) {
                const existingBookingByPayment = await Booking.findById(existingPayment.bookingId);
                if (existingBookingByPayment) {
                    return NextResponse.json(
                        { message: "Booking already exists for this payment" },
                        { status: 400 }
                    );
                }
            }
        }

        // Check capacity - only count confirmed bookings
        if (event.capacity) {
            const confirmedBookingCount = await Booking.countDocuments({ 
                eventId: event._id,
                $or: [
                    { paymentStatus: 'confirmed' },
                    { paymentStatus: { $exists: false } }, // Free events don't have paymentStatus
                    { paymentStatus: null } // Handle null values
                ]
            });
            if (confirmedBookingCount >= event.capacity) {
                // Check if waitlist is enabled
                if (event.waitlistEnabled) {
                    const Waitlist = (await import("@/database/waitlist.model")).default;
                    const existingWaitlist = await Waitlist.findOne({
                        email: user.email,
                        eventId: event._id,
                    });

                    if (!existingWaitlist) {
                        const waitlistCount = await Waitlist.countDocuments({ eventId: event._id });
                        await Waitlist.create({
                            email: user.email,
                            eventId: event._id,
                            position: waitlistCount + 1,
                        });
                    }

                    return NextResponse.json(
                        { message: "Event is sold out. You have been added to the waitlist." },
                        { status: 200 }
                    );
                } else {
                    return NextResponse.json(
                        { message: "Event is sold out" },
                        { status: 400 }
                    );
                }
            }
        }

        // Check if event requires payment
        if (!event.isFree && event.price) {
            // For paid events, require payment intent (PayMongo)
            if (!paymentIntentId) {
                return NextResponse.json(
                    { message: "Payment is required for this event" },
                    { status: 400 }
                );
            }
        }

        // Calculate payment details for transaction (before creating booking)
        let transactionData: any = null;
        let finalAmount: number = 0; // Store final amount for payment record
        const Transaction = (await import("@/database/transaction.model")).default;
        const { calculateRevenue } = await import("@/lib/tickets");

        if (!event.isFree && event.price) {
            let discountAmount = 0;
            let promoCodeId = undefined;

            // Apply promo code discount if used
            if (promoCode) {
                const PromoCode = (await import("@/database/promocode.model")).default;
                const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
                if (promo) {
                    if (promo.discountType === 'percentage') {
                        discountAmount = Math.round((event.price || 0) * (promo.discountValue / 100));
                        if (promo.maxDiscountAmount) {
                            discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
                        }
                    } else {
                        discountAmount = promo.discountValue;
                    }
                    promo.usedCount += 1;
                    await promo.save();
                    promoCodeId = promo._id;
                }
            }

            finalAmount = (event.price || 0) - discountAmount;
            const { platformFee: finalPlatformFee, organizerRevenue: finalOrganizerRevenue } = calculateRevenue(finalAmount);

            // Prepare transaction data (will be created after booking)
            transactionData = {
                userId: user._id,
                eventId: event._id,
                amount: finalAmount,
                currency: event.currency || 'php',
                discountAmount,
                platformFee: finalPlatformFee,
                organizerRevenue: finalOrganizerRevenue,
                promoCodeId,
            };

            // Handle PayMongo payment
            if (paymentIntentId) {
                const { getPaymentIntent, getPaymentsForIntent } = await import("@/lib/paymongo");
                
                // Verify payment intent from PayMongo
                const paymentIntent = await getPaymentIntent(paymentIntentId);
                
                if (!paymentIntent || !paymentIntent.attributes) {
                    return NextResponse.json(
                        { message: "Invalid payment intent" },
                        { status: 400 }
                    );
                }

                // Check payment status
                const paymentStatus = paymentIntent.attributes.status;
                if (paymentStatus !== 'succeeded' && paymentStatus !== 'awaiting_payment_method') {
                    // For PayMongo, we might get 'awaiting_payment_method' if checkout is still in progress
                    // But if it's explicitly failed or cancelled, reject
                    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
                        return NextResponse.json(
                            { message: "Payment failed or was cancelled" },
                            { status: 400 }
                        );
                    }
                }

                // Get payment method from intent metadata or payment
                // IMPORTANT: Check payment intent attributes first, then payments
                // Store detected payment method for reuse in booking and payment records
                let detectedPayMongoMethod: 'card' | 'gcash' | 'grab_pay' | 'paymaya' = 'card';
                let hasSuccessfulPayment = false;
                const payments = await getPaymentsForIntent(paymentIntentId);
                
                // First, try to get payment method from payment intent's payment_method_allowed
                const paymentMethodAllowed = paymentIntent.attributes?.payment_method_allowed || [];
                if (paymentMethodAllowed.length > 0) {
                    // PayMongo returns array like ['gcash', 'card', 'grab_pay']
                    if (paymentMethodAllowed.includes('gcash')) {
                        detectedPayMongoMethod = 'gcash';
                    } else if (paymentMethodAllowed.includes('grab_pay')) {
                        detectedPayMongoMethod = 'grab_pay';
                    } else if (paymentMethodAllowed.includes('paymaya')) {
                        detectedPayMongoMethod = 'paymaya';
                    } else if (paymentMethodAllowed.includes('card')) {
                        detectedPayMongoMethod = 'card';
                    }
                }
                
                // Then check actual payments (more accurate if payment completed)
                if (payments && payments.length > 0) {
                    // Find the most recent successful payment
                    const successfulPayment = payments.find((p: any) => {
                        const pStatus = p.attributes?.status || p.status;
                        return pStatus === 'paid' || pStatus === 'succeeded';
                    }) || payments[0]; // Fallback to first payment if none succeeded yet
                    
                    if (successfulPayment) {
                        const paymentMethod = successfulPayment.attributes?.payment_method;
                        if (paymentMethod) {
                            const methodType = paymentMethod.attributes?.type;
                            if (methodType === 'gcash') detectedPayMongoMethod = 'gcash';
                            else if (methodType === 'grab_pay') detectedPayMongoMethod = 'grab_pay';
                            else if (methodType === 'paymaya') detectedPayMongoMethod = 'paymaya';
                            else if (methodType === 'card') detectedPayMongoMethod = 'card';
                        }
                        
                        // Check if any payment succeeded
                        hasSuccessfulPayment = payments.some((p: any) => {
                            const pStatus = p.attributes?.status || p.status;
                            return pStatus === 'paid' || pStatus === 'succeeded';
                        });
                    }
                }

                // Map PayMongo payment method to transaction payment method enum
                let transactionPaymentMethod: 'card' | 'bank_transfer' | 'paypal' | 'free' = 'card';
                if (detectedPayMongoMethod === 'gcash' || detectedPayMongoMethod === 'grab_pay' || detectedPayMongoMethod === 'paymaya') {
                    transactionPaymentMethod = 'bank_transfer'; // Map e-wallets to bank_transfer for transaction
                }

                // Set transaction status: completed if payment succeeded (either intent status or actual payment)
                // This ensures transaction status matches the booking payment status we'll set later
                const paymentSucceeded = paymentStatus === 'succeeded' || hasSuccessfulPayment;
                transactionData.status = paymentSucceeded ? 'completed' : 'pending';
                transactionData.paymentMethod = transactionPaymentMethod;
                transactionData.paymongoPaymentIntentId = paymentIntentId;
                
                // Store payment method in metadata for reference
                transactionData.metadata = {
                    ...transactionData.metadata,
                    paymongoPaymentMethod: detectedPayMongoMethod,
                    eventSlug: event.slug,
                    eventTitle: event.title,
                };
                
                // Store payment intent and detected method for later use in booking creation
                (transactionData as any)._paymentIntent = paymentIntent;
                (transactionData as any)._detectedPayMongoMethod = detectedPayMongoMethod;
                (transactionData as any)._hasSuccessfulPayment = hasSuccessfulPayment;
            } 
            // Handle manual payment (with receipt)
            else if (paymentMethod && receiptUrl) {
                // Map payment method to transaction payment method enum
                let transactionPaymentMethod: 'card' | 'bank_transfer' | 'paypal' | 'free' = 'bank_transfer';
                if (paymentMethod === 'bank_transfer') {
                    transactionPaymentMethod = 'bank_transfer';
                } else if (paymentMethod === 'gcash' || paymentMethod === 'paymaya' || paymentMethod === 'grabpay' || paymentMethod === 'grab_pay' || paymentMethod.startsWith('qr')) {
                    // Map e-wallet and QR payments to bank_transfer for transaction table
                    transactionPaymentMethod = 'bank_transfer';
                }

                transactionData.status = 'pending'; // Pending until receipt is verified
                transactionData.paymentMethod = transactionPaymentMethod;
                transactionData.metadata = {
                    receiptUrl: receiptUrl,
                    paymentMethod: paymentMethod, // Store original payment method in metadata
                    eventSlug: event.slug,
                    eventTitle: event.title,
                };
            }
        }

        // Create booking
        const bookingData: any = {
            eventId: event._id,
            userId: user._id,
            email: user.email
        };

        // For paid events with PayMongo payment, payment status will be determined by payment intent status
        // If payment is succeeded, booking is confirmed. Otherwise, it's pending.
        // IMPORTANT: When user is redirected back from PayMongo, the payment intent status might
        // still be 'awaiting_payment_method' even though payment succeeded. We need to check
        // the actual payments associated with the intent to determine if payment succeeded.
        // Also store payment method in booking for reference
        if (!event.isFree && event.price && paymentIntentId) {
            // Reuse payment intent and detected method from transactionData if available
            const paymentIntent = (transactionData as any)?._paymentIntent;
            const detectedPayMongoMethod = (transactionData as any)?._detectedPayMongoMethod;
            const hasSuccessfulPayment = (transactionData as any)?._hasSuccessfulPayment;
            
            if (paymentIntent && paymentIntent.attributes) {
                const intentStatus = paymentIntent.attributes.status;
                
                // Store payment method in booking (map PayMongo method to booking method)
                if (detectedPayMongoMethod) {
                    // Map PayMongo method names to booking payment method names
                    if (detectedPayMongoMethod === 'gcash') bookingData.paymentMethod = 'gcash';
                    else if (detectedPayMongoMethod === 'grab_pay') bookingData.paymentMethod = 'grabpay';
                    else if (detectedPayMongoMethod === 'paymaya') bookingData.paymentMethod = 'paymaya';
                    else if (detectedPayMongoMethod === 'card') bookingData.paymentMethod = 'card';
                }
                
                // Check if payment intent status is succeeded
                if (intentStatus === 'succeeded') {
                    bookingData.paymentStatus = 'confirmed';
                } else {
                    // Even if intent status is not 'succeeded', check if there are successful payments
                    // This handles the case where user completed payment but PayMongo hasn't updated intent status yet
                    
                    // Also check if there are no errors (indicates payment likely succeeded)
                    const hasNoErrors = !paymentIntent.attributes.last_payment_error && 
                                       !paymentIntent.attributes.errors &&
                                       intentStatus !== 'failed' &&
                                       intentStatus !== 'canceled';
                    
                    // If we have a successful payment OR no errors and status is processing/awaiting, 
                    // mark as confirmed (payment likely succeeded, just status not updated yet)
                    if (hasSuccessfulPayment || (hasNoErrors && (intentStatus === 'processing' || intentStatus === 'awaiting_payment_method'))) {
                        bookingData.paymentStatus = 'confirmed';
                    } else {
                        // For other states, set as pending - webhook will update when payment succeeds
                        bookingData.paymentStatus = 'pending';
                    }
                }
            } else {
                // If we can't verify payment intent, set as pending
                bookingData.paymentStatus = 'pending';
            }
        } else if (!event.isFree && event.price && paymentMethod && receiptUrl) {
            // Manual payment - pending verification
            bookingData.paymentStatus = 'pending';
            bookingData.receiptUrl = receiptUrl;
            bookingData.paymentMethod = paymentMethod;
        }
        // For free events, paymentStatus remains undefined (which is correct)

        const booking = new Booking(bookingData);
        await booking.save();

        // Create transaction after booking is created (for both Stripe and manual payments)
        // Use try-catch to handle duplicate key errors from unique index
        let transaction: any = null;
        if (transactionData) {
            try {
                const createdTransaction = await Transaction.create({
                    ...transactionData,
                    bookingId: booking._id, // Now we have the booking ID
                });
                // Handle both single document and array returns
                transaction = Array.isArray(createdTransaction) ? createdTransaction[0] : createdTransaction;
                console.log(`✅ Transaction created: ${transaction?._id} for booking ${booking._id} with status: ${transaction?.status}`);
            } catch (transactionError: any) {
                // Handle duplicate key error (E11000) - transaction already exists for this payment intent
                if (transactionError.code === 11000) {
                    console.warn(`⚠️ Duplicate transaction detected for payment intent: ${paymentIntentId}`);
                    // Find existing transaction
                    transaction = await Transaction.findOne({
                        paymongoPaymentIntentId: paymentIntentId,
                        eventId: event._id
                    });
                    if (transaction && transaction.bookingId?.toString() !== booking._id.toString()) {
                        // Different booking - this is a duplicate, rollback booking
                        await Booking.findByIdAndDelete(booking._id);
                        return NextResponse.json(
                            { message: "Booking already exists for this payment" },
                            { status: 400 }
                        );
                    }
                } else {
                    // Other error - log and continue (don't fail booking creation)
                    console.error('❌ Error creating transaction:', transactionError);
                }
            }
        }

        // Create payment record for all paid events
        if (!event.isFree && event.price) {
            try {
                const Payment = (await import("@/database/payment.model")).default;
                
                let paymentStatus: 'pending' | 'succeeded' | 'failed' = 'pending';
                let paymentMethodType: 'card' | 'bank_transfer' | 'gcash' | 'paymaya' | 'grabpay' | 'qr' | 'other' = 'other';
                
                // Determine payment status and method
                if (paymentIntentId) {
                    // PayMongo payment - check status from payment intent
                    const { getPaymentIntent, getPaymentsForIntent } = await import("@/lib/paymongo");
                    const paymentIntent = await getPaymentIntent(paymentIntentId);
                    
                    if (paymentIntent && paymentIntent.attributes) {
                        const intentStatus = paymentIntent.attributes.status;
                        paymentStatus = intentStatus === 'succeeded' ? 'succeeded' : 'pending';
                        
                        // Reuse detected payment method from transactionData if available
                        const detectedPayMongoMethod = (transactionData as any)?._detectedPayMongoMethod;
                        if (detectedPayMongoMethod) {
                            // Map PayMongo method names to Payment model method names
                            if (detectedPayMongoMethod === 'gcash') paymentMethodType = 'gcash';
                            else if (detectedPayMongoMethod === 'grab_pay') paymentMethodType = 'grabpay';
                            else if (detectedPayMongoMethod === 'paymaya') paymentMethodType = 'paymaya';
                            else if (detectedPayMongoMethod === 'card') paymentMethodType = 'card';
                        } else {
                            // Fallback: Get payment method from payments (shouldn't happen if transactionData exists)
                            const payments = await getPaymentsForIntent(paymentIntentId);
                            if (payments && payments.length > 0) {
                                const successfulPayment = payments.find((p: any) => {
                                    const pStatus = p.attributes?.status || p.status;
                                    return pStatus === 'paid' || pStatus === 'succeeded';
                                }) || payments[0];
                                
                                const paymentMethodAttr = successfulPayment.attributes?.payment_method;
                                if (paymentMethodAttr) {
                                    const methodType = paymentMethodAttr.attributes?.type;
                                    if (methodType === 'gcash') paymentMethodType = 'gcash';
                                    else if (methodType === 'grab_pay') paymentMethodType = 'grabpay';
                                    else if (methodType === 'paymaya') paymentMethodType = 'paymaya';
                                    else if (methodType === 'card') paymentMethodType = 'card';
                                }
                            }
                        }
                    } else {
                        paymentStatus = 'pending';
                    }
                } else if (paymentMethod && receiptUrl) {
                    // Manual payment - pending verification
                    paymentStatus = 'pending';
                    // Map payment method to enum
                    if (paymentMethod === 'bank_transfer') {
                        paymentMethodType = 'bank_transfer';
                    } else if (paymentMethod === 'gcash') {
                        paymentMethodType = 'gcash';
                    } else if (paymentMethod === 'paymaya') {
                        paymentMethodType = 'paymaya';
                    } else if (paymentMethod === 'grabpay' || paymentMethod === 'grab_pay') {
                        paymentMethodType = 'grabpay';
                    } else if (paymentMethod.startsWith('qr')) {
                        paymentMethodType = 'qr';
                    } else {
                        paymentMethodType = 'other';
                    }
                } else {
                    // No payment provided - failed
                    paymentStatus = 'failed';
                }

                // Use the finalAmount calculated earlier (includes event price with discounts)
                // This is the actual amount the user paid (event.price - discountAmount)
                // Note: Amounts are stored in cents (e.g., 100 PHP = 10000 cents)
                // We always use finalAmount since it's calculated from event.price
                const paymentAmount = finalAmount || (event.price || 0);

                // Create payment record
                // Use try-catch to handle duplicate key errors
                try {
                    const payment = await Payment.create({
                        eventId: event._id,
                        bookingId: booking._id,
                        userId: user._id,
                        amount: paymentAmount,
                        currency: event.currency || 'php',
                        status: paymentStatus,
                        paymentMethod: paymentMethodType,
                        paymongoPaymentIntentId: paymentIntentId || undefined,
                        receiptUrl: receiptUrl || undefined,
                        description: `Payment for event: ${event.title}`,
                        metadata: {
                            eventSlug: event.slug,
                            eventTitle: event.title,
                            promoCode: promoCode || null,
                            originalEventPrice: event.price || 0, // Store original event price for reference
                            discountAmount: transactionData?.discountAmount || 0, // Store discount amount if applicable
                        },
                        paidAt: paymentStatus === 'succeeded' ? new Date() : undefined,
                    });

                    console.log(`✅ Payment created: ${payment._id} for booking ${booking._id} with status: ${paymentStatus}`);
                } catch (paymentError: any) {
                    // Handle duplicate key error (E11000) - payment already exists for this payment intent
                    if (paymentError.code === 11000) {
                        console.warn(`⚠️ Duplicate payment detected for payment intent: ${paymentIntentId}`);
                        // If transaction was created but payment failed due to duplicate, that's okay
                        // The existing payment record will be used
                    } else {
                        // Log other errors but don't fail the booking creation
                        console.error('❌ Error creating payment record:', paymentError);
                    }
                }
            } catch (paymentError) {
                // Log error but don't fail the booking creation
                console.error('❌ Error creating payment record:', paymentError);
                // Continue with booking creation even if payment record creation fails
            }
        }

        // Generate ticket only if payment is confirmed (free events or PayMongo payments that succeeded)
        // For pending payments, ticket will be generated after payment confirmation
        let ticket = null;
        // Check if payment succeeded: either free event, or payment intent succeeded, or transaction completed
        const paymentSucceeded = event.isFree || 
                                  (paymentIntentId && booking.paymentStatus === 'confirmed') ||
                                  (transactionData?.status === 'completed');
        const shouldGenerateTicket = paymentSucceeded;
        if (shouldGenerateTicket) {
            const Ticket = (await import("@/database/ticket.model")).default;
            const { generateTicketNumber } = await import("@/lib/tickets");
            
            const ticketNumber = generateTicketNumber();
            
            // Generate QR code using react-qr-code with dynamic imports to avoid Turbopack issues
            const React = (await import("react")).default;
            const { renderToString } = await import("react-dom/server");
            const QRCodeSVG = (await import("react-qr-code")).default;
            const sharp = (await import("sharp")).default;
            
            // Get base URL from request or environment variable
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                           (req.headers.get('origin') || 
                            `https://${req.headers.get('host') || 'localhost:3000'}`);
            
            // Generate QR code with URL pointing to verification page
            const qrCodeUrl = `${baseUrl}/verify/${ticketNumber}`;
            
            const qrCodeSVG = renderToString(
                React.createElement(QRCodeSVG, {
                    value: qrCodeUrl,
                    size: 256,
                    bgColor: '#FFFFFF',
                    fgColor: '#000000',
                    level: 'M',
                })
            );
            
            const svgContent = qrCodeSVG.replace(/^<\?xml[^>]*\?>/, '').trim();
            const pngBuffer = await sharp(Buffer.from(svgContent))
                .png()
                .toBuffer();
            
            const base64 = pngBuffer.toString('base64');
            const qrCode = `data:image/png;base64,${base64}`;

            ticket = await Ticket.create({
                bookingId: booking._id,
                ticketNumber,
                qrCode,
                status: 'active',
            });
        }

        // Create notification
        if (booking.paymentStatus === 'pending') {
            // Pending payment notification
            await Notification.create({
                userId: user._id,
                type: 'user_book_pending',
                title: 'Booking Pending Payment Verification',
                message: `Your booking for ${event.title} is pending payment verification. Please wait up to 24 hours for confirmation.`,
                link: `/bookings`,
                metadata: {
                    eventId: event._id.toString(),
                    bookingId: booking._id.toString(),
                },
            });

            // Send email notification for pending payment
            try {
                const { sendEmail, emailTemplates } = await import("@/lib/email");
                
                // Use a pending payment email template if available, otherwise use a generic one
                const emailContent = {
                    subject: `Booking Pending: ${event.title}`,
                    html: `
                        <h2>Booking Pending Payment Verification</h2>
                        <p>Thank you for booking ${event.title}.</p>
                        <p>Your payment receipt has been received and is being verified. Please wait up to 24 hours for email confirmation.</p>
                        <p><strong>Event:</strong> ${event.title}</p>
                        <p><strong>Date:</strong> ${formatDateToReadable(event.date)}</p>
                        <p><strong>Time:</strong> ${formatDateTo12Hour(event.time)}</p>
                        <p>You will receive another email once your payment is confirmed.</p>
                    `
                };

                await sendEmail({
                    to: user.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                });
            } catch (emailError) {
                console.error('Failed to send pending payment email:', emailError);
            }
        } else {
            // Confirmed booking notification
            await Notification.create({
                userId: user._id,
                type: 'user_booking_confirmation',
                title: 'Booking Confirmed',
                message: `Your booking for ${event.title} has been confirmed. Ticket: ${ticket?.ticketNumber || 'N/A'}`,
                link: `/my-ticket?bookingId=${booking._id.toString()}`,
                metadata: {
                    eventId: event._id.toString(),
                    bookingId: booking._id.toString(),
                    ticketNumber: ticket?.ticketNumber,
                },
            });

            // Send email notification
            try {
                const { sendEmail, emailTemplates } = await import("@/lib/email");
                
                const emailContent = emailTemplates.bookingConfirmation(
                    event.title,
                    formatDateToReadable(event.date),
                    formatDateTo12Hour(event.time),
                    ticket?.ticketNumber || ''
                );

                await sendEmail({
                    to: user.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                });
            } catch (emailError) {
                console.error('Failed to send booking confirmation email:', emailError);
                // Don't fail the booking if email fails
            }
        }

        // Create notification for event organizer
        if (event.organizerId) {
            try {
                // Ensure organizerId is properly formatted as ObjectId
                const organizerId = event.organizerId instanceof mongoose.Types.ObjectId
                    ? event.organizerId
                    : new mongoose.Types.ObjectId(String(event.organizerId));

                console.log(`📧 Creating organizer notification for event ${event._id}, organizer ${organizerId.toString()}, booking status: ${booking.paymentStatus || 'none'}`);

                // Determine notification type and content based on booking status
                let notificationType: 'organizer_booking_pending' | 'other' | 'payment_received' = 'other';
                let notificationTitle = 'New Booking Received';
                let notificationMessage = `${user.name || user.email} has booked "${event.title}"`;

                // Handle pending payment bookings
                if (booking.paymentStatus === 'pending') {
                    notificationType = 'organizer_booking_pending';
                    notificationTitle = 'New Booking - Pending Payment Verification';
                    notificationMessage = `${user.name || user.email} has booked "${event.title}". Payment verification is pending.`;
                } 
                // Handle free events (no payment status)
                else if (event.isFree || !booking.paymentStatus) {
                    notificationType = 'other';
                    notificationTitle = 'New Booking Received';
                    notificationMessage = `${user.name || user.email} has booked "${event.title}".${ticket?.ticketNumber ? ` Ticket: ${ticket.ticketNumber}` : ''}`;
                } 
                // Handle confirmed paid bookings (Stripe payments)
                else {
                    notificationType = 'payment_received';
                    notificationTitle = 'New Booking Received';
                    notificationMessage = `${user.name || user.email} has booked "${event.title}".${ticket?.ticketNumber ? ` Ticket: ${ticket.ticketNumber}` : ''}`;
                }

                const notification = await Notification.create({
                    userId: organizerId,
                    type: notificationType,
                    title: notificationTitle,
                    message: notificationMessage,
                    link: `/organizer-dashboard/attendees?eventId=${event._id.toString()}`,
                    metadata: {
                        eventId: event._id.toString(),
                        bookingId: booking._id.toString(),
                        attendeeEmail: user.email,
                        attendeeName: user.name,
                        ticketNumber: ticket?.ticketNumber,
                        paymentStatus: booking.paymentStatus || (event.isFree ? 'free' : 'confirmed'),
                    },
                });

                console.log(`✅ Organizer notification created successfully: ${notification._id} for organizer ${organizerId.toString()}, type: ${notificationType}`);
            } catch (organizerNotificationError) {
                console.error('❌ Failed to create organizer notification:', organizerNotificationError);
                console.error('❌ Error details:', {
                    organizerId: event.organizerId,
                    organizerIdType: typeof event.organizerId,
                    eventId: event._id,
                    eventTitle: event.title,
                    bookingId: booking._id,
                    bookingPaymentStatus: booking.paymentStatus,
                    eventIsFree: event.isFree,
                    error: organizerNotificationError instanceof Error ? organizerNotificationError.message : 'Unknown error',
                    stack: organizerNotificationError instanceof Error ? organizerNotificationError.stack : undefined,
                });
                // Don't fail the booking if notification fails
            }
        } else {
            console.warn(`⚠️ Event ${event._id} (${event.title}) does not have an organizerId set. Cannot send notification to organizer.`);
        }

        // Update event available tickets - only for confirmed bookings
        // Free events and Stripe payments are auto-confirmed (no paymentStatus or paymentStatus is undefined)
        // Manual payments start as pending, so don't decrement until confirmed
        if (event.capacity) {
            const isConfirmed = event.isFree || paymentIntentId || !booking.paymentStatus || booking.paymentStatus === 'confirmed';
            if (isConfirmed) {
                event.availableTickets = Math.max(0, (event.availableTickets || event.capacity) - 1);
                await event.save();
            }
        }

        return handleSuccessResponse(
            booking.paymentStatus === 'pending' 
                ? "Booking submitted. Please wait up to 24 hours for payment verification and confirmation."
                : "Booking created successfully",
            {
                booking: {
                    id: booking._id.toString(),
                    eventId: event._id.toString(),
                    email: booking.email,
                    paymentStatus: booking.paymentStatus,
                    createdAt: booking.createdAt,
                },
                ticket: ticket ? {
                    id: ticket._id.toString(),
                    ticketNumber: ticket.ticketNumber,
                    qrCode: ticket.qrCode,
                } : null
            },
            201
        );
    } catch (error: any) {
        console.error('❌ Booking creation error:', error);
        console.error('❌ Error stack:', error?.stack);
        console.error('❌ Error details:', {
            name: error?.name,
            message: error?.message,
            code: error?.code,
        });

        // Handle specific error types
        if (error?.name === 'ValidationError') {
            const validationErrors = error.errors || {};
            const errorMessages = Object.values(validationErrors)
                .map((err: any) => err.message)
                .join(', ');
            return NextResponse.json(
                { message: `Validation error: ${errorMessages || error.message}` },
                { status: 400 }
            );
        }

        // Handle duplicate key error (E11000)
        if (error?.code === 11000) {
            return NextResponse.json(
                { message: "Booking already exists for this event" },
                { status: 409 }
            );
        }

        // Handle Mongoose CastError (invalid ObjectId)
        if (error?.name === 'CastError') {
            return NextResponse.json(
                { message: `Invalid ${error.path}: ${error.value}` },
                { status: 400 }
            );
        }

        // Return more specific error message if available
        if (error instanceof Error) {
            return NextResponse.json(
                {
                    message: error.message || 'Internal Server Error',
                    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
                },
                { status: 500 }
            );
        }

        return handleApiError(error);
    }
}

