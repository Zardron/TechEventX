import { useMemo } from "react";
import { useGetAllOrganizers } from "@/lib/hooks/api/organizers.queries";

export interface OrganizerOption {
    name: string;
    email: string;
    isSample: boolean;
}

export const useOrganizers = () => {
    const { data, isLoading } = useGetAllOrganizers();

    const organizers = useMemo(() => {
        const result: OrganizerOption[] = [];

        // Add actual organizers from database
        if (data?.data) {
            const organizerOptions = data.data.map((org) => ({
                name: org.name,
                email: '', // Organizers don't have emails in the collection
                isSample: false,
            }));
            result.push(...organizerOptions);
        }

        // Sort by name
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    return {
        organizers,
        isLoading,
    };
};

