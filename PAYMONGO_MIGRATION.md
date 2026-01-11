# PayMongo Migration Guide

## Changes Made

### 1. Created PayMongo Library (`lib/paymongo.ts`)
   - Replaced Stripe SDK with PayMongo REST API integration
   - Implemented functions for:
     - Creating customers
     - Creating payment intents
     - Creating payment methods
     - Creating subscriptions/billings
     - Canceling subscriptions
     - Creating refunds

### 2. Updated Database Models
   - **User Model**: Added `paymongoCustomerId` field (kept `stripeCustomerId` for migration support)
   - **Subscription Model**: Added `paymongoSubscriptionId`, `paymongoCustomerId`, and `paymongoPaymentIntentId` fields

### 3. Updated API Routes
   - **`/api/subscriptions`**: Now uses PayMongo for subscription creation
   - **`/api/subscriptions/[subscriptionId]`**: Updated to use PayMongo for cancellation
   - **`/api/payments/create-intent`**: Updated to use PayMongo payment intents

### 4. Updated Frontend
   - **Billing Page**: Removed Stripe.js dependency, updated to work with PayMongo payment flow

## Environment Variables Required

Add these to your `.env.local` file:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here

# Optional: PayMongo Webhook Secret (for production)
PAYMONGO_WEBHOOK_SECRET=your_webhook_secret_here
```

## Important Notes

1. **PayMongo vs Stripe**: PayMongo doesn't have native subscription management like Stripe. Recurring payments need to be handled through:
   - PayMongo's billing feature (if available)
   - Manual recurring payment processing
   - Third-party subscription management

2. **Payment Flow**: 
   - Payment intents are created server-side
   - Client-side uses PayMongo's payment widget or redirects to PayMongo checkout
   - Payment confirmation happens via webhooks

3. **Migration**: 
   - Existing Stripe subscriptions will continue to work (backward compatibility)
   - New subscriptions will use PayMongo
   - Consider migrating existing customers gradually

4. **Testing**: 
   - Use test keys provided
   - Test payment flow thoroughly before going to production
   - Update webhook endpoints in PayMongo dashboard

## Next Steps

1. Set environment variables
2. Test subscription creation flow
3. Set up PayMongo webhooks (if needed)
4. Update any frontend payment forms to use PayMongo widget
5. Remove Stripe dependencies from package.json (optional, for cleanup)

## Webhook Setup

If you need webhooks, create a route at `/api/webhooks/paymongo/route.ts` to handle PayMongo webhook events.

