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
