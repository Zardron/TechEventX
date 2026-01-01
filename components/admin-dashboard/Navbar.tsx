"use client"

import { LogOut, PanelLeftOpen, PanelRightOpen, User } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/hooks/use-auth"

const Navbar = ({ sideBarCollapsed, setSideBarCollapsed }: { sideBarCollapsed: boolean, setSideBarCollapsed: (collapsed: boolean) => void }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { user, clearAuth } = useAuth()
    // Handle sign out
    const handleSignOut = () => {
        clearAuth()
        setIsMenuOpen(false)
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

    return (
        <div className="max-h-[65px] flex items-center justify-between p-4 border-b border-border-dark">
            <div>
                {!sideBarCollapsed ?
                    <PanelRightOpen className="w-4 h-4 cursor-pointer text-foreground hover:text-blue transition-all duration-200 hover:scale-110" onClick={() => setSideBarCollapsed(true)} />
                    :
                    <PanelLeftOpen className="w-4 h-4 cursor-pointer text-foreground hover:text-blue transition-all duration-200 hover:scale-110" onClick={() => setSideBarCollapsed(false)} />}
            </div>
            <div className="relative ml-2">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`
                                        flex items-center gap-3 px-2 py-1 rounded-xl transition-all duration-300
                                    `}
                    aria-label="User menu"
                >
                    <span className="text-lg font-semibold text-foreground truncate">
                        Welcome, <span className="text-blue capitalize">{user?.name}</span>
                    </span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-blue/30 border-2 border-blue/40 flex items-center justify-center text-xs font-bold text-foreground shadow-[0_0_15px_rgba(148,234,255,0.2)] cursor-pointer">
                        {getUserInitials(user?.name) || <User className="w-4 h-4" />}
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
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

                        <div>
                            <div className="border-t border-blue/10 " />
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Navbar