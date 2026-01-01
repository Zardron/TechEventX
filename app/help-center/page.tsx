"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";
import Image from "next/image";
import { useState } from "react";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    {
        category: "Getting Started",
        question: "How do I create an account?",
        answer: "Click the 'Sign In' button in the top right corner, then select 'Sign Up'. You'll need to provide your name, email, and create a password. Once registered, you can start browsing and booking events immediately."
    },
    {
        category: "Getting Started",
        question: "Is TechHub free to use?",
        answer: "Yes! Creating an account and browsing events is completely free. Some events may have registration fees set by the organizers, but using the TechHub platform itself is free."
    },
    {
        category: "Getting Started",
        question: "How do I find events?",
        answer: "You can browse all events on the Events page. Use filters to search by location, date, event type (online/offline/hybrid), and more. You can also use the search functionality to find specific events or topics."
    },
    {
        category: "Bookings",
        question: "How do I book an event?",
        answer: "Navigate to any event page and click the 'Book Event' button. You'll need to be signed in to complete the booking. Once booked, you'll receive a confirmation and the event will appear in your 'My Bookings' section."
    },
    {
        category: "Bookings",
        question: "Can I cancel a booking?",
        answer: "Yes, you can cancel bookings from your 'My Bookings' page. However, cancellation policies may vary by event organizer. Some events may have refund policies, while others may not allow cancellations. Check the event details for specific information."
    },
    {
        category: "Bookings",
        question: "Where can I see my booked events?",
        answer: "All your booked events are available in the 'My Bookings' section, accessible from your user menu in the top right corner when you're signed in."
    },
    {
        category: "Account",
        question: "How do I update my profile information?",
        answer: "Currently, profile updates can be made through your account settings. If you need to change your email or other account details, please contact our support team through the Contact page."
    },
    {
        category: "Account",
        question: "I forgot my password. How do I reset it?",
        answer: "On the Sign In page, click 'Forgot Password' and enter your email address. You'll receive instructions to reset your password via email."
    },
    {
        category: "Account",
        question: "How do I delete my account?",
        answer: "To delete your account, please contact our support team through the Contact page. We'll process your request within 48 hours and ensure all your data is removed in accordance with our Privacy Policy."
    },
    {
        category: "Events",
        question: "What types of events are available?",
        answer: "TechHub features a wide variety of tech events including hackathons, developer conferences, workshops, meetups, webinars, and more. Events can be online, offline, or hybrid formats."
    },
    {
        category: "Events",
        question: "How do I know if an event is online or offline?",
        answer: "Each event card and event detail page clearly displays the event mode (Online, Offline, or Hybrid) along with the location information. Online events will show virtual meeting details, while offline events will display the physical venue address."
    },
    {
        category: "Events",
        question: "Can I suggest an event to be added?",
        answer: "Yes! We welcome event suggestions. Use the Contact page and select 'General Inquiry' to suggest events. Our team reviews all suggestions and adds relevant tech events to the platform."
    },
    {
        category: "Technical",
        question: "The website isn't loading properly. What should I do?",
        answer: "Try clearing your browser cache and cookies, or try using a different browser. If the problem persists, check your internet connection. For persistent issues, contact our support team with details about the problem."
    },
    {
        category: "Technical",
        question: "I'm having trouble booking an event. What's wrong?",
        answer: "Make sure you're signed in to your account. Check that the event hasn't reached capacity and that registration is still open. If issues persist, try refreshing the page or contact support with the event name and error details."
    },
    {
        category: "Newsletter",
        question: "How do I subscribe to the newsletter?",
        answer: "Scroll to the bottom of any page and enter your email in the newsletter subscription form. You'll receive updates about new events, featured events, and special announcements."
    },
    {
        category: "Newsletter",
        question: "How do I unsubscribe from emails?",
        answer: "You can unsubscribe by clicking the 'Unsubscribe' link at the bottom of any newsletter email, or by managing your preferences in your account settings."
    }
];

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const categories = ["All", ...Array.from(new Set(faqData.map(item => item.category)))];

    const filteredFAQs = faqData.filter(item => {
        const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-8">
            {/* Hero Section */}
            <AnimateOnScroll variant="fade">
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <div className="inline-block mb-6">
                            <div className="glass px-6 py-2 rounded-full border border-blue/30 backdrop-blur-xl">
                                <span className="text-blue text-sm font-medium">Need Help?</span>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                            <span className="block mb-2">Help Center</span>
                            <span className="block text-blue relative">
                                Find Answers & Support
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-linear-to-r from-transparent via-blue to-transparent opacity-60" />
                            </span>
                        </h1>
                        <p className="text-light-100 text-lg max-w-3xl mx-auto">
                            Get instant answers to common questions or contact our support team for personalized assistance.
                        </p>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Search Bar */}
            <AnimateOnScroll variant="fade" delay={100}>
                <div className="mb-12">
                    <div className="glass p-6 rounded-2xl border border-blue/20 max-w-3xl mx-auto">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for help..."
                                    className="w-full bg-dark-200/80 backdrop-blur-sm rounded-lg px-4 py-3 pl-10 text-foreground placeholder:text-light-200 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 focus:ring-offset-background border border-border-dark/50 hover:border-blue/30 transition-all"
                                />
                                <Image
                                    src="/icons/mode.svg"
                                    alt="Search"
                                    width={20}
                                    height={20}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        selectedCategory === category
                                            ? "bg-blue/20 text-blue border border-blue/30"
                                            : "bg-dark-200/50 text-light-200 border border-border-dark/50 hover:border-blue/30"
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Quick Links */}
            <AnimateOnScroll variant="fade" delay={200}>
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <a
                            href="/events"
                            className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105 group"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center group-hover:bg-blue/20 transition-colors">
                                    <Image src="/icons/calendar.svg" alt="Events" width={24} height={24} />
                                </div>
                                <h3 className="text-lg font-semibold">Browse Events</h3>
                            </div>
                            <p className="text-light-200 text-sm">Discover all available tech events</p>
                        </a>
                        <a
                            href="/bookings"
                            className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105 group"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Image src="/icons/clock.svg" alt="Bookings" width={24} height={24} />
                                </div>
                                <h3 className="text-lg font-semibold">My Bookings</h3>
                            </div>
                            <p className="text-light-200 text-sm">View and manage your event bookings</p>
                        </a>
                        <a
                            href="/contact"
                            className="glass p-6 rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300 hover:scale-105 group"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-blue/10 flex items-center justify-center group-hover:bg-blue/20 transition-colors">
                                    <Image src="/icons/audience.svg" alt="Contact" width={24} height={24} />
                                </div>
                                <h3 className="text-lg font-semibold">Contact Support</h3>
                            </div>
                            <p className="text-light-200 text-sm">Get personalized help from our team</p>
                        </a>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* FAQ Section */}
            <AnimateOnScroll variant="fade" delay={300}>
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">
                        Frequently Asked Questions
                        {filteredFAQs.length > 0 && (
                            <span className="text-light-200 text-lg font-normal ml-2">
                                ({filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'})
                            </span>
                        )}
                    </h2>
                    {filteredFAQs.length === 0 ? (
                        <div className="glass p-12 rounded-xl border border-blue/10 text-center">
                            <p className="text-light-200 mb-4">No results found for your search.</p>
                            <p className="text-light-200 text-sm">Try different keywords or <a href="/contact" className="text-blue hover:underline">contact support</a> for help.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredFAQs.map((faq, index) => (
                                <AnimateOnScroll key={index} delay={index * 50} variant="slide">
                                    <div className="glass rounded-xl border border-blue/10 hover:border-blue/30 transition-all duration-300 overflow-hidden">
                                        <button
                                            onClick={() => toggleFAQ(index)}
                                            className="w-full p-6 text-left flex items-center justify-between hover:bg-dark-200/30 transition-colors"
                                        >
                                            <div className="flex-1 pr-4">
                                                <div className="text-xs text-blue mb-2 font-medium">{faq.category}</div>
                                                <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full bg-blue/10 flex items-center justify-center transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                                                <span className="text-blue font-bold">▼</span>
                                            </div>
                                        </button>
                                        {openIndex === index && (
                                            <div className="px-6 pb-6 pt-0">
                                                <div className="pt-4 border-t border-blue/10">
                                                    <p className="text-light-200 text-sm leading-relaxed">{faq.answer}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AnimateOnScroll>
                            ))}
                        </div>
                    )}
                </div>
            </AnimateOnScroll>

            {/* Still Need Help Section */}
            <AnimateOnScroll variant="glow" delay={400}>
                <div className="glass p-10 rounded-2xl border border-blue/20 text-center">
                    <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
                    <p className="text-light-100 mb-8 max-w-2xl mx-auto">
                        Can't find what you're looking for? Our support team is here to help you with any questions or issues.
                    </p>
                    <a
                        href="/contact"
                        className="inline-block bg-primary hover:bg-primary/90 rounded-full px-8 py-3.5 text-lg font-semibold text-primary-foreground transition-all hover:scale-110 hover:shadow-lg hover:shadow-primary/50"
                    >
                        Contact Support
                    </a>
                </div>
            </AnimateOnScroll>
        </section>
    );
}

