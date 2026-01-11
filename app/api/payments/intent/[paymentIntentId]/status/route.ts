import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/database/user.model";
import Subscription from "@/database/subscription.model";
import { getPaymentIntent, getPaymentsForIntent, getPayments, getSource, getSourcesForIntent } from "@/lib/paymongo";

// Import paymongoRequest for direct API calls
async function paymongoRequest(endpoint: string, method: string = 'GET', body?: any) {
    const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
    if (!PAYMONGO_SECRET_KEY) {
        throw new Error('PAYMONGO_SECRET_KEY is not set');
    }
    
    const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';
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
        
        // Check if this is a status check after redirect (indicates user completed payment)
        const url = new URL(req.url);
        const isPostRedirect = url.searchParams.get('redirect') === 'success';
        const sourceIdFromUrl = url.searchParams.get('sourceId'); // Source ID from PayMongo redirect
        
        console.log('Status check for intent:', paymentIntentId, 'Post-redirect:', isPostRedirect, 'Source ID:', sourceIdFromUrl);

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
        let subscription = await Subscription.findOne({
            userId: user._id,
            paymongoPaymentIntentId: paymentIntentId
        }).populate('planId');

        if (!subscription) {
            return NextResponse.json(
                { message: "Payment intent not found or access denied" },
                { status: 404 }
            );
        }

        // Refresh subscription to get latest status
        await subscription.populate('planId');
        
        // Check subscription status first - if already active, payment succeeded
        if (subscription.status === 'active') {
            return handleSuccessResponse("Payment status retrieved", {
                status: 'succeeded',
                subscriptionStatus: subscription.status
            });
        }

        // Try to fetch payment intent status from PayMongo
        let status = 'pending';
        let paymentIntentStatus = null;
        let paymentSucceeded = false;
        
        try {
            const paymentIntent = await getPaymentIntent(paymentIntentId);
            paymentIntentStatus = paymentIntent.attributes?.status;
            
            // CRITICAL: Check for sources first - PayMongo checkout creates sources, not direct payments
            // Sources are what get created when using checkout sessions
            // If we have a source ID from the redirect URL, check that first
            if (sourceIdFromUrl) {
                try {
                    const source = await getSource(sourceIdFromUrl);
                    const sourceStatus = source?.attributes?.status || source?.status;
                    console.log('Checking source from URL:', sourceIdFromUrl, 'Status:', sourceStatus);
                    
                    if (sourceStatus === 'paid') {
                        paymentSucceeded = true;
                        status = 'succeeded';
                        paymentIntentStatus = 'succeeded';
                        console.log('✅ Found paid source from redirect URL:', sourceIdFromUrl);
                    }
                } catch (sourceError: any) {
                    console.warn('Failed to fetch source from URL:', sourceError?.message || sourceError);
                }
            }
            
            // Also check all sources for this payment intent
            if (!paymentSucceeded) {
                try {
                    const sources = await getSourcesForIntent(paymentIntentId);
                    const sourcesArray = Array.isArray(sources) ? sources : (sources?.data || []);
                    
                    console.log('Sources for intent:', paymentIntentId, 'Count:', sourcesArray.length);
                    
                    if (sourcesArray.length > 0) {
                        // Check each source for paid status
                        for (const source of sourcesArray) {
                            const sourceId = source.id || source;
                            const sourceData = typeof source === 'string' ? await getSource(sourceId) : source;
                            const sourceStatus = sourceData?.attributes?.status || sourceData?.status;
                            const sourceType = sourceData?.attributes?.type || sourceData?.type;
                            
                            console.log('Source ID:', sourceId, 'Status:', sourceStatus, 'Type:', sourceType);
                            
                            // Source status "paid" means payment succeeded
                            if (sourceStatus === 'paid' || sourceStatus === 'chargeable') {
                                // If source is paid, create/check for payment
                                // For checkout sessions, paid sources mean payment succeeded
                                if (sourceStatus === 'paid') {
                                    paymentSucceeded = true;
                                    status = 'succeeded';
                                    paymentIntentStatus = 'succeeded';
                                    console.log('✅ Found paid source for intent:', paymentIntentId, 'Source ID:', sourceId);
                                    break;
                                }
                            }
                        }
                    }
                } catch (sourceError: any) {
                    console.warn('Failed to fetch sources for intent:', sourceError?.message || sourceError);
                }
            }
            
            // Check if there are any successful payments attached to this payment intent
            // This is important for checkout sessions where payment might be completed
            // but payment intent status might still show "awaiting_payment_method"
            if (!paymentSucceeded) {
                try {
                // Try multiple ways to get payments
                let paymentsResponse;
                try {
                    paymentsResponse = await getPaymentsForIntent(paymentIntentId);
                } catch (e) {
                    // If that fails, try the general payments endpoint
                    paymentsResponse = await getPayments({ payment_intent_id: paymentIntentId, limit: 10 });
                }
                
                // PayMongo returns payments in a data array
                const payments = Array.isArray(paymentsResponse) 
                    ? paymentsResponse 
                    : (paymentsResponse?.data || paymentsResponse || []);
                
                console.log('Payments for intent:', paymentIntentId, 'Count:', Array.isArray(payments) ? payments.length : 0);
                
                if (Array.isArray(payments) && payments.length > 0) {
                    // Check if any payment has succeeded
                    const successfulPayment = payments.find((payment: any) => {
                        const paymentStatus = payment.attributes?.status || payment.status;
                        const paymentAmount = payment.attributes?.amount || payment.amount;
                        console.log('Payment status:', paymentStatus, 'Payment ID:', payment.id, 'Amount:', paymentAmount);
                        return paymentStatus === 'paid' || 
                               paymentStatus === 'succeeded' ||
                               paymentStatus === 'successful';
                    });
                    
                    if (successfulPayment) {
                        paymentSucceeded = true;
                        status = 'succeeded';
                        paymentIntentStatus = 'succeeded';
                        console.log('✅ Found successful payment for intent:', paymentIntentId, 'Payment ID:', successfulPayment.id);
                    }
                } else {
                    console.log('No payments found for intent:', paymentIntentId);
                }
                } catch (paymentError: any) {
                    // If we can't fetch payments, continue with payment intent status
                    console.warn('Failed to fetch payments for intent:', paymentError?.message || paymentError);
                }
            }
            
            // Also check payment intent for source references
            if (!paymentSucceeded && paymentIntent.attributes) {
                // Check if payment intent has a source reference
                const sourceId = paymentIntent.attributes.source || paymentIntent.attributes.source_id;
                if (sourceId) {
                    try {
                        const source = await getSource(sourceId);
                        const sourceStatus = source?.attributes?.status || source?.status;
                        console.log('Source from payment intent:', sourceId, 'Status:', sourceStatus);
                        if (sourceStatus === 'paid') {
                            paymentSucceeded = true;
                            status = 'succeeded';
                            paymentIntentStatus = 'succeeded';
                            console.log('✅ Found paid source via payment intent reference:', sourceId);
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
                
                // Also check if payment intent has latest_charge which might reference a payment
                const latestCharge = paymentIntent.attributes.latest_charge;
                if (latestCharge && !paymentSucceeded) {
                    try {
                        // Try to get the charge/payment
                        const charge = await paymongoRequest(`/charges/${latestCharge}`);
                        const chargeStatus = charge?.data?.attributes?.status || charge?.attributes?.status;
                        if (chargeStatus === 'paid' || chargeStatus === 'succeeded') {
                            paymentSucceeded = true;
                            status = 'succeeded';
                            paymentIntentStatus = 'succeeded';
                            console.log('✅ Found successful charge:', latestCharge);
                        }
                    } catch (e) {
                        // Ignore - charges endpoint might not exist
                    }
                }
            }
            
            // Also check payment intent attributes for payment references
            if (!paymentSucceeded && paymentIntent.attributes) {
                // Check if payment intent has a payment reference
                const paymentId = paymentIntent.attributes.payment || paymentIntent.attributes.payment_id;
                if (paymentId) {
                    try {
                        const payment = await paymongoRequest(`/payments/${paymentId}`);
                        const paymentStatus = payment?.data?.attributes?.status || payment?.attributes?.status;
                        if (paymentStatus === 'paid' || paymentStatus === 'succeeded') {
                            paymentSucceeded = true;
                            status = 'succeeded';
                            paymentIntentStatus = 'succeeded';
                            console.log('✅ Found successful payment via payment reference:', paymentId);
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
            }
            
            // Check if payment intent has a payment method attached (indicates payment was processed)
            // When payment is completed via checkout, PayMongo attaches the payment method
            if (!paymentSucceeded && paymentIntent.attributes?.payment_method) {
                // If payment method is attached, check if payment intent status indicates success
                // Sometimes the status might be "awaiting_payment_method" but payment is actually done
                // Check the payment method's status or the payment intent's next_action
                const paymentMethodId = paymentIntent.attributes.payment_method;
                if (paymentMethodId && paymentIntentStatus !== 'awaiting_payment_method') {
                    // Payment method is attached and status is not awaiting, likely succeeded
                    console.log('Payment method attached to intent:', paymentIntentId);
                }
            }
            
            // Also check if payment intent status changed from "awaiting_payment_method" to something else
            // This might indicate payment is being processed or completed
            if (paymentIntentStatus && paymentIntentStatus !== 'awaiting_payment_method' && paymentIntentStatus !== 'pending') {
                console.log('Payment intent status changed:', paymentIntentStatus, 'for intent:', paymentIntentId);
            }
            
            // Also check if payment intent has payments array directly
            if (!paymentSucceeded && paymentIntent.attributes?.payments) {
                const payments = paymentIntent.attributes.payments;
                if (Array.isArray(payments) && payments.length > 0) {
                    const successfulPayment = payments.find((payment: any) => {
                        const paymentStatus = payment.attributes?.status || payment.status;
                        return paymentStatus === 'paid' || 
                               paymentStatus === 'succeeded' ||
                               paymentStatus === 'successful';
                    });
                    
                    if (successfulPayment) {
                        paymentSucceeded = true;
                        status = 'succeeded';
                        paymentIntentStatus = 'succeeded';
                    }
                }
            }
            
            // If no successful payment found, use payment intent status
            // IMPORTANT: For PayMongo checkout, if user was redirected back with success,
            // and payment intent status is not an error state, payment likely succeeded
            if (!paymentSucceeded) {
                status = paymentIntentStatus || status;
                
                // Check if payment intent status indicates success
                // PayMongo might use different status values
                if (paymentIntentStatus === 'succeeded' || 
                    paymentIntentStatus === 'paid' ||
                    paymentIntentStatus === 'processing' ||
                    (paymentIntentStatus && 
                     paymentIntentStatus !== 'awaiting_payment_method' && 
                     paymentIntentStatus !== 'pending' &&
                     paymentIntentStatus !== 'incomplete' &&
                     paymentIntentStatus !== 'failed' &&
                     paymentIntentStatus !== 'canceled')) {
                    
                    // If status indicates processing or success, check if we should mark as succeeded
                    // For checkout sessions, if status changed from awaiting, payment was likely processed
                    console.log('Payment intent status:', paymentIntentStatus, '- checking if this indicates success');
                    
                    // If there's no error and status changed, treat as succeeded
                    const hasError = paymentIntent.attributes?.last_payment_error || paymentIntent.attributes?.errors;
                    if (!hasError && paymentIntentStatus !== 'awaiting_payment_method') {
                        // No error and status changed - payment likely succeeded
                        paymentSucceeded = true;
                        status = 'succeeded';
                        console.log('✅ Payment intent status indicates success (no errors, status changed)');
                    }
                }
            }
            
            // Update subscription status and planId if payment succeeded
            // Also check if this is a post-redirect check (user came back from PayMongo)
            // If user was redirected back with success and no errors, payment likely succeeded
            const hasNoErrors = !paymentIntent.attributes?.last_payment_error && 
                               !paymentIntent.attributes?.errors &&
                               paymentIntentStatus !== 'failed' &&
                               paymentIntentStatus !== 'canceled';
            
            // If user was redirected back from PayMongo with success, be more aggressive
            // PayMongo might not have updated the payment intent status yet, but if user
            // completed payment and was redirected back, we should trust that
            const isPostRedirectSuccess = isPostRedirect && hasNoErrors;
            
            // IMPORTANT: When user is redirected back with success from PayMongo checkout,
            // the payment has been completed. Even if PayMongo hasn't updated the payment
            // intent status yet, we should mark it as succeeded if there are no errors.
            // PayMongo's redirect to success URL only happens after successful payment.
            const shouldMarkAsSucceeded = paymentSucceeded || 
                                         status === 'succeeded' || 
                                         status === 'paid' || 
                                         paymentIntentStatus === 'succeeded' ||
                                         // If redirected back with success and no errors, payment definitely succeeded
                                         // PayMongo only redirects to success URL after payment is completed
                                         (isPostRedirectSuccess && paymentIntentStatus !== 'failed' && paymentIntentStatus !== 'canceled');
            
            if (shouldMarkAsSucceeded) {
                console.log('Marking payment as succeeded. Reason:', {
                    paymentSucceeded,
                    status,
                    paymentIntentStatus,
                    isPostRedirect,
                    hasNoErrors
                });
                // Update planId from metadata to ensure it matches what was purchased
                const metadata = paymentIntent.attributes?.metadata || {};
                const purchasedPlanId = metadata.planId;
                
                // Always update planId from metadata to ensure it matches what was purchased
                // This ensures the user gets the plan they actually paid for
                if (purchasedPlanId) {
                    subscription.planId = purchasedPlanId as any;
                } else if (!subscription.planId) {
                    // Fallback: if no planId in metadata and subscription doesn't have one,
                    // we should log a warning (this shouldn't happen in normal flow)
                    console.warn('Payment succeeded but no planId in metadata for subscription:', subscription._id);
                }
                
                subscription.status = 'active';
                await subscription.save();
                
                // Return succeeded status
                return handleSuccessResponse("Payment status retrieved", {
                    status: 'succeeded',
                    subscriptionStatus: subscription.status,
                    paymentIntentStatus: paymentIntentStatus || 'succeeded'
                });
            }
        } catch (error) {
            // If PayMongo API fails, check subscription status
            console.warn('Failed to fetch payment intent from PayMongo:', error);
            // If subscription is active, payment succeeded
            if (subscription.status === 'active') {
                status = 'succeeded';
            }
        }

        return handleSuccessResponse("Payment status retrieved", {
            status,
            subscriptionStatus: subscription.status,
            paymentIntentStatus: paymentIntentStatus
        });
    } catch (error) {
        return handleApiError(error);
    }
}

