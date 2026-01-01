"use client"

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OrganizerLogo from "./OrganizerLogo";

interface OrganizerSliderProps {
    organizers: string[];
}

// Dummy organizers for the slider
const DUMMY_ORGANIZERS = [
    "Meta",
    "Google",
    "Microsoft",
    "Apple",
    "Amazon",
    "Netflix",
    "GitHub",
    "Vercel",
    "Stripe",
    "Shopify",
    "MongoDB",
    "Firebase",
    "Adobe",
    "Salesforce",
    "Oracle",
    "IBM",
];

const OrganizerSlider = ({ organizers }: OrganizerSliderProps) => {
    const [isPaused, setIsPaused] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const positionRef = useRef<number>(0);
    const isPausedRef = useRef<boolean>(false);
    const itemTotalWidthRef = useRef<number>(0);

    // Sync ref with state
    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    // Combine actual organizers with dummy ones to ensure we have enough items for a slider
    const allOrganizers = [
        ...organizers,
        ...DUMMY_ORGANIZERS.filter(org => !organizers.includes(org))
    ].slice(0, 12);

    // Duplicate organizers for seamless infinite scroll
    const duplicatedOrganizers = [...allOrganizers, ...allOrganizers, ...allOrganizers];

    // Continuous scrolling animation
    useEffect(() => {
        if (!sliderRef.current || allOrganizers.length <= 2) return;

        const speed = 0.5; // pixels per frame

        // Calculate item width and gap once
        const calculateItemWidth = () => {
            if (!sliderRef.current) return;
            const firstItem = sliderRef.current.children[0] as HTMLElement;
            const secondItem = sliderRef.current.children[1] as HTMLElement;

            if (firstItem && secondItem) {
                const firstRect = firstItem.getBoundingClientRect();
                const secondRect = secondItem.getBoundingClientRect();
                const actualGap = secondRect.left - firstRect.right;
                const itemWidth = firstRect.width;
                itemTotalWidthRef.current = itemWidth + actualGap;
            }
        };

        // Calculate on mount and resize
        calculateItemWidth();
        const resizeObserver = new ResizeObserver(calculateItemWidth);
        if (sliderRef.current) {
            resizeObserver.observe(sliderRef.current);
        }

        const animate = () => {
            if (!sliderRef.current) return;

            // Only update position if not paused (check ref, not state)
            if (!isPausedRef.current) {
                positionRef.current -= speed;

                // Reset position when we've scrolled through one set of organizers
                if (itemTotalWidthRef.current > 0 && Math.abs(positionRef.current) >= itemTotalWidthRef.current * allOrganizers.length) {
                    positionRef.current = 0;
                }
            }

            // Always update transform, even when paused (to maintain current position)
            if (sliderRef.current) {
                sliderRef.current.style.transform = `translateX(${positionRef.current}px)`;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            resizeObserver.disconnect();
        };
    }, [allOrganizers.length]); // Removed isPaused from dependencies

    if (allOrganizers.length === 0) {
        return null;
    }

    return (
        <div
            className="relative w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Fade gradient on the left */}
            <div className="absolute left-0 top-0 bottom-0 w-40 bg-linear-to-r from-background via-background/95 via-background/70 via-background/30 to-transparent z-10 pointer-events-none" />

            {/* Fade gradient on the right */}
            <div className="absolute right-0 top-0 bottom-0 w-40 bg-linear-to-l from-background via-background/95 via-background/70 via-background/30 to-transparent z-10 pointer-events-none" />

            {/* Slider Container */}
            <div className="overflow-x-hidden overflow-y-visible px-4">
                <div
                    ref={sliderRef}
                    className="flex gap-2 items-center"
                    style={{ willChange: 'transform' }}
                >
                    {duplicatedOrganizers.map((organizer, index) => (
                        <div
                            key={`${organizer}-${index}`}
                            className="shrink-0 w-[120px] md:w-[136px]"
                        >
                            <OrganizerLogo organizer={organizer} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrganizerSlider;
