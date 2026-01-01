"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Toggle between light and dark
    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="h-9 w-9">
                <Sun className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        )
    }

    const isDark = resolvedTheme === "dark"

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 relative transition-all duration-300 hover:scale-110"
            aria-label="Toggle theme"
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Sun Icon - appears in dark mode */}
                <Sun
                    className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-700 ease-in-out ${isDark
                        ? "rotate-0 scale-100 opacity-100 translate-y-0"
                        : "rotate-180 scale-75 opacity-0 -translate-y-2 pointer-events-none"
                        }`}
                />
                {/* Moon Icon - appears in light mode */}
                <Moon
                    className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-700 ease-in-out ${isDark
                        ? "rotate-180 scale-75 opacity-0 translate-y-2 pointer-events-none"
                        : "rotate-0 scale-100 opacity-100 translate-y-0"
                        }`}
                />
            </div>
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
