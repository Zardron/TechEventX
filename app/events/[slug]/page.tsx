import { notFound } from "next/navigation";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import { getSimilarEventsBySlug } from "@/lib/action/event.actions";
import { IEvent } from "@/database/event.model";
import EventCard from "@/components/EventCard";
import { formatTimeWithAMPM, formatDateToReadable } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const EventDetailItem = ({ icon, alt, label }: { icon: string, alt: string, label: string }) => {
    return (
        <div className="flex flex-row gap-2 items-center">
            <Image src={icon} alt={alt} width={14} height={14} />
            <p className="text-light-200 text-sm font-light capitalize">{label}</p>
        </div>
    )
}

const EventAgendaItem = ({ agendaItems }: { agendaItems: string[] }) => {
    return (
        <div className="agenda">
            <h2>Agenda</h2>
            <ul>
                {agendaItems.map((item, index) => (
                    <li key={index}>
                        <p className="text-light-200 text-sm font-ligh capitalize">{item}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const EventTags = ({ tags }: { tags: string[] }) => {
    return (
        <div className="flex flex-row gap-1.5 flex-wrap items-center">
            {tags.map((tag, index) => (
                <div key={index}>
                    <p className="pill capitalize">{tag}</p>
                </div>
            ))}
        </div>
    )
}

const EventDetailsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    const request = await fetch(`${BASE_URL}/api/events/${slug}`);
    const { event: { title, description, overview, image, venue, location, date, time, mode, audience, agenda, organizer, tags } } = await request.json();

    if (!description) {
        return notFound();
    }

    const bookings: number = 10;

    const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

    return (
        <section id="event">
            <div className="header">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>

            <div className="details">
                {/* Event Content */}
                <div className="content">
                    <div className="flex flex-col gap-2">
                        <Image src={image} alt={title} width={800} height={450} className="banner" priority />
                        <EventDetailItem icon="/icons/pin.svg" alt="Venue" label={location} />
                    </div>


                    <section className="flex-col gap-2">
                        <h2>Overview</h2>
                        <p>{overview}</p>
                    </section>

                    <section className="flex-col gap-2">
                        <h2>Event Details</h2>
                        <EventDetailItem icon="/icons/calendar.svg" alt="Date" label={formatDateToReadable(date)} />
                        <EventDetailItem icon="/icons/clock.svg" alt="Time" label={formatTimeWithAMPM(time)} />
                        <EventDetailItem icon="/icons/pin.svg" alt="Pin" label={venue} />
                        <EventDetailItem icon="/icons/mode.svg" alt="Mode" label={mode} />
                        <EventDetailItem icon="/icons/audience.svg" alt="Audience" label={audience} />
                    </section>

                    <EventAgendaItem agendaItems={agenda} />

                    <section className="flex-col gap-2">
                        <h2>About the Organizer</h2>
                        <p>{organizer}</p>
                    </section>

                    <EventTags tags={tags} />
                </div>

                {/* Booking Content */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book Your Spot</h2>
                        {bookings > 0 ? (
                            <p className="text-sm">
                                {bookings} {bookings === 1 ? 'person has' : 'people have'} already booked.
                            </p>
                        ) : (
                            <p className="text-sm">Be the first to book your spot.</p>
                        )}
                        <BookEvent />
                    </div>
                </aside>
            </div>

            <div className="flex flex-col w-full gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
                        <EventCard key={similarEvent.slug} {...similarEvent} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default EventDetailsPage