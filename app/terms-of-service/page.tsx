"use client";

import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function TermsOfServicePage() {
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
                            <span className="block mb-2">Terms of Service</span>
                            <span className="block text-blue relative">
                                Rules & Guidelines
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-linear-to-r from-transparent via-blue to-transparent opacity-60" />
                            </span>
                        </h1>
                        <p className="text-light-100 text-lg max-w-3xl mx-auto">
                            Please read these terms carefully before using TechHub. By accessing or using our platform, you agree to be bound by these terms.
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
                            1. Acceptance of Terms
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed">
                            By accessing or using TechHub ("the Platform", "we", "us", "our"), you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform. These Terms apply to all users, including visitors, registered users, and event organizers.
                        </p>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={200}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            2. Description of Service
                        </h2>
                        <div className="space-y-3 text-light-200 text-sm leading-relaxed">
                            <p>TechHub is a platform that connects users with technology events, including but not limited to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Hackathons and coding competitions</li>
                                <li>Developer conferences and workshops</li>
                                <li>Tech meetups and networking events</li>
                                <li>Online and offline educational events</li>
                                <li>Hybrid events combining online and in-person components</li>
                            </ul>
                            <p>We provide a platform for event discovery, registration, and management. We are not responsible for the content, quality, or conduct of individual events listed on our platform.</p>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={300}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            3. User Accounts
                        </h2>
                        <div className="space-y-4 text-light-200 text-sm leading-relaxed">
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Account Creation</h3>
                                <p>To use certain features of the Platform, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Account Security</h3>
                                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Account Termination</h3>
                                <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for violation of these Terms or for any other reason we deem necessary.</p>
                            </div>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={400}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            4. Event Bookings and Cancellations
                        </h2>
                        <div className="space-y-4 text-light-200 text-sm leading-relaxed">
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Booking Process</h3>
                                <p>When you book an event through our Platform, you enter into a direct agreement with the event organizer. TechHub acts as a facilitator and is not a party to this agreement.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Cancellation and Refunds</h3>
                                <p>Cancellation and refund policies are determined by individual event organizers. We are not responsible for refunds or cancellations. Please review the event details and organizer's policies before booking.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Event Changes</h3>
                                <p>Event organizers may modify, postpone, or cancel events. We will make reasonable efforts to notify you of significant changes, but we are not responsible for event modifications or cancellations.</p>
                            </div>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={500}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            5. User Conduct
                        </h2>
                        <div className="space-y-3 text-light-200 text-sm leading-relaxed">
                            <p>You agree not to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Use the Platform for any illegal or unauthorized purpose</li>
                                <li>Violate any laws, regulations, or third-party rights</li>
                                <li>Transmit any viruses, malware, or harmful code</li>
                                <li>Attempt to gain unauthorized access to the Platform or related systems</li>
                                <li>Interfere with or disrupt the Platform's operation</li>
                                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                                <li>Collect or harvest information about other users without their consent</li>
                                <li>Use automated systems to access the Platform without permission</li>
                            </ul>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={600}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            6. Intellectual Property
                        </h2>
                        <div className="space-y-3 text-light-200 text-sm leading-relaxed">
                            <p>The Platform and its original content, features, and functionality are owned by TechHub and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
                            <p>You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Platform without our prior written consent.</p>
                            <p>Event content, including descriptions, images, and materials, are the property of their respective event organizers or licensors.</p>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={700}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            7. Disclaimers and Limitation of Liability
                        </h2>
                        <div className="space-y-4 text-light-200 text-sm leading-relaxed">
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Service Availability</h3>
                                <p>We strive to provide reliable service but do not guarantee that the Platform will be available at all times, uninterrupted, or error-free. We may experience downtime for maintenance, updates, or technical issues.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Third-Party Content</h3>
                                <p>The Platform may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third-party sites. Your interactions with third parties are solely between you and the third party.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-100 mb-2">Limitation of Liability</h3>
                                <p>To the maximum extent permitted by law, TechHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Platform.</p>
                            </div>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={800}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            8. Indemnification
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed">
                            You agree to defend, indemnify, and hold harmless TechHub, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of or in any way connected with your access to or use of the Platform, your violation of these Terms, or your violation of any third-party rights.
                        </p>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={900}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            9. Changes to Terms
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Platform after such changes constitutes acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the Platform.
                        </p>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={1000}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            10. Governing Law
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed">
                            These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes arising from these Terms or your use of the Platform shall be resolved through appropriate legal channels.
                        </p>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll variant="fade" delay={1100}>
                    <div className="glass p-8 rounded-xl border border-blue/10">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="w-1 h-6 bg-linear-to-b from-blue to-primary rounded-full" />
                            11. Contact Information
                        </h2>
                        <p className="text-light-200 text-sm leading-relaxed mb-4">
                            If you have any questions about these Terms of Service, please contact us:
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

