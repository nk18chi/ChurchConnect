# ChurchConnect Architecture Documentation

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Application Architecture](#application-architecture)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Authentication Flow](#authentication-flow)
- [Third-Party Integrations](#third-party-integrations)
- [Deployment Architecture](#deployment-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)
- [Scalability Strategy](#scalability-strategy)

## System Overview

ChurchConnect Japan is a multi-application platform built on a monorepo architecture with shared packages and independent applications. The system consists of:

- **4 Applications**: Public web, church portal, admin dashboard, GraphQL API
- **9 Shared Packages**: Database, GraphQL schema, UI components, auth, email, cloudinary, monitoring, and config packages
- **1 PostgreSQL Database**: Shared across all applications
- **5 Third-Party Services**: Cloudinary (images), Resend (email), Stripe (payments), reCAPTCHA (spam prevention), Sentry (monitoring)

### Key Architectural Decisions

1. **Monorepo**: Turborepo for code sharing and efficient builds
2. **Database-First**: Prisma ORM with PostgreSQL for type-safe data access
3. **GraphQL API**: Code-first schema with Pothos for type safety
4. **Server-Side Rendering**: Next.js 14 with App Router for SEO and performance
5. **Role-Based Access Control**: NextAuth.js v5 with three user roles
6. **Microservices-Ready**: Independent apps can be deployed separately

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Browser (Desktop/Mobile)                                        │
│    ├── Public Web (localhost:3000)                              │
│    ├── Church Portal (localhost:3002)                           │
│    └── Admin Dashboard (localhost:3003)                         │
└───────────────────┬─────────────────────────────────────────────┘
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Apps (SSR + Client Components)                         │
│    ├── apps/web                                                 │
│    ├── apps/church-portal                                       │
│    └── apps/admin                                               │
│                                                                  │
│  Express + Apollo Server                                        │
│    └── apps/api (GraphQL API)                                  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Shared Packages Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ├── @repo/database      (Prisma Client + Schema)               │
│  ├── @repo/graphql       (Pothos Schema Definitions)            │
│  ├── @repo/auth          (NextAuth.js Config)                   │
│  ├── @repo/ui            (Shared Components)                    │
│  ├── @repo/email         (Email Templates + Resend)             │
│  ├── @repo/cloudinary    (Image Upload Utils)                   │
│  ├── @repo/monitoring    (Sentry Config)                        │
│  └── Config packages     (TS, ESLint, Tailwind)                 │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                             │
│    ├── Churches, Users, Reviews, Donations                      │
│    ├── Full-text search (tsvector)                             │
│    ├── Triggers (search vectors, timestamps)                    │
│    └── Indexes (performance optimization)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   External Services                              │
├─────────────────────────────────────────────────────────────────┤
│  ├── Cloudinary    (Image Storage & CDN)                        │
│  ├── Resend        (Transactional Email)                        │
│  ├── Stripe        (Payment Processing)                         │
│  ├── reCAPTCHA     (Spam Prevention)                            │
│  └── Sentry        (Error Tracking)                             │
└─────────────────────────────────────────────────────────────────┘
```

## Application Architecture

### Monorepo Structure

```
churchconnect/
├── apps/                          # Applications
│   ├── web/                       # Public website (Next.js 14)
│   │   ├── app/                   # App Router pages
│   │   ├── components/            # React components
│   │   ├── lib/                   # Utilities
│   │   └── public/                # Static assets
│   │
│   ├── church-portal/             # Church admin portal (Next.js 14)
│   │   ├── app/                   # App Router pages
│   │   ├── components/            # React components
│   │   └── middleware.ts          # Auth middleware
│   │
│   ├── admin/                     # Platform admin (Next.js 14)
│   │   ├── app/                   # App Router pages
│   │   ├── components/            # React components
│   │   └── middleware.ts          # Auth middleware
│   │
│   └── api/                       # GraphQL API (Express + Apollo)
│       └── src/
│           ├── index.ts           # Server setup
│           └── context.ts         # GraphQL context
│
├── packages/                      # Shared packages
│   ├── database/                  # Prisma ORM
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   ├── migrations/        # Migration files
│   │   │   ├── seed.ts           # Seed script
│   │   │   └── data/             # Reference data
│   │   └── src/
│   │       └── client.ts         # Prisma client export
│   │
│   ├── graphql/                   # GraphQL schema (Pothos)
│   │   └── src/
│   │       ├── builder.ts        # Pothos builder config
│   │       └── types/            # GraphQL type definitions
│   │
│   ├── auth/                      # NextAuth.js
│   │   └── src/
│   │       └── config.ts         # Auth configuration
│   │
│   ├── ui/                        # Shared UI components
│   │   └── src/
│   │       └── components/       # shadcn/ui components
│   │
│   ├── email/                     # Email templates
│   │   └── src/
│   │       ├── templates/        # HTML templates
│   │       └── send.ts          # Resend integration
│   │
│   ├── cloudinary/                # Image upload
│   │   └── src/
│   │       └── upload.ts        # Upload utilities
│   │
│   ├── monitoring/                # Sentry
│   │   └── src/
│   │       └── sentry.ts        # Sentry config
│   │
│   ├── typescript-config/         # Shared TS configs
│   ├── eslint-config/             # Shared ESLint configs
│   └── tailwind-config/           # Shared Tailwind config
│
└── docs/                          # Documentation
```

### Technology Stack

**Frontend:**
- **Framework**: Next.js 14 with App Router (React Server Components)
- **Language**: TypeScript 5.4 (strict mode)
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **State Management**: React hooks + Server Components (no global state needed)
- **Forms**: React Hook Form + Zod validation
- **API Client**: Apollo Client (for GraphQL)

**Backend:**
- **API**: Apollo Server 4 + Express
- **Schema**: Pothos GraphQL (code-first)
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 14+
- **Authentication**: NextAuth.js v5
- **Validation**: Zod

**Infrastructure:**
- **Hosting**: Render (web services + PostgreSQL)
- **CDN**: Cloudinary
- **Email**: Resend
- **Payments**: Stripe
- **Monitoring**: Sentry
- **Version Control**: Git + GitHub

## Database Design

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│  Prefecture  │────────>│     City     │
└──────────────┘ 1     n └──────────────┘
                              │ n
                              │
                              │ 1
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Denomination │────────>│    Church    │<────────│     User     │
└──────────────┘ 1     n └──────────────┘ n     1 └──────────────┘
                              │ 1               (adminUserId)
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼ n                 ▼ 1
            ┌───────────────┐   ┌──────────────┐
            │ ServiceTime   │   │ChurchProfile │
            └───────────────┘   └──────────────┘
                    ▼ n                 ▼ 1
            ┌───────────────┐   ┌──────────────┐
            │  ChurchStaff  │   │ChurchSocial  │
            └───────────────┘   └──────────────┘
                    ▼ n
            ┌───────────────┐
            │     Photo     │
            └───────────────┘
                    ▼ n
            ┌───────────────┐
            │     Event     │
            └───────────────┘
                    ▼ n
            ┌───────────────┐
            │    Sermon     │
            └───────────────┘

┌──────────────┐         ┌──────────────┐
│     User     │────────>│    Review    │
└──────────────┘ 1     n └──────────────┘
                              │ 1
                              │
                              ▼ 1
                    ┌──────────────────┐
                    │ ReviewResponse   │
                    └──────────────────┘

┌──────────────┐         ┌────────────────────────┐
│     User     │────────>│  PlatformDonation      │
└──────────────┘ 1     n └────────────────────────┘
                              │ 1
                              │
                              ▼ 0..1
            ┌──────────────────────────────────┐
            │PlatformDonationSubscription      │
            └──────────────────────────────────┘
```

### Key Tables

**Reference Data (Static):**
- `Prefecture` - 47 Japanese prefectures
- `City` - Major cities (500+)
- `Language` - Service languages (English, Japanese, etc.)
- `Denomination` - Church denominations

**Core Entities:**
- `Church` - Main church data with search vector
- `ChurchProfile` - Extended information (about, vision, faith)
- `ChurchStaff` - Pastors and leaders
- `ChurchSocial` - Social media links
- `ServiceTime` - Weekly service schedules

**Content:**
- `Photo` - Church photo gallery
- `Event` - Church events
- `Sermon` - Sermon archive

**User Data:**
- `User` - Platform users with roles
- `Review` - User reviews of churches
- `ReviewResponse` - Church responses to reviews
- `ChurchAnalytics` - Profile view tracking

**Platform:**
- `PlatformDonation` - One-time donations
- `PlatformDonationSubscription` - Recurring donations
- `VerificationRequest` - Church verification requests

### Database Features

**Full-Text Search:**
```sql
-- Search vector on Church table
ALTER TABLE "Church" ADD COLUMN "searchVector" tsvector;

-- Trigger to auto-update search vector
CREATE TRIGGER church_search_vector_update
BEFORE INSERT OR UPDATE ON "Church"
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(
    searchVector, 'pg_catalog.english',
    name, address, description
  );

-- GIN index for fast search
CREATE INDEX idx_church_search_vector
ON "Church" USING GIN(searchVector);
```

**Indexes:**
- Primary keys (auto-created)
- Foreign keys (auto-created)
- `Church.slug` (unique, for URL lookup)
- `Church.searchVector` (GIN, for full-text search)
- `Church.isPublished + isDeleted` (composite, for filtering)
- `Review.status + churchId` (composite, for moderation)
- `User.email` (unique, for login)

**Constraints:**
- Unique: email, slug, prefecture names, etc.
- Foreign keys: All relationships enforced
- Check constraints: Email format, status enums, etc.

## API Design

### GraphQL Schema Structure

**Code-First with Pothos:**

```typescript
// builder.ts - Pothos builder configuration
import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import type PrismaTypes from '@pothos/plugin-prisma/generated'

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  Context: Context
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
})

// Query and Mutation root types
builder.queryType()
builder.mutationType()
```

### API Organization

```
packages/graphql/src/types/
├── prefecture.ts      # Prefecture queries
├── city.ts           # City queries
├── language.ts       # Language queries
├── denomination.ts   # Denomination queries
├── church.ts         # Church queries & mutations
├── review.ts         # Review queries & mutations
├── donation.ts       # Donation queries & mutations
└── user.ts          # User queries & mutations
```

### Authentication Context

```typescript
export interface Context {
  prisma: PrismaClient
  userId?: string      // From NextAuth session
  userRole?: UserRole  // From NextAuth session
}
```

### Authorization Patterns

```typescript
// Public - anyone can access
builder.queryFields((t) => ({
  churches: t.prismaField({
    type: ['Church'],
    resolve: (query) => prisma.church.findMany({ ...query })
  })
}))

// Authenticated - requires login
builder.queryFields((t) => ({
  myReviews: t.prismaField({
    type: ['Review'],
    resolve: (query, _root, _args, ctx) => {
      if (!ctx.userId) throw new Error('Unauthorized')
      return prisma.review.findMany({
        ...query,
        where: { userId: ctx.userId }
      })
    }
  })
}))

// Role-based - requires specific role
builder.mutationFields((t) => ({
  verifyChurch: t.field({
    type: 'Boolean',
    resolve: (_root, _args, ctx) => {
      if (ctx.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }
      // ... verification logic
    }
  })
}))
```

### API Endpoints

**GraphQL:**
- `POST /graphql` - GraphQL queries and mutations
- `GET /graphql` - GraphQL Playground (dev only)

**REST (Next.js API Routes):**
- `POST /api/auth/[...nextauth]` - NextAuth.js callbacks
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhooks` - Stripe webhook handler
- `POST /api/upload` - Image upload (church portal)
- `POST /api/contact` - Contact form submission

## Authentication Flow

### NextAuth.js v5 Integration

```typescript
// packages/auth/src/config.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcrypt'
import { prisma } from '@repo/database'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session: ({ session, token }) => {
      session.user.id = token.id
      session.user.role = token.role
      return session
    }
  }
})
```

### Authentication Flow Diagram

```
User Login Request
      │
      ▼
┌─────────────────┐
│  Next.js App    │
│  /login page    │
└────────┬────────┘
         │ POST credentials
         ▼
┌─────────────────┐
│  NextAuth.js    │
│  Credentials    │
│  Provider       │
└────────┬────────┘
         │ Verify credentials
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   User table    │
└────────┬────────┘
         │ Return user with role
         ▼
┌─────────────────┐
│  NextAuth.js    │
│  JWT callback   │
│  (add role)     │
└────────┬────────┘
         │ Create session
         ▼
┌─────────────────┐
│  Set cookie     │
│  Redirect user  │
└─────────────────┘
```

### Role-Based Access Control

**Three User Roles:**

1. **USER**
   - Browse churches
   - Submit reviews
   - Make donations
   - Contact churches

2. **CHURCH_ADMIN**
   - All USER permissions
   - Manage their church's profile
   - Upload photos
   - Respond to reviews
   - View analytics

3. **ADMIN**
   - All permissions
   - Manage all churches
   - Verify churches
   - Moderate reviews
   - Manage users

**Middleware Protection:**

```typescript
// apps/church-portal/middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      return token?.role === 'CHURCH_ADMIN'
    }
  }
})

export const config = {
  matcher: ['/dashboard/:path*']
}
```

## Third-Party Integrations

### Cloudinary (Image Storage)

**Flow:**
1. Client requests signed upload URL from server
2. Server generates signature with API secret
3. Client uploads directly to Cloudinary with signature
4. Cloudinary returns image URL
5. Client saves URL to database

**Code:**
```typescript
// Server-side signature generation
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export function generateUploadSignature() {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET
  )
  return { timestamp, signature }
}
```

### Resend (Email)

**Email Types:**
1. Contact form submissions
2. Review notifications
3. Verification approvals/rejections
4. Donation receipts

**Code:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html
}: EmailParams) {
  await resend.emails.send({
    from: 'ChurchConnect <noreply@churchconnect.jp>',
    to,
    subject,
    html
  })
}
```

### Stripe (Payments)

**Flow:**
1. User selects donation amount
2. Client creates checkout session via API
3. Server creates Stripe Checkout Session
4. User redirected to Stripe Checkout
5. User completes payment
6. Stripe sends webhook to server
7. Server records donation in database
8. User redirected to success page

**Webhook Events:**
- `checkout.session.completed` - One-time payment
- `customer.subscription.created` - Recurring started
- `customer.subscription.deleted` - Recurring cancelled
- `invoice.payment_succeeded` - Recurring payment
- `invoice.payment_failed` - Payment failed

### reCAPTCHA v3 (Spam Prevention)

**Implementation:**
```typescript
// Client-side
const token = await grecaptcha.execute(siteKey, {
  action: 'contact_form'
})

// Server-side verification
const response = await fetch(
  `https://www.google.com/recaptcha/api/siteverify`,
  {
    method: 'POST',
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token
    })
  }
)

const data = await response.json()
if (data.score < 0.5) {
  throw new Error('Suspected spam')
}
```

### Sentry (Error Tracking)

**Setup:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend: (event) => {
    // Remove sensitive data
    delete event.request?.cookies
    return event
  }
})
```

## Deployment Architecture

### Render Deployment

```
GitHub Repository
      │
      │ Git push
      ▼
┌─────────────────────────────────────┐
│        Render Build System          │
│  ┌──────────────────────────────┐  │
│  │  pnpm install                │  │
│  │  pnpm build                  │  │
│  │  Deploy to web service       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
      │
      │ Deploy
      ▼
┌─────────────────────────────────────┐
│         Render Services             │
│  ┌──────────────────────────────┐  │
│  │ Web App                       │  │
│  │ (Next.js SSR)                │  │
│  │ https://churchconnect.jp     │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Church Portal                │  │
│  │ https://portal.churchconnect │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Admin Dashboard              │  │
│  │ https://admin.churchconnect  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ GraphQL API                  │  │
│  │ https://api.churchconnect    │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
      │
      │ Database queries
      ▼
┌─────────────────────────────────────┐
│    Render PostgreSQL Database       │
│  - Managed database                 │
│  - Automatic backups                │
│  - Connection pooling               │
└─────────────────────────────────────┘
```

### Environment Variables by Service

**All Services:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

**Web App:**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RECAPTCHA_SECRET_KEY`
- `RECAPTCHA_SITE_KEY`
- `RESEND_API_KEY`

**Church Portal:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Admin:**
- All admin-specific vars

**API:**
- `CORS_ORIGINS`

## Data Flow

### Church Profile Update Flow

```
Church Admin
    │ 1. Edit profile
    ▼
Church Portal UI
    │ 2. Form submission
    ▼
GraphQL Mutation
    │ 3. updateChurchProfile
    ▼
Authorization Check
    │ 4. Verify CHURCH_ADMIN role
    │    and church ownership
    ▼
Prisma Update
    │ 5. Update database
    ▼
Search Vector Trigger
    │ 6. Auto-update searchVector
    ▼
Return Updated Church
    │ 7. Return to client
    ▼
UI Update
    │ 8. Optimistic update
    ▼
Success!
```

### Review Submission Flow

```
User
    │ 1. Submit review
    ▼
Web App
    │ 2. Create review form
    ▼
GraphQL Mutation
    │ 3. createReview
    ▼
Database
    │ 4. Insert review (status: PENDING)
    ▼
Email Service
    │ 5. Notify admin via Resend
    ▼
Admin Dashboard
    │ 6. Review appears in moderation queue
    ▼
Admin Action
    │ 7. Approve/Reject
    ▼
Database Update
    │ 8. Update review status
    ▼
Email Notifications
    │ 9. Notify user and church
    ▼
Public Display
    │ 10. Show on church profile
```

### Donation Flow

```
User
    │ 1. Select amount
    ▼
Web App
    │ 2. POST /api/stripe/checkout
    ▼
Create Checkout Session
    │ 3. Stripe API call
    ▼
Redirect to Stripe
    │ 4. User completes payment
    ▼
Stripe Webhook
    │ 5. checkout.session.completed
    ▼
Verify Webhook
    │ 6. Validate signature
    ▼
Database
    │ 7. Create PlatformDonation record
    ▼
Email Receipt
    │ 8. Send via Resend
    ▼
Success Page
    │ 9. Redirect user
```

## Security Architecture

### Security Layers

1. **Network Security**
   - HTTPS only (enforced)
   - CORS configured per environment
   - Rate limiting on API endpoints

2. **Authentication Security**
   - Bcrypt password hashing (10 rounds)
   - HTTP-only session cookies
   - CSRF protection (NextAuth.js)
   - Session expiration (30 days)

3. **Authorization Security**
   - Role-based access control
   - Resource ownership validation
   - Middleware protection on routes

4. **Data Security**
   - SQL injection prevention (Prisma)
   - XSS prevention (React escaping)
   - Input validation (Zod)
   - Secure file uploads (signed URLs)

5. **API Security**
   - GraphQL query complexity limits (planned)
   - Rate limiting per IP
   - Webhook signature verification

6. **Third-Party Security**
   - Stripe webhook signature validation
   - reCAPTCHA score threshold (0.5)
   - Cloudinary signed uploads
   - Environment variable encryption

### Sensitive Data Handling

**Never Stored:**
- Credit card numbers (handled by Stripe)
- Passwords in plain text (bcrypt hashed)

**Encrypted in Transit:**
- All API requests (HTTPS)
- Database connections (SSL)
- Third-party API calls (HTTPS)

**Access Controlled:**
- User emails (only admins can see all)
- Donation amounts (user can see own)
- Church admin info (verified only)

## Performance Considerations

### Database Optimization

1. **Indexes**
   - All foreign keys indexed
   - Slug field indexed (unique)
   - Search vector GIN indexed
   - Composite indexes for common queries

2. **Query Optimization**
   - Select only needed fields
   - Include related data in one query
   - Pagination for large lists
   - Connection pooling

3. **Caching**
   - Next.js static generation for public pages
   - Revalidation on data changes
   - CDN caching for images (Cloudinary)

### Frontend Optimization

1. **Next.js Features**
   - Server Components (reduce client JS)
   - Image optimization (next/image)
   - Code splitting (automatic)
   - Streaming SSR

2. **Bundle Size**
   - Tree-shaking unused code
   - Dynamic imports for heavy components
   - Shared packages reduce duplication

3. **Asset Optimization**
   - Cloudinary automatic optimization
   - WebP format for images
   - Lazy loading images

### API Optimization

1. **GraphQL**
   - Field-level resolver caching (planned)
   - DataLoader for batching (planned)
   - Query complexity limiting (planned)

2. **Database Queries**
   - N+1 query prevention (Prisma include)
   - Cursor-based pagination
   - Limit query depth

## Scalability Strategy

### Current Architecture (MVP)

- **Render Free/Starter Tier**: Good for 0-1000 users
- **Single PostgreSQL instance**: Sufficient for 10,000+ churches
- **Serverless Functions**: Auto-scaling Next.js apps

### Scaling Strategy

**Stage 1: Vertical Scaling (0-10k users)**
- Upgrade Render instance size
- Increase database resources
- Enable connection pooling

**Stage 2: Horizontal Scaling (10k-100k users)**
- Add multiple app instances
- Implement Redis caching
- Add read replicas for database
- CDN for static assets (already using Cloudinary)

**Stage 3: Regional Scaling (100k+ users)**
- Multi-region deployment
- Geographic load balancing
- Database sharding by region

**Stage 4: Microservices (if needed)**
- Separate payment service
- Separate image processing service
- Separate email service
- Message queue for async tasks

### Monitoring Scaling Needs

**Metrics to Watch:**
- Response time (target: <3s)
- Database connection pool usage
- CPU utilization (alert at 80%)
- Memory usage (alert at 80%)
- Error rate (alert at 1%)
- Request rate per second

**Scaling Triggers:**
- Response time > 5s consistently
- Database CPU > 80%
- Connection pool exhaustion
- Error rate > 5%

---

For questions about architecture, see [CONTRIBUTING.md](../CONTRIBUTING.md) or create an issue.
