"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Home,
    Calendar,
    Plus,
    Users,
    CreditCard,
    Settings,
    Tag,
    DollarSign,
    CheckCircle,
    Mail,
    X,
    ChevronRight,
    Sparkles,
} from "lucide-react"
import Link from "next/link"

const GUIDE_STEPS = [
    {
        title: "Dashboard Overview",
        description: "Your central hub for all event statistics, analytics, and quick actions. Monitor your events, bookings, and revenue at a glance.",
        icon: Home,
        href: "/organizer-dashboard",
    },
    {
        title: "Create Your First Event",
        description: "Start by creating an event. Set event details, pricing, capacity, and publish it to start accepting bookings.",
        icon: Plus,
        href: "/organizer-dashboard/events/create",
    },
    {
        title: "Manage Events",
        description: "View, edit, and manage all your events. Track event status, dates, and performance metrics.",
        icon: Calendar,
        href: "/organizer-dashboard/events",
    },
    {
        title: "Attendees Management",
        description: "View all attendees, manage bookings, check-in attendees, and communicate with your event participants.",
        icon: Users,
        href: "/organizer-dashboard/attendees",
    },
    {
        title: "Billing & Subscriptions",
        description: "Manage your subscription plan, view billing history, and upgrade your plan to unlock more features.",
        icon: CreditCard,
        href: "/organizer-dashboard/billing",
    },
    {
        title: "Promo Codes",
        description: "Create discount codes to attract more attendees and boost your event registrations.",
        icon: Tag,
        href: "/organizer-dashboard/promo-codes",
    },
    {
        title: "Payouts & Revenue",
        description: "Track your earnings, view payout history, and manage your revenue from all events.",
        icon: DollarSign,
        href: "/organizer-dashboard/payouts",
    },
    {
        title: "Check-In History",
        description: "View and manage attendee check-ins for your events. Track who attended and when.",
        icon: CheckCircle,
        href: "/organizer-dashboard/check-in-history",
    },
    {
        title: "Communicate",
        description: "Send messages and notifications to your attendees. Keep them informed about event updates.",
        icon: Mail,
        href: "/organizer-dashboard/attendees/communicate",
    },
    {
        title: "Settings",
        description: "Customize your profile, notification preferences, and account settings.",
        icon: Settings,
        href: "/organizer-dashboard/settings",
    },
]

const STORAGE_KEYS = {
    GUIDE_SKIPPED_TODAY: "organizer_welcome_guide_skipped_today",
}

export default function WelcomeGuide() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted || !user || user.role !== "organizer") return

        // Check if skipped today
        const skippedToday = localStorage.getItem(STORAGE_KEYS.GUIDE_SKIPPED_TODAY)
        const today = new Date().toDateString()
        if (skippedToday === today) return

        // Show guide every time organizer visits dashboard (unless skipped today)
        // Show after a short delay for better UX
        const timer = setTimeout(() => {
            setIsOpen(true)
        }, 1000)
        return () => clearTimeout(timer)
    }, [mounted, user])

    const handleDontShowToday = () => {
        const today = new Date().toDateString()
        localStorage.setItem(STORAGE_KEYS.GUIDE_SKIPPED_TODAY, today)
        setIsOpen(false)
    }

    const handleClose = () => {
        setIsOpen(false)
    }

    const handleNext = () => {
        if (currentStep < GUIDE_STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            // Just close when finished, don't permanently dismiss
            setIsOpen(false)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    if (!mounted || !isOpen) return null

    const currentGuideStep = GUIDE_STEPS[currentStep]
    const Icon = currentGuideStep.icon

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-primary/10">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-2xl">
                                    Welcome to TechEventX!
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base mt-1">
                                    Let's get you started with your organizer dashboard
                                </AlertDialogDescription>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </AlertDialogHeader>

                <div className="mt-6 space-y-6">
                    {/* Progress Indicator */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Step {currentStep + 1} of {GUIDE_STEPS.length}
                            </span>
                            <span className="text-muted-foreground">
                                {Math.round(((currentStep + 1) / GUIDE_STEPS.length) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStep + 1) / GUIDE_STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Current Step Content */}
                    <div className="p-6 border rounded-md bg-card space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-md bg-primary/10 shrink-0">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-xl font-semibold">{currentGuideStep.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {currentGuideStep.description}
                                </p>
                                {currentGuideStep.href && (
                                    <Link
                                        href={currentGuideStep.href}
                                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                                        onClick={handleClose}
                                    >
                                        Go to {currentGuideStep.title}
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step Navigation Dots */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {GUIDE_STEPS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentStep
                                        ? "bg-primary w-8"
                                        : index < currentStep
                                        ? "bg-primary/50"
                                        : "bg-muted"
                                }`}
                                aria-label={`Go to step ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={handleDontShowToday}
                            className="flex-1 sm:flex-none"
                        >
                            Don't show today
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                className="flex-1 sm:flex-none"
                            >
                                Previous
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className="flex-1 sm:flex-none"
                        >
                            {currentStep === GUIDE_STEPS.length - 1 ? "Get Started" : "Next"}
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

