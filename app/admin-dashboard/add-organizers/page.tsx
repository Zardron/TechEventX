"use client";

import { useState } from "react";
import { useCreateOrganizer } from "@/lib/hooks/api/organizers.queries";
import { FormInput } from "@/components/ui/form-input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AddOrganizersPage() {
    const DEFAULT_PASSWORD = "P@ssword123!";
    const [formData, setFormData] = useState({
        organizerName: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [useAutoEmail, setUseAutoEmail] = useState(false);
    const [useDefaultPassword, setUseDefaultPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const createOrganizerMutation = useCreateOrganizer();

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Password validation: at least 8 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // Generate email from organizer name: admin@[organizername].com (no spaces, lowercase)
    const generateEmailFromOrganizerName = (organizerName: string): string => {
        if (!organizerName.trim()) return "";
        const cleanName = organizerName.trim().toLowerCase().replace(/\s+/g, "");
        return `admin@${cleanName}.com`;
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Validate organizer name
        if (!formData.organizerName.trim()) {
            newErrors.organizerName = "Organizer name is required";
        } else if (formData.organizerName.trim().length > 100) {
            newErrors.organizerName = "Organizer name must be 100 characters or less";
        }

        // Validate full name
        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (formData.fullName.trim().length > 100) {
            newErrors.fullName = "Full name must be 100 characters or less";
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (!passwordRegex.test(formData.password)) {
            newErrors.password =
                "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&)";
        }

        // Validate confirm password
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        const createPromise = createOrganizerMutation.mutateAsync({
            name: formData.organizerName.trim(),
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            password: formData.password,
        }).then((data) => {
            // Reset form
            setFormData({
                organizerName: "",
                fullName: "",
                email: "",
                password: "",
                confirmPassword: "",
            });
            setUseAutoEmail(false);
            setUseDefaultPassword(false);
            return data;
        });

        toast.promise(createPromise, {
            loading: 'Creating organizer...',
            success: (data) => data.message || `Organizer "${formData.organizerName.trim()}" has been created.`,
            error: (error) => error instanceof Error ? error.message : "An error occurred while creating the organizer. Please try again.",
        });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        
        // Auto-populate fields when organizer name changes
        if (name === "organizerName") {
            const autoName = value.trim() ? `${value.trim()} Admin` : "";
            const autoEmail = useAutoEmail ? generateEmailFromOrganizerName(value) : formData.email;
            setFormData((prev) => ({
                ...prev,
                [name]: value,
                fullName: autoName,
                email: autoEmail,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Uncheck default password checkbox if user manually types in password fields
        if ((name === "password" || name === "confirmPassword") && useDefaultPassword) {
            if (value !== DEFAULT_PASSWORD) {
                setUseDefaultPassword(false);
            }
        }

        // Uncheck auto email checkbox if user manually types in email field
        if (name === "email" && useAutoEmail) {
            const expectedEmail = generateEmailFromOrganizerName(formData.organizerName);
            if (value !== expectedEmail) {
                setUseAutoEmail(false);
            }
        }
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Add Organizers</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new event organizer to the platform
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <div className="border rounded-lg bg-card shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">Organizer Information</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Fill in the details to create a new organizer account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Organizer Name Field */}
                                <FormInput
                                    id="organizerName"
                                    name="organizerName"
                                    type="text"
                                    label="Organizer Name"
                                    placeholder="Microsoft, Apple, Amazon, etc."
                                    value={formData.organizerName}
                                    onChange={handleChange}
                                    error={errors.organizerName}
                                    required
                                    containerClassName="md:col-span-2"
                                />

                                {/* Full Name Field (Auto-populated) */}
                                <FormInput
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    label="Full Name"
                                    placeholder="Auto-populated from organizer name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    error={errors.fullName}
                                    required
                                    containerClassName="md:col-span-2"
                                    helperText="Automatically set to 'Organizer Name + Admin'"
                                />

                                {/* Email Field */}
                                <FormInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    label="Email Address"
                                    placeholder="contact@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={errors.email}
                                    required
                                    containerClassName="md:col-span-2"
                                />

                                {/* Auto-populate Email Checkbox */}
                                <div className="md:col-span-2 flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="useAutoEmail"
                                        checked={useAutoEmail}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setUseAutoEmail(checked);
                                            if (checked) {
                                                const autoEmail = generateEmailFromOrganizerName(formData.organizerName);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    email: autoEmail,
                                                }));
                                                // Clear email error when using auto email
                                                setErrors((prev) => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.email;
                                                    return newErrors;
                                                });
                                            } else {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    email: "",
                                                }));
                                            }
                                        }}
                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        htmlFor="useAutoEmail"
                                        className="text-sm font-medium text-foreground cursor-pointer"
                                    >
                                        Auto-populate email from organizer name (admin@[name].com)
                                    </label>
                                </div>

                                {/* Password Field */}
                                <FormInput
                                    id="password"
                                    name="password"
                                    type="password"
                                    label="Password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    error={errors.password}
                                    helperText={
                                        !errors.password
                                            ? "8+ chars, uppercase, lowercase, number, special char"
                                            : undefined
                                    }
                                    required
                                />

                                {/* Confirm Password Field */}
                                <FormInput
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    label="Confirm Password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    error={errors.confirmPassword}
                                    required
                                />

                                {/* Use Default Password Checkbox */}
                                <div className="md:col-span-2 flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="useDefaultPassword"
                                        checked={useDefaultPassword}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setUseDefaultPassword(checked);
                                            if (checked) {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    password: DEFAULT_PASSWORD,
                                                    confirmPassword: DEFAULT_PASSWORD,
                                                }));
                                                // Clear password errors when using default password
                                                setErrors((prev) => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.password;
                                                    delete newErrors.confirmPassword;
                                                    return newErrors;
                                                });
                                            } else {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    password: "",
                                                    confirmPassword: "",
                                                }));
                                            }
                                        }}
                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        htmlFor="useDefaultPassword"
                                        className="text-sm font-medium text-foreground cursor-pointer"
                                    >
                                        Use default password (P@ssword123!)
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setFormData({
                                            organizerName: "",
                                            fullName: "",
                                            email: "",
                                            password: "",
                                            confirmPassword: "",
                                        });
                                        setUseAutoEmail(false);
                                        setUseDefaultPassword(false);
                                        setErrors({});
                                    }}
                                    disabled={createOrganizerMutation.isPending}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createOrganizerMutation.isPending}
                                    size="lg"
                                >
                                    {createOrganizerMutation.isPending
                                        ? "Creating Organizer..."
                                        : "Create Organizer"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Info Card Section */}
                <div className="lg:col-span-1">
                    <div className="border rounded-lg bg-card shadow-sm sticky top-4">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">Organizer Role</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Understanding organizer permissions
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Organizer Role */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <h3 className="font-semibold text-sm">Organizer</h3>
                                </div>
                                <p className="text-sm text-muted-foreground ml-4">
                                    Can create and manage events. Has access to event management tools and booking analytics.
                                </p>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <h3 className="font-semibold text-sm">Quick Tips</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Ensure email addresses are unique and valid</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Passwords must meet all security requirements</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Organizers will receive a confirmation email</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Organizers can create and manage their own events</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-sm mb-2">Password Requirements</h3>
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Minimum 8 characters
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        One uppercase letter
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        One lowercase letter
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        One number
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        One special character (@$!%*?&)
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
