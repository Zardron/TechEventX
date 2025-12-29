"use client"

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

interface Props {
    slug: string;
    title: string;
    img: string;
    location: string;
    time: string;
    date: string;
    description: string;
}

const EventCard = ({ slug, title, img, location, time, date, description }: Props) => {
    const handleClick = () => {
        posthog.capture('event_card_clicked', {
            event_slug: slug,
            event_title: title,
            event_location: location,
            event_date: date,
            event_time: time,
        });
    };

    return (
        <Link href={`/events/${slug}`} id="event-card" onClick={handleClick}>
            <Image src={img} alt={title} width={410} height={300} className="poster" priority />

            <div className="flex grow gap-2">
                <Image src="/icons/pin.svg" alt={location} width={14} height={14} />
                <p className="location">{location}</p>
            </div>
            <p className="title">{title}</p>

            <div className="datetime">
                <div>
                    <Image src="/icons/calendar.svg" alt={date} width={14} height={14} />
                    <p className="date">{date}</p>
                </div>
                <div>
                    <Image src="/icons/clock.svg" alt={time} width={14} height={14} />
                    <p className="time">{time}</p>
                </div>
            </div>

            <p className="description">{description}</p>
        </Link>
    )
}

export default EventCard