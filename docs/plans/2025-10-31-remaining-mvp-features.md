# ChurchConnect Remaining MVP Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining MVP features for ChurchConnect Japan: Cloudinary image uploads, email notifications, reCAPTCHA spam protection, full-text search, and missing profile sections.

**Architecture:** Integrate Cloudinary for file uploads with server-side signed URLs, implement email service (Resend) for notifications, add reCAPTCHA to contact forms, implement PostgreSQL full-text search, and complete church profile content sections.

**Tech Stack:** Next.js 14, Cloudinary SDK, Resend email API, Google reCAPTCHA v3, PostgreSQL full-text search, Prisma, GraphQL

---

## Phase 1: Cloudinary Image Upload Integration

### Task 1: Set Up Cloudinary Package and Configuration

**Files:**
- Create: `packages/cloudinary/package.json`
- Create: `packages/cloudinary/tsconfig.json`
- Create: `packages/cloudinary/src/index.ts`
- Create: `packages/cloudinary/src/config.ts`
- Create: `packages/cloudinary/src/upload.ts`
- Create: `packages/cloudinary/.env.example`

**Step 1: Create package directory**

```bash
mkdir -p packages/cloudinary/src
```

**Step 2: Create package.json**

File: `packages/cloudinary/package.json`
```json
{
  "name": "@repo/cloudinary",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "cloudinary": "^2.0.3"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/node": "^20.12.7",
    "typescript": "^5.4.5"
  }
}
```

**Step 3: Create TypeScript config**

File: `packages/cloudinary/tsconfig.json`
```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create Cloudinary configuration**

File: `packages/cloudinary/src/config.ts`
```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }
```

**Step 5: Create upload utilities**

File: `packages/cloudinary/src/upload.ts`
```typescript
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
```

**Step 6: Create index exports**

File: `packages/cloudinary/src/index.ts`
```typescript
export { cloudinary } from './config'
export {
  generateUploadSignature,
  deleteImage,
  getOptimizedImageUrl,
  type SignedUploadParams,
  type UploadSignature,
} from './upload'
```

**Step 7: Create .env.example**

File: `packages/cloudinary/.env.example`
```
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Step 8: Install dependencies**

```bash
cd packages/cloudinary
pnpm install
cd ../..
```

**Step 9: Update root .env.example**

File: `.env.example` (add to existing file)
```
# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Step 10: Commit**

```bash
git add packages/cloudinary .env.example
git commit -m "feat(cloudinary): add cloudinary package for image uploads"
```

---

### Task 2: Create Upload API Endpoint for Church Portal

**Files:**
- Create: `apps/church-portal/app/api/upload/signature/route.ts`
- Create: `apps/church-portal/app/api/upload/delete/route.ts`
- Modify: `apps/church-portal/package.json`

**Step 1: Add Cloudinary dependency to church-portal**

File: `apps/church-portal/package.json` (add to dependencies)
```json
{
  "dependencies": {
    "@repo/cloudinary": "workspace:*"
  }
}
```

Run: `pnpm install`

**Step 2: Create upload signature API route**

File: `apps/church-portal/app/api/upload/signature/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@repo/auth'
import { generateUploadSignature } from '@repo/cloudinary'
import { prisma } from '@repo/database'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CHURCH_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get church for this admin
    const church = await prisma.church.findUnique({
      where: { adminUserId: session.user.id },
      select: { id: true },
    })

    if (!church) {
      return NextResponse.json(
        { error: 'No church found for this admin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { photoType } = body // 'hero', 'gallery', 'staff', 'event'

    // Validate photo type
    const validTypes = ['hero', 'gallery', 'staff', 'event']
    if (!photoType || !validTypes.includes(photoType)) {
      return NextResponse.json(
        { error: 'Invalid photo type' },
        { status: 400 }
      )
    }

    // Generate signed upload parameters
    const folder = `churchconnect/churches/${church.id}/${photoType}`
    const signature = await generateUploadSignature({ folder })

    return NextResponse.json(signature)
  } catch (error) {
    console.error('Upload signature error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create delete image API route**

File: `apps/church-portal/app/api/upload/delete/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@repo/auth'
import { deleteImage } from '@repo/cloudinary'
import { prisma } from '@repo/database'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'CHURCH_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { publicId, photoId } = body

    if (!publicId || !photoId) {
      return NextResponse.json(
        { error: 'Missing publicId or photoId' },
        { status: 400 }
      )
    }

    // Verify photo belongs to this admin's church
    const photo = await prisma.churchPhoto.findUnique({
      where: { id: photoId },
      include: { church: true },
    })

    if (!photo || photo.church.adminUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Photo not found or unauthorized' },
        { status: 403 }
      )
    }

    // Delete from Cloudinary
    await deleteImage(publicId)

    // Delete from database
    await prisma.churchPhoto.delete({
      where: { id: photoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
```

**Step 4: Commit**

```bash
git add apps/church-portal/app/api/upload apps/church-portal/package.json
git commit -m "feat(church-portal): add upload signature and delete API routes"
```

---

### Task 3: Create Image Upload Component

**Files:**
- Create: `apps/church-portal/components/upload/image-uploader.tsx`
- Create: `apps/church-portal/components/upload/upload-widget.tsx`

**Step 1: Create image uploader component**

File: `apps/church-portal/components/upload/image-uploader.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@repo/ui'

export interface UploadedImage {
  url: string
  publicId: string
  width: number
  height: number
}

interface ImageUploaderProps {
  photoType: 'hero' | 'gallery' | 'staff' | 'event'
  onUploadComplete: (image: UploadedImage) => void
  onUploadError?: (error: string) => void
  maxSizeMB?: number
  aspectRatio?: string
  className?: string
}

export function ImageUploader({
  photoType,
  onUploadComplete,
  onUploadError,
  maxSizeMB = 5,
  aspectRatio,
  className = '',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError?.('Please select an image file')
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      onUploadError?.(`Image must be less than ${maxSizeMB}MB`)
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

      // Get signed upload parameters from API
      const signatureRes = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoType }),
      })

      if (!signatureRes.ok) {
        throw new Error('Failed to get upload signature')
      }

      const {
        signature,
        timestamp,
        cloudName,
        apiKey,
        folder,
      } = await signatureRes.json()

      // Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('signature', signature)
      formData.append('timestamp', timestamp.toString())
      formData.append('api_key', apiKey)
      formData.append('folder', folder)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadData = await uploadRes.json()

      onUploadComplete({
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        width: uploadData.width,
        height: uploadData.height,
      })

      setPreview(null)
    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.(
        error instanceof Error ? error.message : 'Failed to upload image'
      )
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={className}>
      <label className="block">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        <div
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary ${
            isUploading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-64 rounded"
                style={aspectRatio ? { aspectRatio } : undefined}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isUploading
                  ? 'Uploading...'
                  : 'Click to select image or drag and drop'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, WebP up to {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/church-portal/components/upload
git commit -m "feat(church-portal): add image uploader component with Cloudinary integration"
```

---

### Task 4: Update Photos Page to Use Cloudinary

**Files:**
- Modify: `apps/church-portal/app/photos/page.tsx`

**Step 1: Replace photos page with real Cloudinary integration**

File: `apps/church-portal/app/photos/page.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Image as ImageIcon, Trash2, Loader2 } from 'lucide-react'
import { ImageUploader, type UploadedImage } from '@/components/upload/image-uploader'
import { Button, Input, Label, Select } from '@repo/ui'
import { useMutation, useQuery } from '@apollo/client'
import { gql } from '@apollo/client'

const GET_CHURCH_PHOTOS = gql`
  query GetChurchPhotos {
    myChurch {
      id
      photos {
        id
        url
        caption
        category
        order
        createdAt
      }
    }
  }
`

const ADD_CHURCH_PHOTO = gql`
  mutation AddChurchPhoto($input: AddChurchPhotoInput!) {
    addChurchPhoto(input: $input) {
      id
      url
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
  caption: string | null
  category: string
  order: number
  createdAt: string
}

export default function PhotosPage() {
  const { data: session } = useSession()
  const [selectedCategory, setSelectedCategory] = useState('worship')
  const [caption, setCaption] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data, loading, refetch } = useQuery(GET_CHURCH_PHOTOS)
  const [addPhoto, { loading: adding }] = useMutation(ADD_CHURCH_PHOTO)
  const [deletePhoto] = useMutation(DELETE_CHURCH_PHOTO)

  const photos: ChurchPhoto[] = data?.myChurch?.photos || []

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
      setCaption('')
      setUploadError(null)
      refetch()
    } catch (error) {
      setUploadError('Failed to save photo')
    }
  }

  const handleDelete = async (photo: ChurchPhoto) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      // Extract public_id from URL
      const urlParts = photo.url.split('/')
      const filename = urlParts[urlParts.length - 1].split('.')[0]
      const folder = urlParts.slice(-3, -1).join('/')
      const publicId = `${folder}/${filename}`

      await deletePhoto({
        variables: { id: photo.id },
      })

      // Also delete from Cloudinary
      await fetch('/api/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId,
          photoId: photo.id,
        }),
      })

      refetch()
    } catch (error) {
      alert('Failed to delete photo')
    }
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
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="worship">Worship Service</option>
                <option value="fellowship">Fellowship</option>
                <option value="ministry">Ministry</option>
                <option value="building">Building/Facility</option>
                <option value="events">Events</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe this photo..."
              />
            </div>

            {uploadError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {uploadError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Your Photos ({photos.length})
        </h2>

        {photos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Church photo'}
                  className="h-48 w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-sm text-gray-700">
                    {photo.caption || 'No caption'}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {photo.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(photo)}
                  className="absolute right-2 top-2 rounded-lg bg-red-500 p-2 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
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
  )
}
```

**Step 2: Commit**

```bash
git add apps/church-portal/app/photos/page.tsx
git commit -m "feat(church-portal): integrate Cloudinary uploads in photos page"
```

---

## Phase 2: Email Notification System

### Task 5: Set Up Resend Email Package

**Files:**
- Create: `packages/email/package.json`
- Create: `packages/email/tsconfig.json`
- Create: `packages/email/src/index.ts`
- Create: `packages/email/src/config.ts`
- Create: `packages/email/src/templates/contact-form.tsx`
- Create: `packages/email/src/templates/review-notification.tsx`
- Create: `packages/email/src/templates/donation-receipt.tsx`

**Step 1: Create package directory**

```bash
mkdir -p packages/email/src/templates
```

**Step 2: Create package.json**

File: `packages/email/package.json`
```json
{
  "name": "@repo/email",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "resend": "^3.2.0",
    "react": "^18.2.0",
    "@react-email/components": "^0.0.16"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/node": "^20.12.7",
    "@types/react": "^18.2.79",
    "typescript": "^5.4.5"
  }
}
```

**Step 3: Create TypeScript config**

File: `packages/email/tsconfig.json`
```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM"],
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create Resend configuration**

File: `packages/email/src/config.ts`
```typescript
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = process.env.EMAIL_FROM || 'ChurchConnect <noreply@churchconnect.jp>'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@churchconnect.jp'
```

**Step 5: Create contact form email template**

File: `packages/email/src/templates/contact-form.tsx`
```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ContactFormEmailProps {
  name: string
  email: string
  subject: string
  message: string
  churchName?: string
}

export function ContactFormEmail({
  name,
  email,
  subject,
  message,
  churchName,
}: ContactFormEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New contact form submission from {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {churchName ? `Contact Form - ${churchName}` : 'Contact Form Submission'}
          </Heading>

          <Section style={section}>
            <Text style={label}>From:</Text>
            <Text style={value}>{name} ({email})</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Subject:</Text>
            <Text style={value}>{subject}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Message:</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This message was sent via ChurchConnect Japan contact form.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
}

const section = {
  padding: '0 40px',
  marginBottom: '20px',
}

const label = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666',
  margin: '0 0 4px',
}

const value = {
  fontSize: '16px',
  color: '#333',
  margin: '0',
}

const messageText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  whiteSpace: 'pre-wrap',
}

const footer = {
  padding: '0 40px',
  marginTop: '40px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
}

const footerText = {
  fontSize: '12px',
  color: '#999',
}
```

**Step 6: Create review notification template**

File: `packages/email/src/templates/review-notification.tsx`
```typescript
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ReviewNotificationEmailProps {
  churchName: string
  reviewerName: string
  reviewContent: string
  reviewDate: string
  reviewUrl: string
}

export function ReviewNotificationEmail({
  churchName,
  reviewerName,
  reviewContent,
  reviewDate,
  reviewUrl,
}: ReviewNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New review for {churchName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Review Approved</Heading>

          <Text style={text}>
            A new review has been approved and published for {churchName}.
          </Text>

          <Section style={reviewBox}>
            <Text style={reviewerText}>
              {reviewerName} • {reviewDate}
            </Text>
            <Text style={reviewText}>{reviewContent}</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={reviewUrl}>
              View Review & Respond
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You can respond to this review in your church portal.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
}

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  padding: '0 40px',
}

const reviewBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
}

const reviewerText = {
  fontSize: '14px',
  color: '#666',
  marginBottom: '8px',
}

const reviewText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  margin: '0',
}

const buttonSection = {
  padding: '0 40px',
  marginTop: '20px',
}

const button = {
  backgroundColor: '#ed1c24',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const footer = {
  padding: '0 40px',
  marginTop: '40px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
}

const footerText = {
  fontSize: '12px',
  color: '#999',
}
```

**Step 7: Create donation receipt template**

File: `packages/email/src/templates/donation-receipt.tsx`
```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface DonationReceiptEmailProps {
  donorName: string
  amount: number
  currency: string
  type: 'ONE_TIME' | 'MONTHLY'
  date: string
  receiptNumber: string
}

export function DonationReceiptEmail({
  donorName,
  amount,
  currency,
  type,
  date,
  receiptNumber,
}: DonationReceiptEmailProps) {
  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
  }).format(amount / 100) // Stripe amounts are in cents

  return (
    <Html>
      <Head />
      <Preview>Thank you for your donation to ChurchConnect Japan</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank You for Your Donation!</Heading>

          <Text style={text}>
            Dear {donorName},
          </Text>

          <Text style={text}>
            Thank you for supporting ChurchConnect Japan. Your generous donation helps us connect Christians with churches across Japan.
          </Text>

          <Section style={receiptBox}>
            <Heading style={h2}>Donation Receipt</Heading>
            <Text style={receiptLine}>
              <strong>Receipt Number:</strong> {receiptNumber}
            </Text>
            <Text style={receiptLine}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={receiptLine}>
              <strong>Amount:</strong> {formattedAmount}
            </Text>
            <Text style={receiptLine}>
              <strong>Type:</strong> {type === 'ONE_TIME' ? 'One-time Donation' : 'Monthly Subscription'}
            </Text>
          </Section>

          {type === 'MONTHLY' && (
            <Text style={text}>
              You will be charged {formattedAmount} monthly. You can manage your subscription anytime in your account settings.
            </Text>
          )}

          <Section style={footer}>
            <Text style={footerText}>
              This is your official donation receipt. Please keep it for your records.
            </Text>
            <Text style={footerText}>
              ChurchConnect Japan is a non-profit platform supporting churches across Japan.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  padding: '0 40px',
  marginBottom: '16px',
}

const receiptBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
}

const receiptLine = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#333',
  margin: '8px 0',
}

const footer = {
  padding: '0 40px',
  marginTop: '40px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
}

const footerText = {
  fontSize: '12px',
  color: '#999',
  marginBottom: '8px',
}
```

**Step 8: Create index exports**

File: `packages/email/src/index.ts`
```typescript
export { resend, EMAIL_FROM, ADMIN_EMAIL } from './config'
export { ContactFormEmail } from './templates/contact-form'
export { ReviewNotificationEmail } from './templates/review-notification'
export { DonationReceiptEmail } from './templates/donation-receipt'

export async function sendContactFormEmail(params: {
  to: string
  name: string
  email: string
  subject: string
  message: string
  churchName?: string
}) {
  const { resend, EMAIL_FROM } = await import('./config')
  const { ContactFormEmail } = await import('./templates/contact-form')
  const { render } = await import('@react-email/components')

  return resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    replyTo: params.email,
    subject: `Contact Form: ${params.subject}`,
    html: render(ContactFormEmail(params)),
  })
}

export async function sendReviewNotification(params: {
  to: string
  churchName: string
  reviewerName: string
  reviewContent: string
  reviewDate: string
  reviewUrl: string
}) {
  const { resend, EMAIL_FROM } = await import('./config')
  const { ReviewNotificationEmail } = await import('./templates/review-notification')
  const { render } = await import('@react-email/components')

  return resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `New review for ${params.churchName}`,
    html: render(ReviewNotificationEmail(params)),
  })
}

export async function sendDonationReceipt(params: {
  to: string
  donorName: string
  amount: number
  currency: string
  type: 'ONE_TIME' | 'MONTHLY'
  date: string
  receiptNumber: string
}) {
  const { resend, EMAIL_FROM } = await import('./config')
  const { DonationReceiptEmail } = await import('./templates/donation-receipt')
  const { render } = await import('@react-email/components')

  return resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: 'Your ChurchConnect Japan Donation Receipt',
    html: render(DonationReceiptEmail(params)),
  })
}
```

**Step 9: Install dependencies**

```bash
cd packages/email
pnpm install
cd ../..
```

**Step 10: Update root .env.example**

File: `.env.example` (add to existing file)
```
# Resend (Email Service)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="ChurchConnect <noreply@churchconnect.jp>"
ADMIN_EMAIL="admin@churchconnect.jp"
```

**Step 11: Commit**

```bash
git add packages/email .env.example
git commit -m "feat(email): add Resend email package with templates"
```

---

Due to length constraints, I'll save this plan and continue with the remaining phases. Let me save what we have so far:
