"use client";

import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import AnimateOnScroll from "@/components/AnimateOnScroll"
import { IEvent } from "@/database/event.model";
import Link from "next/link";
import Image from "next/image";
import OrganizerSlider from "@/components/OrganizerSlider";
import { formatOrganizerCount } from "@/lib/formatters";
import { useEvents } from "@/lib/hooks/api/events.queries";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, CreditCard, Ticket, Zap, Shield, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Page = () => {
  const { data: eventsData, isLoading } = useEvents();
  const events = eventsData?.events || [];

  const featuredEvents = events && events.length > 0 ? events.slice(0, 3) : [];
  const totalEvents = events?.length || 0;

  // Calculate unique organizers count
  const uniqueOrganizers = events && events.length > 0
    ? new Set(events.map((event: any) => event.organizer)).size
    : 0;
  const organizerCount = formatOrganizerCount(uniqueOrganizers);

  // Fetch pricing plans
  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const response = await fetch("/api/plans");
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
  });

  const plans = plansData?.data?.plans || [];

  // Format price from centavos to PHP
  const formatPrice = (centavos: number, planName?: string) => {
    // Enterprise plan should show "Custom pricing" instead of "Free"
    if (centavos === 0 && planName?.toLowerCase() === 'enterprise') {
      return "Custom pricing";
    }
    if (centavos === 0) return "Free";
    return `₱${(centavos / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (isLoading) {
    return (
      <section id="home">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-light-200">Loading events...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="home">
      {/* Hero Section */}
      <div className="relative min-h-[85vh] flex flex-col items-center justify-center text-center py-20 overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none z-2" />



        {/* Main Content */}
        <div className="relative z-4 max-w-5xl mx-auto px-4">
          {/* Badge */}
          <div className="animate-fade-in-up mb-6 inline-block">
            <div className="glass px-6 py-2 rounded-full border border-blue/30 backdrop-blur-xl">
              <span className="text-blue text-sm font-medium">💻 Your Tech Event Platform</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-center animate-fade-in-up mb-6 leading-tight">
            <span className="block mb-2">All Tech Events.</span>
            <span className="block text-blue relative">
              One Platform. Your Future.
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue to-transparent opacity-60 animate-pulse" />
            </span>
          </h1>

          {/* Subheading */}
          <p className="subheading animate-fade-in-up animate-delay-200 max-w-2xl mx-auto mb-8 text-lg">
            Hackathons, Tech Conferences, Developer Workshops, and more. Connect, learn, and grow with the global tech community.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <ExploreBtn />
            <Link href="/sign-up" className="w-full sm:w-auto">
              <button className="bg-blue hover:bg-blue/90 text-black px-8 py-3.5 rounded-full hover:scale-110 transition-all duration-300 shadow-lg shadow-blue/20 font-semibold flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-[240px] cursor-pointer">
                <span className="text-black">Organize Events</span>
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="animate-fade-in-up animate-delay-400 mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-light-200">{totalEvents}+ Active Events</span>
            </div>
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-blue rounded-full animate-pulse" />
              <span className="text-light-200">{organizerCount} Organizers</span>
            </div>
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-light-200">50K+ Developers</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[4] animate-bounce">
          <div className="w-6 h-10 border-2 border-blue/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <AnimateOnScroll variant="fade">
        <div className="my-20 space-y-12">
          <h2 className="text-3xl font-bold text-center">Why Choose TechEventX?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimateOnScroll delay={0} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/calendar.svg" alt="Calendar" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Easy Discovery</h3>
              </div>
              <p className="text-light-200">Find events that match your interests, skills, and schedule. Filter by location, date, and type.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/mode.svg" alt="Mode" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Multiple Formats</h3>
              </div>
              <p className="text-light-200">Join online, offline, or hybrid events. Attend from anywhere or connect in person.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={200} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/audience.svg" alt="Audience" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Community Driven</h3>
              </div>
              <p className="text-light-200">Connect with like-minded developers, share knowledge, and grow your network.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={300} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/clock.svg" alt="Clock" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Stay Updated</h3>
              </div>
              <p className="text-light-200">Get notified about new events, schedule changes, and important updates.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={400} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/pin.svg" alt="Location" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Global Reach</h3>
              </div>
              <p className="text-light-200">Events from around the world. Find local meetups or international conferences.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={500} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue rounded-full flex items-center justify-center">
                  <span className="text-white dark:text-foreground font-bold">✓</span>
                </div>
                <h3 className="text-xl font-semibold">One-Click Booking</h3>
              </div>
              <p className="text-light-200">Simple and fast event registration. Book your spot in seconds with secure payment processing.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={600} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold">Secure Payments</h3>
              </div>
              <p className="text-light-200">Safe and secure payment processing for paid events. Your transactions are protected.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={700} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-yellow-500" />
                <h3 className="text-xl font-semibold">Instant Tickets</h3>
              </div>
              <p className="text-light-200">Get your tickets instantly with QR codes. Easy check-in at events.</p>
            </AnimateOnScroll>
          </div>
        </div>
      </AnimateOnScroll>

      {/* Divider */}
      <AnimateOnScroll variant="scale">
        <div className="my-20 flex items-center justify-center">
          <div className="h-[1.5px] w-full max-w-3xl bg-gradient-to-r from-transparent via-blue/70 to-transparent divider-grow"></div>
        </div>
      </AnimateOnScroll>

      {/* Featured Events Section */}
      <AnimateOnScroll variant="fade">
        <div className="mt-20 space-y-7" id="events">
          <div className="flex justify-between items-center">
            <h3>Featured Events</h3>
            {events && events.length > 3 && (
              <Link href="/events" className="text-blue hover:underline transition-all duration-300 hover:scale-110">
                View All Events →
              </Link>
            )}
          </div>
          <ul className="events">
            {featuredEvents.length > 0 ? featuredEvents.map((event: IEvent, index: number) => (
              <li key={event.title}>
                <AnimateOnScroll delay={index * 100}>
                  <div className="hover:scale-105 transition-transform duration-300">
                    <EventCard {...event} />
                  </div>
                </AnimateOnScroll>
              </li>
            )) : (
              <li className="col-span-full text-center py-12">
                <p className="text-light-200">No events available at the moment. Check back soon!</p>
              </li>
            )}
          </ul>
        </div>
      </AnimateOnScroll>

      {/* Pricing Section */}
      {plans.length > 0 && (
        <AnimateOnScroll variant="fade">
          <div className="my-20 space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
              <p className="text-light-200 max-w-2xl mx-auto text-lg">
                Choose the perfect plan for your event management needs. Start free, upgrade anytime.
              </p>
              <Link href="/pricing" className="inline-block text-blue hover:underline text-sm">
                View Full Pricing Details →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {plans.map((plan: any, index: number) => (
                <AnimateOnScroll
                  key={plan.id}
                  delay={index * 100}
                  variant="slide"
                  className={`glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300 border-2 ${
                    plan.isPopular
                      ? "border-blue/50 bg-gradient-to-b from-blue/10 to-transparent relative"
                      : "border-blue/20"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue text-white px-4 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                      {plan.price > 0 && (
                        <span className="text-light-200/60 text-sm">/month</span>
                      )}
                    </div>
                    {plan.annualPrice && plan.price > 0 && (
                      <p className="text-sm text-light-200/60 mb-2">
                        {formatPrice(plan.annualPrice)}/year
                        <span className="text-green-500 ml-2">
                          (Save {formatPrice((plan.price * 12) - plan.annualPrice)})
                        </span>
                      </p>
                    )}
                    {plan.description && (
                      <p className="text-sm text-light-200/80">{plan.description}</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-light-200">
                        {plan.features.maxEvents === null
                          ? "Unlimited events"
                          : `${plan.features.maxEvents} events`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-light-200">
                        {plan.features.maxBookingsPerEvent === null
                          ? "Unlimited bookings"
                          : `Up to ${plan.features.maxBookingsPerEvent} bookings/event`}
                      </span>
                    </li>
                    {plan.features.analytics && (
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-light-200">Analytics & Insights</span>
                      </li>
                    )}
                    {plan.features.customBranding && (
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-light-200">Custom Branding</span>
                      </li>
                    )}
                    {plan.features.prioritySupport && (
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-light-200">Priority Support</span>
                      </li>
                    )}
                    {plan.features.apiAccess && (
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-light-200">API Access</span>
                      </li>
                    )}
                    {plan.features.whiteLabel && (
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-light-200">White Label</span>
                      </li>
                    )}
                  </ul>

                  <Link href="/sign-up" className="block">
                    <Button
                      className={`w-full ${
                        plan.isPopular
                          ? "bg-blue hover:bg-blue/90 text-white"
                          : "bg-dark-200 hover:bg-dark-200/80 text-foreground border border-blue/20"
                      }`}
                    >
                      {plan.price === 0 && plan.name?.toLowerCase() !== 'enterprise' 
                          ? "Get Started" 
                          : plan.name?.toLowerCase() === 'enterprise'
                          ? "Contact Sales"
                          : "Choose Plan"}
                    </Button>
                  </Link>
                </AnimateOnScroll>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-light-200/60">
                All plans include secure payment processing, ticket generation, and email notifications.
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      )}

      {/* Divider */}
      {plans.length > 0 && (
        <AnimateOnScroll variant="scale">
          <div className="my-20 flex items-center justify-center">
            <div className="h-[1.5px] w-full max-w-3xl bg-gradient-to-r from-transparent via-blue/70 to-transparent divider-grow"></div>
          </div>
        </AnimateOnScroll>
      )}

      {/* For Organizers Section */}
      <AnimateOnScroll variant="fade">
        <div className="my-20 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">For Event Organizers</h2>
            <p className="text-light-200 max-w-2xl mx-auto text-lg">
              Everything you need to create, manage, and monetize your events. From free meetups to paid conferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimateOnScroll delay={0} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300 border border-blue/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue/20 rounded-md flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue" />
                </div>
                <h3 className="text-lg font-semibold">Event Management</h3>
              </div>
              <p className="text-light-200 text-sm">Create and manage unlimited events with our powerful dashboard.</p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={100} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300 border border-blue/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-md flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Monetize Events</h3>
              </div>
              <p className="text-light-200 text-sm">Accept payments, set ticket prices, and track revenue seamlessly.</p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300 border border-blue/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-md flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">Analytics & Insights</h3>
              </div>
              <p className="text-light-200 text-sm">Track bookings, revenue, and attendee engagement in real-time.</p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={300} variant="slide" className="glass p-6 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300 border border-blue/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-md flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold">Ticket System</h3>
              </div>
              <p className="text-light-200 text-sm">Generate QR codes, manage check-ins, and handle capacity limits.</p>
            </AnimateOnScroll>
          </div>

          <div className="text-center mt-8">
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-blue to-primary hover:from-blue/90 hover:to-primary/90 text-white px-8 py-3 rounded-full hover:scale-110 transition-all duration-300">
                Start Organizing Today
              </Button>
            </Link>
          </div>
        </div>
      </AnimateOnScroll>

      {/* Divider */}
      <AnimateOnScroll variant="scale">
        <div className="my-20 flex items-center justify-center">
          <div className="h-[1.5px] w-full max-w-3xl bg-gradient-to-r from-transparent via-blue/70 to-transparent divider-grow"></div>
        </div>
      </AnimateOnScroll>

      {/* CTA Section */}
      <AnimateOnScroll variant="glow">
        <div className="my-10 glass p-12 rounded-md text-center hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-light-200 mb-8 max-w-2xl mx-auto">
            Join thousands of developers discovering and attending amazing events. Start your journey today and unlock endless opportunities to learn, network, and grow your career.
          </p>
          <Link
            href="/events"
            id="browse-all-events-btn"
            className="inline-block border-dark-200 bg-dark-100 rounded-full border px-8 py-3.5 hover:bg-dark-200 hover:scale-110 transition-all duration-300"
          >
            Browse All Events
          </Link>
        </div>
      </AnimateOnScroll>

      {/* Divider */}
      <AnimateOnScroll variant="scale">
        <div className="my-20 flex items-center justify-center">
          <div className="h-[1.5px] w-full max-w-3xl bg-gradient-to-r from-transparent via-blue/70 to-transparent divider-grow"></div>
        </div>
      </AnimateOnScroll>

      {/* Trusted Organizers Section */}
      <AnimateOnScroll variant="fade">
        <div className="mt-20 space-y-8 w-screen relative left-1/2 -translate-x-1/2">
          <div className="text-center space-y-2 px-5 sm:px-10">
            <h3 className="text-center">Our Event Organizers</h3>
            <p className="text-light-200 text-sm max-w-2xl mx-auto">
              Join events from leading tech companies and developer communities worldwide
            </p>
          </div>
          <OrganizerSlider
            organizers={featuredEvents.length > 0
              ? (Array.from(new Set(featuredEvents.map((event: any) => event.organizer))) as string[])
              : []
            }
          />
        </div>
      </AnimateOnScroll>
    </section >
  )
}

export default Page