import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@repo/auth'
import { deleteImage } from '@repo/cloudinary'
import { prisma } from '@repo/database'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
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

    // Delete from database FIRST to avoid race condition
    await prisma.churchPhoto.delete({
      where: { id: photoId },
    })

    // Then delete from Cloudinary (failures here won't leave orphaned DB records)
    try {
      await deleteImage(publicId)
    } catch (cloudinaryError) {
      // Log but don't fail the request - database record is already deleted
      console.error('Cloudinary deletion failed (DB already updated):', cloudinaryError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
