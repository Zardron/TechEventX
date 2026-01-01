"use client"

import { Home, Users, Plus, ChevronDown, Calendar, FolderKanbanIcon, Settings, Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

const sideBarItems = [
    {
        href: "/admin-dashboard",
        label: "Dashboard",
        icon: Home
    },
    {
        href: "",
        label: "Users",
        icon: Users,
        dropdownItems: [
            {
                href: "/admin-dashboard/all-users",
                label: "All Users",
                icon: Users
            },
            {
                href: "/admin-dashboard/add-users",
                label: "Add Users",
                icon: Plus
            }
        ]
    },
    {
        href: "",
        label: "Organizer",
        icon: FolderKanbanIcon,
        dropdownItems: [
            {
                href: "/admin-dashboard/all-organizers",
                label: "All Organizers",
                icon: FolderKanbanIcon
            },
            {
                href: "/admin-dashboard/add-organizers",
                label: "Add Organizers",
                icon: Plus
            }
        ]
    },
    {
        href: "",
        label: "Event",
        icon: Calendar,
        dropdownItems: [
            {
                href: "/admin-dashboard/all-events",
                label: "All Events",
                icon: Calendar
            },
            {
                href: "/admin-dashboard/add-events",
                label: "Add Events",
                icon: Plus
            }
        ]
    },
    {
        href: "/",
        label: "Visit Website",
        icon: Globe,
    },
    {
        href: "/admin-dashboard/settings",
        label: "Settings",
        icon: Settings,
    }
]

const SideBar = () => {
    const pathname = usePathname()
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})

    // Auto-expand dropdown if current path matches any dropdown item
    useEffect(() => {
        const newOpenDropdowns: Record<string, boolean> = {}
        sideBarItems.forEach((item) => {
            if (item.dropdownItems) {
                const isActive = item.dropdownItems.some(
                    (dropdownItem) => pathname === dropdownItem.href || pathname?.startsWith(dropdownItem.href)
                )
                if (isActive) {
                    newOpenDropdowns[item.label] = true
                }
            }
        })
        setOpenDropdowns(newOpenDropdowns)
    }, [pathname])

    const toggleDropdown = (label: string) => {
        setOpenDropdowns((prev) => ({
            ...prev,
            [label]: !prev[label]
        }))
    }

    const isActive = (href: string) => {
        if (!href) return false
        // Handle root path - only active when exactly on "/"
        if (href === "/") {
            return pathname === "/"
        }
        // Handle admin dashboard - only active when exactly on "/admin-dashboard"
        if (href === "/admin-dashboard") {
            return pathname === "/admin-dashboard"
        }
        // For other paths, check exact match or if pathname starts with the href
        return pathname === href || pathname?.startsWith(href + "/")
    }

    const isDropdownItemActive = (item: typeof sideBarItems[0]) => {
        if (!item.dropdownItems) return false
        return item.dropdownItems.some((dropdownItem) => isActive(dropdownItem.href))
    }

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
            {/* Logo Section */}
            <div className="flex items-center gap-3 py-4 px-6 border-b border-sidebar-border">
                <div className="relative  shrink-0">
                    <Image
                        src="/icons/logo.png"
                        alt="logo"
                        width={24}
                        height={24}
                        className="object-contain"
                    />
                </div>
                <h3 className="text-2xl font-semibold text-sidebar-foreground">TechHub</h3>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {sideBarItems.map((item) => {
                    const Icon = item.icon
                    const hasDropdown = !!item.dropdownItems
                    const isItemActive = isActive(item.href) || isDropdownItemActive(item)
                    const isDropdownOpen = openDropdowns[item.label] || false

                    return (
                        <div key={item.label} className="space-y-1">
                            {hasDropdown ? (
                                <>
                                    <button
                                        onClick={() => toggleDropdown(item.label)}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                            transition-all duration-200 ease-in-out
                                            group relative cursor-pointer
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

                                        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isItemActive ? 'text-primary' : 'group-hover:text-primary'
                                            }`} />

                                        <span className="flex-1 text-sm font-medium text-left">
                                            {item.label}
                                        </span>

                                        <ChevronDown
                                            className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''
                                                } ${isItemActive ? 'text-primary' : 'text-sidebar-foreground/40'}`}
                                        />
                                    </button>

                                    {/* Dropdown Items */}
                                    <div className={`
                                        overflow-hidden transition-all duration-300 ease-in-out
                                        ${isDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                                    `}>
                                        <div className="pl-4 ml-3 border-l-2 border-sidebar-border/30 space-y-1 py-1">
                                            {item.dropdownItems?.map((dropdownItem) => {
                                                const DropdownIcon = dropdownItem.icon
                                                const isDropdownActive = isActive(dropdownItem.href)

                                                return (
                                                    <Link
                                                        href={dropdownItem.href}
                                                        key={dropdownItem.href}
                                                        className={`
                                                            flex items-center gap-3 px-3 py-2 rounded-lg
                                                            transition-all duration-200 ease-in-out
                                                            group relative cursor-pointer
                                                            ${isDropdownActive
                                                                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                                                                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                                            }
                                                        `}
                                                    >
                                                        {/* Active indicator bar */}
                                                        {isDropdownActive && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                                                        )}

                                                        <DropdownIcon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isDropdownActive ? 'text-primary' : 'group-hover:text-primary'
                                                            }`} />

                                                        <span className="text-sm font-medium">
                                                            {dropdownItem.label}
                                                        </span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg
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

                                    <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isItemActive ? 'text-primary' : 'group-hover:text-primary'
                                        }`} />

                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>
                                </Link>
                            )}
                        </div>
                    )
                })}
            </nav>
        </div>
    )
}

export default SideBar