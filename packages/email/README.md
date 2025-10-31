# @repo/email

Email service package for ChurchConnect Japan using Resend and React Email.

## Features

- Send transactional emails using Resend API
- Beautiful, responsive email templates built with React Email
- TypeScript support with full type safety
- Three pre-built email templates:
  - Contact form submissions
  - Review notifications
  - Donation receipts

## Installation

This package is already part of the monorepo. To use it in an app:

```json
{
  "dependencies": {
    "@repo/email": "workspace:*"
  }
}
```

Then run `pnpm install` from the root directory.

## Environment Variables

Add these to your `.env` file:

```bash
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="ChurchConnect <noreply@churchconnect.jp>"
ADMIN_EMAIL="admin@churchconnect.jp"
```

## Usage

### Contact Form Email

Send an email when a user submits a contact form to a church:

```typescript
import { sendContactFormEmail } from '@repo/email'

await sendContactFormEmail({
  to: 'church@example.com',
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Service Times Inquiry',
  message: 'I would like to know more about your worship times...',
  churchName: 'Tokyo Gospel Church' // optional
})
```

### Review Notification Email

Notify church admins when a new review is approved:

```typescript
import { sendReviewNotification } from '@repo/email'

await sendReviewNotification({
  to: 'admin@church.com',
  churchName: 'Tokyo Gospel Church',
  reviewerName: 'John Doe',
  rating: 5,
  reviewContent: 'Great church with a welcoming community!',
  reviewDate: 'January 15, 2025',
  reviewUrl: 'https://portal.churchconnect.jp/reviews/123'
})
```

### Donation Receipt Email

Send a receipt after a successful donation:

```typescript
import { sendDonationReceipt } from '@repo/email'

await sendDonationReceipt({
  to: 'donor@example.com',
  donorName: 'Jane Smith',
  amount: 5000, // in cents (¥50)
  currency: 'JPY',
  type: 'ONE_TIME', // or 'MONTHLY'
  date: 'January 15, 2025',
  receiptNumber: 'CC-2025-0001',
  paymentMethod: 'Visa ending in 4242' // optional
})
```

## API Reference

### sendContactFormEmail(params)

Sends a contact form submission email to a church.

**Parameters:**
- `to` (string): Recipient email address (church email)
- `name` (string): Name of the person submitting the form
- `email` (string): Email of the person (used as reply-to)
- `subject` (string): Subject of the inquiry
- `message` (string): Message content
- `churchName` (string, optional): Name of the church being contacted

**Returns:** Promise with Resend API response

### sendReviewNotification(params)

Sends a notification email when a review is approved.

**Parameters:**
- `to` (string): Church admin email address
- `churchName` (string): Name of the church
- `reviewerName` (string): Name of the reviewer
- `rating` (number): Star rating (1-5)
- `reviewContent` (string): Review text content
- `reviewDate` (string): Formatted date of the review
- `reviewUrl` (string): URL to view/respond to the review

**Returns:** Promise with Resend API response

### sendDonationReceipt(params)

Sends a donation receipt email to a donor.

**Parameters:**
- `to` (string): Donor email address
- `donorName` (string): Name of the donor
- `amount` (number): Amount in cents (e.g., 5000 = ¥50)
- `currency` (string): Currency code (e.g., 'JPY', 'USD')
- `type` ('ONE_TIME' | 'MONTHLY'): Donation type
- `date` (string): Formatted donation date
- `receiptNumber` (string): Unique receipt identifier
- `paymentMethod` (string, optional): Payment method description

**Returns:** Promise with Resend API response

## Error Handling

All send functions will throw an error if:
- `RESEND_API_KEY` is not set
- The Resend API returns an error
- Network issues occur

Always wrap email sending in try-catch blocks:

```typescript
try {
  await sendContactFormEmail({...})
  console.log('Email sent successfully')
} catch (error) {
  console.error('Failed to send email:', error)
  // Handle error appropriately
}
```

## Templates

The package includes three React Email templates in `src/templates/`:

- `contact-form.tsx` - Contact form submission template
- `review-notification.tsx` - Review notification template
- `donation-receipt.tsx` - Donation receipt template

All templates are responsive and optimized for major email clients.

## Development

To check types:

```bash
cd packages/email
pnpm type-check
```

## Getting a Resend API Key

1. Sign up at https://resend.com
2. Verify your domain or use the testing domain
3. Create an API key in the dashboard
4. Add it to your `.env` file as `RESEND_API_KEY`

Free tier includes:
- 100 emails per day
- 3,000 emails per month
- All features included
