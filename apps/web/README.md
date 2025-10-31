# ChurchConnect Web App

Public-facing website for ChurchConnect Japan - a cross-denominational church directory platform.

## Overview

The web app is the main public interface where users can:
- Browse and search for churches
- View detailed church profiles
- Submit and read reviews
- Make platform donations
- Contact churches

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe Checkout
- **Database**: PostgreSQL + Prisma (via `@repo/database`)
- **API**: GraphQL (via `@repo/graphql`)

## Features

### Church Directory (`/`)
- Search and browse churches
- Filter by prefecture, city, denomination, language
- Sort by relevance, completeness, verification status
- Map view of churches (planned)

### Church Profile (`/churches/[slug]`)
- Comprehensive church information
- Photo gallery
- Staff/pastor profiles
- Service times and languages
- Upcoming events
- Sermon archive
- Reviews and testimonials
- Contact form

### Donations (`/donate`)
- One-time donations
- Monthly recurring donations
- Preset amounts: ¥500, ¥1,000, ¥3,000, ¥5,000
- Custom amount support
- Stripe Checkout integration

### Reviews (`/churches/[slug]/reviews`)
- Submit reviews (requires login)
- Church responses
- Moderation queue
- Helpful votes (planned)

### User Authentication
- Email/password login
- User registration
- Profile management
- Review history

## Project Structure

```
apps/web/
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   ├── churches/            # Church pages
│   │   └── [slug]/          # Dynamic church profile
│   ├── donate/              # Donation pages
│   │   ├── success/         # Payment success
│   │   └── cancel/          # Payment cancelled
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   └── stripe/          # Stripe webhooks
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── church/              # Church-related components
│   ├── forms/               # Form components
│   └── ui/                  # UI components (shadcn)
├── lib/                     # Utilities
│   ├── apollo-client.ts     # GraphQL client
│   ├── auth.ts              # NextAuth config
│   └── utils.ts             # Helper functions
├── public/                  # Static assets
└── styles/                  # Global styles
```

## Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/churchconnect?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URLs
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

See [Environment Variables](../../docs/ENVIRONMENT_VARIABLES.md) for details.

## Development

### Install Dependencies

From the root directory:

```bash
pnpm install
```

### Run Development Server

```bash
# From root
pnpm --filter web dev

# Or from this directory
pnpm dev
```

App runs on http://localhost:3000

### Build for Production

```bash
# From root
pnpm --filter web build

# Or from this directory
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript compiler

## Key Pages

### Homepage (`app/page.tsx`)
- Hero section with search
- Featured churches
- Statistics
- Call to action for church registration

### Church Listing (`app/churches/page.tsx`)
- Filterable church list
- Search functionality
- Pagination
- Map view toggle (planned)

### Church Profile (`app/churches/[slug]/page.tsx`)
- Dynamic route based on church slug
- Tabbed interface:
  - About
  - Service Times
  - Staff
  - Events
  - Sermons
  - Photos
  - Reviews
  - Contact

### Donation Page (`app/donate/page.tsx`)
- Amount selection
- One-time vs. monthly toggle
- Stripe Checkout redirect
- Custom amount input

## API Routes

### Authentication (`app/api/auth/[...nextauth]/route.ts`)
- Handles NextAuth.js callbacks
- Login, logout, session management

### Stripe Checkout (`app/api/stripe/checkout/route.ts`)
- Creates Stripe Checkout session
- Handles one-time and recurring payments
- Returns session URL for redirect

### Stripe Webhooks (`app/api/stripe/webhooks/route.ts`)
- Receives Stripe webhook events
- Verifies webhook signature
- Processes payment events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

## GraphQL Integration

The app uses Apollo Client to query the GraphQL API.

### Apollo Client Setup (`lib/apollo-client.ts`)

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_API_URL + '/graphql',
  }),
  cache: new InMemoryCache(),
})
```

### Example Query

```typescript
import { gql } from '@apollo/client'

const GET_CHURCHES = gql`
  query GetChurches($prefectureId: String) {
    churches(prefectureId: $prefectureId) {
      id
      name
      slug
      city {
        name
        prefecture {
          name
        }
      }
      denomination {
        name
      }
    }
  }
`
```

## Authentication

Uses NextAuth.js v5 with credentials provider.

### Protected Routes

```typescript
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return <div>Protected content</div>
}
```

### Client-Side Session

```typescript
'use client'

import { useSession } from 'next-auth/react'

export function UserProfile() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Not logged in</div>

  return <div>Welcome, {session.user.name}</div>
}
```

## Styling

### Tailwind CSS

Configure in `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [sharedConfig],
}

export default config
```

### shadcn/ui Components

Components are in `components/ui/`. Add new components:

```bash
npx shadcn-ui@latest add button
```

## Testing

### Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] Church search works
- [ ] Church filters work
- [ ] Church profile displays all sections
- [ ] Login/logout works
- [ ] Review submission works
- [ ] Donation flow completes
- [ ] Stripe webhook processes payment
- [ ] Mobile responsive design

### Testing Stripe Integration

Use Stripe test cards:

- **Successful payment**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

## Deployment

See [Deployment Guide](../../docs/DEPLOYMENT.md) for production deployment.

### Vercel (Recommended)

```bash
vercel
```

### Environment Variables

Set in Vercel dashboard:
- All variables from `.env.local`
- Use production Stripe keys
- Update URLs to production domains

## Troubleshooting

### GraphQL queries fail

- Check API server is running
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check GraphQL endpoint: http://localhost:3001/graphql

### Authentication not working

- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Clear cookies and try again

### Stripe webhooks failing

- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Use Stripe CLI for local testing
- Check webhook endpoint returns 200

### Build errors

- Clear `.next` folder: `rm -rf .next`
- Regenerate Prisma client: `cd ../../packages/database && pnpm db:generate`
- Reinstall dependencies: `pnpm install`

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

## License

MIT
