"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSignUp } from "@/lib/hooks/api/auth.queries";
import { useAuth } from "@/lib/hooks/use-auth";

const SignUpPage = () => {
    const router = useRouter();
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [success, setSuccess] = useState<string>('');
    const { isAuthenticated } = useAuth();
    const signUpMutation = useSignUp();

    // Check if user is already authenticated and redirect
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, router]);

    // Password validation regex: at least 8 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Validate name
        if (!name.trim()) {
            newErrors.name = 'Name is required';
        } else if (name.trim().length > 100) {
            newErrors.name = 'Name must be 100 characters or less';
        }

        // Validate email
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Validate password
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (!passwordRegex.test(password)) {
            newErrors.password = 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&)';
        }

        // Validate confirm password
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        signUpMutation.mutate(
            { name, email, password, role: 'user' },
            {
                onSuccess: (data) => {
                    setSuccess(data.message || 'Account created successfully!');
                    // Redirect is handled by useEffect when isAuthenticated changes
                },
                onError: (error) => {
                    // Error is handled by the mutation
                },
            }
        );
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue/5 pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row">
                    {/* Left Panel - Branding & Visuals */}
                    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                        {/* Content */}
                        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-10 py-10">
                            <div className="animate-fade-in-up">
                                {/* Logo */}
                                <Link href="/" className="flex items-center gap-3 mb-8 w-fit group">
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
                                <h1 className="text-5xl xl:text-6xl font-bold mb-4 leading-tight">
                                    <span className="block text-foreground">Join the</span>
                                    <span className="block text-gradient">Community</span>
                                </h1>
                                <p className="text-light-200 text-base mb-8 max-w-sm leading-relaxed">
                                    Create your account and start exploring amazing tech events. Connect with developers, learn new skills, and grow your network.
                                </p>

                                {/* Features List */}
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 animate-fade-in-up animate-delay-200">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                            <span className="text-primary text-lg">✓</span>
                                        </div>
                                        <p className="text-light-100 text-sm">Discover exclusive developer events</p>
                                    </div>
                                    <div className="flex items-center gap-3 animate-fade-in-up animate-delay-300">
                                        <div className="w-8 h-8 rounded-lg bg-blue/20 border border-blue/30 flex items-center justify-center">
                                            <span className="text-blue text-lg">✓</span>
                                        </div>
                                        <p className="text-light-100 text-sm">Build your professional network</p>
                                    </div>
                                    <div className="flex items-center gap-3 animate-fade-in-up animate-delay-400">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                            <span className="text-primary text-lg">✓</span>
                                        </div>
                                        <p className="text-light-100 text-sm">Book and manage your events</p>
                                    </div>
                                </div>

                                {/* Additional Description */}
                                <p className="text-light-200 text-sm max-w-sm leading-relaxed">
                                    The ultimate platform for discovering and attending tech events worldwide. Connect, learn, and grow with the global tech community.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Sign Up Form */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 lg:px-10 py-8 relative animate-fade-in-up">
                        <div className="w-full max-w-sm relative z-10">
                            {/* Mobile Logo */}
                            <div className="lg:hidden mb-8 text-center animate-fade-in-up">
                                <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
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
                                <h1 className="text-4xl font-bold mb-2 text-foreground">
                                    Join the Community
                                </h1>
                                <p className="text-light-200 text-sm">
                                    Create your TechHub account
                                </p>
                            </div>

                            {/* Desktop Header */}
                            <div className="hidden lg:block mb-4 animate-fade-in-up">
                                <h2 className="text-xl font-bold mb-1 text-foreground">
                                    Sign Up
                                </h2>
                                <p className="text-light-200 text-xs">
                                    Create an account to get started
                                </p>
                            </div>

                            {/* Sign Up Form Card */}
                            <div className="bg-dark-200/60 backdrop-blur-xl border border-blue/20 rounded-xl shadow-lg px-5 py-6 relative overflow-hidden animate-fade-in-up">
                                {/* Subtle glow effect inside card */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                <form onSubmit={handleSubmit} className="relative z-10">
                                    <div className="flex flex-col gap-4">
                                        {/* Name Field */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="name"
                                                className="text-light-100 text-xs font-medium block"
                                            >
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                placeholder="Enter your full name"
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (errors.name) setErrors({ ...errors, name: '' });
                                                }}
                                                required
                                                maxLength={100}
                                                className={`bg-dark-100/80 backdrop-blur-sm rounded-lg px-4 py-2.5 w-full text-sm text-foreground placeholder:text-light-200/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 border transition-all duration-300 hover:border-blue/30 ${errors.name ? 'border-red-500/50' : 'border-border-dark/50'
                                                    }`}
                                            />
                                            {errors.name && (
                                                <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>
                                            )}
                                        </div>

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
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (errors.email) setErrors({ ...errors, email: '' });
                                                }}
                                                required
                                                className={`bg-dark-100/80 backdrop-blur-sm rounded-lg px-4 py-2.5 w-full text-sm text-foreground placeholder:text-light-200/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 border transition-all duration-300 hover:border-blue/30 ${errors.email ? 'border-red-500/50' : 'border-border-dark/50'
                                                    }`}
                                            />
                                            {errors.email && (
                                                <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>
                                            )}
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
                                                placeholder="Create a password"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (errors.password) setErrors({ ...errors, password: '' });
                                                    if (errors.confirmPassword && e.target.value === confirmPassword) {
                                                        setErrors({ ...errors, confirmPassword: '' });
                                                    }
                                                }}
                                                required
                                                className={`bg-dark-100/80 backdrop-blur-sm rounded-lg px-4 py-2.5 w-full text-sm text-foreground placeholder:text-light-200/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 border transition-all duration-300 hover:border-blue/30 ${errors.password ? 'border-red-500/50' : 'border-border-dark/50'
                                                    }`}
                                            />
                                            {errors.password && (
                                                <p className="text-red-400 text-xs mt-0.5">{errors.password}</p>
                                            )}
                                            <p className="text-light-200/60 text-[10px] mt-0.5 leading-tight">
                                                Must be at least 8 characters with uppercase, lowercase, number, and special character
                                            </p>
                                        </div>

                                        {/* Confirm Password Field */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="confirmPassword"
                                                className="text-light-100 text-xs font-medium block"
                                            >
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                placeholder="Confirm your password"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                                }}
                                                required
                                                className={`bg-dark-100/80 backdrop-blur-sm rounded-lg px-4 py-2.5 w-full text-sm text-foreground placeholder:text-light-200/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 border transition-all duration-300 hover:border-blue/30 ${errors.confirmPassword ? 'border-red-500/50' : 'border-border-dark/50'
                                                    }`}
                                            />
                                            {errors.confirmPassword && (
                                                <p className="text-red-400 text-xs mt-0.5">{errors.confirmPassword}</p>
                                            )}
                                        </div>

                                        {/* API Error Message */}
                                        {signUpMutation.isError && (
                                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2.5 text-red-400 text-xs">
                                                {signUpMutation.error instanceof Error
                                                    ? signUpMutation.error.message
                                                    : 'Something went wrong. Please try again.'}
                                            </div>
                                        )}

                                        {/* Success Message */}
                                        {success && (
                                            <div className="bg-green-500/10 border border-green-500/50 rounded-lg px-4 py-2.5 text-green-400 text-xs">
                                                {success}
                                            </div>
                                        )}

                                        {/* Sign Up Button */}
                                        <button
                                            type="submit"
                                            disabled={signUpMutation.isPending}
                                            className="bg-primary hover:bg-primary/90 w-full cursor-pointer items-center justify-center rounded-lg px-4 py-3 text-base font-semibold text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50 mt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {signUpMutation.isPending ? 'Creating account...' : 'Sign up'}
                                        </button>
                                    </div>
                                </form>

                                {/* Sign In Link */}
                                <div className="mt-6 text-center relative z-10 animate-fade-in-up">
                                    <p className="text-light-200 text-sm">
                                        Already have an account?{" "}
                                        <Link
                                            href="/sign-in"
                                            className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline inline-flex items-center gap-1"
                                        >
                                            Sign in
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

export default SignUpPage;

