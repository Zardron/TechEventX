"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCurrentOrganizer } from "@/lib/hooks/api/organizer.queries";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, DollarSign, Users, BarChart3, Sparkles, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrganizerWelcomeBanner() {
    const { token } = useAuthStore();
    const { user } = useAuth();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);
    const { data: organizerData } = useCurrentOrganizer();

    // Check subscription status
    const { data: subscriptionData } = useQuery({
        queryKey: ["organizer", "subscription"],
        queryFn: async () => {
            if (!token) return null;
            const response = await fetch("/api/subscriptions", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) return null;
            return response.json();
        },
        enabled: !!token,
    });

    const hasActiveSubscription = subscriptionData?.data?.subscription?.status === 'active' || 
                                  subscriptionData?.data?.subscription?.status === 'trialing';
    
    const organizerName = organizerData?.data?.organizer?.name || organizerData?.organizer?.name || user?.name || 'Organizer';

    // Check if dismissed in localStorage
    useEffect(() => {
        const isDismissed = localStorage.getItem('organizer-welcome-dismissed') === 'true';
        setDismissed(isDismissed);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('organizer-welcome-dismissed', 'true');
        setDismissed(true);
    };

    if (dismissed || user?.role !== 'organizer') {
        return null;
    }

    const steps = [
        {
            icon: DollarSign,
            title: "You're on the Free Plan",
            description: "You've been automatically assigned the Free plan. Upgrade anytime to unlock more features and higher limits.",
            action: "View Plans",
            href: "/organizer-dashboard/billing",
            completed: true, // Always completed since Free plan is auto-assigned
        },
        {
            icon: Calendar,
            title: "Create Your First Event",
            description: "Start hosting events! Create your first event and set it up for attendees to book.",
            action: "Create Event",
            href: "/organizer-dashboard/events/create",
            completed: false,
        },
        {
            icon: Users,
            title: "Manage Attendees",
            description: "Track who's attending your events, check them in, and communicate with your audience.",
            action: "View Attendees",
            href: "/organizer-dashboard/attendees",
            completed: false,
        },
        {
            icon: BarChart3,
            title: "Track Your Analytics",
            description: "Monitor your event performance, revenue, and booking statistics to grow your events.",
            action: "View Analytics",
            href: "/organizer-dashboard",
            completed: false,
        },
    ];

    return (
        <div className="mb-6">
            <div className="glass rounded-md p-6 md:p-8 border border-primary/30 relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue/5 pointer-events-none" />
                
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 hover:bg-background/50 rounded-md transition-colors z-10"
                    aria-label="Dismiss welcome message"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{organizerName}</h2>
                            <p className="text-muted-foreground">
                                Congratulations on becoming an organizer! Here's a quick guide to get you started.
                            </p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <Link
                                    key={index}
                                    href={step.href}
                                    className="p-4 rounded-md border border-border/50 bg-background/30 hover:bg-background/50 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
                                            step.completed ? 'bg-green-500/20' : 'bg-primary/10'
                                        }`}>
                                            {step.completed ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Icon className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-sm">{step.title}</h3>
                                                {step.completed && (
                                                    <span className="text-xs text-green-500">Completed</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                                {step.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-primary group-hover:gap-3 transition-all">
                                                <span className="font-medium">{step.action}</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                        <Button
                            onClick={() => router.push("/organizer-dashboard/events/create")}
                            variant="default"
                            className="bg-gradient-to-r from-primary to-blue"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Create Your First Event
                        </Button>
                        <Button
                            onClick={() => router.push("/organizer-dashboard/billing")}
                            variant="outline"
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            {hasActiveSubscription ? "Manage Subscription" : "View Plans"}
                        </Button>
                        <Button
                            onClick={() => router.push("/organizer-dashboard")}
                            variant="ghost"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

