import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Subscription from "@/database/subscription.model";
import { getPaymentIntent } from "@/lib/paymongo";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get payment intent status
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
        });

        if (!subscription) {
            return NextResponse.json(
                { message: "Payment intent not found or access denied" },
                { status: 404 }
            );
        }

        // Try to fetch payment intent status from PayMongo
        let status = subscription.status === 'active' ? 'succeeded' : 'pending';
        
        try {
            const paymentIntent = await getPaymentIntent(paymentIntentId);
            status = paymentIntent.attributes.status || status;
            
            // Update subscription status and planId if payment succeeded
            if (status === 'succeeded' && subscription.status !== 'active') {
                // Update planId from metadata if it's an upgrade
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
            }
        } catch (error) {
            // If PayMongo API fails, use subscription status
            console.warn('Failed to fetch payment intent from PayMongo:', error);
        }

        return handleSuccessResponse("Payment status retrieved", {
            status,
            subscriptionStatus: subscription.status
        });
    } catch (error) {
        return handleApiError(error);
    }
}

