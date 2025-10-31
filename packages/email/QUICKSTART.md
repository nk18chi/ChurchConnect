# Email Package Quick Start

Get the `@repo/email` package up and running in 5 minutes.

## Step 1: Get a Resend API Key

1. Go to https://resend.com and sign up (free)
2. Verify your email address
3. Go to **API Keys** in the dashboard
4. Click **Create API Key**
5. Copy the key (it starts with `re_`)

## Step 2: Set Environment Variables

Add to your `.env` file (or `.env.local` for Next.js apps):

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="ChurchConnect <noreply@churchconnect.jp>"
ADMIN_EMAIL="admin@churchconnect.jp"
```

For testing, you can use Resend's test domain:
```bash
EMAIL_FROM="onboarding@resend.dev"
```

## Step 3: Add Package to Your App

In your app's `package.json`:

```json
{
  "dependencies": {
    "@repo/email": "workspace:*"
  }
}
```

Then run:
```bash
pnpm install
```

## Step 4: Send Your First Email

Create a simple API route to test:

```typescript
// apps/web/app/api/test-email/route.ts
import { NextResponse } from 'next/server'
import { sendContactFormEmail } from '@repo/email'

export async function POST() {
  try {
    const result = await sendContactFormEmail({
      to: 'your-email@example.com', // Use your actual email
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Email',
      message: 'This is a test email from ChurchConnect!',
      churchName: 'Test Church'
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
```

## Step 5: Test It

Start your app and send a POST request:

```bash
curl -X POST http://localhost:3000/api/test-email
```

Check your email inbox for the test email!

## Common Issues

### "RESEND_API_KEY environment variable is required"

Make sure:
1. You have `RESEND_API_KEY` in your `.env` file
2. Your app is loading environment variables correctly
3. You restarted your dev server after adding the variable

### Email not received

1. Check spam folder
2. Verify the recipient email address
3. Check Resend dashboard for delivery status
4. Make sure you're using a verified sender domain (or use `onboarding@resend.dev` for testing)

### TypeScript errors

Make sure you've run `pnpm install` after adding the package dependency.

## Next Steps

- Read [README.md](./README.md) for full API documentation
- Check [EXAMPLES.md](./EXAMPLES.md) for real-world usage examples
- Visit https://resend.com/docs for Resend documentation

## Free Tier Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month
- All features included
- No credit card required

Perfect for development and small projects!
