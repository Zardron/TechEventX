import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Subscription from "@/database/subscription.model";
import { cancelPayMongoSubscription } from "@/lib/paymongo";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// DELETE - Cancel subscription
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ subscriptionId: string }> }
): Promise<NextResponse> {
    try {
        await connectDB();

        const { subscriptionId } = await params;
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

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: user._id,
        });

        if (!subscription) {
            return NextResponse.json(
                { message: "Subscription not found" },
                { status: 404 }
            );
        }

        if (subscription.status === 'canceled') {
            return NextResponse.json(
                { message: "Subscription is already canceled" },
                { status: 400 }
            );
        }

        // Cancel at period end (soft cancel)
        if (subscription.paymongoSubscriptionId) {
            await cancelPayMongoSubscription(subscription.paymongoSubscriptionId);
        } else if (subscription.stripeSubscriptionId) {
            // Legacy Stripe support
            const { cancelStripeSubscription } = await import("@/lib/stripe");
            await cancelStripeSubscription(subscription.stripeSubscriptionId, false);
        }

        subscription.cancelAtPeriodEnd = true;
        await subscription.save();

        return handleSuccessResponse("Subscription will be canceled at period end", {
            subscription: {
                id: subscription._id.toString(),
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH - Update subscription (change plan)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ subscriptionId: string }> }
): Promise<NextResponse> {
    try {
        await connectDB();

        const { subscriptionId } = await params;
        const { planId, newPriceId } = await req.json();
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

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: user._id,
        }).populate('planId');

        if (!subscription) {
            return NextResponse.json(
                { message: "Subscription not found" },
                { status: 404 }
            );
        }

        // Validate planId if provided
        if (planId) {
            const Plan = (await import("@/database/plan.model")).default;
            const newPlan = await Plan.findById(planId);
            if (!newPlan || !newPlan.isActive) {
                return NextResponse.json(
                    { message: "Invalid or inactive plan" },
                    { status: 400 }
                );
            }

            // Check if trying to update to the same plan
            const currentPlanId = subscription.planId?._id?.toString() || subscription.planId?.toString();
            if (currentPlanId === planId) {
                return NextResponse.json(
                    { message: "You are already subscribed to this plan" },
                    { status: 400 }
                );
            }

            // Create payment intent for the new plan
            const { createPaymentIntent } = await import("@/lib/paymongo");
            const paymentIntent = await createPaymentIntent(
                newPlan.price,
                newPlan.currency || 'php',
                {
                    userId: user._id.toString(),
                    planId: newPlan._id.toString(),
                    type: 'subscription_upgrade',
                    previousPlanId: currentPlanId,
                }
            );

            // DON'T update planId yet - wait for payment success
            // Only update payment intent ID and set status to incomplete
            subscription.paymongoPaymentIntentId = paymentIntent.id;
            subscription.status = 'incomplete'; // Reset to incomplete until payment succeeds
            await subscription.save();

            return handleSuccessResponse("Subscription plan updated successfully", {
                subscription: {
                    id: subscription._id.toString(),
                    status: subscription.status,
                    plan: newPlan,
                    clientSecret: paymentIntent.attributes.client_key,
                    paymentIntentId: paymentIntent.id,
                }
            });
        }

        // For PayMongo, we'll need to cancel the old subscription and create a new one
        // or handle plan upgrades differently
        if (subscription.paymongoSubscriptionId) {
            // Cancel current subscription and create new one with new plan
            // This is a simplified approach - you may want to implement proper plan upgrades
            return NextResponse.json(
                { message: "Plan upgrades are not yet supported. Please cancel and create a new subscription." },
                { status: 400 }
            );
        } else if (subscription.stripeSubscriptionId) {
            // Legacy Stripe support
            if (!newPriceId) {
                return NextResponse.json(
                    { message: "Invalid subscription or price ID" },
                    { status: 400 }
                );
            }
            const { updateStripeSubscription } = await import("@/lib/stripe");
            await updateStripeSubscription(subscription.stripeSubscriptionId, newPriceId);
        }

        // Update database
        if (planId) {
            subscription.planId = planId as any;
        }
        await subscription.save();

        return handleSuccessResponse("Subscription updated successfully", {
            subscription: {
                id: subscription._id.toString(),
                status: subscription.status,
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

