"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function PrivacyPolicyPage() {
    const lastUpdated = "January 2024";

    return (
        <section className="py-8">
            {/* Hero Section */}
            <AnimateOnScroll variant="fade">
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <div className="inline-block mb-6">
                            <div className="glass px-6 py-2 rounded-full border border-blue/30 backdrop-blur-xl">
                                <span className="text-blue text-sm font-medium">Legal</span>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                            <span className="block mb-2">Privacy Policy</span>
                            <span className="block text-blue relative">
                                Your Privacy Matters
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-linear-to-r from-transparent via-blue to-transparent opacity-60" />
                            </span>
                        </h1>
                        <p className="text-light-100 text-lg max-w-3xl mx-auto">
                            We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your personal information.
                        </p>
                        <p className="text-light-200 text-sm mt-4">
                            Last updated: {lastUpdated}
                        </p>
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Content */}
            <div className="max-w-4xl mx-auto space-y-8">
                <AnimateOnScroll variant="fade" delay={100}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            1. Information We Collect
                        </h2>
                        <div className="space-y-4 text-light-200 text-sm leading-relaxed">
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Personal Information</h3>
                                <p>When you create an account, we collect information such as your name, email address, and password. This information is necessary to provide you with access to our services and to manage your event bookings.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Usage Data</h3>
                                <p>We automatically collect information about how you interact with our platform, including pages visited, events viewed, booking history, and device information. This helps us improve our services and user experience.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Cookies and Tracking</h3>
                                <p>We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie preferences through your browser settings.</p>
                            </div>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={200}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            2. How We Use Your Information
                        </h2>
                        <div className="space-y-3 text-light-200 text-sm leading-relaxed">
                            <p>We use the information we collect to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process your event bookings and manage your account</li>
                                <li>Send you event updates, newsletters, and important notifications</li>
                                <li>Personalize your experience and recommend relevant events</li>
                                <li>Analyze usage patterns to enhance platform functionality</li>
                                <li>Detect, prevent, and address technical issues or security threats</li>
                                <li>Comply with legal obligations and enforce our terms of service</li>
                            </ul>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={300}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            3. Information Sharing and Disclosure
                        </h2>
                        <div className="space-y-4 text-light-200 text-sm leading-relaxed">
                            <p>We respect your privacy and do not sell your personal information. We may share your information only in the following circumstances:</p>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Event Organizers</h3>
                                <p>When you book an event, we share necessary information (name, email) with the event organizer to facilitate your participation and event management.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Service Providers</h3>
                                <p>We may share information with trusted third-party service providers who assist us in operating our platform, conducting business, or serving our users, provided they agree to keep this information confidential.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Legal Requirements</h3>
                                <p>We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety, or that of our users or others.</p>
                            </div>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={400}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            4. Data Security
                        </h2>
                        <div className="space-y-3 text-light-200 text-sm leading-relaxed">
                            <p>We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Encryption of data in transit and at rest</li>
                                <li>Regular security assessments and updates</li>
                                <li>Access controls and authentication mechanisms</li>
                                <li>Secure data storage and backup procedures</li>
                            </ul>
                            <p className="mt-4">However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={500}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            5. Your Rights and Choices
                        </h2>
                        <div className="space-y-4 text-light-200 text-sm leading-relaxed">
                            <p>You have the following rights regarding your personal information:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong className="text-light-100">Access:</strong> Request access to your personal data</li>
                                <li><strong className="text-light-100">Correction:</strong> Update or correct inaccurate information</li>
                                <li><strong className="text-light-100">Deletion:</strong> Request deletion of your account and associated data</li>
                                <li><strong className="text-light-100">Opt-out:</strong> Unsubscribe from marketing emails and newsletters</li>
                                <li><strong className="text-light-100">Data Portability:</strong> Request a copy of your data in a portable format</li>
                            </ul>
                            <p>To exercise these rights, please contact us through our <a href="/contact" className="text-blue hover:underline">Contact page</a>.</p>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={600}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            6. Children's Privacy
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed">
                            Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately so we can delete it.
                        </p>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={700}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            7. Changes to This Policy
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed">
                            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                        </p>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={800}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            8. Contact Us
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed mb-4">
                            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                        </p>
                        <div className="space-y-2 text-light-200 text-sm">
                            <p>Email: <a href="/contact" className="text-blue hover:underline">Contact Support</a></p>
                            <p>Website: <a href="/contact" className="text-blue hover:underline">Contact Page</a></p>
                        </div>
                    </div>
                </AnimateOnScroll>
            </div>
        </section>
    );
}

