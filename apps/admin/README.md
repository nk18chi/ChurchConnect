# ChurchConnect Admin Dashboard

Platform administrator dashboard for managing ChurchConnect Japan.

## Overview

The admin dashboard allows platform administrators to:
- Manage all churches (CRUD operations)
- Review and approve verification requests
- Moderate user reviews
- Manage users and roles
- View platform analytics
- Configure platform settings

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js v5 (ADMIN role required)
- **Database**: PostgreSQL + Prisma (via `@repo/database`)
- **API**: GraphQL (via `@repo/graphql`)
- **Charts**: Recharts or Chart.js

## Features

### Dashboard (`/dashboard`)
- Platform-wide statistics
- Recent activity feed
- Pending actions (verifications, reviews)
- Quick links

### Church Management (`/churches`)
- List all churches
- Create/edit/delete churches
- Bulk operations
- Search and filter
- Export church data

### Verification Queue (`/verifications`)
- Review verification requests
- Approve/reject with notes
- View submitted documents
- Email notifications to churches

### Review Moderation (`/reviews`)
- Review all submitted reviews
- Approve/reject reviews
- Flag inappropriate content
- View church responses
- Bulk moderation

### User Management (`/users`)
- List all users
- Create/edit users
- Assign roles (USER, CHURCH_ADMIN, ADMIN)
- Link church admins to churches
- Suspend/delete users

### Analytics (`/analytics`)
- User growth metrics
- Church growth metrics
- Most viewed churches
- Search analytics
- Donation metrics
- Geographic distribution

### Platform Settings (`/settings`)
- Site-wide configuration
- Email templates
- Moderation rules
- Feature flags

## Project Structure

```
apps/admin/
├── app/
│   ├── (auth)/              # Auth pages (admin login)
│   ├── (dashboard)/         # Dashboard layout
│   │   ├── dashboard/       # Main dashboard
│   │   ├── churches/        # Church management
│   │   ├── verifications/   # Verification queue
│   │   ├── reviews/         # Review moderation
│   │   ├── users/           # User management
│   │   ├── analytics/       # Analytics dashboard
│   │   └── settings/        # Platform settings
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing/redirect
├── components/              # React components
│   ├── dashboard/           # Dashboard components
│   ├── tables/              # Data tables
│   ├── charts/              # Chart components
│   └── ui/                  # UI components (shadcn)
├── lib/                     # Utilities
│   ├── apollo-client.ts     # GraphQL client
│   ├── auth.ts              # NextAuth config
│   └── utils.ts             # Helper functions
└── middleware.ts            # Auth middleware
```

## Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/churchconnect?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3003"
NEXTAUTH_SECRET="your-secret-key-here"

# App URLs
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Email (optional)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="noreply@churchconnect.jp"
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
pnpm --filter admin dev

# Or from this directory
pnpm dev
```

App runs on http://localhost:3003

### Build for Production

```bash
# From root
pnpm --filter admin build

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

## Authentication & Authorization

### Required Role

Users must have `ADMIN` role to access the dashboard.

### Middleware Protection

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === 'ADMIN',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/churches/:path*',
    // ... all protected routes
  ],
}
```

### Creating Admin User

```sql
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@churchconnect.jp',
  'Platform Admin',
  -- Use bcrypt hashed password
  '$2a$10$...',
  'ADMIN',
  NOW(),
  NOW()
);
```

Generate password hash:

```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('secure-password', 10);
console.log(hash);
```

## Key Features

### Church Management

**List all churches:**
```typescript
const churches = await prisma.church.findMany({
  include: {
    city: true,
    prefecture: true,
    denomination: true,
    _count: {
      select: { reviews: true, photos: true },
    },
  },
  orderBy: { createdAt: 'desc' },
})
```

**Bulk operations:**
```typescript
// Bulk publish
await prisma.church.updateMany({
  where: { id: { in: selectedIds } },
  data: { isPublished: true },
})

// Bulk delete
await prisma.church.updateMany({
  where: { id: { in: selectedIds } },
  data: { isDeleted: true },
})
```

### Verification Queue

**Pending verifications:**
```graphql
query {
  verificationRequests(status: PENDING) {
    id
    church {
      id
      name
      slug
    }
    requestedBy
    requestEmail
    documentUrl
    notes
    createdAt
  }
}
```

**Approve/reject:**
```graphql
mutation ApproveVerification($id: String!, $note: String) {
  approveVerification(id: $id, reviewNote: $note) {
    id
    status
    reviewedBy
    reviewedAt
  }
}
```

### Review Moderation

**Pending reviews:**
```typescript
const pendingReviews = await prisma.review.findMany({
  where: { status: 'PENDING' },
  include: {
    church: { select: { name: true, slug: true } },
    user: { select: { name: true, email: true } },
  },
  orderBy: { createdAt: 'desc' },
})
```

**Moderate review:**
```graphql
mutation ModerateReview($id: String!, $status: ReviewStatus!, $note: String) {
  updateReviewStatus(id: $id, status: $status, moderationNote: $note) {
    id
    status
    moderatedAt
    moderatedBy
  }
}
```

### User Management

**List users with filters:**
```typescript
const users = await prisma.user.findMany({
  where: {
    role: role ? role : undefined,
    email: searchQuery ? { contains: searchQuery } : undefined,
  },
  include: {
    managedChurch: { select: { name: true } },
    _count: {
      select: { reviews: true, platformDonations: true },
    },
  },
  orderBy: { createdAt: 'desc' },
})
```

**Assign church admin:**
```typescript
await prisma.$transaction([
  // Update user role
  prisma.user.update({
    where: { id: userId },
    data: { role: 'CHURCH_ADMIN' },
  }),
  // Link to church
  prisma.church.update({
    where: { id: churchId },
    data: { adminUserId: userId },
  }),
])
```

### Analytics Dashboard

**Platform metrics:**
```typescript
const metrics = {
  totalChurches: await prisma.church.count(),
  verifiedChurches: await prisma.church.count({
    where: { isVerified: true },
  }),
  totalUsers: await prisma.user.count(),
  totalReviews: await prisma.review.count(),
  totalDonations: await prisma.platformDonation.aggregate({
    _sum: { amount: true },
  }),
}
```

**Growth over time:**
```typescript
const churchGrowth = await prisma.$queryRaw`
  SELECT
    DATE_TRUNC('month', "createdAt") as month,
    COUNT(*) as count
  FROM "Church"
  WHERE "createdAt" >= NOW() - INTERVAL '12 months'
  GROUP BY month
  ORDER BY month
`
```

## Data Tables

### Using TanStack Table

```typescript
'use client'

import { ColumnDef, useReactTable } from '@tanstack/react-table'

const columns: ColumnDef<Church>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'city.prefecture.name',
    header: 'Prefecture',
  },
  {
    accessorKey: 'isVerified',
    header: 'Verified',
    cell: ({ row }) => (
      <Badge variant={row.original.isVerified ? 'success' : 'secondary'}>
        {row.original.isVerified ? 'Yes' : 'No'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function ChurchesTable({ churches }: { churches: Church[] }) {
  const table = useReactTable({
    data: churches,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return <DataTable table={table} />
}
```

### Export to CSV

```typescript
function exportToCSV(data: any[], filename: string) {
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row =>
      Object.values(row)
        .map(val => `"${val}"`)
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
}
```

## Charts & Visualizations

### Using Recharts

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export function GrowthChart({ data }: { data: ChartData[] }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="churches" stroke="#8884d8" />
      <Line type="monotone" dataKey="users" stroke="#82ca9d" />
    </LineChart>
  )
}
```

## GraphQL Queries & Mutations

### Get all churches (with pagination)

```graphql
query GetAllChurches($skip: Int, $take: Int, $where: ChurchWhereInput) {
  churches(skip: $skip, take: $take, where: $where) {
    id
    name
    slug
    isVerified
    isPublished
    city {
      name
      prefecture {
        name
      }
    }
  }
  churchesCount(where: $where)
}
```

### Create church

```graphql
mutation CreateChurch($input: CreateChurchInput!) {
  createChurch(input: $input) {
    id
    name
    slug
  }
}
```

### Update church

```graphql
mutation UpdateChurch($id: String!, $input: UpdateChurchInput!) {
  updateChurch(id: $id, input: $input) {
    id
    name
    isVerified
    isPublished
  }
}
```

### Delete church

```graphql
mutation DeleteChurch($id: String!) {
  deleteChurch(id: $id)
}
```

## Email Notifications

### Send verification approval email

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

async function sendVerificationApprovalEmail(church: Church, email: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Your church has been verified!',
    html: `
      <h1>Congratulations!</h1>
      <p>Your church, ${church.name}, has been verified on ChurchConnect Japan.</p>
      <p>You can now manage your church profile at:</p>
      <a href="${process.env.NEXT_PUBLIC_WEB_URL}/churches/${church.slug}">
        View your church profile
      </a>
    `,
  })
}
```

## Security Considerations

### Audit Logging

Log all admin actions:

```typescript
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    action: 'APPROVE_VERIFICATION',
    entityType: 'CHURCH',
    entityId: church.id,
    metadata: { note: reviewNote },
    ipAddress: req.headers.get('x-forwarded-for'),
  },
})
```

### Rate Limiting

Prevent abuse of bulk operations:

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

### Input Validation

Always validate admin inputs:

```typescript
import { z } from 'zod'

const churchSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  email: z.string().email().optional(),
  // ... etc
})
```

## Testing

### Manual Testing Checklist

- [ ] Login as admin
- [ ] View dashboard metrics
- [ ] Create new church
- [ ] Edit church details
- [ ] Delete church
- [ ] Approve verification request
- [ ] Reject verification request
- [ ] Approve review
- [ ] Reject review with note
- [ ] Create user
- [ ] Assign church admin role
- [ ] Link admin to church
- [ ] View analytics charts
- [ ] Export church data to CSV
- [ ] Search and filter churches

### Test Admin User

Create via SQL:

```sql
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'admin-test-id',
  'test@admin.churchconnect.jp',
  'Test Admin',
  -- Hash: 'password'
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'ADMIN',
  NOW(),
  NOW()
);
```

Login: `test@admin.churchconnect.jp` / `password`

## Deployment

See [Deployment Guide](../../docs/DEPLOYMENT.md) for production deployment.

### Environment Variables

Set in hosting platform:
- All variables from `.env.local`
- Update `NEXTAUTH_URL` to production domain
- Configure SMTP for email notifications

## Troubleshooting

### Can't access admin dashboard

- Verify user has `ADMIN` role
- Check session cookie is set
- Clear cookies and login again

### Bulk operations failing

- Check database connection
- Verify transaction limits
- Review error logs

### Charts not rendering

- Check data format
- Verify chart library is installed
- Check for console errors

### Email not sending

- Verify SMTP credentials
- Check SMTP host/port
- Test with a basic email send

## Future Enhancements

- [ ] Advanced search (Elasticsearch)
- [ ] Batch import churches (CSV)
- [ ] Automated duplicate detection
- [ ] More granular permissions
- [ ] Activity timeline for churches
- [ ] Scheduled reports (weekly digest)
- [ ] Content moderation AI
- [ ] Multi-language admin interface
- [ ] Dark mode
- [ ] Mobile admin app

## Contributing

1. Create feature branch
2. Make changes
3. Test with admin account
4. Submit pull request

## License

MIT
