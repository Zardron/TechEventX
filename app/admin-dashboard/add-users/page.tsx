"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateUser } from "@/lib/hooks/api/user.queries";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useGetAllOrganizers } from "@/lib/hooks/api/organizers.queries";

export default function AddUsersPage() {
    const searchParams = useSearchParams();
    const { data: organizersData, isLoading: isLoadingOrganizers } = useGetAllOrganizers();
    const organizers = organizersData?.data || [];
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user" as "admin" | "user" | "organizer",
        organizerName: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Generate email from organizer name: @[organizername].com (no spaces, lowercase)
    const generateEmailFromOrganizerName = (organizerName: string): string => {
        if (!organizerName.trim()) return "";
        // Remove "Admin" suffix if present, convert to lowercase, remove spaces and special chars
        const cleanName = organizerName
            .replace(/\s+Admin$/i, '') // Remove " Admin" at the end
            .toLowerCase()
            .replace(/\s+/g, '') // Remove all spaces
            .replace(/[^a-z0-9]/g, ''); // Remove special characters, keep only alphanumeric
        return `@${cleanName}.com`;
    };

    // Read query parameters and pre-fill form
    useEffect(() => {
        const role = searchParams.get("role");
        const organizerId = searchParams.get("organizerId");
        const organizerName = searchParams.get("organizerName");

        if (role === "organizer") {
            // If organizerId is provided, find the organizer by ID
            let selectedOrganizerName = organizerName || "";
            
            if (organizerId && organizers.length > 0) {
                const foundOrganizer = organizers.find(org => org.id === organizerId);
                if (foundOrganizer) {
                    selectedOrganizerName = foundOrganizer.name;
                }
            }

            const autoEmail = selectedOrganizerName ? generateEmailFromOrganizerName(selectedOrganizerName) : "";
            setFormData((prev) => ({
                ...prev,
                role: "organizer",
                organizerName: selectedOrganizerName,
                email: autoEmail,
            }));
        }
    }, [searchParams, organizers]);

    const createUserMutation = useCreateUser();

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Password validation: at least 8 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.trim().length > 100) {
            newErrors.name = "Name must be 100 characters or less";
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

        // Validate role
        if (!formData.role) {
            newErrors.role = "Role is required";
        }

        // Validate organizer name if role is organizer
        if (formData.role === "organizer") {
            if (!formData.organizerName.trim()) {
                newErrors.organizerName = "Please select an organizer";
            }
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

        const createPromise = createUserMutation.mutateAsync({
            name: formData.role === "organizer" && formData.organizerName 
                ? formData.organizerName.trim() 
                : formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            organizerName: formData.role === "organizer" && formData.organizerName 
                ? formData.organizerName.trim() 
                : undefined,
        }).then((data) => {
            // Reset form
            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "user",
                organizerName: "",
            });
            return data;
        });

        toast.promise(createPromise, {
            loading: 'Creating user...',
            success: (data) => data.message || `User "${formData.role === "organizer" && formData.organizerName ? formData.organizerName : formData.name.trim()}" has been created with ${formData.role} role.`,
            error: (error) => error instanceof Error ? error.message : "An error occurred while creating the user. Please try again.",
        });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
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
                <h1 className="text-2xl sm:text-3xl font-bold">Add Users</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new user to the platform
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <div className="border rounded-lg bg-card shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">User Information</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Fill in the details to create a new user account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name Field */}
                                <FormInput
                                    id="name"
                                    name="name"
                                    type="text"
                                    label="Full Name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    required
                                    containerClassName="md:col-span-2"
                                />

                                {/* Email Field */}
                                <FormInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    label="Email Address"
                                    placeholder="john.doe@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={errors.email}
                                    required
                                    containerClassName="md:col-span-2"
                                />

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

                                {/* Role Field */}
                                <FormSelect
                                    id="role"
                                    name="role"
                                    label="Role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    options={[
                                        { value: "user", label: "User" },
                                        { value: "admin", label: "Admin" },
                                        { value: "organizer", label: "Organizer" },
                                    ]}
                                    error={errors.role}
                                    helperText={
                                        !errors.role
                                            ? "Select the role for this user account"
                                            : undefined
                                    }
                                    required
                                    containerClassName="md:col-span-2"
                                />

                                {/* Organizer Selection - Only show when role is organizer */}
                                {formData.role === "organizer" && (
                                    <FormSelect
                                        id="organizerName"
                                        name="organizerName"
                                        label="Select Organizer"
                                        value={formData.organizerName}
                                        onChange={handleChange}
                                        options={[
                                            { value: "", label: "Select an organizer..." },
                                            ...organizers.map((org) => ({
                                                value: org.name,
                                                label: org.name,
                                            })),
                                        ]}
                                        error={errors.organizerName}
                                        helperText={
                                            !errors.organizerName
                                                ? "Select the organizer company this account will represent"
                                                : undefined
                                        }
                                        required={formData.role === "organizer"}
                                        containerClassName="md:col-span-2"
                                    />
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setFormData({
                                            name: "",
                                            email: "",
                                            password: "",
                                            confirmPassword: "",
                                            role: "user",
                                            organizerName: "",
                                        });
                                        setErrors({});
                                    }}
                                    disabled={createUserMutation.isPending}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createUserMutation.isPending}
                                    size="lg"
                                >
                                    {createUserMutation.isPending
                                        ? "Creating User..."
                                        : "Create User"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Info Card Section */}
                <div className="lg:col-span-1">
                    <div className="border rounded-lg bg-card shadow-sm sticky top-4">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">User Roles Guide</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Understand the different user roles
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Admin Role */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <h3 className="font-semibold text-sm">Admin</h3>
                                </div>
                                <p className="text-sm text-muted-foreground ml-4">
                                    Full system access. Can manage users, events, organizers, and all platform settings.
                                </p>
                            </div>

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

                            {/* User Role */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <h3 className="font-semibold text-sm">User</h3>
                                </div>
                                <p className="text-sm text-muted-foreground ml-4">
                                    Standard user access. Can browse events, make bookings, and manage their own profile.
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
                                        <span>Users will receive a confirmation email</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Role can be changed later from user management</span>
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