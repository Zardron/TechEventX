"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";
import Image from "next/image";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage(null);

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            setSubmitMessage({ type: 'success', text: 'Thank you for your message! We\'ll get back to you soon.' });
            setFormData({ name: "", email: "", subject: "", message: "" });
            setIsSubmitting(false);
        }, 1500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <section className="py-8">
            {/* Hero Section */}
            <AnimateOnScroll variant="fade">
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <div className="inline-block mb-6">
                            <div className="glass px-6 py-2 rounded-full border border-blue/30 backdrop-blur-xl">
                                <span className="text-blue text-sm font-medium">Get in Touch</span>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                            <span className="block mb-2">Contact Us</span>
                            <span className="block text-blue relative">
                                We'd Love to Hear From You
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-linear-to-r from-transparent via-blue to-transparent opacity-60" />
                            </span>
                        </h1>
                        <p className="text-light-100 text-lg max-w-3xl mx-auto">
                            Have a question, suggestion, or feedback? We're here to help and would love to hear from you.
                        </p>
                    </div>
                </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Information */}
                <AnimateOnScroll variant="fade" delay={100}>
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center">
                                    <Image src="/icons/pin.svg" alt="Location" width={24} height={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">Location</h3>
                                    <p className="text-light-200 text-sm">Global Platform</p>
                                </div>
                            </div>
                            <p className="text-light-200 text-sm leading-relaxed">
                                TechHub serves developers worldwide. We're a digital-first platform connecting the global tech community.
                            </p>
                        </div>

                        <div className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Image src="/icons/clock.svg" alt="Response Time" width={24} height={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">Response Time</h3>
                                    <p className="text-light-200 text-sm">Within 24-48 hours</p>
                                </div>
                            </div>
                            <p className="text-light-200 text-sm leading-relaxed">
                                We typically respond to all inquiries within 24-48 hours during business days.
                            </p>
                        </div>

                        <div className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center">
                                    <Image src="/icons/audience.svg" alt="Support" width={24} height={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">Support</h3>
                                    <p className="text-light-200 text-sm">Available 24/7</p>
                                </div>
                            </div>
                            <p className="text-light-200 text-sm leading-relaxed">
                                For technical issues or urgent matters, visit our <a href="/help-center" className="text-blue hover:underline">Help Center</a> for immediate assistance.
                            </p>
                        </div>
                    </div>
                </AnimateOnScroll>

                {/* Contact Form */}
                <AnimateOnScroll variant="fade" delay={200} className="lg:col-span-2">
                    <div className="glass p-8 rounded-2xl border border-blue/20">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            Send us a Message
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-light-100 mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-dark-200/80 backdrop-blur-sm rounded-lg px-4 py-3 text-foreground placeholder:text-light-200 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 focus:ring-offset-background border border-border-dark/50 hover:border-blue/30 transition-all"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-light-100 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-dark-200/80 backdrop-blur-sm rounded-lg px-4 py-3 text-foreground placeholder:text-light-200 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 focus:ring-offset-background border border-border-dark/50 hover:border-blue/30 transition-all"
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-light-100 mb-2">
                                    Subject *
                                </label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-dark-200/80 backdrop-blur-sm rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 focus:ring-offset-background border border-border-dark/50 hover:border-blue/30 transition-all"
                                >
                                    <option value="">Select a subject</option>
                                    <option value="general">General Inquiry</option>
                                    <option value="support">Technical Support</option>
                                    <option value="partnership">Partnership Opportunity</option>
                                    <option value="feedback">Feedback</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-light-100 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={6}
                                    className="w-full bg-dark-200/80 backdrop-blur-sm rounded-lg px-4 py-3 text-foreground placeholder:text-light-200 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 focus:ring-offset-background border border-border-dark/50 hover:border-blue/30 transition-all resize-none"
                                    placeholder="Tell us how we can help..."
                                />
                            </div>
                            {submitMessage && (
                                <div className={`p-4 rounded-lg ${submitMessage.type === 'success' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                                    <p className="text-sm font-medium">{submitMessage.text}</p>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary/90 rounded-lg px-8 py-4 text-lg font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </AnimateOnScroll>
            </div>

            {/* FAQ Section */}
            <AnimateOnScroll variant="fade" delay={300}>
                <div className="mt-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300">
                            <h3 className="text-lg font-semibold mb-2">How do I report a problem with an event?</h3>
                            <p className="text-light-200 text-sm leading-relaxed">
                                Use the contact form above and select "Technical Support" as the subject. Include the event name and details about the issue.
                            </p>
                        </div>
                        <div className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300">
                            <h3 className="text-lg font-semibold mb-2">Can I list my event on TechHub?</h3>
                            <p className="text-light-200 text-sm leading-relaxed">
                                Yes! We welcome event organizers. Select "Partnership Opportunity" in the contact form and we'll guide you through the process.
                            </p>
                        </div>
                        <div className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300">
                            <h3 className="text-lg font-semibold mb-2">How can I unsubscribe from emails?</h3>
                            <p className="text-light-200 text-sm leading-relaxed">
                                You can manage your email preferences in your account settings or use the unsubscribe link in any newsletter email.
                            </p>
                        </div>
                        <div className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300">
                            <h3 className="text-lg font-semibold mb-2">Do you have a mobile app?</h3>
                            <p className="text-light-200 text-sm leading-relaxed">
                                TechHub is fully responsive and works great on mobile browsers. We're working on native apps for iOS and Android.
                            </p>
                        </div>
                    </div>
                </div>
            </AnimateOnScroll>
        </section>
    );
}

