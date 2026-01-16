"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth.store";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { 
    Settings as SettingsIcon, 
    Shield, 
    Mail, 
    Bell, 
    Server,
    Save,
    RefreshCw,
    DollarSign
} from "lucide-react";

export default function SettingsPage() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        // General Settings
        platformName: "TechEventX",
        platformDescription: "Your premier destination for tech events and networking",
        contactEmail: "contact@techeventx.com",
        supportEmail: "support@techeventx.com",
        // Financial Settings
        platformFeePercentage: "5",
        minimumPayoutAmount: "10.00",
        currency: "php",
        
        // Security Settings
        minPasswordLength: "8",
        requireUppercase: "true",
        requireLowercase: "true",
        requireNumbers: "true",
        requireSpecialChars: "true",
        sessionTimeout: "24",
        
        // Email Settings
        smtpHost: "smtp.gmail.com",
        smtpPort: "587",
        smtpUser: "",
        smtpPassword: "",
        smtpFromEmail: "noreply@techeventx.com",
        smtpFromName: "TechEventX",
        
        // Notification Settings
        emailNotifications: "true",
        bookingConfirmations: "true",
        eventReminders: "true",
        adminAlerts: "true",
        
        // System Settings
        maintenanceMode: "false",
        apiRateLimit: "100",
        maxFileUploadSize: "10",
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "security" | "email" | "notifications" | "system" | "financial">("general");

    // Fetch platform settings
    const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
        queryKey: ["admin", "platform-settings"],
        queryFn: async () => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/admin/platform-settings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch settings");
            return response.json();
        },
        enabled: !!token,
    });

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (settings: any) => {
            if (!token) throw new Error("Not authenticated");
            const response = await fetch("/api/admin/platform-settings", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update settings");
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success("Platform settings updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin", "platform-settings"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update settings");
        },
    });

    // Load settings into form
    useEffect(() => {
        if (settingsData?.data?.settings) {
            const settings = settingsData.data.settings;
            setFormData(prev => ({
                ...prev,
                platformName: settings.platformName || prev.platformName,
                platformDescription: settings.platformDescription || prev.platformDescription,
                contactEmail: settings.contactEmail || prev.contactEmail,
                supportEmail: settings.supportEmail || prev.supportEmail,
                platformFeePercentage: settings.platformFeePercentage?.toString() || prev.platformFeePercentage,
                minimumPayoutAmount: settings.minimumPayoutAmount ? (settings.minimumPayoutAmount / 100).toFixed(2) : prev.minimumPayoutAmount,
                currency: settings.currency || prev.currency,
                maintenanceMode: settings.maintenanceMode?.toString() || prev.maintenanceMode,
            }));
        }
    }, [settingsData]);

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

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
            newErrors.contactEmail = "Please enter a valid email address";
        }
        
        if (formData.supportEmail && !emailRegex.test(formData.supportEmail)) {
            newErrors.supportEmail = "Please enter a valid email address";
        }
        
        if (formData.smtpFromEmail && !emailRegex.test(formData.smtpFromEmail)) {
            newErrors.smtpFromEmail = "Please enter a valid email address";
        }

        // Numeric validations
        const minPasswordLength = parseInt(formData.minPasswordLength);
        if (isNaN(minPasswordLength) || minPasswordLength < 6 || minPasswordLength > 32) {
            newErrors.minPasswordLength = "Password length must be between 6 and 32";
        }

        const sessionTimeout = parseInt(formData.sessionTimeout);
        if (isNaN(sessionTimeout) || sessionTimeout < 1 || sessionTimeout > 168) {
            newErrors.sessionTimeout = "Session timeout must be between 1 and 168 hours";
        }

        const smtpPort = parseInt(formData.smtpPort);
        if (isNaN(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
            newErrors.smtpPort = "SMTP port must be between 1 and 65535";
        }

        const apiRateLimit = parseInt(formData.apiRateLimit);
        if (isNaN(apiRateLimit) || apiRateLimit < 1 || apiRateLimit > 10000) {
            newErrors.apiRateLimit = "API rate limit must be between 1 and 10000";
        }

        const maxFileUploadSize = parseInt(formData.maxFileUploadSize);
        if (isNaN(maxFileUploadSize) || maxFileUploadSize < 1 || maxFileUploadSize > 100) {
            newErrors.maxFileUploadSize = "Max file upload size must be between 1 and 100 MB";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            toast.error("Please fix the errors in the form before saving.", {
                duration: 5000,
            });
            return;
        }

        setIsSaving(true);

        try {
            const settingsToUpdate: any = {
                platformName: formData.platformName,
                platformDescription: formData.platformDescription,
                contactEmail: formData.contactEmail,
                supportEmail: formData.supportEmail,
                platformFeePercentage: parseFloat(formData.platformFeePercentage),
                minimumPayoutAmount: Math.round(parseFloat(formData.minimumPayoutAmount) * 100),
                currency: formData.currency,
                maintenanceMode: formData.maintenanceMode === "true",
            };

            await updateSettingsMutation.mutateAsync(settingsToUpdate);
        } catch (error) {
            // Error handled by mutation
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setFormData({
            platformName: "TechEventX",
            platformDescription: "Your premier destination for tech events and networking",
            contactEmail: "contact@techeventx.com",
            supportEmail: "support@techeventx.com",
            minPasswordLength: "8",
            requireUppercase: "true",
            requireLowercase: "true",
            requireNumbers: "true",
            requireSpecialChars: "true",
            sessionTimeout: "24",
            smtpHost: "smtp.gmail.com",
            smtpPort: "587",
            smtpUser: "",
            smtpPassword: "",
            smtpFromEmail: "noreply@techeventx.com",
            smtpFromName: "TechEventX",
            emailNotifications: "true",
            bookingConfirmations: "true",
            eventReminders: "true",
            adminAlerts: "true",
            maintenanceMode: "false",
            apiRateLimit: "100",
            maxFileUploadSize: "10",
        });
        setErrors({});
        toast.info("Settings Reset", {
            description: "All settings have been reset to default values.",
            duration: 3000,
        });
    };

    const tabs = [
        { id: "general" as const, label: "General", icon: SettingsIcon },
        { id: "financial" as const, label: "Financial", icon: DollarSign },
        { id: "security" as const, label: "Security", icon: Shield },
        { id: "email" as const, label: "Email", icon: Mail },
        { id: "notifications" as const, label: "Notifications", icon: Bell },
        { id: "system" as const, label: "System", icon: Server },
    ];

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                    Manage platform settings and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <div className="border rounded-md bg-card shadow-sm">
                        {/* Tabs */}
                        <div className="border-b">
                            <div className="flex overflow-x-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                                                ${
                                                    activeTab === tab.id
                                                        ? "border-primary text-primary"
                                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                                                }
                                            `}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {/* General Settings Tab */}
                            {activeTab === "general" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormInput
                                                id="platformName"
                                                name="platformName"
                                                type="text"
                                                label="Platform Name"
                                                placeholder="TechHub"
                                                value={formData.platformName}
                                                onChange={handleChange}
                                                error={errors.platformName}
                                                required
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormInput
                                                id="platformDescription"
                                                name="platformDescription"
                                                type="text"
                                                label="Platform Description"
                                                placeholder="Your premier destination for tech events"
                                                value={formData.platformDescription}
                                                onChange={handleChange}
                                                error={errors.platformDescription}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormInput
                                                id="contactEmail"
                                                name="contactEmail"
                                                type="email"
                                                label="Contact Email"
                                                placeholder="contact@techeventx.com"
                                                value={formData.contactEmail}
                                                onChange={handleChange}
                                                error={errors.contactEmail}
                                                required
                                            />

                                            <FormInput
                                                id="supportEmail"
                                                name="supportEmail"
                                                type="email"
                                                label="Support Email"
                                                placeholder="support@techeventx.com"
                                                value={formData.supportEmail}
                                                onChange={handleChange}
                                                error={errors.supportEmail}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Financial Settings Tab */}
                            {activeTab === "financial" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Financial Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormInput
                                                id="platformFeePercentage"
                                                name="platformFeePercentage"
                                                type="number"
                                                step="0.1"
                                                label="Platform Fee Percentage"
                                                placeholder="5"
                                                value={formData.platformFeePercentage}
                                                onChange={handleChange}
                                                error={errors.platformFeePercentage}
                                                required
                                                min="0"
                                                max="100"
                                                helperText="Percentage of each transaction taken as platform fee (0-100)"
                                            />

                                            <FormInput
                                                id="minimumPayoutAmount"
                                                name="minimumPayoutAmount"
                                                type="number"
                                                step="0.01"
                                                label="Minimum Payment Amount"
                                                placeholder="10.00"
                                                value={formData.minimumPayoutAmount}
                                                onChange={handleChange}
                                                error={errors.minimumPayoutAmount}
                                                required
                                                min="0"
                                                helperText="Minimum amount organizers can request for payment"
                                            />

                                            <FormSelect
                                                id="currency"
                                                name="currency"
                                                label="Default Currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "php", label: "PHP (₱)" },
                                                    { value: "usd", label: "USD ($)" },
                                                ]}
                                                required
                                                containerClassName="md:col-span-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Settings Tab */}
                            {activeTab === "security" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormInput
                                                id="minPasswordLength"
                                                name="minPasswordLength"
                                                type="number"
                                                label="Minimum Password Length"
                                                placeholder="8"
                                                value={formData.minPasswordLength}
                                                onChange={handleChange}
                                                error={errors.minPasswordLength}
                                                required
                                                min="6"
                                                max="32"
                                            />

                                            <FormInput
                                                id="sessionTimeout"
                                                name="sessionTimeout"
                                                type="number"
                                                label="Session Timeout (hours)"
                                                placeholder="24"
                                                value={formData.sessionTimeout}
                                                onChange={handleChange}
                                                error={errors.sessionTimeout}
                                                required
                                                min="1"
                                                max="168"
                                            />

                                            <FormSelect
                                                id="requireUppercase"
                                                name="requireUppercase"
                                                label="Require Uppercase Letters"
                                                value={formData.requireUppercase}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Yes" },
                                                    { value: "false", label: "No" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormSelect
                                                id="requireLowercase"
                                                name="requireLowercase"
                                                label="Require Lowercase Letters"
                                                value={formData.requireLowercase}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Yes" },
                                                    { value: "false", label: "No" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormSelect
                                                id="requireNumbers"
                                                name="requireNumbers"
                                                label="Require Numbers"
                                                value={formData.requireNumbers}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Yes" },
                                                    { value: "false", label: "No" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormSelect
                                                id="requireSpecialChars"
                                                name="requireSpecialChars"
                                                label="Require Special Characters"
                                                value={formData.requireSpecialChars}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Yes" },
                                                    { value: "false", label: "No" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Settings Tab */}
                            {activeTab === "email" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormInput
                                                id="smtpHost"
                                                name="smtpHost"
                                                type="text"
                                                label="SMTP Host"
                                                placeholder="smtp.gmail.com"
                                                value={formData.smtpHost}
                                                onChange={handleChange}
                                                error={errors.smtpHost}
                                                required
                                            />

                                            <FormInput
                                                id="smtpPort"
                                                name="smtpPort"
                                                type="number"
                                                label="SMTP Port"
                                                placeholder="587"
                                                value={formData.smtpPort}
                                                onChange={handleChange}
                                                error={errors.smtpPort}
                                                required
                                                min="1"
                                                max="65535"
                                            />

                                            <FormInput
                                                id="smtpUser"
                                                name="smtpUser"
                                                type="text"
                                                label="SMTP Username"
                                                placeholder="your-email@gmail.com"
                                                value={formData.smtpUser}
                                                onChange={handleChange}
                                                error={errors.smtpUser}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormInput
                                                id="smtpPassword"
                                                name="smtpPassword"
                                                type="password"
                                                label="SMTP Password"
                                                placeholder="••••••••"
                                                value={formData.smtpPassword}
                                                onChange={handleChange}
                                                error={errors.smtpPassword}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormInput
                                                id="smtpFromEmail"
                                                name="smtpFromEmail"
                                                type="email"
                                                label="From Email Address"
                                                placeholder="noreply@techeventx.com"
                                                value={formData.smtpFromEmail}
                                                onChange={handleChange}
                                                error={errors.smtpFromEmail}
                                                required
                                            />

                                            <FormInput
                                                id="smtpFromName"
                                                name="smtpFromName"
                                                type="text"
                                                label="From Name"
                                                placeholder="TechHub"
                                                value={formData.smtpFromName}
                                                onChange={handleChange}
                                                error={errors.smtpFromName}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notification Settings Tab */}
                            {activeTab === "notifications" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormSelect
                                                id="emailNotifications"
                                                name="emailNotifications"
                                                label="Enable Email Notifications"
                                                value={formData.emailNotifications}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Enabled" },
                                                    { value: "false", label: "Disabled" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormSelect
                                                id="bookingConfirmations"
                                                name="bookingConfirmations"
                                                label="Send Booking Confirmations"
                                                value={formData.bookingConfirmations}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Yes" },
                                                    { value: "false", label: "No" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormSelect
                                                id="eventReminders"
                                                name="eventReminders"
                                                label="Send Event Reminders"
                                                value={formData.eventReminders}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Yes" },
                                                    { value: "false", label: "No" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormSelect
                                                id="adminAlerts"
                                                name="adminAlerts"
                                                label="Send Admin Alerts"
                                                value={formData.adminAlerts}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "true", label: "Yes" },
                                                    { value: "false", label: "No" },
                                                ]}
                                                containerClassName="md:col-span-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* System Settings Tab */}
                            {activeTab === "system" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">System Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormSelect
                                                id="maintenanceMode"
                                                name="maintenanceMode"
                                                label="Maintenance Mode"
                                                value={formData.maintenanceMode}
                                                onChange={handleChange}
                                                options={[
                                                    { value: "false", label: "Disabled" },
                                                    { value: "true", label: "Enabled" },
                                                ]}
                                                helperText="When enabled, only admins can access the platform"
                                                containerClassName="md:col-span-2"
                                            />

                                            <FormInput
                                                id="apiRateLimit"
                                                name="apiRateLimit"
                                                type="number"
                                                label="API Rate Limit (requests per minute)"
                                                placeholder="100"
                                                value={formData.apiRateLimit}
                                                onChange={handleChange}
                                                error={errors.apiRateLimit}
                                                required
                                                min="1"
                                                max="10000"
                                            />

                                            <FormInput
                                                id="maxFileUploadSize"
                                                name="maxFileUploadSize"
                                                type="number"
                                                label="Max File Upload Size (MB)"
                                                placeholder="10"
                                                value={formData.maxFileUploadSize}
                                                onChange={handleChange}
                                                error={errors.maxFileUploadSize}
                                                required
                                                min="1"
                                                max="100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={isSaving}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    size="lg"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Settings
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Info Panel */}
                <div className="lg:col-span-1">
                    <div className="border rounded-md bg-card shadow-sm sticky top-4">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">Settings Guide</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure your platform settings
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {activeTab === "general" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Platform Information</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Set your platform name, description, and contact information. These details will be visible to users.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Contact Emails</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Configure email addresses for general contact and support inquiries.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "financial" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Platform Fees</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Set the commission percentage charged on each transaction. This is how the platform generates revenue.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Payment Settings</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Configure the minimum amount organizers must accumulate before requesting a payment.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Password Policy</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Configure password requirements to ensure account security. Stronger policies improve security.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Session Management</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Set how long users remain logged in before requiring re-authentication.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "email" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">SMTP Configuration</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Configure your email server settings to enable email notifications and transactional emails.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Common SMTP Providers</h3>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Gmail: smtp.gmail.com:587</li>
                                            <li>• Outlook: smtp-mail.outlook.com:587</li>
                                            <li>• SendGrid: smtp.sendgrid.net:587</li>
                                            <li>• Mailgun: smtp.mailgun.org:587</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Email Notifications</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Control which email notifications are sent to users and administrators.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Notification Types</h3>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Booking confirmations</li>
                                            <li>• Event reminders</li>
                                            <li>• Admin alerts</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === "system" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Maintenance Mode</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Enable maintenance mode to restrict access to administrators only. Useful for updates and maintenance.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">API & Performance</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Configure API rate limits and file upload restrictions to manage system resources.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t space-y-3">
                                <h3 className="font-semibold text-sm">Quick Tips</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Save settings after making changes to apply them</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Test email settings before enabling notifications</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Use strong password policies for better security</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Disable maintenance mode after updates</span>
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
