'use client'

import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { Image as ImageIcon, Trash2, Loader2, Edit2, X, Check } from 'lucide-react'
import { ImageUploader, type UploadedImage } from '@/components/upload/image-uploader'

// GraphQL Queries and Mutations
const GET_MY_CHURCH_PHOTOS = gql`
  query GetMyChurchPhotos($category: String) {
    myChurchPhotos(category: $category) {
      id
      url
      publicId
      caption
      category
      order
      createdAt
    }
  }
`

const ADD_CHURCH_PHOTO = gql`
  mutation AddChurchPhoto($input: AddChurchPhotoInput!) {
    addChurchPhoto(input: $input) {
      id
      url
      publicId
      caption
      category
      order
      createdAt
    }
  }
`

const UPDATE_CHURCH_PHOTO = gql`
  mutation UpdateChurchPhoto($id: String!, $input: UpdateChurchPhotoInput!) {
    updateChurchPhoto(id: $id, input: $input) {
      id
      caption
      category
      order
    }
  }
`

const DELETE_CHURCH_PHOTO = gql`
  mutation DeleteChurchPhoto($id: String!) {
    deleteChurchPhoto(id: $id)
  }
`

interface ChurchPhoto {
  id: string
  url: string
  publicId: string
  caption: string | null
  category: string
  order: number
  createdAt: string
}

const PHOTO_CATEGORIES = [
  { value: 'worship', label: 'Worship Service' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'building', label: 'Building/Facility' },
  { value: 'events', label: 'Events' },
  { value: 'other', label: 'Other' },
]

export default function PhotosPage() {
  const [selectedCategory, setSelectedCategory] = useState('worship')
  const [caption, setCaption] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  // GraphQL Hooks
  const { data, loading, refetch } = useQuery(GET_MY_CHURCH_PHOTOS, {
    variables: { category: filterCategory },
  })

  const [addPhoto, { loading: adding }] = useMutation(ADD_CHURCH_PHOTO, {
    onCompleted: () => {
      setCaption('')
      setUploadError(null)
      refetch()
    },
    onError: (error) => {
      setUploadError(error.message)
    },
  })

  const [updatePhoto] = useMutation(UPDATE_CHURCH_PHOTO, {
    onCompleted: () => {
      setEditingPhotoId(null)
      setEditCaption('')
      refetch()
    },
    onError: (error) => {
      alert(`Failed to update photo: ${error.message}`)
    },
  })

  const [deletePhoto] = useMutation(DELETE_CHURCH_PHOTO, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      alert(`Failed to delete photo: ${error.message}`)
    },
  })

  const photos: ChurchPhoto[] = data?.myChurchPhotos || []

  // Handle upload completion
  const handleUploadComplete = async (image: UploadedImage) => {
    try {
      await addPhoto({
        variables: {
          input: {
            url: image.url,
            publicId: image.publicId,
            caption: caption || null,
            category: selectedCategory,
          },
        },
      })
    } catch (error) {
      // Error handled by onError callback
      console.error('Upload error:', error)
    }
  }

  // Handle delete
  const handleDelete = async (photo: ChurchPhoto) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      // First delete from GraphQL/database
      await deletePhoto({
        variables: { id: photo.id },
      })

      // Then delete from Cloudinary
      await fetch('/api/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: photo.publicId,
          photoId: photo.id,
        }),
      })
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // Handle caption edit
  const handleStartEdit = (photo: ChurchPhoto) => {
    setEditingPhotoId(photo.id)
    setEditCaption(photo.caption || '')
  }

  const handleSaveEdit = async (photoId: string) => {
    try {
      await updatePhoto({
        variables: {
          id: photoId,
          input: {
            caption: editCaption || null,
          },
        },
      })
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingPhotoId(null)
    setEditCaption('')
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
        <p className="mt-1 text-gray-600">
          Upload and manage your church photos
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Upload New Photo</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <ImageUploader
              photoType="gallery"
              onUploadComplete={handleUploadComplete}
              onUploadError={setUploadError}
              maxSizeMB={5}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PHOTO_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="caption" className="mb-1 block text-sm font-medium text-gray-700">
                Caption (optional)
              </label>
              <input
                id="caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe this photo..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {uploadError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {uploadError}
              </div>
            )}

            {adding && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                Saving photo to database...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Your Photos ({photos.length})
          </h2>

          <div className="flex items-center gap-2">
            <label htmlFor="filter" className="text-sm text-gray-600">
              Filter:
            </label>
            <select
              id="filter"
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {PHOTO_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {photos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Church photo'}
                  className="h-48 w-full object-cover"
                />
                <div className="p-3">
                  {editingPhotoId === photo.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Enter caption..."
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(photo.id)}
                          className="flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700">
                        {photo.caption || 'No caption'}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {PHOTO_CATEGORIES.find((c) => c.value === photo.category)?.label || photo.category}
                      </span>
                    </>
                  )}
                </div>
                {editingPhotoId !== photo.id && (
                  <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleStartEdit(photo)}
                      className="rounded-lg bg-blue-500 p-2 text-white shadow-lg transition-colors hover:bg-blue-600"
                      aria-label="Edit caption"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(photo)}
                      className="rounded-lg bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
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
  )
}
