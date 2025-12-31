"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const SignInPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    // Check if user is already authenticated and redirect
    useEffect(() => {
        const checkAuth = async () => {
            if (typeof window === 'undefined') return;

            const token = localStorage.getItem('token');
            if (!token) return;

            // Immediately redirect if token exists (optimistic check)
            // Then verify token is valid in background
            router.replace('/');

            // Verify token is valid in background
            try {
                const response = await fetch('/api/auth/sign-in', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    // Token is invalid, remove it
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                // Error verifying token, remove it
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        };

        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/sign-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Login successful!');
                // Store token in localStorage
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                setError(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setError('Failed to sign in. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="fixed inset-0 h-screen w-full z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Back to Home Link - Upper Left */}
            <Link
                href="/"
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-light-200 hover:text-primary transition-colors duration-200 group"
            >
                <span className="text-lg group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span className="text-sm font-medium">Back to Home</span>
            </Link>

            {/* Background Effects - Behind the container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Main Glassmorphism Container */}
            <div className="w-full max-w-5xl mx-auto bg-dark-100/40 backdrop-blur-2xl border border-blue/20 rounded-2xl shadow-2xl overflow-hidden relative animate-scale-in">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-blue/5 pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row">
                    {/* Left Panel - Branding & Visuals */}
                    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                        {/* Content */}
                        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-10 py-8">
                            <div className="animate-fade-in-up">
                                {/* Logo */}
                                <Link href="/" className="flex items-center gap-3 mb-6 w-fit group">
                                    <div className="w-10 h-10 rounded-lg bg-transparent border border-blue/30 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(148,234,255,0.2)] group-hover:shadow-[0_0_30px_rgba(148,234,255,0.3)] transition-all duration-300">
                                        <Image
                                            src="/icons/logo.png"
                                            alt="TechHub Logo"
                                            width={24}
                                            height={24}
                                            className="w-6 h-6"
                                        />
                                    </div>
                                    <span className="text-xl font-bold text-foreground font-schibsted-grotesk">
                                        TechHub
                                    </span>
                                </Link>

                                {/* Welcome Message */}
                                <h1 className="text-4xl xl:text-5xl font-bold mb-3 leading-tight">
                                    <span className="block text-foreground">Welcome</span>
                                    <span className="block text-gradient">Back</span>
                                </h1>
                                <p className="text-light-200 text-sm mb-6 max-w-sm leading-relaxed">
                                    Sign in to continue your journey with the developer community. Discover events, connect with peers, and grow your skills.
                                </p>

                                {/* Features List */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-3 animate-fade-in-up animate-delay-200">
                                        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                            <span className="text-primary text-base">✓</span>
                                        </div>
                                        <p className="text-light-100 text-xs">Access exclusive developer events</p>
                                    </div>
                                    <div className="flex items-center gap-3 animate-fade-in-up animate-delay-300">
                                        <div className="w-7 h-7 rounded-lg bg-blue/20 border border-blue/30 flex items-center justify-center">
                                            <span className="text-blue text-base">✓</span>
                                        </div>
                                        <p className="text-light-100 text-xs">Connect with like-minded developers</p>
                                    </div>
                                    <div className="flex items-center gap-3 animate-fade-in-up animate-delay-400">
                                        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                            <span className="text-primary text-base">✓</span>
                                        </div>
                                        <p className="text-light-100 text-xs">Track your event bookings</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Sign In Form */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 lg:px-10 py-8 relative animate-fade-in-up">
                        <div className="w-full max-w-sm relative z-10">
                            {/* Mobile Logo */}
                            <div className="lg:hidden mb-6 text-center animate-fade-in-up">
                                <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
                                    <div className="w-10 h-10 rounded-lg bg-transparent border border-blue/30 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(148,234,255,0.15)] group-hover:shadow-[0_0_25px_rgba(148,234,255,0.25)] transition-all duration-300">
                                        <Image
                                            src="/icons/logo.png"
                                            alt="TechHub Logo"
                                            width={24}
                                            height={24}
                                            className="w-6 h-6"
                                        />
                                    </div>
                                    <span className="text-xl font-bold text-foreground font-schibsted-grotesk">
                                        TechHub
                                    </span>
                                </Link>
                                <h1 className="text-3xl font-bold mb-2 text-foreground">
                                    Welcome Back
                                </h1>
                                <p className="text-light-200 text-xs">
                                    Sign in to your TechHub account
                                </p>
                            </div>

                            {/* Desktop Header */}
                            <div className="hidden lg:block mb-4 animate-fade-in-up">
                                <h2 className="text-xl font-bold mb-1 text-foreground">
                                    Sign In
                                </h2>
                                <p className="text-light-200 text-xs">
                                    Enter your credentials to continue
                                </p>
                            </div>

                            {/* Login Form Card */}
                            <div className="bg-dark-200/60 backdrop-blur-xl border border-blue/20 rounded-xl shadow-lg px-5 py-6 relative overflow-hidden animate-fade-in-up">
                                {/* Subtle glow effect inside card */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                <form onSubmit={handleSubmit} className="relative z-10">
                                    <div className="flex flex-col gap-4">
                                        {/* Email Field */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="email"
                                                className="text-light-100 text-xs font-medium block"
                                            >
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="bg-dark-100/80 backdrop-blur-sm rounded-lg px-4 py-2.5 w-full text-sm text-foreground placeholder:text-light-200/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 border border-border-dark/50 transition-all duration-300 hover:border-blue/30"
                                            />
                                        </div>

                                        {/* Password Field */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="password"
                                                className="text-light-100 text-xs font-medium block"
                                            >
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="bg-dark-100/80 backdrop-blur-sm rounded-lg px-4 py-2.5 w-full text-sm text-foreground placeholder:text-light-200/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 border border-border-dark/50 transition-all duration-300 hover:border-blue/30"
                                            />
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2.5 text-red-400 text-xs">
                                                {error}
                                            </div>
                                        )}

                                        {/* Success Message */}
                                        {success && (
                                            <div className="bg-green-500/10 border border-green-500/50 rounded-lg px-4 py-2.5 text-green-400 text-xs">
                                                {success}
                                            </div>
                                        )}

                                        {/* Sign In Button */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-primary hover:bg-primary/90 w-full cursor-pointer items-center justify-center rounded-lg px-4 py-3 text-base font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 mt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                                        </button>
                                    </div>
                                </form>

                                {/* Sign Up Link */}
                                <div className="mt-6 text-center relative z-10 animate-fade-in-up">
                                    <p className="text-light-200 text-xs">
                                        Don't have an account?{" "}
                                        <Link
                                            href="/sign-up"
                                            className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline inline-flex items-center gap-1"
                                        >
                                            Sign up
                                            <span className="text-primary/60">→</span>
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SignInPage;

