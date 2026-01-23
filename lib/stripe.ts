import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});

// Stripe webhook secret for verifying webhook events
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(email: string, name: string, metadata?: Record<string, string>) {
    return await stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
    });
}

/**
 * Create a Stripe subscription
 */
export async function createStripeSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
) {
    return await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: metadata || {},
        expand: ['latest_invoice.payment_intent'],
    });
}

/**
 * Create a Stripe payment intent for one-time payments
 */
export async function createPaymentIntent(
    amount: number, // Amount in cents
    currency: string = 'usd',
    metadata?: Record<string, string>
) {
    return await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: metadata || {},
        automatic_payment_methods: {
            enabled: true,
        },
    });
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(subscriptionId: string, cancelImmediately: boolean = false) {
    if (cancelImmediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
    } else {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }
}

/**
 * Update a Stripe subscription (change plan)
 */
export async function updateStripeSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
        items: [{
            id: subscription.items.data[0].id,
            price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
    });
}

/**
 * Create a refund
 */
export async function createRefund(chargeId: string, amount?: number, reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer') {
    return await stripe.refunds.create({
        charge: chargeId,
        amount,
        reason,
    });
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

