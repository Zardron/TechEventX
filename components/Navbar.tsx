"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Menu, X, User, ChevronDown, Calendar, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import ThemeToggle from "./ThemeToggle"

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const pathname = usePathname()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { user, isAuthenticated, clearAuth } = useAuth()

    console.log(user)

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isDropdownOpen])

    // Handle sign out
    const handleSignOut = () => {
        clearAuth()
        setIsDropdownOpen(false)
        window.location.href = '/'
    }

    // Get user initials for avatar
    const getUserInitials = (name: string | undefined): string => {
        if (!name || name.trim().length === 0) return ''
        const words = name.trim().split(' ').filter(n => n.length > 0)
        if (words.length === 0) return ''
        if (words.length === 1) return words[0][0].toUpperCase()
        return (words[0][0] + words[words.length - 1][0]).toUpperCase().slice(0, 2)
    }

    // Hide navbar on sign-in and sign-up pages
    if (pathname === '/sign-in' || pathname === '/sign-up') {
        return null
    }

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/events", label: "All Events" },
        { href: "/about-us", label: "About Us" },
        { href: "/contact", label: "Contact" },
        { href: "/help-center", label: "Help Center" },
        { href: "/privacy-policy", label: "Privacy Policy" },
    ]

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/"
        }
        return pathname?.startsWith(href)
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full">
            {/* Background with backdrop blur */}
            <div className="absolute inset-0 bg-dark-100/80 backdrop-blur-xl border-b border-blue/10" />

            <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-between w-full">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 group relative z-10"
                        >
                            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-blue/10 border border-blue/20 flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(148,234,255,0.1)] group-hover:shadow-[0_0_25px_rgba(148,234,255,0.2)] group-hover:border-blue/40 transition-all duration-300">
                                <Image
                                    src="/icons/logo.png"
                                    alt="TechHub Logo"
                                    width={24}
                                    height={24}
                                    className="w-6 h-6"
                                />
                            </div>
                            <span className="text-xl font-bold text-foreground font-schibsted-grotesk group-hover:text-blue/90 transition-colors duration-200">
                                TechHub
                            </span>
                        </Link>
                        <div className="flex items-center gap-2">
                            {navLinks.map((link) => {
                                const active = isActive(link.href)
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`
                                        relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                                        ${active
                                                ? "bg-gradient-to-r from-blue/20 to-primary/20 text-blue border border-blue/30 shadow-[0_0_25px_rgba(148,234,255,0.25)]"
                                                : "text-foreground/80 hover:text-foreground hover:bg-dark-200/50"
                                            }
                                    `}
                                    >
                                        {link.label}
                                        {active && (
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue/10 to-primary/10 -z-10 blur-sm" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>

                        {isAuthenticated ? (
                            <div className="relative ml-2" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300
                                        ${isDropdownOpen
                                            ? "bg-dark-200/80 border border-blue/30 shadow-[0_0_20px_rgba(148,234,255,0.15)]"
                                            : "bg-dark-200/40 border border-blue/10 hover:bg-dark-200/60 hover:border-blue/20"
                                        }
                                    `}
                                    aria-label="User menu"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-blue/30 border-2 border-blue/40 flex items-center justify-center text-xs font-bold text-foreground shadow-[0_0_15px_rgba(148,234,255,0.2)]">
                                        {getUserInitials(user?.name) || <User className="w-4 h-4" />}
                                    </div>
                                    <ChevronDown
                                        className={`w-4 h-4 text-foreground/60 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-dark-200/95 backdrop-blur-xl rounded-xl border border-blue/20 shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                                        {/* User Info Section */}
                                        <div className="px-4 py-3 border-b border-blue/10 bg-dark-100/50">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {user?.name}
                                            </p>
                                            <p className="text-xs text-foreground/60 truncate">
                                                {user?.email}
                                            </p>
                                        </div>

                                        <div className="py-2">
                                            <Link
                                                href="/bookings"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/90 hover:bg-blue/10 hover:text-blue transition-colors duration-200"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                My Bookings
                                            </Link>
                                            <div className="border-t border-blue/10 my-1" />
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <ThemeToggle />
                                <Link
                                    href="/sign-in"
                                    className={`
                                    ml-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer
                                    ${isActive('/sign-in')
                                            ? "bg-gradient-to-r from-blue/20 to-primary/20 text-blue border border-blue/30 shadow-[0_0_25px_rgba(148,234,255,0.25)]"
                                            : "text-foreground/80 hover:text-foreground hover:bg-dark-200/50 border border-transparent hover:border-blue/20"
                                        }
                                `}
                                >
                                    Sign in
                                </Link>
                            </div>

                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden relative z-10 p-2.5 rounded-xl text-foreground hover:bg-dark-200/50 transition-colors duration-200"
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-dark-200/95 backdrop-blur-xl rounded-xl border border-blue/20 shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        {/* User Info (if authenticated) */}
                        {isAuthenticated && user && (
                            <div className="px-4 py-3 border-b border-blue/10 bg-dark-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-blue/30 border-2 border-blue/40 flex items-center justify-center text-xs font-bold text-foreground shadow-[0_0_15px_rgba(148,234,255,0.2)]">
                                        {getUserInitials(user?.name) || <User className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-foreground/60 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="py-2">
                            {navLinks.map((link) => {
                                const active = isActive(link.href)
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`
                                            block px-4 py-3 text-sm font-medium transition-all duration-200
                                            ${active
                                                ? "bg-blue/10 text-blue border-l-2 border-blue"
                                                : "text-foreground/90 hover:bg-blue/5 hover:text-foreground"
                                            }
                                        `}
                                    >
                                        {link.label}
                                    </Link>
                                )
                            })}

                            {isAuthenticated ? (
                                <>
                                    <div className="border-t border-blue/10 my-1" />
                                    <Link
                                        href="/bookings"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-foreground/90 hover:bg-blue/10 hover:text-blue transition-colors duration-200"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        My Bookings
                                    </Link>
                                    <div className="border-t border-blue/10 my-1" />
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            handleSignOut()
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="border-t border-blue/10 my-1" />
                                    <Link
                                        href="/sign-in"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`
                                            block px-4 py-3 text-sm font-medium transition-all duration-200
                                            ${isActive('/sign-in')
                                                ? "bg-blue/10 text-blue border-l-2 border-blue"
                                                : "text-foreground/90 hover:bg-blue/5 hover:text-foreground"
                                            }
                                        `}
                                    >
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}

export default Navbar
