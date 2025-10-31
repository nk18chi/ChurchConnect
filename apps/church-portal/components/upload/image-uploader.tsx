'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, AlertCircle } from 'lucide-react'

/**
 * Represents an uploaded image with its metadata from Cloudinary
 */
export interface UploadedImage {
  url: string
  publicId: string
  width: number
  height: number
}

/**
 * Props for the ImageUploader component
 */
interface ImageUploaderProps {
  /** Type of photo being uploaded (determines Cloudinary folder structure) */
  photoType: 'hero' | 'gallery' | 'staff' | 'event'
  /** Callback when upload completes successfully */
  onUploadComplete: (image: UploadedImage) => void
  /** Callback when an error occurs during upload */
  onUploadError?: (error: string) => void
  /** Maximum file size in megabytes (default: 5MB) */
  maxSizeMB?: number
  /** Optional aspect ratio for preview display (e.g., "16/9", "4/3") */
  aspectRatio?: string
  /** Additional CSS classes for the container */
  className?: string
}

/**
 * ImageUploader Component
 *
 * A React component for uploading images to Cloudinary via server-signed URLs.
 *
 * Upload Flow:
 * 1. User selects an image file
 * 2. Component validates file type and size
 * 3. Requests signed upload URL from `/api/upload/signature`
 * 4. Uploads image directly to Cloudinary using signed parameters
 * 5. Returns uploaded image URL and publicId to parent via onUploadComplete
 *
 * Features:
 * - Client-side file validation (type and size)
 * - Real-time upload progress indication
 * - Image preview before and during upload
 * - Error handling with user-friendly messages
 * - Secure uploads using server-side signatures
 *
 * @example
 * ```tsx
 * <ImageUploader
 *   photoType="gallery"
 *   onUploadComplete={(image) => {
 *     console.log('Uploaded:', image.url, image.publicId)
 *   }}
 *   onUploadError={(error) => {
 *     console.error('Upload failed:', error)
 *   }}
 *   maxSizeMB={5}
 * />
 * ```
 */
export function ImageUploader({
  photoType,
  onUploadComplete,
  onUploadError,
  maxSizeMB = 5,
  aspectRatio,
  className = '',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handles file selection and initiates the upload process
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset error state
    setError(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select an image file (PNG, JPG, WebP, etc.)'
      setError(errorMsg)
      onUploadError?.(errorMsg)
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      const errorMsg = `Image must be less than ${maxSizeMB}MB (current size: ${fileSizeMB.toFixed(2)}MB)`
      setError(errorMsg)
      onUploadError?.(errorMsg)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setIsUploading(true)
      setUploadProgress(10) // Initial progress

      // Step 1: Request signed upload parameters from our API
      setUploadProgress(20)
      const signatureRes = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoType }),
      })

      if (!signatureRes.ok) {
        const errorData = await signatureRes.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get upload signature')
      }

      const {
        signature,
        timestamp,
        cloudName,
        apiKey,
        folder,
      } = await signatureRes.json()

      // Step 2: Upload to Cloudinary using signed parameters
      setUploadProgress(40)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('signature', signature)
      formData.append('timestamp', timestamp.toString())
      formData.append('api_key', apiKey)
      formData.append('folder', folder)

      setUploadProgress(60)
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary')
      }

      setUploadProgress(80)
      const uploadData = await uploadRes.json()

      // Step 3: Return uploaded image data to parent component
      setUploadProgress(100)
      onUploadComplete({
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        width: uploadData.width,
        height: uploadData.height,
      })

      // Reset state after successful upload
      setPreview(null)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to upload image'
      setError(errorMsg)
      onUploadError?.(errorMsg)
      setPreview(null)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Clears the current preview and resets the file input
   */
  const handleClearPreview = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <label className="block">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          aria-label="Select image to upload"
        />
        <div
          className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-primary'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {preview ? (
            <div className="relative p-4">
              <img
                src={preview}
                alt="Upload preview"
                className="mx-auto max-h-64 rounded object-contain"
                style={aspectRatio ? { aspectRatio } : undefined}
              />
              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleClearPreview()
                  }}
                  className="absolute right-6 top-6 rounded-full bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600"
                  aria-label="Clear preview"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                  <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
                  <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-white text-sm mt-2 font-medium">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-700">
                {isUploading
                  ? 'Uploading...'
                  : 'Click to select image or drag and drop'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, WebP up to {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
