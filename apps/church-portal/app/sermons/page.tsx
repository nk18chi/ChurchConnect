"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/form-input";
import { FormTextarea } from "@/components/form-textarea";
import { Plus, Edit2, Trash2, Save, X, Video } from "lucide-react";

const sermonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  preacher: z.string().min(1, "Preacher is required"),
  passage: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  youtubeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  podcastUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type SermonFormData = z.infer<typeof sermonSchema>;

// Mock data
const mockSermons = [
  {
    id: "1",
    title: "Walking in Faith",
    preacher: "Pastor John",
    passage: "Hebrews 11:1-6",
    date: "2024-10-27",
    youtubeUrl: "https://youtube.com/watch?v=example",
  },
];

export default function SermonsPage() {
  const [sermons, setSermons] = useState(mockSermons);
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SermonFormData>({
    resolver: zodResolver(sermonSchema),
  });

  const onSubmit = async (data: SermonFormData) => {
    // TODO: Implement GraphQL mutation
    console.log("Sermon data:", data);
    alert("Sermon saved successfully!");
    setIsAdding(false);
    reset();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this sermon?")) {
      setSermons(sermons.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sermons</h1>
          <p className="mt-1 text-gray-600">
            Manage your sermon archive and messages
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
          Add Sermon
        </button>
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Sermon
              </h2>
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
                label="Title"
                name="title"
                register={register}
                error={errors.title}
                placeholder="Sermon title"
                required
              />

              <FormTextarea
                label="Description"
                name="description"
                register={register}
                error={errors.description}
                placeholder="Brief description of the sermon..."
                rows={3}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Preacher"
                  name="preacher"
                  register={register}
                  error={errors.preacher}
                  placeholder="Pastor name"
                  required
                />
                <FormInput
                  label="Date"
                  name="date"
                  type="date"
                  register={register}
                  error={errors.date}
                  required
                />
              </div>

              <FormInput
                label="Bible Passage"
                name="passage"
                register={register}
                error={errors.passage}
                placeholder="e.g., John 3:16-21"
              />

              <FormInput
                label="YouTube URL"
                name="youtubeUrl"
                register={register}
                error={errors.youtubeUrl}
                placeholder="https://youtube.com/watch?v=..."
              />

              <FormInput
                label="Podcast URL"
                name="podcastUrl"
                register={register}
                error={errors.podcastUrl}
                placeholder="https://..."
              />

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

        {sermons.length > 0 ? (
          <div className="space-y-4">
            {sermons.map((sermon) => (
              <div
                key={sermon.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sermon.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {sermon.preacher} • {new Date(sermon.date).toLocaleDateString()}
                    </p>
                    {sermon.passage && (
                      <p className="mt-1 text-sm text-gray-500">
                        {sermon.passage}
                      </p>
                    )}
                    {sermon.youtubeUrl && (
                      <a
                        href={sermon.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-primary hover:underline"
                      >
                        Watch on YouTube
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(sermon.id)}
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
            <Video className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No sermons yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Start sharing your messages with the community.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
