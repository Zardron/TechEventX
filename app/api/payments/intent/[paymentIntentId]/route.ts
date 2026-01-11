import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Subscription from "@/database/subscription.model";
import { getPaymentIntent } from "@/lib/paymongo";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get payment intent details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ paymentIntentId: string }> }
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

        const { paymentIntentId } = await params;

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

        // Get current active subscription to determine if this is an upgrade
        const currentSubscription = await Subscription.findOne({
            userId: user._id,
            status: { $in: ['active', 'trialing'] },
            _id: { $ne: subscription._id }
        }).populate('planId');

        // Fetch payment intent from PayMongo
        try {
            const paymentIntent = await getPaymentIntent(paymentIntentId);
            
            return handleSuccessResponse("Payment intent retrieved", {
                paymentIntent,
                subscription: {
                    id: subscription._id.toString(),
                    status: subscription.status,
                    plan: subscription.planId,
                },
                currentSubscription: currentSubscription ? {
                    id: currentSubscription._id.toString(),
                    plan: currentSubscription.planId,
                } : null,
            });
        } catch (error: any) {
            // If PayMongo API fails, return subscription info
            return handleSuccessResponse("Payment intent retrieved", {
                paymentIntent: {
                    id: paymentIntentId,
                    attributes: {
                        client_key: null, // Will be set when payment intent is created
                        status: subscription.status === 'active' ? 'succeeded' : 'pending',
                    }
                },
                subscription: {
                    id: subscription._id.toString(),
                    status: subscription.status,
                    plan: subscription.planId,
                },
                currentSubscription: currentSubscription ? {
                    id: currentSubscription._id.toString(),
                    plan: currentSubscription.planId,
                } : null,
            });
        }
    } catch (error) {
        return handleApiError(error);
    }
}

