export const SAMPLE_ORGANIZERS = [
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

// Map organizer names to their email addresses
export const ORGANIZER_EMAILS: Record<string, string> = {
    "Meta": "contact@meta.com",
    "Google": "contact@google.com",
    "Microsoft": "contact@microsoft.com",
    "Apple": "contact@apple.com",
    "Amazon": "contact@amazon.com",
    "Netflix": "contact@netflix.com",
    "GitHub": "contact@github.com",
    "Vercel": "contact@vercel.com",
    "Stripe": "contact@stripe.com",
    "Shopify": "contact@shopify.com",
    "MongoDB": "contact@mongodb.com",
    "Firebase": "contact@firebase.com",
    "Adobe": "contact@adobe.com",
    "Salesforce": "contact@salesforce.com",
    "Oracle": "contact@oracle.com",
    "IBM": "contact@ibm.com",
};

export const events = [
    {
        slug: "react-conf-2025",
        title: "React Conf 2025",
        description: "Join the React community for the premier conference on React, featuring talks from core team members, community leaders, and industry experts.",
        overview: "React Conf 2025 highlights the latest in React development, featuring talks from core team members, community leaders, and industry experts. Learn about the latest features, best practices, and the future of React. Discover new hooks, concurrent features, server components, and real-world applications from the React team and community.",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340",
        venue: "Moscone Center",
        location: "San Francisco, CA",
        date: "2025-05-15",
        time: "09:00",
        mode: "offline",
        audience: "React developers, frontend engineers, JavaScript enthusiasts",
        agenda: [
            "09:00 AM - 10:00 AM | Keynote: The Future of React",
            "10:15 AM - 11:30 AM | Deep Dives: Server Components, Concurrent Features",
            "11:45 AM - 12:45 PM | Community Talks & Networking",
            "12:45 PM - 01:45 PM | Lunch",
            "01:45 PM - 03:15 PM | Workshops: Advanced React Patterns",
            "03:30 PM - 04:45 PM | Panel: React Ecosystem & Best Practices"
        ],
        organizer: "Meta organizes React Conf to bring together the global React community, showcase innovations, and share knowledge about building modern user interfaces.",
        tags: ["React", "JavaScript", "Frontend", "UI"]
    },
    {
        slug: "nextjs-conf-2025",
        title: "Next.js Conf 2025",
        description: "The official Next.js conference featuring the latest updates, best practices, and community insights.",
        overview: "Next.js Conf 2025 brings together the Next.js community to explore the latest features, performance optimizations, and real-world applications. Learn from the Vercel team and community experts about server components, routing, and deployment strategies.",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340",
        venue: "San Francisco Marriott Marquis",
        location: "San Francisco, CA",
        date: "2025-06-20",
        time: "10:00",
        mode: "hybrid",
        audience: "Next.js developers, full-stack engineers, web developers",
        agenda: [
            "10:00 AM - 11:00 AM | Opening Keynote",
            "11:15 AM - 12:30 PM | Next.js 15 Deep Dive",
            "12:30 PM - 01:30 PM | Lunch Break",
            "01:30 PM - 03:00 PM | Advanced Patterns & Performance",
            "03:15 PM - 04:30 PM | Community Showcase"
        ],
        organizer: "Vercel",
        tags: ["Next.js", "React", "Full-stack", "Web Development"]
    }
];
