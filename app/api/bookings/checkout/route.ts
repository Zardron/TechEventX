import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Event from "@/database/event.model";
import { createCheckoutSession, getPaymentIntent } from "@/lib/paymongo";
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

        const { paymentIntentId, paymentMethodType } = await req.json();

        if (!paymentIntentId) {
            return NextResponse.json(
                { message: "Payment intent ID is required" },
                { status: 400 }
            );
        }

        // Get payment intent to verify it exists and get metadata
        let paymentIntent;
        try {
            paymentIntent = await getPaymentIntent(paymentIntentId);
        } catch (error: any) {
            return NextResponse.json(
                {
                    message: "Failed to fetch payment intent from PayMongo",
                    error: error?.message || "Unknown error",
                    status: "error"
                },
                { status: 500 }
            );
        }

        if (!paymentIntent || !paymentIntent.attributes) {
            return NextResponse.json(
                {
                    message: "Invalid payment intent response",
                    status: "error"
                },
                { status: 500 }
            );
        }

        // Get event from metadata
        const metadata = paymentIntent.attributes.metadata || {};
        const eventSlug = metadata.eventSlug;
        const eventId = metadata.eventId;

        if (!eventSlug && !eventId) {
            return NextResponse.json(
                { message: "Event information not found in payment intent" },
                { status: 400 }
            );
        }

        // Find event
        const event = eventSlug 
            ? await Event.findOne({ slug: eventSlug })
            : await Event.findById(eventId);

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

        // Calculate final amount (with promo code discount if applicable)
        let amount = event.price || 0;
        const promoCode = metadata.promoCode;
        
        if (promoCode) {
            const PromoCode = (await import("@/database/promocode.model")).default;
            const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
            if (promo) {
                let discountAmount = 0;
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

        // Create checkout session for e-wallet payments
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       (req.headers.get('origin') || 'http://localhost:3000');
        
        const checkoutSession = await createCheckoutSession(
            [{
                name: event.title,
                quantity: 1,
                amount: amount,
                currency: event.currency || 'PHP'
            }],
            `${baseUrl}/events/${event.slug}?payment=success&intent=${paymentIntentId}`,
            `${baseUrl}/events/${event.slug}?payment=cancel&intent=${paymentIntentId}`,
            {
                userId: user._id.toString(),
                eventId: event._id.toString(),
                eventSlug: event.slug,
                paymentIntentId: paymentIntentId,
                paymentMethodType: paymentMethodType || 'gcash',
                promoCode: promoCode || ''
            }
        );

        return handleSuccessResponse("Checkout session created", {
            status: 'pending',
            checkoutUrl: checkoutSession.attributes.checkout_url,
            paymentIntent: paymentIntent,
            requiresRedirect: true
        });
    } catch (error: any) {
        console.error('Booking checkout error:', error);
        return handleApiError(error);
    }
}
