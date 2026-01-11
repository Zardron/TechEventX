import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Subscription from "@/database/subscription.model";
import { attachPaymentMethodToIntent, createPaymentMethod, getPaymentIntent, createCheckoutSession } from "@/lib/paymongo";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// POST - Complete payment by attaching payment method to payment intent
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Connect to database
        try {
            await connectDB();
        } catch (dbError: any) {
            console.error('Database connection error:', dbError);
            return NextResponse.json(
                {
                    message: "Database connection failed",
                    error: dbError?.message || "Unknown database error",
                    status: "error"
                },
                { status: 500 }
            );
        }

        const tokenPayload = verifyToken(req);
        if (!tokenPayload) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        let requestBody;
        try {
            requestBody = await req.json();
        } catch (parseError: any) {
            return NextResponse.json(
                {
                    message: "Invalid request body",
                    error: parseError?.message || "Failed to parse request",
                    status: "error"
                },
                { status: 400 }
            );
        }

        const { paymentIntentId, paymentMethodType, paymentMethodDetails } = requestBody;

        if (!paymentIntentId) {
            return NextResponse.json(
                { message: "Payment intent ID is required" },
                { status: 400 }
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

        // Verify the payment intent belongs to this user's subscription
        const subscription = await Subscription.findOne({
            userId: user._id,
            paymongoPaymentIntentId: paymentIntentId
        }).populate('planId');

        if (!subscription) {
            return NextResponse.json(
                { message: "Payment intent not found or access denied" },
                { status: 404 }
            );
        }

        // Get payment intent to check status
        let paymentIntent;
        try {
            paymentIntent = await getPaymentIntent(paymentIntentId);
        } catch (error: any) {
            // If we can't fetch from PayMongo, return error with subscription info
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
        
        if (paymentIntent.attributes.status === 'succeeded') {
            // Payment already succeeded - update planId from metadata if it's an upgrade
            const metadata = paymentIntent.attributes.metadata || {};
            const pendingPlanId = metadata.planId;
            
            if (pendingPlanId) {
                const currentPlanId = subscription.planId?.toString();
                // Only update planId if it's different (for upgrades)
                if (currentPlanId !== pendingPlanId) {
                    subscription.planId = pendingPlanId as any;
                }
            }
            
            subscription.status = 'active';
            await subscription.save();
            
            return handleSuccessResponse("Payment already completed", {
                status: 'succeeded',
                paymentIntent: paymentIntent
            });
        }

        // For card payments, we need payment method details
        // For other payment methods (gcash, grab_pay, etc.), PayMongo handles them differently
        if (paymentMethodType === 'card' && paymentMethodDetails) {
            try {
                // Create payment method
                const paymentMethod = await createPaymentMethod('card', paymentMethodDetails);
                
                // Attach payment method to payment intent
                await attachPaymentMethodToIntent(paymentIntentId, paymentMethod.id);
                
                // Check if payment succeeded
                const updatedIntent = await getPaymentIntent(paymentIntentId);
                
                if (updatedIntent?.attributes?.status === 'succeeded') {
                    // Update planId from metadata if it's an upgrade
                    const metadata = updatedIntent.attributes.metadata || {};
                    const pendingPlanId = metadata.planId;
                    
                    if (pendingPlanId) {
                        const currentPlanId = subscription.planId?.toString();
                        // Only update planId if it's different (for upgrades)
                        if (currentPlanId !== pendingPlanId) {
                            subscription.planId = pendingPlanId as any;
                        }
                    }
                    
                    subscription.status = 'active';
                    await subscription.save();
                }
                
                return handleSuccessResponse("Payment method attached", {
                    status: updatedIntent?.attributes?.status || 'pending',
                    paymentIntent: updatedIntent
                });
            } catch (error: any) {
                return NextResponse.json(
                    {
                        message: "Failed to process card payment",
                        error: error?.message || "Unknown error",
                        status: "error"
                    },
                    { status: 500 }
                );
            }
        } else {
            // For e-wallet payments (GCash, GrabPay, PayMaya), create a checkout session
            try {
                // Get plan details for checkout session (already populated)
                const planData = subscription.planId;
                
                if (!planData) {
                    return NextResponse.json(
                        {
                            message: "Plan not found",
                            status: "error"
                        },
                        { status: 404 }
                    );
                }

                // Create checkout session for e-wallet payments
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                               (req.headers.get('origin') || 'http://localhost:3001');
                
                const checkoutSession = await createCheckoutSession(
                    [{
                        name: planData.name || 'Subscription',
                        quantity: 1,
                        amount: planData.price,
                        currency: planData.currency || 'PHP'
                    }],
                    `${baseUrl}/organizer-dashboard/billing/payment?intent=${paymentIntentId}&status=success`,
                    `${baseUrl}/organizer-dashboard/billing/payment?intent=${paymentIntentId}&status=cancel`,
                    {
                        userId: user._id.toString(),
                        planId: planData._id.toString(),
                        subscriptionId: subscription._id.toString(),
                        paymentIntentId: paymentIntentId,
                        paymentMethodType: paymentMethodType || 'gcash'
                    }
                );

                return handleSuccessResponse("Checkout session created", {
                    status: 'pending',
                    checkoutUrl: checkoutSession.attributes.checkout_url,
                    paymentIntent: paymentIntent,
                    requiresRedirect: true
                });
            } catch (error: any) {
                console.error('Error creating checkout session:', error);
                return NextResponse.json(
                    {
                        message: "Failed to create checkout session",
                        error: error?.message || "Unknown error",
                        status: "error"
                    },
                    { status: 500 }
                );
            }
        }
    } catch (error: any) {
        console.error('Payment complete error:', error);
        // Use handleApiError but ensure it returns a proper response
        try {
            return handleApiError(error);
        } catch (handlerError: any) {
            // Fallback if handleApiError fails
            return NextResponse.json(
                {
                    message: "Internal server error",
                    error: error?.message || "Unknown error occurred",
                    status: "error"
                },
                { status: 500 }
            );
        }
    }
}

