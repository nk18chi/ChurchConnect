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
