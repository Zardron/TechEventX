import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Subscription from "@/database/subscription.model";
import Plan from "@/database/plan.model";
import { createPayMongoCustomer, createPayMongoSubscription, createPaymentIntent, attachPaymentMethodToIntent } from "@/lib/paymongo";
import { handleApiError, handleSuccessResponse } from "@/lib/utils";

// GET - Get user's current subscription
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

        const subscription = await Subscription.findOne({
            userId: user._id,
            status: { $in: ['active', 'trialing'] }
        }).populate('planId');

        if (!subscription) {
            return handleSuccessResponse("No active subscription", { subscription: null });
        }

        return handleSuccessResponse("Subscription retrieved", {
            subscription: {
                id: subscription._id.toString(),
                status: subscription.status,
                plan: subscription.planId,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST - Create a new subscription
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

        // Only organizers can have subscriptions
        if (user.role !== 'organizer') {
            return NextResponse.json(
                { message: "Only organizers can subscribe to plans" },
                { status: 403 }
            );
        }

        const { planId, paymentMethodId } = await req.json();

        if (!planId) {
            return NextResponse.json(
                { message: "Plan ID is required" },
                { status: 400 }
            );
        }

        const plan = await Plan.findById(planId);
        if (!plan || !plan.isActive) {
            return NextResponse.json(
                { message: "Invalid or inactive plan" },
                { status: 400 }
            );
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({
            userId: user._id,
            status: { $in: ['active', 'trialing'] }
        }).populate('planId');

        // If user has an existing subscription, handle upgrade/downgrade
        if (existingSubscription) {
            const currentPlanId = existingSubscription.planId?._id?.toString() || existingSubscription.planId?.toString();
            const newPlanId = plan._id.toString();

            // Check if trying to subscribe to the same plan
            if (currentPlanId === newPlanId) {
                return NextResponse.json(
                    { message: "You are already subscribed to this plan" },
                    { status: 400 }
                );
            }

            // Create or retrieve PayMongo customer (optional - not required for payment intents)
            let paymongoCustomerId = user.paymongoCustomerId || user.stripeCustomerId; // Support migration
            if (!paymongoCustomerId) {
                try {
                    const customer = await createPayMongoCustomer(user.email, user.name, {
                        userId: user._id.toString(),
                    });
                    paymongoCustomerId = customer.id;
                    // Store paymongoCustomerId in user model
                    user.paymongoCustomerId = paymongoCustomerId;
                    await user.save();
                } catch (error: any) {
                    // If customer creation fails, we can still proceed with payment intent
                    // PayMongo payment intents don't strictly require a customer
                    console.warn('Failed to create PayMongo customer:', error.message);
                    // Continue without customer ID - payment intent can still be created
                }
            }

            // Create payment intent for the new plan
            const paymentIntent = await createPaymentIntent(
                plan.price, // Amount in centavos
                plan.currency || 'php',
                {
                    userId: user._id.toString(),
                    planId: plan._id.toString(),
                    type: 'subscription_upgrade',
                    previousPlanId: currentPlanId,
                }
            );

            // DON'T update planId yet - wait for payment success
            // Only update payment intent ID and set status to incomplete
            existingSubscription.paymongoPaymentIntentId = paymentIntent.id;
            existingSubscription.status = 'incomplete'; // Reset to incomplete until payment succeeds
            // Keep existing period dates for now, or recalculate if needed
            // For upgrades, you might want to prorate or start new period immediately
            await existingSubscription.save();

            return handleSuccessResponse("Subscription plan updated successfully", {
                subscription: {
                    id: existingSubscription._id.toString(),
                    status: existingSubscription.status,
                    plan: plan,
                    clientSecret: paymentIntent.attributes.client_key,
                    paymentIntentId: paymentIntent.id,
                }
            }, 200);
        }

        // Create or retrieve PayMongo customer (optional - not required for payment intents)
        let paymongoCustomerId = user.paymongoCustomerId || user.stripeCustomerId; // Support migration
        if (!paymongoCustomerId) {
            try {
                const customer = await createPayMongoCustomer(user.email, user.name, {
                    userId: user._id.toString(),
                });
                paymongoCustomerId = customer.id;
                // Store paymongoCustomerId in user model
                user.paymongoCustomerId = paymongoCustomerId;
                await user.save();
            } catch (error: any) {
                // If customer creation fails, we can still proceed with payment intent
                // PayMongo payment intents don't strictly require a customer
                console.warn('Failed to create PayMongo customer:', error.message);
                // Continue without customer ID - payment intent can still be created
            }
        }

        // For PayMongo, we create a payment intent for the first payment
        // Recurring payments will need to be handled separately or through PayMongo's billing feature
        const paymentIntent = await createPaymentIntent(
            plan.price, // Amount in centavos
            plan.currency || 'php',
            {
                userId: user._id.toString(),
                planId: plan._id.toString(),
                type: 'subscription',
            }
        );

        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Create subscription in database
        // Note: PayMongo doesn't have native subscriptions, so we'll manage this in our database
        const subscription = await Subscription.create({
            userId: user._id,
            planId: plan._id,
            status: 'incomplete', // Will be set to 'active' after payment confirmation
            paymongoCustomerId: paymongoCustomerId || undefined, // Optional - payment intents don't require customer
            paymongoPaymentIntentId: paymentIntent.id,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
        });

        return handleSuccessResponse("Subscription created successfully", {
            subscription: {
                id: subscription._id.toString(),
                status: subscription.status,
                plan: plan,
                clientSecret: paymentIntent.attributes.client_key,
                paymentIntentId: paymentIntent.id,
            }
        }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}

