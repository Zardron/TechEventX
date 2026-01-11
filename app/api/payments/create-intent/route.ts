import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Event from "@/database/event.model";
import { createPaymentIntent } from "@/lib/paymongo";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

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

        const { eventSlug, promoCode } = await req.json();

        if (!eventSlug) {
            return NextResponse.json(
                { message: "Event slug is required" },
                { status: 400 }
            );
        }

        const event = await Event.findOne({ slug: eventSlug });

        if (!event) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 }
            );
        }

        if (event.isFree) {
            return NextResponse.json(
                { message: "This is a free event, no payment required" },
                { status: 400 }
            );
        }

        if (!event.price) {
            return NextResponse.json(
                { message: "Event price not set" },
                { status: 400 }
            );
        }

        // Check capacity
        if (event.capacity) {
            const Booking = (await import("@/database/booking.model")).default;
            const bookingCount = await Booking.countDocuments({ eventId: event._id });
            if (bookingCount >= event.capacity) {
                return NextResponse.json(
                    { message: "Event is sold out" },
                    { status: 400 }
                );
            }
        }

        let amount = event.price;
        let discountAmount = 0;

        // Apply promo code if provided
        if (promoCode) {
            const PromoCode = (await import("@/database/promocode.model")).default;
            const promo = await PromoCode.findOne({
                code: promoCode.toUpperCase(),
                isActive: true,
                validFrom: { $lte: new Date() },
                validUntil: { $gte: new Date() },
                $or: [
                    { eventId: event._id },
                    { eventId: null },
                ],
            });

            if (promo && (!promo.usageLimit || promo.usedCount < promo.usageLimit)) {
                if (promo.discountType === 'percentage') {
                    discountAmount = Math.round(amount * (promo.discountValue / 100));
                    if (promo.maxDiscountAmount) {
                        discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
                    }
                } else {
                    discountAmount = promo.discountValue;
                }
                amount = Math.max(0, amount - discountAmount);
            }
        }

        // Create payment intent
        const paymentIntent = await createPaymentIntent(
            amount,
            event.currency || 'php', // Default to PHP for PayMongo
            {
                userId: user._id.toString(),
                eventId: event._id.toString(),
                eventSlug: event.slug,
                promoCode: promoCode || '',
            }
        );

        return handleSuccessResponse("Payment intent created", {
            clientSecret: paymentIntent.attributes.client_key,
            paymentIntentId: paymentIntent.id,
            amount,
            discountAmount,
            currency: event.currency || 'php',
        });
    } catch (error) {
        return handleApiError(error);
    }
}

