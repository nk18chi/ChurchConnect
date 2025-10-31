import { cloudinary } from './config'

export interface SignedUploadParams {
  folder: string
  publicId?: string
  transformation?: string
  resourceType?: 'image' | 'video' | 'raw' | 'auto'
}

export interface UploadSignature {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}

/**
 * Generate a signed upload URL for client-side uploads
 * This ensures only authorized users can upload to specific folders
 */
export async function generateUploadSignature(
  params: SignedUploadParams
): Promise<UploadSignature> {
  const timestamp = Math.round(Date.now() / 1000)

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: params.folder,
      ...(params.publicId && { public_id: params.publicId }),
      ...(params.transformation && { transformation: params.transformation }),
    },
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder: params.folder,
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'limit' | 'scale'
    quality?: 'auto' | number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
  }
): string {
  return cloudinary.url(publicId, {
    width: options?.width,
    height: options?.height,
    crop: options?.crop || 'fill',
    quality: options?.quality || 'auto',
    fetch_format: options?.format || 'auto',
    secure: true,
  })
}
