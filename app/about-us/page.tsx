"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";
import Image from "next/image";

export default function AboutUsPage() {
    return (
        <section className="py-8">
            {/* Hero Section */}
            <AnimateOnScroll variant="fade">
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <div className="inline-block mb-6">
                            <div className="glass px-6 py-2 rounded-full border border-blue/30 backdrop-blur-xl">
                                <span className="text-blue text-sm font-medium">About TechHub</span>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                            <span className="block mb-2">About Us</span>
                            <span className="block text-blue relative">
                                Building the Future of Tech Events
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-linear-to-r from-transparent via-blue to-transparent opacity-60" />
                            </span>
                        </h1>
                        <p className="text-light-100 text-lg max-w-3xl mx-auto">
                            Connecting developers, innovators, and tech enthusiasts with the world's best technology events.
                        </p>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Mission Section */}
            <AnimateOnScroll variant="fade" delay={100}>
                <div className="mb-16">
                    <div className="glass p-10 rounded-2xl border border-blue/20 hover:border-blue/40 transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                                    <span className="w-1 h-8 bg-linear-to-b from-blue to-primary rounded-full" />
                                    Our Mission
                                </h2>
                                <p className="text-light-100 text-base leading-relaxed mb-4">
                                    At TechHub, we believe that great ideas are born when passionate developers come together. Our mission is to create a seamless platform that connects tech enthusiasts with events that inspire, educate, and transform careers.
                                </p>
                                <p className="text-light-200 text-sm leading-relaxed">
                                    We're committed to making tech events accessible to everyone, regardless of location, experience level, or background. Whether you're a seasoned developer or just starting your journey, TechHub is your gateway to the global tech community.
                                </p>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="w-full max-w-md p-8 rounded-xl bg-dark-200/50 border border-blue/10">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-blue/10 flex items-center justify-center mx-auto mb-3">
                                                <Image src="/icons/calendar.svg" alt="Events" width={32} height={32} />
                                            </div>
                                            <p className="text-2xl font-bold text-blue mb-1">50K+</p>
                                            <p className="text-light-200 text-xs">Active Users</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                                <Image src="/icons/audience.svg" alt="Community" width={32} height={32} />
                                            </div>
                                            <p className="text-2xl font-bold text-primary mb-1">100+</p>
                                            <p className="text-light-200 text-xs">Events Monthly</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Values Section */}
            <AnimateOnScroll variant="fade" delay={200}>
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AnimateOnScroll delay={0} variant="slide" className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center">
                                    <Image src="/icons/mode.svg" alt="Innovation" width={24} height={24} />
                                </div>
                                <h3 className="text-xl font-semibold">Innovation</h3>
                            </div>
                            <p className="text-light-200 text-sm leading-relaxed">
                                We continuously evolve our platform to provide the best experience for discovering and attending tech events.
                            </p>
                        </AnimateOnScroll>

                        <AnimateOnScroll delay={100} variant="slide" className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Image src="/icons/audience.svg" alt="Community" width={24} height={24} />
                                </div>
                                <h3 className="text-xl font-semibold">Community</h3>
                            </div>
                            <p className="text-light-200 text-sm leading-relaxed">
                                We foster a welcoming environment where developers can connect, learn, and grow together.
                            </p>
                        </AnimateOnScroll>

                        <AnimateOnScroll delay={200} variant="slide" className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center">
                                    <Image src="/icons/clock.svg" alt="Accessibility" width={24} height={24} />
                                </div>
                                <h3 className="text-xl font-semibold">Accessibility</h3>
                            </div>
                            <p className="text-light-200 text-sm leading-relaxed">
                                We believe tech events should be accessible to everyone, regardless of location or experience level.
                            </p>
                        </AnimateOnScroll>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* What We Do Section */}
            <AnimateOnScroll variant="glow" delay={300}>
                <div className="mb-16">
                    <div className="glass p-10 rounded-2xl border border-blue/20">
                        <h2 className="text-3xl font-bold mb-8 text-center">What We Do</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-primary font-bold">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Event Discovery</h3>
                                        <p className="text-light-200 text-sm leading-relaxed">
                                            Browse through hundreds of tech events from hackathons and conferences to workshops and meetups. Filter by location, date, format, and more.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-blue font-bold">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Easy Registration</h3>
                                        <p className="text-light-200 text-sm leading-relaxed">
                                            Register for events with just a few clicks. Manage all your bookings in one place and never miss an important event.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-primary font-bold">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Community Building</h3>
                                        <p className="text-light-200 text-sm leading-relaxed">
                                            Connect with like-minded developers, share experiences, and build lasting professional relationships.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center shrink-0 mt-1">
                                        <span className="text-blue font-bold">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
                                        <p className="text-light-200 text-sm leading-relaxed">
                                            Get notified about new events, schedule changes, and exclusive opportunities through our newsletter.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* CTA Section */}
            <AnimateOnScroll variant="fade" delay={400}>
                <div className="glass p-12 rounded-2xl border border-blue/20 text-center hover:scale-[1.02] transition-transform duration-300">
                    <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
                    <p className="text-light-100 mb-8 max-w-2xl mx-auto">
                        Be part of a growing community of developers, innovators, and tech enthusiasts. Start discovering events that will shape your career today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/events"
                            className="inline-block bg-primary hover:bg-primary/90 rounded-full px-8 py-3.5 text-lg font-semibold text-primary-foreground transition-all hover:scale-110 hover:shadow-lg hover:shadow-primary/50"
                        >
                            Explore Events
                        </a>
                        <a
                            href="/contact"
                            className="inline-block border-dark-200 bg-dark-100 rounded-full border px-8 py-3.5 text-lg font-semibold hover:bg-dark-200 transition-all hover:scale-110"
                        >
                            Get in Touch
                        </a>
                    </div>
                </div>
            </AnimateOnScroll>
        </section>
    );
}

