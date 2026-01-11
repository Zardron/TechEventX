"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Smartphone,
  Wallet,
  ArrowUpRight,
  Shield,
  Lock,
  Info,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const paymentIntentId = searchParams.get("intent");
  const paymentStatusParam = searchParams.get("status");
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "processing" | "succeeded" | "failed"
  >("pending");

  // Handle payment status from redirect
  useEffect(() => {
    if (paymentStatusParam === "success") {
      setPaymentStatus("processing");
      // Payment status will be checked by the periodic check below
    } else if (paymentStatusParam === "cancel") {
      setPaymentStatus("failed");
      toast.error("Payment was cancelled");
    }
  }, [paymentStatusParam]);

  // Fetch payment intent details
  const { data: paymentIntentData, isLoading } = useQuery({
    queryKey: ["paymentIntent", paymentIntentId],
    queryFn: async () => {
      if (!token || !paymentIntentId)
        throw new Error("Missing payment intent ID");

      // Fetch payment intent from our API
      const response = await fetch(`/api/payments/intent/${paymentIntentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payment intent");
      }

      return response.json();
    },
    enabled: !!token && !!paymentIntentId,
  });

  const paymentIntent =
    paymentIntentData?.paymentIntent || paymentIntentData?.data?.paymentIntent;
  const subscription =
    paymentIntentData?.subscription || paymentIntentData?.data?.subscription;
  const currentSubscription =
    paymentIntentData?.currentSubscription ||
    paymentIntentData?.data?.currentSubscription;
  const newPlan = subscription?.plan;
  const currentPlan = currentSubscription?.plan;
  const fetchedClientKey = paymentIntent?.attributes?.client_key;
  const [manualClientKey, setManualClientKey] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("gcash");
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine if this is an upgrade
  const isUpgrade = !!currentPlan && !!newPlan;
  const amount = paymentIntent?.attributes?.amount || newPlan?.price || 0;

  // Use fetched client key or manual input
  const clientKey = fetchedClientKey || manualClientKey;

  // Handle PayMongo payment using client key
  const handlePayMongoPayment = async () => {
    if (!clientKey || !paymentIntentId) {
      toast.error("Missing payment information");
      return;
    }

    setIsProcessing(true);

    try {
      // For e-wallet payments (GCash, GrabPay, PayMaya),
      // Create checkout session and redirect to PayMongo
      const response = await fetch("/api/payments/complete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodType: selectedPaymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if we got a checkout URL for redirect
        if (data?.checkoutUrl || data?.data?.checkoutUrl) {
          const checkoutUrl = data?.checkoutUrl || data?.data?.checkoutUrl;
          // Redirect to PayMongo checkout
          window.location.href = checkoutUrl;
          return;
        }

        // Check payment status
        const status = data?.status || data?.data?.status;
        if (status === "succeeded") {
          setPaymentStatus("succeeded");
          setIsProcessing(false);
          toast.success("Payment successful! Your subscription is now active.");
          setTimeout(() => {
            router.push("/organizer-dashboard/billing");
          }, 2000);
        } else if (status === "error") {
          setIsProcessing(false);
          setPaymentStatus("failed");
          toast.error(
            data?.message || data?.error || "Payment failed. Please try again."
          );
        } else {
          setPaymentStatus("processing");
          toast("Payment is being processed...", { icon: "⏳" });
        }
      } else {
        throw new Error(data?.message || data?.error || "Payment failed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      setPaymentStatus("failed");
      toast.error(error?.message || "Payment failed. Please try again.");
    }
  };

  // Check payment status function
  const checkPaymentStatus = async () => {
    if (!paymentIntentId || !token) return;

    try {
      const response = await fetch(
        `/api/payments/intent/${paymentIntentId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const status = data.status || data.data?.status;

        if (status === "succeeded") {
          setPaymentStatus("succeeded");
          toast.success("Payment successful! Your subscription is now active.");
          setTimeout(() => {
            router.push("/organizer-dashboard/billing");
          }, 2000);
        } else if (status === "failed" || status === "canceled") {
          setPaymentStatus("failed");
        } else if (status === "processing") {
          setPaymentStatus("processing");
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  // Complete payment mutation
  const completePaymentMutation = useMutation({
    mutationFn: async (): Promise<any> => {
      if (!token || !paymentIntentId) {
        throw new Error("Missing payment intent ID");
      }

      try {
        const response = await fetch("/api/payments/complete", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentIntentId,
            paymentMethodType: selectedPaymentMethod,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            data?.message ||
            data?.error ||
            `Failed to complete payment (${response.status})`;
          const error = new Error(errorMessage);
          (error as any).error = data?.error;
          (error as any).status = data?.status;
          throw error;
        }

        return data;
      } catch (fetchError: any) {
        // Re-throw if it's already an Error with our format
        if (fetchError instanceof Error) {
          throw fetchError;
        }
        // Otherwise wrap it
        throw new Error(fetchError?.message || "Network error occurred");
      }
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      const status = data?.status || data?.data?.status;

      if (status === "succeeded") {
        setPaymentStatus("succeeded");
        toast.success("Payment successful! Your subscription is now active.");
        setTimeout(() => {
          router.push("/organizer-dashboard/billing");
        }, 2000);
      } else if (status === "error") {
        setPaymentStatus("failed");
        toast.error(
          data?.message || data?.error || "Payment failed. Please try again."
        );
      } else if (data?.requiresRedirect) {
        // For payment methods that require redirect, show instructions
        toast(
          data?.message ||
            "Please use PayMongo's payment widget to complete payment",
          { icon: "ℹ️" }
        );
        setPaymentStatus("processing");
      } else {
        setPaymentStatus("processing");
        toast("Payment is being processed...", { icon: "⏳" });
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      setPaymentStatus("failed");
      const errorMessage =
        error?.message || error?.error || "Payment failed. Please try again.";
      toast.error(errorMessage);
    },
  });

  // Check payment status periodically
  useEffect(() => {
    if (!paymentIntentId || !token) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `/api/payments/intent/${paymentIntentId}/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const status = data.status || data.data?.status;

          if (status === "succeeded") {
            setPaymentStatus("succeeded");
            toast.success(
              "Payment successful! Your subscription is now active."
            );
            // Redirect after a short delay
            setTimeout(() => {
              router.push("/organizer-dashboard/billing");
            }, 2000);
          } else if (status === "failed" || status === "canceled") {
            setPaymentStatus("failed");
          } else if (status === "processing") {
            setPaymentStatus("processing");
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };

    // Check immediately and then every 3 seconds
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 3000);

    return () => clearInterval(interval);
  }, [paymentIntentId, token, router]);

  if (!paymentIntentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <XCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold">Invalid Payment Intent</h2>
        <p className="text-muted-foreground">No payment intent ID provided.</p>
        <Button onClick={() => router.push("/organizer-dashboard/billing")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading payment details...</p>
      </div>
    );
  }

  if (paymentStatus === "succeeded") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-bold">Payment Successful!</h2>
        <p className="text-muted-foreground">
          Your subscription has been activated.
        </p>
        <Button onClick={() => router.push("/organizer-dashboard/billing")}>
          Back to Billing
        </Button>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <XCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold">Payment Failed</h2>
        <p className="text-muted-foreground">
          Your payment could not be processed. Please try again.
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/organizer-dashboard/billing")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col w-1/2 h-full justify-between">
        <div>
          <div
             onClick={() => router.push("/organizer-dashboard/billing")}
            className="w-36 h-10 flex items-center mb-4 cursor-pointer border p-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </div>
          <h1 className="text-3xl font-bold">Complete Your Payment</h1>
          <h3 className="text-lg font-semibold mb-4 pt-4">
          {isUpgrade
              ? "Upgrade your subscription"
              : "Activate your subscription"}
              </h3>
        
           
        </div>

        {/* Billing Details */}
        {newPlan && (
          <div className="border rounded-lg bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">Billing Details</h2>
            <div className="space-y-3">
              {isUpgrade && currentPlan && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Plan
                    </p>
                    <p className="font-medium">{currentPlan.name}</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Upgrading To
                    </p>
                    <p className="font-medium">{newPlan.name}</p>
                  </div>
                </div>
              )}
              {!isUpgrade && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Subscribing To
                  </p>
                  <p className="font-medium text-lg">{newPlan.name}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-semibold">Total Amount</span>
                <span className="text-2xl font-bold">
                  ₱
                  {(amount / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

{clientKey ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 pt-10">
                Select Payment Method
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GCash Card */}
                <div
                  onClick={() => setSelectedPaymentMethod("gcash")}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === "gcash"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">GCash</p>
                      <p className="text-sm text-muted-foreground">
                        Mobile wallet
                      </p>
                    </div>
                    {selectedPaymentMethod === "gcash" && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>

                {/* GrabPay Card */}
                <div
                  onClick={() => setSelectedPaymentMethod("grab_pay")}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === "grab_pay"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">GrabPay</p>
                      <p className="text-sm text-muted-foreground">
                        Mobile wallet
                      </p>
                    </div>
                    {selectedPaymentMethod === "grab_pay" && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>

                {/* PayMaya Card */}
                <div
                  onClick={() => setSelectedPaymentMethod("paymaya")}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === "paymaya"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">PayMaya</p>
                      <p className="text-sm text-muted-foreground">
                        Mobile wallet
                      </p>
                    </div>
                    {selectedPaymentMethod === "paymaya" && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>

                {/* Credit Card - Disabled */}
                <div className="p-4 border-2 rounded-lg cursor-not-allowed opacity-50 bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-500/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">
                        Coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-500">
                <strong>Note:</strong>{" "}
                {selectedPaymentMethod === "gcash"
                  ? "GCash"
                  : selectedPaymentMethod === "grab_pay"
                  ? "GrabPay"
                  : "PayMaya"}{" "}
                payments will redirect you to complete the payment. Your
                subscription will be activated automatically upon successful
                payment.
              </p>
            </div>

            <Button
              onClick={handlePayMongoPayment}
              disabled={
                isProcessing || !clientKey || completePaymentMutation.isPending
              }
              className="w-full"
              size="lg"
            >
              {isProcessing || completePaymentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Preparing payment...</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-1/2 border rounded-lg bg-card p-6 space-y-4 mt-17">
        {paymentStatus === "processing" && (
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <p className="text-sm text-blue-500">Processing your payment...</p>
          </div>
        )}

        {/* Plan Features */}
        {newPlan && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">What's Included</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    {newPlan.features?.maxEvents === null
                      ? "Unlimited events"
                      : `${newPlan.features?.maxEvents || 0} events per month`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create and manage your events
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    {newPlan.features?.maxBookingsPerEvent === null
                      ? "Unlimited bookings"
                      : `Up to ${newPlan.features?.maxBookingsPerEvent || 0} bookings per event`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Handle more attendees
                  </p>
                </div>
              </div>
              {newPlan.features?.analytics && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Analytics & Insights</p>
                    <p className="text-xs text-muted-foreground">
                      Track event performance
                    </p>
                  </div>
                </div>
              )}
              {newPlan.features?.customBranding && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Custom Branding</p>
                    <p className="text-xs text-muted-foreground">
                      Brand your event pages
                    </p>
                  </div>
                </div>
              )}
              {newPlan.features?.prioritySupport && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Priority Support</p>
                    <p className="text-xs text-muted-foreground">
                      Get help faster
                    </p>
                  </div>
                </div>
              )}
              {newPlan.features?.apiAccess && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">API Access</p>
                    <p className="text-xs text-muted-foreground">
                      Integrate with your tools
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security & Trust */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Secure Payment</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              <p className="text-sm text-muted-foreground">
                Your payment is processed securely through PayMongo, a PCI-DSS compliant payment gateway.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              <p className="text-sm text-muted-foreground">
                We never store your payment card details. All transactions are encrypted.
              </p>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Need Help?</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Payment Process</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be redirected to complete your payment. Your subscription activates automatically once payment is confirmed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Cancellation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can cancel your subscription anytime from your billing settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
