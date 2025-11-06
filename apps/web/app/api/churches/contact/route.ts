import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactFormEmail } from '@repo/email'
import { prisma } from '@repo/database'
import { verifyRecaptchaToken } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

// Rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>()

// Clean up old entries periodically (entries older than 1 hour)
function cleanupRateLimitMap() {
  const oneHourAgo = Date.now() - 3600000
  const entries = Array.from(rateLimitMap.entries())
  for (const [ip, timestamps] of entries) {
    const recentTimestamps = timestamps.filter(time => time > oneHourAgo)
    if (recentTimestamps.length === 0) {
      rateLimitMap.delete(ip)
    } else {
      rateLimitMap.set(ip, recentTimestamps)
    }
  }
}

// Check rate limit: 5 requests per hour per IP
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const oneHourAgo = now - 3600000

  // Get existing timestamps for this IP
  const timestamps = rateLimitMap.get(ip) || []

  // Filter to only recent timestamps (within last hour)
  const recentTimestamps = timestamps.filter(time => time > oneHourAgo)

  // Check if limit exceeded
  if (recentTimestamps.length >= 5) {
    return false // Rate limit exceeded
  }

  // Add current timestamp and update map
  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)

  return true // Within rate limit
}

// Clean up rate limit map every 5 minutes
setInterval(cleanupRateLimitMap, 5 * 60 * 1000)

// Validation schema for church contact form
const churchContactFormSchema = z.object({
  churchId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const result = churchContactFormSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data',
          errors: result.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { churchId, name, email, subject, message, recaptchaToken } = result.data

    // Verify reCAPTCHA token
    const recaptchaResult = await verifyRecaptchaToken(
      recaptchaToken,
      'church_contact_form'
    )

    if (!recaptchaResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'reCAPTCHA verification failed. Please try again.'
        },
        { status: 400 }
      )
    }

    // Get church from database
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: {
        name: true,
        contactEmail: true,
        email: true,
      }
    })

    if (!church) {
      return NextResponse.json(
        {
          success: false,
          error: 'Church not found'
        },
        { status: 404 }
      )
    }

    // Use contactEmail first, fall back to email
    const churchEmail = church.contactEmail || church.email

    if (!churchEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Church does not have a contact email configured'
        },
        { status: 400 }
      )
    }

    // Send email to church
    try {
      await sendContactFormEmail({
        to: churchEmail,
        name,
        email,
        subject,
        message,
        churchName: church.name,
      })
    } catch (emailError) {
      console.error('Failed to send church contact form email:', emailError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email. Please try again later.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to the church successfully!'
    })

  } catch (error) {
    console.error('Church contact form error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    )
  }
}
