/**
 * PayMongo API Integration
 * Documentation: https://developers.paymongo.com/
 */

if (!process.env.PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY is not set in environment variables');
}

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

// Helper function to make authenticated requests
async function paymongoRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${PAYMONGO_BASE_URL}${endpoint}`;
    const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

    const options: RequestInit = {
        method,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.detail || `PayMongo API error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Create a PayMongo customer
 * Note: PayMongo may require default_device for certain operations, but it's optional for basic customer creation
 */
export async function createPayMongoCustomer(email: string, name: string, metadata?: Record<string, string>) {
    const customerData: any = {
        data: {
            attributes: {
                email,
                name,
                metadata: metadata || {},
            }
        }
    };

    // If default_device is required by PayMongo API, we can add it here
    // For now, we'll try without it first as it's not always required
    const response = await paymongoRequest('/customers', 'POST', customerData);

    return response.data;
}

/**
 * Create a payment intent for one-time payments
 */
export async function createPaymentIntent(
    amount: number, // Amount in cents (PHP centavos)
    currency: string = 'php',
    metadata?: Record<string, string>,
    paymentMethodAllowed: string[] = ['card', 'gcash', 'grab_pay', 'paymaya'] // Default payment methods (qr_ph requires account activation)
) {
    const response = await paymongoRequest('/payment_intents', 'POST', {
        data: {
            attributes: {
                amount,
                currency: currency.toUpperCase(),
                payment_method_allowed: paymentMethodAllowed,
                metadata: metadata || {},
            }
        }
    });

    return response.data;
}

/**
 * Create a payment method
 */
export async function createPaymentMethod(
    type: 'card' | 'gcash' | 'grab_pay' = 'card',
    details?: {
        cardNumber?: string;
        expMonth?: number;
        expYear?: number;
        cvc?: string;
    }
) {
    const response = await paymongoRequest('/payment_methods', 'POST', {
        data: {
            attributes: {
                type,
                details: details || {},
            }
        }
    });

    return response.data;
}

/**
 * Attach payment method to payment intent
 */
export async function attachPaymentMethodToIntent(
    paymentIntentId: string,
    paymentMethodId: string
) {
    const response = await paymongoRequest(`/payment_intents/${paymentIntentId}/attach`, 'POST', {
        data: {
            attributes: {
                payment_method: paymentMethodId,
            }
        }
    });

    return response.data;
}

/**
 * Create a subscription (PayMongo uses billing for recurring payments)
 */
export async function createPayMongoSubscription(
    customerId: string,
    amount: number, // Amount in cents
    currency: string = 'php',
    interval: 'day' | 'week' | 'month' | 'year' = 'month',
    intervalCount: number = 1,
    metadata?: Record<string, string>
) {
    // PayMongo doesn't have native subscriptions, so we'll create a billing
    // For recurring payments, you'll need to handle this differently
    // This is a simplified implementation
    const response = await paymongoRequest('/billings', 'POST', {
        data: {
            attributes: {
                type: 'recurring',
                amount,
                currency: currency.toUpperCase(),
                interval,
                interval_count: intervalCount,
                customer: customerId,
                metadata: metadata || {},
            }
        }
    });

    return response.data;
}

/**
 * Cancel a subscription/billing
 */
export async function cancelPayMongoSubscription(subscriptionId: string) {
    const response = await paymongoRequest(`/billings/${subscriptionId}/cancel`, 'POST');
    return response.data;
}

/**
 * Create a refund
 */
export async function createRefund(
    paymentId: string,
    amount?: number,
    reason?: string
) {
    const response = await paymongoRequest('/refunds', 'POST', {
        data: {
            attributes: {
                amount,
                payment: paymentId,
                reason: reason || 'requested_by_customer',
            }
        }
    });

    return response.data;
}

/**
 * Get payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string) {
    const response = await paymongoRequest(`/payment_intents/${paymentIntentId}`);
    return response.data;
}

/**
 * Create a checkout session for PayMongo
 */
export async function createCheckoutSession(
    lineItems: Array<{
        name: string;
        quantity: number;
        amount: number; // Amount in cents
        currency: string;
    }>,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
) {
    const response = await paymongoRequest('/checkout_sessions', 'POST', {
        data: {
            attributes: {
                line_items: lineItems,
                payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'],
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: metadata || {},
            }
        }
    });

    return response.data;
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string) {
    const response = await paymongoRequest(`/customers/${customerId}`);
    return response.data;
}

/**
 * Verify PayMongo webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // PayMongo webhook verification
    // You'll need to implement this based on PayMongo's webhook verification method
    // For now, this is a placeholder
    return true;
}

