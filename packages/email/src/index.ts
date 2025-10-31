import { render } from '@react-email/components'
import { resend, EMAIL_FROM, ADMIN_EMAIL } from './config'
import { ContactFormEmail } from './templates/contact-form'
import { ReviewNotificationEmail } from './templates/review-notification'
import { DonationReceiptEmail } from './templates/donation-receipt'

// Export config and templates for direct use if needed
export { resend, EMAIL_FROM, ADMIN_EMAIL }
export { ContactFormEmail } from './templates/contact-form'
export { ReviewNotificationEmail } from './templates/review-notification'
export { DonationReceiptEmail } from './templates/donation-receipt'

/**
 * Send a contact form submission email to the church
 *
 * @example
 * ```typescript
 * await sendContactFormEmail({
 *   to: 'church@example.com',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   subject: 'Service Times Inquiry',
 *   message: 'I would like to know more about your worship times...',
 *   churchName: 'Tokyo Gospel Church'
 * })
 * ```
 */
export async function sendContactFormEmail(params: {
  to: string
  name: string
  email: string
  subject: string
  message: string
  churchName?: string
}) {
  const html = render(ContactFormEmail(params))

  return resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    reply_to: params.email,
    subject: `Contact Form: ${params.subject}`,
    html,
  })
}

/**
 * Send a review notification email to church admins
 *
 * @example
 * ```typescript
 * await sendReviewNotification({
 *   to: 'admin@church.com',
 *   churchName: 'Tokyo Gospel Church',
 *   reviewerName: 'John Doe',
 *   rating: 5,
 *   reviewContent: 'Great church with a welcoming community!',
 *   reviewDate: 'January 15, 2025',
 *   reviewUrl: 'https://portal.churchconnect.jp/reviews/123'
 * })
 * ```
 */
export async function sendReviewNotification(params: {
  to: string
  churchName: string
  reviewerName: string
  rating: number
  reviewContent: string
  reviewDate: string
  reviewUrl: string
}) {
  const html = render(ReviewNotificationEmail(params))

  return resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `New review for ${params.churchName}`,
    html,
  })
}

/**
 * Send a donation receipt email to donors
 *
 * @example
 * ```typescript
 * await sendDonationReceipt({
 *   to: 'donor@example.com',
 *   donorName: 'Jane Smith',
 *   amount: 5000, // in cents (¥50)
 *   currency: 'JPY',
 *   type: 'ONE_TIME',
 *   date: 'January 15, 2025',
 *   receiptNumber: 'CC-2025-0001',
 *   paymentMethod: 'Visa ending in 4242'
 * })
 * ```
 */
export async function sendDonationReceipt(params: {
  to: string
  donorName: string
  amount: number
  currency: string
  type: 'ONE_TIME' | 'MONTHLY'
  date: string
  receiptNumber: string
  paymentMethod?: string
}) {
  const html = render(DonationReceiptEmail(params))

  return resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: 'Your ChurchConnect Japan Donation Receipt',
    html,
  })
}

/**
 * Type definitions for email parameters
 */
export type ContactFormEmailParams = Parameters<typeof sendContactFormEmail>[0]
export type ReviewNotificationParams = Parameters<typeof sendReviewNotification>[0]
export type DonationReceiptParams = Parameters<typeof sendDonationReceipt>[0]
