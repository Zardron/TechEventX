import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Subscription from "@/database/subscription.model";
import Booking from "@/database/booking.model";
import Transaction from "@/database/transaction.model";
import Ticket from "@/database/ticket.model";
import Event from "@/database/event.model";
import Notification from "@/database/notification.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { verifyWebhookSignature } from "@/lib/paymongo";

/**
 * PayMongo Webhook Handler
 * 
 * This endpoint receives webhook events from PayMongo when payments are completed.
 * 
 * Webhook Events to Subscribe to in PayMongo Dashboard:
 * - payment.paid
 * - source.chargeable
 * - checkout_session.payment.paid
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/paymongo
 */

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        await connectDB();

        const body = await req.text();
        const signature = req.headers.get("paymongo-signature");

        // Verify webhook signature if secret is configured
        if (process.env.PAYMONGO_WEBHOOK_SECRET && signature) {
            const isValid = verifyWebhookSignature(body, signature, process.env.PAYMONGO_WEBHOOK_SECRET);
            if (!isValid) {
                console.error("PayMongo webhook signature verification failed");
                return NextResponse.json(
                    { message: "Invalid webhook signature" },
                    { status: 401 }
                );
            }
        }

        const event = JSON.parse(body);
        const eventType = event.type || event.data?.type;

        console.log('PayMongo webhook received:', eventType, event);

        // Handle different event types
        switch (eventType) {
            case 'payment.paid':
                await handlePaymentPaid(event.data);
                break;

            case 'source.chargeable':
                await handleSourceChargeable(event.data);
                break;

            case 'checkout_session.payment.paid':
                await handleCheckoutSessionPaymentPaid(event.data);
                break;

            case 'payment.failed':
                await handlePaymentFailed(event.data);
                break;

            default:
                console.log(`Unhandled PayMongo webhook event type: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("PayMongo webhook error:", error);
        return NextResponse.json(
            { message: "Webhook processing failed", error: error?.message },
            { status: 500 }
        );
    }
}

/**
 * Handle payment.paid event
 * This is triggered when a payment is successfully completed
 */
async function handlePaymentPaid(paymentData: any) {
    try {
        const payment = paymentData.attributes || paymentData;
        const paymentIntentId = payment.attributes?.payment_intent_id || payment.payment_intent_id;
        
        if (!paymentIntentId) {
            console.warn('Payment paid event missing payment_intent_id');
            return;
        }

        console.log('Processing payment.paid event for intent:', paymentIntentId);

        // First, try to find and update subscription
        const subscription = await Subscription.findOne({
            paymongoPaymentIntentId: paymentIntentId
        }).populate('planId');

        if (subscription) {
            // Update subscription status and planId
            const metadata = payment.attributes?.metadata || payment.metadata || {};
            const purchasedPlanId = metadata.planId;

            if (purchasedPlanId) {
                subscription.planId = purchasedPlanId as any;
            }

            subscription.status = 'active';
            await subscription.save();

            console.log('✅ Subscription activated via webhook for payment intent:', paymentIntentId);
        }

        // Also check for booking payments
        const transaction = await Transaction.findOne({
            paymongoPaymentIntentId: paymentIntentId
        });

        if (transaction && transaction.bookingId) {
            const booking = await Booking.findById(transaction.bookingId);
            
            if (booking && booking.paymentStatus !== 'confirmed') {
                // Update booking payment status
                booking.paymentStatus = 'confirmed';
                await booking.save();

                // Update transaction status
                transaction.status = 'completed';
                await transaction.save();

                // Generate ticket if it doesn't exist
                let ticket = await Ticket.findOne({ bookingId: booking._id });
                if (!ticket) {
                    const { generateTicketNumber } = await import("@/lib/tickets");
                    const React = (await import("react")).default;
                    const { renderToString } = await import("react-dom/server");
                    const QRCodeSVG = (await import("react-qr-code")).default;
                    const sharp = (await import("sharp")).default;

                    const ticketNumber = generateTicketNumber();
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                                   (process.env.NODE_ENV === 'production' 
                                       ? 'https://yourdomain.com' 
                                       : 'http://localhost:3000');
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

                    console.log('✅ Ticket generated via webhook for booking:', booking._id);
                }

                // Update event available tickets
                const event = await Event.findById(booking.eventId);
                if (event && event.capacity) {
                    event.availableTickets = Math.max(0, (event.availableTickets || event.capacity) - 1);
                    await event.save();
                }

                // Send confirmation notification
                const { formatDateToReadable, formatDateTo12Hour } = await import("@/lib/formatters");
                await Notification.create({
                    userId: booking.userId,
                    type: 'user_booking_confirmation',
                    title: 'Booking Confirmed',
                    message: `Your booking for ${event?.title || 'the event'} has been confirmed. Ticket: ${ticket?.ticketNumber || 'N/A'}`,
                    link: `/my-ticket?bookingId=${booking._id.toString()}`,
                    metadata: {
                        eventId: booking.eventId.toString(),
                        bookingId: booking._id.toString(),
                        ticketNumber: ticket?.ticketNumber,
                    },
                });

                // Send email notification
                try {
                    const User = (await import("@/database/user.model")).default;
                    const user = await User.findById(booking.userId);
                    if (user && user.email && event) {
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
                    }
                } catch (emailError) {
                    console.error('Failed to send booking confirmation email:', emailError);
                }

                console.log('✅ Booking confirmed via webhook for payment intent:', paymentIntentId);
            }
        }
    } catch (error: any) {
        console.error('Error handling payment.paid webhook:', error);
    }
}

/**
 * Handle source.chargeable event
 * This is triggered when a source becomes chargeable (payment completed via source)
 */
async function handleSourceChargeable(sourceData: any) {
    try {
        const source = sourceData.attributes || sourceData;
        const sourceId = source.id || sourceData.id;
        const paymentIntentId = source.attributes?.payment_intent_id || source.payment_intent_id;

        console.log('Processing source.chargeable event:', sourceId, 'for intent:', paymentIntentId);

        if (!paymentIntentId) {
            // Try to find subscription by checking all subscriptions with incomplete status
            // and matching the amount
            const amount = source.attributes?.amount || source.amount;
            if (amount) {
                const subscriptions = await Subscription.find({
                    status: 'incomplete',
                    planId: { $exists: true }
                }).populate('planId');

                for (const sub of subscriptions) {
                    if (sub.planId && (sub.planId as any).price === amount) {
                        const metadata = source.attributes?.metadata || source.metadata || {};
                        const purchasedPlanId = metadata.planId;

                        if (purchasedPlanId) {
                            sub.planId = purchasedPlanId as any;
                        }

                        sub.status = 'active';
                        await sub.save();
                        console.log('✅ Subscription activated via source.chargeable webhook');
                        return;
                    }
                }
            }
            console.warn('Source chargeable event missing payment_intent_id');
            return;
        }

        // Find subscription by payment intent ID
        const subscription = await Subscription.findOne({
            paymongoPaymentIntentId: paymentIntentId
        }).populate('planId');

        if (!subscription) {
            console.warn('Subscription not found for payment intent:', paymentIntentId);
            return;
        }

        // Update subscription status and planId
        const metadata = source.attributes?.metadata || source.metadata || {};
        const purchasedPlanId = metadata.planId;

        if (purchasedPlanId) {
            subscription.planId = purchasedPlanId as any;
        }

        subscription.status = 'active';
        await subscription.save();

        console.log('✅ Subscription activated via source.chargeable webhook for payment intent:', paymentIntentId);
    } catch (error: any) {
        console.error('Error handling source.chargeable webhook:', error);
    }
}

/**
 * Handle checkout_session.payment.paid event
 * This is triggered when payment is completed via checkout session
 */
async function handleCheckoutSessionPaymentPaid(checkoutData: any) {
    try {
        const checkout = checkoutData.attributes || checkoutData;
        const paymentIntentId = checkout.attributes?.payment_intent_id || checkout.payment_intent_id;
        const metadata = checkout.attributes?.metadata || checkout.metadata || {};

        console.log('Processing checkout_session.payment.paid event for intent:', paymentIntentId);

        if (!paymentIntentId) {
            console.warn('Checkout session payment paid event missing payment_intent_id');
            return;
        }

        // First, try to find and update subscription
        const subscription = await Subscription.findOne({
            paymongoPaymentIntentId: paymentIntentId
        }).populate('planId');

        if (subscription) {
            // Update subscription status and planId
            const purchasedPlanId = metadata.planId;

            if (purchasedPlanId) {
                subscription.planId = purchasedPlanId as any;
            }

            subscription.status = 'active';
            await subscription.save();

            console.log('✅ Subscription activated via checkout_session.payment.paid webhook for payment intent:', paymentIntentId);
        }

        // Also check for booking payments (same logic as handlePaymentPaid)
        const transaction = await Transaction.findOne({
            paymongoPaymentIntentId: paymentIntentId
        });

        if (transaction && transaction.bookingId) {
            const booking = await Booking.findById(transaction.bookingId);
            
            if (booking && booking.paymentStatus !== 'confirmed') {
                // Update booking payment status
                booking.paymentStatus = 'confirmed';
                await booking.save();

                // Update transaction status
                transaction.status = 'completed';
                await transaction.save();

                // Generate ticket if it doesn't exist
                let ticket = await Ticket.findOne({ bookingId: booking._id });
                if (!ticket) {
                    const { generateTicketNumber } = await import("@/lib/tickets");
                    const React = (await import("react")).default;
                    const { renderToString } = await import("react-dom/server");
                    const QRCodeSVG = (await import("react-qr-code")).default;
                    const sharp = (await import("sharp")).default;

                    const ticketNumber = generateTicketNumber();
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                                   (process.env.NODE_ENV === 'production' 
                                       ? 'https://yourdomain.com' 
                                       : 'http://localhost:3000');
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

                    console.log('✅ Ticket generated via webhook for booking:', booking._id);
                }

                // Update event available tickets
                const event = await Event.findById(booking.eventId);
                if (event && event.capacity) {
                    event.availableTickets = Math.max(0, (event.availableTickets || event.capacity) - 1);
                    await event.save();
                }

                // Send confirmation notification
                const { formatDateToReadable, formatDateTo12Hour } = await import("@/lib/formatters");
                await Notification.create({
                    userId: booking.userId,
                    type: 'user_booking_confirmation',
                    title: 'Booking Confirmed',
                    message: `Your booking for ${event?.title || 'the event'} has been confirmed. Ticket: ${ticket?.ticketNumber || 'N/A'}`,
                    link: `/my-ticket?bookingId=${booking._id.toString()}`,
                    metadata: {
                        eventId: booking.eventId.toString(),
                        bookingId: booking._id.toString(),
                        ticketNumber: ticket?.ticketNumber,
                    },
                });

                // Send email notification
                try {
                    const User = (await import("@/database/user.model")).default;
                    const user = await User.findById(booking.userId);
                    if (user && user.email && event) {
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
                    }
                } catch (emailError) {
                    console.error('Failed to send booking confirmation email:', emailError);
                }

                console.log('✅ Booking confirmed via checkout_session.payment.paid webhook for payment intent:', paymentIntentId);
            }
        }
    } catch (error: any) {
        console.error('Error handling checkout_session.payment.paid webhook:', error);
    }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(paymentData: any) {
    try {
        const payment = paymentData.attributes || paymentData;
        const paymentIntentId = payment.attributes?.payment_intent_id || payment.payment_intent_id;

        if (!paymentIntentId) {
            console.warn('Payment failed event missing payment_intent_id');
            return;
        }

        console.log('Processing payment.failed event for intent:', paymentIntentId);

        // Find subscription by payment intent ID
        const subscription = await Subscription.findOne({
            paymongoPaymentIntentId: paymentIntentId
        });

        if (subscription) {
            // Don't change status to failed - keep it as incomplete so user can retry
            console.log('Payment failed for subscription:', subscription._id);
        }
    } catch (error: any) {
        console.error('Error handling payment.failed webhook:', error);
    }
}





