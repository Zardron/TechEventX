"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:border",
                    title: "group-[.toast]:text-foreground group-[.toast]:font-semibold group-[.toast]:text-base",
                    description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-0.5",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    success:
                        "group-[.toaster]:bg-card group-[.toaster]:border-border",
                    error:
                        "group-[.toaster]:bg-card group-[.toaster]:border-border",
                    info:
                        "group-[.toaster]:bg-card group-[.toaster]:border-border",
                    warning:
                        "group-[.toaster]:bg-card group-[.toaster]:border-border",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }

