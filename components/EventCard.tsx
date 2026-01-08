"use client"

import Image from "next/image";
import Link from "next/link";
import { formatDateTo12Hour } from "@/lib/formatters";

interface Props {
    slug: string;
    title: string;
    image: string;
    location: string;
    time: string;
    date: string;
    description: string;
}

const EventCard = ({ slug, title, image, location, time, date, description }: Props) => {
    return (
        <Link 
            href={`/events/${slug}`} 
            id="event-card" 
            className="group relative flex flex-col h-full glass rounded-xl overflow-hidden border border-border-dark/50 hover:border-blue/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue/10"
        >
            {/* Image Container with Overlay */}
            <div className="relative overflow-hidden">
                <Image 
                    src={image} 
                    alt={title} 
                    width={410} 
                    height={300} 
                    className="poster w-full h-[300px] object-cover group-hover:scale-110 transition-transform duration-500" 
                    priority 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4 p-5 flex-grow">
                {/* Location */}
                <div className="flex items-center gap-2">
                    <Image src="/icons/pin.svg" alt={location} width={16} height={16} className="opacity-70" />
                    <p className="location text-sm font-medium">{location}</p>
                </div>

                {/* Title */}
                <h3 className="title text-xl font-bold line-clamp-2 group-hover:text-blue transition-colors duration-300">
                    {title}
                </h3>

                {/* Date & Time */}
                <div className="datetime flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Image src="/icons/calendar.svg" alt={date} width={16} height={16} className="opacity-70" />
                        <p className="date font-medium">{date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Image src="/icons/clock.svg" alt={time} width={16} height={16} className="opacity-70" />
                        <p className="time font-medium">{formatDateTo12Hour(time)}</p>
                    </div>
                </div>

                {/* Description */}
                <p className="description text-sm line-clamp-3 mt-auto">{description}</p>

                {/* Hover Indicator */}
                <div className="mt-2 flex items-center gap-2 text-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm font-medium">View Details</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    )
}

export default EventCard