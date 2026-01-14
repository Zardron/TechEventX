"use client";

import { useState } from "react";

const NewsletterForm = () => {
    const [email, setEmail] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    return (
        <div className="glass p-8 md:p-12 rounded-md">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-3">Stay Updated with Latest Events</h2>
                <p className="text-light-200 mb-8">
                    Sign up to receive notifications about new events, exclusive updates, and special offers.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        disabled={isSubmitting}
                        className="flex-1 bg-dark-200 rounded-full px-6 py-3.5 text-foreground placeholder:text-light-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90 rounded-full px-8 py-3.5 text-lg font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                    </button>
                </form>
                {message && (
                    <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-primary' : 'text-red-400'}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
};

export default NewsletterForm;

