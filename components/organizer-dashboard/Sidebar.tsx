"use client"

import { Home, Calendar, Users, Settings, CreditCard, Plus, Tag, RefreshCw, DollarSign, Clock, CheckCircle, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const sideBarItems = [
    {
        href: "/organizer-dashboard",
        label: "Dashboard",
        icon: Home
    },
    {
        href: "/organizer-dashboard/events",
        label: "Events",
        icon: Calendar
    },
    {
        href: "/organizer-dashboard/events/create",
        label: "Create Event",
        icon: Plus
    },
    {
        href: "/organizer-dashboard/attendees",
        label: "Attendees",
        icon: Users
    },
    {
        href: "/organizer-dashboard/team",
        label: "Team",
        icon: Users
    },
    {
        href: "/organizer-dashboard/billing",
        label: "Billing",
        icon: CreditCard
    },
    {
        href: "/organizer-dashboard/promo-codes",
        label: "Promo Codes",
        icon: Tag
    },
    {
        href: "/organizer-dashboard/refunds",
        label: "Refunds",
        icon: RefreshCw
    },
    {
        href: "/organizer-dashboard/payouts",
        label: "Payouts",
        icon: DollarSign
    },
    {
        href: "/organizer-dashboard/waitlist",
        label: "Waitlist",
        icon: Clock
    },
    {
        href: "/organizer-dashboard/check-in-history",
        label: "Check-In History",
        icon: CheckCircle
    },
    {
        href: "/organizer-dashboard/attendees/communicate",
        label: "Communicate",
        icon: Mail
    },
    {
        href: "/organizer-dashboard/settings",
        label: "Settings",
        icon: Settings
    }
]

const SideBar = () => {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (!href) return false
        // Handle root path - only active when exactly on "/"
        if (href === "/") {
            return pathname === "/"
        }
        // Handle organizer dashboard - only active when exactly on "/organizer-dashboard"
        if (href === "/organizer-dashboard") {
            return pathname === "/organizer-dashboard"
        }
        // For other paths, check exact match or if pathname starts with the href
        return pathname === href || pathname?.startsWith(href + "/")
    }

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-y-auto">
            {/* Logo Section */}
            <div className="flex items-center py-4 px-4 sm:px-6 border-b border-sidebar-border shrink-0">
                <Link href="/organizer-dashboard" className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <div className="relative shrink-0">
                        <Image
                            src="/icons/logo.png"
                            alt="logo"
                            width={24}
                            height={24}
                            className="object-contain"
                        />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-sidebar-foreground cursor-pointer">TechEventX</h3>
                </Link>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-2 sm:px-3 py-4 space-y-1 overflow-y-auto">
                {sideBarItems.map((item) => {
                    const Icon = item.icon
                    const isItemActive = isActive(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-md
                                transition-all duration-200 ease-in-out
                                group relative
                                ${isItemActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                }
                            `}
                        >
                            {/* Active indicator bar */}
                            {isItemActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                            )}

                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors duration-200 ${isItemActive ? 'text-primary' : 'group-hover:text-primary'
                                }`} />

                            <span className="flex-1 text-xs sm:text-sm font-medium">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}

export default SideBar

