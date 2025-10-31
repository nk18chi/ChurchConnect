"use client";

import { useState } from "react";
import { Image as ImageIcon, Upload, Trash2 } from "lucide-react";

// Mock data
const mockPhotos = [
  {
    id: "1",
    url: "https://via.placeholder.com/400x300",
    caption: "Sunday service",
    category: "worship",
  },
];

export default function PhotosPage() {
  const [photos, setPhotos] = useState(mockPhotos);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      setPhotos(photos.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="mt-1 text-gray-600">
            Manage your church photos and images
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Upload className="h-4 w-4" />
          Upload Photos
        </button>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop photos here, or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF up to 10MB
          </p>
          <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Select Photos
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Image upload will be integrated with Cloudinary in a future phase
          </p>
        </div>

        {photos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="h-48 w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-sm text-gray-700">{photo.caption}</p>
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {photo.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute right-2 top-2 rounded-lg bg-red-500 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No photos yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload photos to showcase your church community.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
