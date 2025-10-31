"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/form-input";
import { FormTextarea } from "@/components/form-textarea";
import { Plus, Trash2, Save, X, CalendarDays } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
  registrationUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type EventFormData = z.infer<typeof eventSchema>;

// Mock data
const mockEvents = [
  {
    id: "1",
    title: "Community Outreach Day",
    description: "Join us for a day of serving our community",
    startDate: "2024-11-15",
    location: "City Park",
    isOnline: false,
  },
];

export default function EventsPage() {
  const [events, setEvents] = useState(mockEvents);
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const onSubmit = async (data: EventFormData) => {
    // TODO: Implement GraphQL mutation
    console.log("Event data:", data);
    alert("Event saved successfully!");
    setIsAdding(false);
    reset();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-gray-600">
            Manage your church events and gatherings
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            reset();
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Event</h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormInput
                label="Event Title"
                name="title"
                register={register}
                error={errors.title}
                placeholder="Community Outreach Day"
                required
              />

              <FormTextarea
                label="Description"
                name="description"
                register={register}
                error={errors.description}
                placeholder="Describe your event..."
                rows={3}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Start Date"
                  name="startDate"
                  type="datetime-local"
                  register={register}
                  error={errors.startDate}
                  required
                />
                <FormInput
                  label="End Date"
                  name="endDate"
                  type="datetime-local"
                  register={register}
                  error={errors.endDate}
                />
              </div>

              <FormInput
                label="Location"
                name="location"
                register={register}
                error={errors.location}
                placeholder="City Park or Online"
              />

              <FormInput
                label="Registration URL"
                name="registrationUrl"
                register={register}
                error={errors.registrationUrl}
                placeholder="https://..."
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  {...register("isOnline")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isOnline" className="text-sm text-gray-700">
                  This is an online event
                </label>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    reset();
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(event.startDate).toLocaleDateString()}
                    </p>
                    {event.description && (
                      <p className="mt-2 text-sm text-gray-700">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="mt-2 text-sm text-gray-500">
                        Location: {event.location}
                      </p>
                    )}
                    {event.isOnline && (
                      <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        Online Event
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No events yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first event to engage your community.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
