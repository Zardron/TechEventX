import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Booking from "@/database/booking.model";
import Event from "@/database/event.model";
import Transaction from "@/database/transaction.model";
import Ticket from "@/database/ticket.model";
import Payment from "@/database/payment.model";
import Notification from "@/database/notification.model";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";
import { formatDateToReadable, formatDateTo12Hour } from "@/lib/formatters";
import mongoose from "mongoose";

// PATCH - Update booking payment status (for organizers to confirm/reject pending payments)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
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

        // Only organizers and admins can confirm/reject bookings
        if (user.role !== 'organizer' && user.role !== 'admin') {
            return NextResponse.json(
                { message: "Forbidden - Organizer access required" },
                { status: 403 }
            );
        }

        const { bookingId } = await params;
        const { paymentStatus } = await req.json();

        if (!paymentStatus || !['confirmed', 'rejected'].includes(paymentStatus)) {
            return NextResponse.json(
                { message: "Invalid payment status. Must be 'confirmed' or 'rejected'" },
                { status: 400 }
            );
        }

        // Find booking with event
        const booking = await Booking.findById(bookingId)
            .populate('eventId')
            .populate('userId');

        if (!booking) {
            return NextResponse.json(
                { message: "Booking not found" },
                { status: 404 }
            );
        }

        const event = booking.eventId as any;
        const attendee = booking.userId as any;

        // Check if user owns this event
        if (user.role === 'organizer') {
            const userId = user._id instanceof mongoose.Types.ObjectId 
                ? user._id 
                : new mongoose.Types.ObjectId(user._id.toString());
            const userOrganizerId = user.organizerId ? (user.organizerId instanceof mongoose.Types.ObjectId 
                ? user.organizerId 
                : new mongoose.Types.ObjectId(user.organizerId.toString())) : null;
            
            const eventOrganizerId = event.organizerId ? (event.organizerId instanceof mongoose.Types.ObjectId 
                ? event.organizerId 
                : new mongoose.Types.ObjectId(event.organizerId.toString())) : null;
            
            const ownsEvent = eventOrganizerId && (
                eventOrganizerId.toString() === userId.toString() || 
                (userOrganizerId && eventOrganizerId.toString() === userOrganizerId.toString())
            );
            
            if (!ownsEvent) {
                return NextResponse.json(
                    { message: "Forbidden - You don't own this event" },
                    { status: 403 }
                );
            }
        }

        // Only allow updating pending bookings
        if (booking.paymentStatus !== 'pending') {
            return NextResponse.json(
                { message: `Cannot update booking with status '${booking.paymentStatus}'. Only pending bookings can be updated.` },
                { status: 400 }
            );
        }

        // Update booking payment status
        booking.paymentStatus = paymentStatus;
        await booking.save();

        // Update transaction status if exists
        const transaction = await Transaction.findOne({ bookingId: booking._id });
        if (transaction) {
            transaction.status = paymentStatus === 'confirmed' ? 'completed' : 'failed';
            await transaction.save();
        }

        // Update payment record if exists
        const payment = await Payment.findOne({ bookingId: booking._id });
        if (payment) {
            payment.status = paymentStatus === 'confirmed' ? 'succeeded' : 'failed';
            if (paymentStatus === 'confirmed') {
                payment.paidAt = new Date();
            }
            await payment.save();
        }

        // Generate ticket if confirmed
        let ticket = null;
        if (paymentStatus === 'confirmed') {
            const existingTicket = await Ticket.findOne({ bookingId: booking._id });
            if (!existingTicket) {
                const { generateTicketNumber } = await import("@/lib/tickets");
                const ticketNumber = generateTicketNumber();
                
                // Generate QR code using react-qr-code with dynamic imports to avoid Turbopack issues
                const React = (await import("react")).default;
                const { renderToString } = await import("react-dom/server");
                const QRCodeSVG = (await import("react-qr-code")).default;
                const sharp = (await import("sharp")).default;
                
                const qrCodeData = JSON.stringify({
                    ticketNumber,
                    bookingId: booking._id.toString(),
                    timestamp: Date.now(),
                });
                
                const qrCodeSVG = renderToString(
                    React.createElement(QRCodeSVG, {
                        value: qrCodeData,
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
            } else {
                ticket = existingTicket;
            }

            // Update event available tickets when booking is confirmed
            // (pending bookings don't count towards capacity)
            if (event.capacity) {
                event.availableTickets = Math.max(0, (event.availableTickets || event.capacity) - 1);
                await event.save();
            }
        }
        // If rejected, availableTickets doesn't change since pending bookings don't count

        // Create notification for attendee
        const notificationType = paymentStatus === 'confirmed' ? 'user_booking_confirmation' : 'other';
        const notificationTitle = paymentStatus === 'confirmed' 
            ? 'Booking Confirmed' 
            : 'Booking Payment Rejected';
        const notificationLink = paymentStatus === 'confirmed' 
            ? `/my-ticket?bookingId=${booking._id.toString()}`
            : `/bookings`;
        const notificationMessage = paymentStatus === 'confirmed'
            ? `Your booking for ${event.title} has been confirmed.${ticket ? ` Ticket: ${ticket.ticketNumber}` : ''}`
            : `Your payment for ${event.title} has been rejected. Please contact support if you believe this is an error.`;

        await Notification.create({
            userId: attendee._id,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            link: notificationLink,
            metadata: {
                eventId: event._id.toString(),
                bookingId: booking._id.toString(),
                paymentStatus: paymentStatus,
            },
        });

        // Send email notification
        try {
            const { sendEmail, emailTemplates } = await import("@/lib/email");
            
            if (paymentStatus === 'confirmed') {
                // Get ticket if not already retrieved
                const ticketForEmail = ticket || await Ticket.findOne({ bookingId: booking._id });
                const emailContent = emailTemplates.bookingConfirmation(
                    event.title,
                    formatDateToReadable(event.date),
                    formatDateTo12Hour(event.time),
                    ticketForEmail?.ticketNumber || ''
                );

                await sendEmail({
                    to: attendee.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                });
            } else {
                await sendEmail({
                    to: attendee.email,
                    subject: `Payment Rejected: ${event.title}`,
                    html: `
                        <h2>Payment Rejected</h2>
                        <p>Your payment for ${event.title} has been rejected.</p>
                        <p><strong>Event:</strong> ${event.title}</p>
                        <p><strong>Date:</strong> ${formatDateToReadable(event.date)}</p>
                        <p>Please contact support if you believe this is an error.</p>
                    `
                });
            }
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
        }

        return handleSuccessResponse(
            `Booking payment ${paymentStatus} successfully`,
            {
                booking: {
                    id: booking._id.toString(),
                    paymentStatus: booking.paymentStatus,
                }
            }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Cancel a booking
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
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

        const { bookingId } = await params;

        // Find booking
        const booking = await Booking.findById(bookingId)
            .populate('eventId');

        if (!booking) {
            return NextResponse.json(
                { message: "Booking not found" },
                { status: 404 }
            );
        }

        const event = booking.eventId as any;

        // Check if user owns this booking (or is admin)
        if (user.role !== 'admin' && booking.userId.toString() !== user._id.toString()) {
            return NextResponse.json(
                { message: "Forbidden - You don't have permission to cancel this booking" },
                { status: 403 }
            );
        }

        // Check if event has already passed
        const eventDate = new Date(event.date);
        const eventTime = event.time.split(':');
        eventDate.setHours(parseInt(eventTime[0]), parseInt(eventTime[1]));
        
        if (eventDate < new Date()) {
            return NextResponse.json(
                { message: "Cannot cancel booking for past events" },
                { status: 400 }
            );
        }

        // Find associated transaction
        const transaction = await Transaction.findOne({
            bookingId: booking._id,
            status: 'completed'
        });

        // Find associated ticket
        const ticket = await Ticket.findOne({
            bookingId: booking._id
        });

        // Handle refund if payment was made
        if (transaction && transaction.amount > 0) {
            // For now, we'll mark the transaction as refunded
            // In production, you'd want to actually process the refund through Stripe
            transaction.status = 'refunded';
            transaction.refundAmount = transaction.amount;
            transaction.refundedAt = new Date();
            await transaction.save();

            // TODO: Process actual refund through Stripe
            // if (transaction.stripePaymentIntentId) {
            //     const { stripe } = await import("@/lib/stripe");
            //     await stripe.refunds.create({
            //         payment_intent: transaction.stripePaymentIntentId,
            //     });
            // }
        }

        // Update ticket status
        if (ticket) {
            ticket.status = 'cancelled';
            await ticket.save();
        }

        // Update event capacity - only if booking was confirmed
        // Pending bookings don't count towards capacity, so we only increment if it was confirmed
        if (event.capacity && booking.paymentStatus === 'confirmed') {
            event.availableTickets = Math.min(
                event.capacity,
                (event.availableTickets || 0) + 1
            );
            await event.save();
        }

        // Create notification
        const Notification = (await import("@/database/notification.model")).default;
        await Notification.create({
            userId: user._id,
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
            message: `Your booking for ${event.title} has been cancelled${transaction && transaction.amount > 0 ? '. Refund will be processed.' : '.'}`,
            link: `/bookings`,
            metadata: {
                eventId: event._id.toString(),
                bookingId: booking._id.toString(),
            },
        });

        // Send email notification
        try {
            const { sendEmail, emailTemplates } = await import("@/lib/email");
            
            const emailContent = emailTemplates.bookingCancellation?.(
                event.title,
                formatDateToReadable(event.date),
                formatDateTo12Hour(event.time),
                transaction && transaction.amount > 0
            ) || {
                subject: `Booking Cancelled: ${event.title}`,
                html: `<p>Your booking for ${event.title} has been cancelled.</p>`
            };

            await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });
        } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
        }

        // Delete booking (soft delete by removing it)
        // Or you could add a 'cancelled' status field to the booking model
        await Booking.findByIdAndDelete(booking._id);

        return handleSuccessResponse("Booking cancelled successfully", {
            bookingId: booking._id.toString(),
            refunded: transaction && transaction.amount > 0,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

