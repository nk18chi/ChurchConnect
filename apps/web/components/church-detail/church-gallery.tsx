"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ChurchGalleryProps {
  heroImageUrl?: string | null;
  photos: Array<{
    id: string;
    url: string;
    caption?: string | null;
  }>;
  churchName: string;
}

export function ChurchGallery({ heroImageUrl, photos, churchName }: ChurchGalleryProps) {
  const [showModal, setShowModal] = useState(false);

  // Combine hero image with other photos
  const allPhotos = [
    ...(heroImageUrl ? [{ id: 'hero', url: heroImageUrl, caption: null }] : []),
    ...photos,
  ];

  // Get first 5 photos for the grid
  const displayPhotos = allPhotos.slice(0, 5);
  const remainingCount = allPhotos.length - 5;

  if (displayPhotos.length === 0) {
    return (
      <div className="w-full h-[450px] bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">No photos available</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-[450px] grid grid-cols-4 gap-2">
        {/* Large image on the left */}
        <div className="col-span-2 row-span-2 relative overflow-hidden rounded-l-xl">
          <img
            src={displayPhotos[0].url}
            alt={displayPhotos[0].caption || churchName}
            className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition"
            onClick={() => setShowModal(true)}
          />
        </div>

        {/* 4 smaller images on the right */}
        {displayPhotos.slice(1, 5).map((photo, index) => (
          <div
            key={photo.id}
            className={`relative overflow-hidden ${
              index === 1 ? 'rounded-tr-xl' : ''
            } ${index === 3 ? 'rounded-br-xl' : ''}`}
          >
            <img
              src={photo.url}
              alt={photo.caption || `${churchName} photo ${index + 2}`}
              className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition"
              onClick={() => setShowModal(true)}
            />
          </div>
        ))}

        {/* Show all photos button */}
        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-4 right-4 bg-white border border-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-2"
        >
          <svg
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="presentation"
            focusable="false"
            className="w-4 h-4"
          >
            <path d="M3 11.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-10-5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-10-5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"></path>
          </svg>
          Show all photos
        </button>
      </div>

      {/* Photo Gallery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 text-white">
            <button
              onClick={() => setShowModal(false)}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-sm">
              {allPhotos.length} {allPhotos.length === 1 ? 'photo' : 'photos'}
            </div>
          </div>

          {/* Photo Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPhotos.map((photo, index) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.url}
                    alt={photo.caption || `${churchName} photo ${index + 1}`}
                    className="w-full h-auto rounded-lg"
                  />
                  {photo.caption && (
                    <p className="text-white text-sm mt-2">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
