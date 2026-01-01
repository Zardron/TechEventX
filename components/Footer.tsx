"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import AnimateOnScroll from "./AnimateOnScroll";
import { formatOrganizerCount } from "@/lib/formatters";
import { IEvent } from "@/database/event.model";
import { useEvents } from "@/lib/hooks/api/events.queries";

const Footer = () => {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { data: eventsData } = useEvents();

    // Hide newsletter and entire footer on sign-in page
    const isSignInPage = pathname === '/sign-in';

    // Calculate organizer count from events data
    const organizerCount = eventsData?.events && eventsData.events.length > 0
        ? formatOrganizerCount(new Set(eventsData.events.map((event: IEvent) => event.organizer)).size)
        : "5+";

    const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'Successfully subscribed!' });
                setEmail('');
            } else {
                setMessage({ type: 'error', text: data.message || 'Something went wrong. Please try again.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to subscribe. Please try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render footer on sign-in page
    if (isSignInPage) {
        return null;
    }

    const socialLinks = [
        { name: 'Twitter', href: '#', icon: '𝕏', color: 'hover:text-blue-400' },
        { name: 'GitHub', href: '#', icon: '⚡', color: 'hover:text-purple-400' },
        { name: 'LinkedIn', href: '#', icon: '💼', color: 'hover:text-blue-500' },
        { name: 'Discord', href: '#', icon: '💬', color: 'hover:text-indigo-400' },
    ];

    return (
        <footer className="relative overflow-hidden">
            {/* Background linear effect */}
            <div className="absolute inset-0 bg-linear-to-t from-background via-background to-transparent opacity-50 pointer-events-none" />

            {/* Newsletter Section */}
            {!isSignInPage && (
                <AnimateOnScroll variant="glow">
                    <div className="mb-16 glass p-8 md:p-12 rounded-2xl border border-blue/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 max-w-3xl mx-auto text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Image src="/icons/calendar.svg" alt="Newsletter" width={32} height={32} className="animate-pulse" />
                                <h2 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-foreground via-blue to-foreground bg-clip-text text-transparent">
                                    Never Miss an Event
                                </h2>
                            </div>
                            <p className="text-light-200 mb-8 text-lg">
                                Get the latest developer events, exclusive updates, and special offers delivered straight to your inbox.
                            </p>
                            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    required
                                    disabled={isSubmitting}
                                    className="flex-1 bg-dark-200/80 backdrop-blur-sm rounded-full px-6 py-4 text-foreground placeholder:text-light-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 border border-border-dark/50 hover:border-blue/30 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-primary hover:bg-primary/90 rounded-full px-8 py-4 text-lg font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/50 whitespace-nowrap"
                                >
                                    {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
                                </button>
                            </form>
                            {message && (
                                <p className={`mt-4 text-sm font-medium ${message.type === 'success' ? 'text-primary' : 'text-red-400'}`}>
                                    {message.text}
                                </p>
                            )}
                        </div>
                    </div>
                </AnimateOnScroll>
            )}

            {/* Main Footer Content */}
            <div className="border-t border-border-dark pt-12 pb-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand Section */}
                    <AnimateOnScroll delay={0} variant="fade" className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-3 w-fit group">
                            <div className="relative">
                                <Image
                                    src="/icons/logo.png"
                                    alt="TechHub Logo"
                                    width={40}
                                    height={40}
                                    className="group-hover:scale-110 transition-transform duration-300"
                                    unoptimized
                                    priority
                                />
                                <div className="absolute inset-0 bg-blue/20 rounded-full blur-xl group-hover:bg-blue/30 transition-colors" />
                            </div>
                            <p className="text-2xl font-bold bg-linear-to-r from-foreground to-blue bg-clip-text text-transparent">
                                TechHub
                            </p>
                        </Link>
                        <p className="text-light-200 text-base leading-relaxed max-w-md">
                            The ultimate platform for discovering and attending tech events worldwide. Connect, learn, and grow with the global tech community.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-4 pt-2">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    aria-label={social.name}
                                    className={`group relative w-12 h-12 rounded-full bg-dark-200/50 backdrop-blur-sm border border-border-dark/50 flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 hover:border-blue/50 ${social.color} hover:bg-dark-200`}
                                >
                                    <span className="group-hover:scale-125 transition-transform duration-300">
                                        {social.icon}
                                    </span>
                                    <div className="absolute inset-0 rounded-full bg-blue/0 group-hover:bg-blue/10 transition-colors blur-sm" />
                                </a>
                            ))}
                        </div>
                    </AnimateOnScroll>

                    {/* Quick Links */}
                    <AnimateOnScroll delay={100} variant="fade">
                        <div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                                Quick Links
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { href: '/', label: 'Home' },
                                    { href: '/events', label: 'All Events' },
                                    { href: '/sign-in', label: 'Sign In' },
                                ].map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="group flex items-center gap-2 text-light-200 hover:text-blue transition-all duration-300 text-base"
                                        >
                                            <span className="w-0 group-hover:w-2 h-0.5 bg-blue transition-all duration-300" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AnimateOnScroll>

                    {/* Resources */}
                    <AnimateOnScroll delay={200} variant="fade">
                        <div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                                Resources
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { href: '/about-us', label: 'About Us' },
                                    { href: '/contact', label: 'Contact' },
                                    { href: '/help-center', label: 'Help Center' },
                                    { href: '/privacy-policy', label: 'Privacy Policy' },
                                ].map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="group flex items-center gap-2 text-light-200 hover:text-blue transition-all duration-300 text-base"
                                        >
                                            <span className="w-0 group-hover:w-2 h-0.5 bg-blue transition-all duration-300" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AnimateOnScroll>

                    {/* Stats/Highlights */}
                    <AnimateOnScroll delay={300} variant="fade">
                        <div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                                Community
                            </h3>
                            <div className="space-y-4">
                                <div className="glass p-4 rounded-lg border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105">
                                    <p className="text-2xl font-bold text-blue mb-1">50K+</p>
                                    <p className="text-light-200 text-sm">Active Participants</p>
                                </div>
                                <div className="glass p-4 rounded-lg border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105">
                                    <p className="text-2xl font-bold text-blue mb-1">{organizerCount}</p>
                                    <p className="text-light-200 text-sm">Event Organizers</p>
                                </div>
                            </div>
                        </div>
                    </AnimateOnScroll>
                </div>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border-dark" />
                    </div>
                    <div className="relative flex justify-center">
                        <div className="bg-background px-4">
                            <div className="w-16 h-1 bg-linear-to-r from-transparent via-blue to-transparent rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-light-200 text-sm">
                        © {currentYear} <span className="text-blue font-semibold">TechHub</span> created by <span className="text-primary">Zardron</span>. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-light-200">
                        <Link href="/terms-of-service" className="hover:text-blue transition-colors">Terms of Service</Link>
                        <span className="text-border-dark">•</span>
                        <Link href="/privacy-policy" className="hover:text-blue transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

