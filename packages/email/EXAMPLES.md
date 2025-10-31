# Email Package Usage Examples

## Example 1: Contact Form in Public Web App

When a visitor submits a contact form on a church's public page:

```typescript
// apps/web/app/api/churches/[slug]/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormEmail } from '@repo/email'
import { prisma } from '@repo/database'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    // Get church details
    const church = await prisma.church.findUnique({
      where: { slug: params.slug },
      select: { name: true, email: true },
    })

    if (!church || !church.email) {
      return NextResponse.json(
        { error: 'Church not found or no contact email' },
        { status: 404 }
      )
    }

    // Send email to church
    await sendContactFormEmail({
      to: church.email,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      churchName: church.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
```

## Example 2: Review Notification in GraphQL Resolver

When an admin approves a review, notify the church:

```typescript
// apps/api/src/resolvers/mutations/approveReview.ts
import { sendReviewNotification } from '@repo/email'
import { prisma } from '@repo/database'

export async function approveReview(
  _parent: unknown,
  { reviewId }: { reviewId: string },
  context: Context
) {
  // Check admin permissions
  if (context.user?.role !== 'PLATFORM_ADMIN') {
    throw new Error('Unauthorized')
  }

  // Approve the review
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'APPROVED', approvedAt: new Date() },
    include: {
      church: {
        select: {
          id: true,
          name: true,
          adminUser: { select: { email: true } },
        },
      },
      user: { select: { name: true } },
    },
  })

  // Send notification to church admin
  if (review.church.adminUser?.email) {
    try {
      await sendReviewNotification({
        to: review.church.adminUser.email,
        churchName: review.church.name,
        reviewerName: review.user.name || 'Anonymous',
        rating: review.rating,
        reviewContent: review.content,
        reviewDate: new Date(review.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        reviewUrl: `https://portal.churchconnect.jp/reviews/${reviewId}`,
      })
    } catch (emailError) {
      console.error('Failed to send review notification:', emailError)
      // Don't fail the whole operation if email fails
    }
  }

  return review
}
```

## Example 3: Donation Receipt in Stripe Webhook

When a donation is processed, send a receipt:

```typescript
// apps/web/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { sendDonationReceipt } from '@repo/email'
import { prisma } from '@repo/database'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object

      // Create donation record
      const donation = await prisma.donation.create({
        data: {
          amount: session.amount_total!,
          currency: session.currency!,
          type: session.mode === 'subscription' ? 'MONTHLY' : 'ONE_TIME',
          status: 'COMPLETED',
          stripeSessionId: session.id,
          donorEmail: session.customer_email!,
          donorName: session.customer_details?.name || 'Anonymous',
        },
      })

      // Send receipt email
      await sendDonationReceipt({
        to: donation.donorEmail,
        donorName: donation.donorName,
        amount: donation.amount,
        currency: donation.currency.toUpperCase(),
        type: donation.type,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        receiptNumber: `CC-${new Date().getFullYear()}-${donation.id.slice(0, 8)}`,
        paymentMethod: session.payment_method_types?.[0] || undefined,
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}
```

## Example 4: Error Handling with Retry Logic

For critical emails, implement retry logic:

```typescript
import { sendDonationReceipt, type DonationReceiptParams } from '@repo/email'

async function sendReceiptWithRetry(
  params: DonationReceiptParams,
  maxRetries = 3
) {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendDonationReceipt(params)
      console.log(`Receipt sent successfully on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} failed:`, error)

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed
  throw new Error(`Failed to send receipt after ${maxRetries} attempts: ${lastError?.message}`)
}
```

## Example 5: Batch Email Sending

Send multiple emails (e.g., monthly newsletter to all churches):

```typescript
import { sendReviewNotification } from '@repo/email'
import { prisma } from '@repo/database'

async function sendMonthlyReviewDigest() {
  const churches = await prisma.church.findMany({
    where: {
      adminUser: { isNot: null },
    },
    include: {
      adminUser: { select: { email: true } },
      reviews: {
        where: {
          status: 'APPROVED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: { user: { select: { name: true } } },
      },
    },
  })

  const results = await Promise.allSettled(
    churches
      .filter(church => church.reviews.length > 0)
      .map(async church => {
        if (!church.adminUser?.email) return

        for (const review of church.reviews) {
          await sendReviewNotification({
            to: church.adminUser.email,
            churchName: church.name,
            reviewerName: review.user.name || 'Anonymous',
            rating: review.rating,
            reviewContent: review.content,
            reviewDate: new Date(review.createdAt).toLocaleDateString(),
            reviewUrl: `https://portal.churchconnect.jp/reviews/${review.id}`,
          })

          // Rate limiting: wait 100ms between emails
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`Sent ${successful} review notifications, ${failed} failed`)
}
```

## Example 6: Testing Email Templates

Preview email templates without sending:

```typescript
import { render } from '@react-email/components'
import { ContactFormEmail } from '@repo/email'
import fs from 'fs'

// Generate HTML preview
const html = render(
  ContactFormEmail({
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Test Subject',
    message: 'This is a test message',
    churchName: 'Test Church',
  })
)

// Save to file for preview
fs.writeFileSync('preview.html', html)
console.log('Preview saved to preview.html')
```

## Tips and Best Practices

1. **Always use try-catch**: Email sending can fail, don't let it break your app
2. **Log failures**: Keep track of failed emails for debugging
3. **Don't block user actions**: Send emails asynchronously
4. **Use queue systems**: For high-volume emails, consider a queue (Bull, BullMQ)
5. **Rate limiting**: Respect Resend's rate limits (100/day on free tier)
6. **Test with real emails**: Use your own email for testing
7. **Monitor deliverability**: Check Resend dashboard for bounces/complaints
8. **Environment-specific config**: Use different `EMAIL_FROM` for dev/prod
