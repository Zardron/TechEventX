"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { X, Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;
    const { token } = useAuthStore();
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        overview: "",
        venue: "",
        location: "",
        date: "",
        time: "",
        mode: "Virtual" as "Virtual" | "Onsite" | "Hybrid",
        audience: "",
        tags: [] as string[],
        agenda: [] as string[],
        isFree: true,
        price: "",
        capacity: "",
        waitlistEnabled: false,
        status: "draft",
    });

    const [imageSource, setImageSource] = useState<"file" | "url">("url");
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [agendaInput, setAgendaInput] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (eventId && token) {
            fetchEvent();
        }
    }, [eventId, token]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(`/api/organizer/events/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch event");
            }

            const data = await response.json();
            // handleSuccessResponse spreads the data object, so event is at root level
            const event = data.event || data.data?.event;

            if (!event) {
                throw new Error("Event data not found in response");
            }

            setFormData({
                title: event.title || "",
                description: event.description || "",
                overview: event.overview || "",
                venue: event.venue || "",
                location: event.location || "",
                date: event.date || "",
                time: event.time || "",
                mode: event.mode || "Virtual",
                audience: event.audience || "",
                tags: event.tags || [],
                agenda: event.agenda || [],
                isFree: event.isFree ?? true,
                price: event.price ? (event.price / 100).toString() : "",
                capacity: event.capacity?.toString() || "",
                waitlistEnabled: event.waitlistEnabled || false,
                status: event.status || "draft",
            });

            setImageUrl(event.image || "");
            setIsLoading(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to load event");
            router.push("/organizer-dashboard/events");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const submitFormData = new FormData();
            submitFormData.append("title", formData.title);
            submitFormData.append("description", formData.description);
            submitFormData.append("overview", formData.overview);
            submitFormData.append("venue", formData.venue);
            submitFormData.append("location", formData.location);
            submitFormData.append("date", formData.date);
            submitFormData.append("time", formData.time);
            submitFormData.append("mode", formData.mode);
            submitFormData.append("audience", formData.audience);
            submitFormData.append("tags", JSON.stringify(formData.tags));
            submitFormData.append("agenda", JSON.stringify(formData.agenda));
            submitFormData.append("isFree", formData.isFree.toString());
            submitFormData.append("imageSource", imageSource);
            submitFormData.append("status", formData.status);

            if (imageSource === "file" && image) {
                submitFormData.append("image", image);
            } else {
                submitFormData.append("imageUrl", imageUrl);
            }

            if (!formData.isFree && formData.price) {
                submitFormData.append("price", (parseFloat(formData.price) * 100).toString());
            }

            if (formData.capacity) {
                submitFormData.append("capacity", formData.capacity);
            }

            submitFormData.append("waitlistEnabled", formData.waitlistEnabled.toString());

            const response = await fetch(`/api/organizer/events/${eventId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: submitFormData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update event");
            }

            toast.success("Event updated successfully!");
            router.push("/organizer-dashboard/events");
        } catch (error: any) {
            toast.error(error.message || "Failed to update event");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    const handleAddAgenda = () => {
        if (agendaInput.trim() && !formData.agenda.includes(agendaInput.trim())) {
            setFormData({ ...formData, agenda: [...formData.agenda, agendaInput.trim()] });
            setAgendaInput("");
        }
    };

    const handleRemoveAgenda = (item: string) => {
        setFormData({ ...formData, agenda: formData.agenda.filter(a => a !== item) });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setImageUrl("");
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Edit Event</h1>
                    <p className="text-muted-foreground mt-2">Loading event...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Edit Event</h1>
                <p className="text-muted-foreground mt-2">Update your event details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <FormInput
                        label="Event Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <FormSelect
                        label="Status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        options={[
                            { value: "draft", label: "Draft" },
                            { value: "published", label: "Published" },
                            { value: "cancelled", label: "Cancelled" },
                        ]}
                    />

                    <FormInput
                        label="Venue"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        required
                    />

                    <FormInput
                        label="Location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                    />

                    <FormInput
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />

                    <FormInput
                        label="Time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                    />

                    <FormSelect
                        label="Mode"
                        value={formData.mode}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                        options={[
                            { value: "Virtual", label: "Virtual" },
                            { value: "Onsite", label: "Onsite" },
                            { value: "Hybrid", label: "Hybrid" },
                        ]}
                        required
                    />
                </div>

                <FormInput
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    multiline
                    rows={3}
                />

                <FormInput
                    label="Overview"
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    required
                    multiline
                    rows={5}
                />

                <FormInput
                    label="Target Audience"
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    required
                />

                {/* Pricing Section */}
                <div className="p-4 border rounded-md space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isFree"
                            checked={formData.isFree}
                            onChange={(e) => setFormData({ ...formData, isFree: e.target.checked, price: "" })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isFree" className="font-medium">Free Event</label>
                    </div>

                    {!formData.isFree && (
                        <FormInput
                            label="Price (PHP)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required={!formData.isFree}
                        />
                    )}
                </div>

                {/* Capacity Section */}
                <div className="p-4 border rounded-md space-y-4">
                    <FormInput
                        label="Capacity (leave empty for unlimited)"
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="waitlistEnabled"
                            checked={formData.waitlistEnabled}
                            onChange={(e) => setFormData({ ...formData, waitlistEnabled: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="waitlistEnabled">Enable waitlist when event is full</label>
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                            className="flex-1 px-3 py-2 border rounded-md"
                            placeholder="Add a tag"
                        />
                        <Button type="button" onClick={handleAddTag} variant="outline">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:text-destructive"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Agenda */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Agenda</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={agendaInput}
                            onChange={(e) => setAgendaInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAgenda())}
                            className="flex-1 px-3 py-2 border rounded-md"
                            placeholder="Add agenda item"
                        />
                        <Button type="button" onClick={handleAddAgenda} variant="outline">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        {formData.agenda.map((item, index) => (
                            <li key={index} className="flex items-center justify-between">
                                <span>{item}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAgenda(item)}
                                    className="text-destructive hover:underline"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                    <label className="text-sm font-medium">Event Image</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="file"
                                checked={imageSource === "file"}
                                onChange={() => {
                                    setImageSource("file");
                                    setImageUrl("");
                                    setImagePreview(null);
                                }}
                            />
                            Upload File
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="url"
                                checked={imageSource === "url"}
                                onChange={() => {
                                    setImageSource("url");
                                    setImage(null);
                                    setImagePreview(null);
                                }}
                            />
                            Image URL
                        </label>
                    </div>

                    {imageSource === "file" ? (
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full"
                            />
                            {imagePreview && (
                                <img src={imagePreview} alt="Preview" className="mt-4 max-w-md rounded-md" />
                            )}
                        </div>
                    ) : (
                        <FormInput
                            label="Image URL"
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                    )}
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}

