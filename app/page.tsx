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

const Page = () => {
  const { data: eventsData, isLoading } = useEvents();
  const events = eventsData?.events || [];

  const featuredEvents = events && events.length > 0 ? events.slice(0, 3) : [];
  const totalEvents = events?.length || 0;

  // Calculate unique organizers count
  const uniqueOrganizers = events && events.length > 0
    ? new Set(events.map((event: IEvent) => event.organizer)).size
    : 0;
  const organizerCount = formatOrganizerCount(uniqueOrganizers);

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

          {/* CTA Button */}
          <div className="animate-fade-in-up animate-delay-300">
            <ExploreBtn />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimateOnScroll delay={0} variant="slide" className="glass p-6 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/calendar.svg" alt="Calendar" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Easy Discovery</h3>
              </div>
              <p className="text-light-200">Find events that match your interests, skills, and schedule. Filter by location, date, and type.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100} variant="slide" className="glass p-6 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/mode.svg" alt="Mode" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Multiple Formats</h3>
              </div>
              <p className="text-light-200">Join online, offline, or hybrid events. Attend from anywhere or connect in person.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={200} variant="slide" className="glass p-6 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/audience.svg" alt="Audience" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Community Driven</h3>
              </div>
              <p className="text-light-200">Connect with like-minded developers, share knowledge, and grow your network.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={300} variant="slide" className="glass p-6 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/clock.svg" alt="Clock" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Stay Updated</h3>
              </div>
              <p className="text-light-200">Get notified about new events, schedule changes, and important updates.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={400} variant="slide" className="glass p-6 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/pin.svg" alt="Location" width={32} height={32} className="animate-pulse" />
                <h3 className="text-xl font-semibold">Global Reach</h3>
              </div>
              <p className="text-light-200">Events from around the world. Find local meetups or international conferences.</p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={500} variant="slide" className="glass p-6 rounded-lg hover:scale-105 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue rounded-full flex items-center justify-center">
                  <span className="text-white dark:text-foreground font-bold">✓</span>
                </div>
                <h3 className="text-xl font-semibold">One-Click Booking</h3>
              </div>
              <p className="text-light-200">Simple and fast event registration. Book your spot in seconds.</p>
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

      {/* CTA Section */}
      <AnimateOnScroll variant="glow">
        <div className="my-10 glass p-12 rounded-lg text-center hover:scale-[1.02] transition-transform duration-300">
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
              ? (Array.from(new Set(featuredEvents.map((event: IEvent) => event.organizer))) as string[])
              : []
            }
          />
        </div>
      </AnimateOnScroll>
    </section >
  )
}

export default Page