"use client";

import { useState } from "react";
import { useCreateEvent } from "@/lib/hooks/api/events.queries";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { X, Plus } from "lucide-react";
import { useOrganizers } from "@/lib/hooks/use-organizers";

export default function AddEventsPage() {
    const { organizers, isLoading: isLoadingOrganizers } = useOrganizers();
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
        organizer: "",
        tags: [] as string[],
        agenda: [] as string[],
    });
    const [imageSource, setImageSource] = useState<"file" | "url">("file");
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [agendaInput, setAgendaInput] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const createEventMutation = useCreateEvent();

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Validate title
        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        // Validate description
        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        // Validate overview
        if (!formData.overview.trim()) {
            newErrors.overview = "Overview is required";
        }

        // Validate venue
        if (!formData.venue.trim()) {
            newErrors.venue = "Venue is required";
        }

        // Validate location
        if (!formData.location.trim()) {
            newErrors.location = "Location is required";
        }

        // Validate date
        if (!formData.date.trim()) {
            newErrors.date = "Date is required";
        }

        // Validate time
        if (!formData.time.trim()) {
            newErrors.time = "Time is required";
        }

        // Validate mode
        if (!formData.mode) {
            newErrors.mode = "Mode is required";
        }

        // Validate audience
        if (!formData.audience.trim()) {
            newErrors.audience = "Audience is required";
        }

        // Validate organizer
        if (!formData.organizer.trim()) {
            newErrors.organizer = "Organizer is required";
        }

        // Validate tags
        if (formData.tags.length === 0) {
            newErrors.tags = "At least one tag is required";
        }

        // Validate agenda
        if (formData.agenda.length === 0) {
            newErrors.agenda = "At least one agenda item is required";
        }

        // Validate image
        if (imageSource === "file" && !image) {
            newErrors.image = "Image file is required";
        } else if (imageSource === "url" && !imageUrl.trim()) {
            newErrors.image = "Image URL is required";
        } else if (imageSource === "url" && imageUrl.trim()) {
            // Validate URL format
            try {
                new URL(imageUrl.trim());
            } catch {
                newErrors.image = "Please enter a valid image URL";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append("title", formData.title.trim());
        formDataToSend.append("description", formData.description.trim());
        formDataToSend.append("overview", formData.overview.trim());
        formDataToSend.append("venue", formData.venue.trim());
        formDataToSend.append("location", formData.location.trim());
        formDataToSend.append("date", formData.date.trim());
        formDataToSend.append("time", formData.time.trim());
        formDataToSend.append("mode", formData.mode);
        formDataToSend.append("audience", formData.audience.trim());
        formDataToSend.append("organizer", formData.organizer.trim());
        formDataToSend.append("tags", JSON.stringify(formData.tags));
        formDataToSend.append("agenda", JSON.stringify(formData.agenda));
        formDataToSend.append("imageSource", imageSource);
        
        if (imageSource === "file" && image) {
            formDataToSend.append("image", image);
        } else if (imageSource === "url" && imageUrl.trim()) {
            formDataToSend.append("imageUrl", imageUrl.trim());
        }

        const createPromise = createEventMutation.mutateAsync(formDataToSend)
            .then((data) => {
                // Reset form
                setFormData({
                    title: "",
                    description: "",
                    overview: "",
                    venue: "",
                    location: "",
                    date: "",
                    time: "",
                    mode: "Virtual",
                    audience: "",
                    organizer: "",
                    tags: [],
                    agenda: [],
                });
                setImage(null);
                setImageUrl("");
                setImagePreview(null);
                setImageSource("file");
                setTagInput("");
                setAgendaInput("");
                return data;
            });

        toast.promise(createPromise, {
            loading: 'Creating event...',
            success: (data) => data.message || `Event "${formData.title.trim()}" has been created.`,
            error: (error) => error instanceof Error ? error.message : "An error occurred while creating the event. Please try again.",
        });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        if (errors.image) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.image;
                return newErrors;
            });
        }
    };

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setImageUrl(url);
        if (url.trim()) {
            try {
                new URL(url.trim());
                setImagePreview(url.trim());
            } catch {
                setImagePreview(null);
            }
        } else {
            setImagePreview(null);
        }
        if (errors.image) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.image;
                return newErrors;
            });
        }
    };

    const handleImageSourceChange = (source: "file" | "url") => {
        setImageSource(source);
        setImage(null);
        setImageUrl("");
        setImagePreview(null);
        if (errors.image) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.image;
                return newErrors;
            });
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput("");
            if (errors.tags) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.tags;
                    return newErrors;
                });
            }
        }
    };

    const removeTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const addAgenda = () => {
        if (agendaInput.trim() && !formData.agenda.includes(agendaInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                agenda: [...prev.agenda, agendaInput.trim()],
            }));
            setAgendaInput("");
            if (errors.agenda) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.agenda;
                    return newErrors;
                });
            }
        }
    };

    const removeAgenda = (item: string) => {
        setFormData((prev) => ({
            ...prev,
            agenda: prev.agenda.filter((a) => a !== item),
        }));
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Add Events</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new event to the platform
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <div className="border rounded-lg bg-card shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">Event Information</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Fill in the details to create a new event
                            </p>
                        </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Title */}
                            <FormInput
                                id="title"
                                name="title"
                                type="text"
                                label="Event Title"
                                placeholder="React Conference 2024"
                                value={formData.title}
                                onChange={handleChange}
                                error={errors.title}
                                required
                            />

                            {/* Description */}
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium text-foreground block">
                                    Description <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Brief description of the event..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                                        errors.description ? "border-destructive focus-visible:ring-destructive" : ""
                                    }`}
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive mt-1.5">{errors.description}</p>
                                )}
                            </div>

                            {/* Overview */}
                            <div className="space-y-2">
                                <label htmlFor="overview" className="text-sm font-medium text-foreground block">
                                    Overview <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    id="overview"
                                    name="overview"
                                    placeholder="Detailed overview of the event..."
                                    value={formData.overview}
                                    onChange={handleChange}
                                    rows={4}
                                    className={`flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                                        errors.overview ? "border-destructive focus-visible:ring-destructive" : ""
                                    }`}
                                />
                                {errors.overview && (
                                    <p className="text-xs text-destructive mt-1.5">{errors.overview}</p>
                                )}
                            </div>

                            {/* Image */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground block">
                                    Event Image <span className="text-destructive">*</span>
                                </label>
                                
                                {/* Image Source Toggle */}
                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="imageSource"
                                            value="file"
                                            checked={imageSource === "file"}
                                            onChange={() => handleImageSourceChange("file")}
                                            className="w-4 h-4 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-foreground">Upload File</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="imageSource"
                                            value="url"
                                            checked={imageSource === "url"}
                                            onChange={() => handleImageSourceChange("url")}
                                            className="w-4 h-4 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-foreground">Image URL</span>
                                    </label>
                                </div>

                                {/* File Upload */}
                                {imageSource === "file" && (
                                    <div className="space-y-2">
                                        <input
                                            id="image"
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                                                errors.image ? "border-destructive focus-visible:ring-destructive" : ""
                                            }`}
                                        />
                                    </div>
                                )}

                                {/* Image URL Input */}
                                {imageSource === "url" && (
                                    <div className="space-y-2">
                                        <FormInput
                                            id="imageUrl"
                                            name="imageUrl"
                                            type="url"
                                            label=""
                                            placeholder="https://example.com/image.jpg"
                                            value={imageUrl}
                                            onChange={handleImageUrlChange}
                                            error={errors.image}
                                            required
                                        />
                                    </div>
                                )}

                                {errors.image && (
                                    <p className="text-xs text-destructive mt-1.5">{errors.image}</p>
                                )}
                                
                                {imagePreview && (
                                    <div className="mt-2">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full max-w-md h-48 object-cover rounded-lg border"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Venue */}
                                <FormInput
                                    id="venue"
                                    name="venue"
                                    type="text"
                                    label="Venue"
                                    placeholder="Convention Center"
                                    value={formData.venue}
                                    onChange={handleChange}
                                    error={errors.venue}
                                    required
                                />

                                {/* Location */}
                                <FormInput
                                    id="location"
                                    name="location"
                                    type="text"
                                    label="Location"
                                    placeholder="New York, USA"
                                    value={formData.location}
                                    onChange={handleChange}
                                    error={errors.location}
                                    required
                                />

                                {/* Date */}
                                <FormInput
                                    id="date"
                                    name="date"
                                    type="date"
                                    label="Date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    error={errors.date}
                                    required
                                />

                                {/* Time */}
                                <FormInput
                                    id="time"
                                    name="time"
                                    type="time"
                                    label="Time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    error={errors.time}
                                    required
                                />

                                {/* Mode */}
                                <FormSelect
                                    id="mode"
                                    name="mode"
                                    label="Mode"
                                    value={formData.mode}
                                    onChange={handleChange}
                                    options={[
                                        { value: "Virtual", label: "Virtual" },
                                        { value: "Onsite", label: "Onsite" },
                                        { value: "Hybrid", label: "Hybrid" },
                                    ]}
                                    error={errors.mode}
                                    required
                                />

                                {/* Audience */}
                                <FormInput
                                    id="audience"
                                    name="audience"
                                    type="text"
                                    label="Audience"
                                    placeholder="Developers, Designers, etc."
                                    value={formData.audience}
                                    onChange={handleChange}
                                    error={errors.audience}
                                    required
                                />
                            </div>

                            {/* Organizer */}
                            <FormSelect
                                id="organizer"
                                name="organizer"
                                label="Organizer"
                                value={formData.organizer}
                                onChange={handleChange}
                                options={[
                                    { value: "", label: "Select an organizer..." },
                                    ...organizers.map((org) => ({
                                        value: org.name,
                                        label: org.name,
                                    })),
                                ]}
                                error={errors.organizer}
                                required
                            />

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground block">
                                    Tags <span className="text-destructive">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a tag..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addTag}
                                        className="whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                {errors.tags && (
                                    <p className="text-xs text-destructive mt-1.5">{errors.tags}</p>
                                )}
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-destructive"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Agenda */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground block">
                                    Agenda <span className="text-destructive">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add an agenda item..."
                                        value={agendaInput}
                                        onChange={(e) => setAgendaInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addAgenda();
                                            }
                                        }}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addAgenda}
                                        className="whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                {errors.agenda && (
                                    <p className="text-xs text-destructive mt-1.5">{errors.agenda}</p>
                                )}
                                {formData.agenda.length > 0 && (
                                    <ul className="mt-2 space-y-2">
                                        {formData.agenda.map((item, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
                                            >
                                                <span className="text-sm">{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAgenda(item)}
                                                    className="text-destructive hover:text-destructive/80"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFormData({
                                        title: "",
                                        description: "",
                                        overview: "",
                                        venue: "",
                                        location: "",
                                        date: "",
                                        time: "",
                                        mode: "Virtual",
                                        audience: "",
                                        organizer: "",
                                        tags: [],
                                        agenda: [],
                                    });
                                    setImage(null);
                                    setImageUrl("");
                                    setImagePreview(null);
                                    setImageSource("file");
                                    setTagInput("");
                                    setAgendaInput("");
                                    setErrors({});
                                }}
                                disabled={createEventMutation.isPending}
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={createEventMutation.isPending}
                                size="lg"
                            >
                                {createEventMutation.isPending
                                    ? "Creating Event..."
                                    : "Create Event"}
                            </Button>
                        </div>
                    </form>
                    </div>
                </div>

                {/* Info Card Section */}
                <div className="lg:col-span-1">
                    <div className="border rounded-lg bg-card shadow-sm sticky top-4">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">Event Guidelines</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Tips for creating great events
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Event Information */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Event Details</h3>
                                <p className="text-sm text-muted-foreground">
                                    Provide clear and detailed information about your event. Include all relevant details to help attendees understand what to expect.
                                </p>
                            </div>

                            {/* Image Guidelines */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Image Requirements</h3>
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Use high-quality images (recommended: 1200x630px)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Supported formats: JPG, PNG, WebP</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Keep file size under 5MB for faster uploads</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Tags & Agenda */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Tags & Agenda</h3>
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Add relevant tags to help users discover your event</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Include a detailed agenda with time slots</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Use clear, descriptive agenda items</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Event Modes */}
                            <div className="pt-4 border-t space-y-3">
                                <h3 className="font-semibold text-sm">Event Modes</h3>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <div>
                                            <span className="font-medium">Virtual:</span> Virtual events accessible from anywhere
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <div>
                                            <span className="font-medium">Onsite:</span> In-person events at a physical location
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-purple-500 mt-0.5">•</span>
                                        <div>
                                            <span className="font-medium">Hybrid:</span> Combination of virtual and onsite attendance
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Tips */}
                            <div className="pt-4 border-t space-y-3">
                                <h3 className="font-semibold text-sm">Quick Tips</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Double-check all dates and times before submitting</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Ensure organizer name matches an existing organizer</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Add at least 3-5 relevant tags for better discoverability</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Include detailed agenda items with time information</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
