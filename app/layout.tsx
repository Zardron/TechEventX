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

const schibstedGrotesk = Schibsted_Grotesk({
    variable: "--font-schibsted-grotesk",
    subsets: ["latin"],
});

const martianMono = Martian_Mono({
    variable: "--font-martian-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "TechHub - Your Tech Event Platform",
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
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
