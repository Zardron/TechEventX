import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import LightRays from '../components/LightRays';
import ScrollToTop from "@/components/ScrollToTop";
import ConditionalFooter from "@/components/ConditionalFooter";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/lib/theme-provider";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import RoleBasedLayout from "@/components/RoleBasedLayout";
import ConditionalContainer from "@/components/ConditionalContainer";
import { Toaster } from "react-hot-toast";

const schibstedGrotesk = Schibsted_Grotesk({
    variable: "--font-schibsted-grotesk",
    subsets: ["latin"],
});

const martianMono = Martian_Mono({
    variable: "--font-martian-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "TechEventX - Your Tech Event Platform",
    description: "Discover and attend tech events worldwide. Hackathons, developer conferences, tech workshops, and more.",
    icons: {
        icon: "/icons/logo.png",
        shortcut: "/icons/logo.png",
        apple: "/icons/logo.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${schibstedGrotesk.variable} ${martianMono.variable} min-h-screen antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <QueryProvider>
                        <ScrollToTop />
                        <ConditionalNavbar />
                        <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
                            <LightRays
                                raysOrigin="top-center-offset"
                                raysColor="#5dfeca"
                                raysSpeed={0.5}
                                lightSpread={0.9}
                                rayLength={1.4}
                                followMouse={true}
                                mouseInfluence={0.02}
                                noiseAmount={0.0}
                                distortion={0.01}
                                className="w-full h-full"
                            />
                        </div>
                        <RoleBasedLayout>
                            <ConditionalContainer>
                                {children}
                            </ConditionalContainer>
                        </RoleBasedLayout>
                        <ConditionalFooter />
                        <Toaster 
                            position="bottom-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: 'var(--background)',
                                    color: 'var(--foreground)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                },
                                success: {
                                    iconTheme: {
                                        primary: '#10b981',
                                        secondary: 'white',
                                    },
                                    style: {
                                        borderLeft: '4px solid #10b981',
                                    },
                                },
                                error: {
                                    iconTheme: {
                                        primary: '#ef4444',
                                        secondary: 'white',
                                    },
                                    style: {
                                        borderLeft: '4px solid #ef4444',
                                    },
                                },
                                loading: {
                                    iconTheme: {
                                        primary: '#3b82f6',
                                        secondary: 'white',
                                    },
                                    style: {
                                        borderLeft: '4px solid #3b82f6',
                                    },
                                },
                            }}
                        />
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
