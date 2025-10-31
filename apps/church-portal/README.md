# ChurchConnect Church Portal

Church administrator portal for managing church content and profile on ChurchConnect Japan.

## Overview

The church portal allows verified church administrators to:
- Manage church profile and information
- Upload and organize photos
- Add and edit staff members
- Post sermons and events
- Respond to reviews
- Track analytics
- Request verification

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js v5 (CHURCH_ADMIN role required)
- **Database**: PostgreSQL + Prisma (via `@repo/database`)
- **API**: GraphQL (via `@repo/graphql`)
- **File Upload**: Cloudinary (planned) or S3

## Features

### Dashboard (`/dashboard`)
- Quick stats (views, completeness)
- Profile completeness checklist
- Recent reviews
- Quick actions

### Church Profile Management (`/profile`)
- Basic information (name, address, contact)
- About sections (who we are, vision, statement of faith)
- Service times and languages
- Social media links
- Hero image upload

### Staff Management (`/staff`)
- Add/edit/delete staff members
- Upload staff photos
- Reorder staff display
- Social media links per staff member

### Content Management
- **Sermons** (`/sermons`): Upload/link to sermon recordings
- **Events** (`/events`): Create and manage church events
- **Photos** (`/photos`): Upload and organize church photos

### Reviews Management (`/reviews`)
- View all reviews (approved, pending, rejected)
- Respond to reviews
- Flag inappropriate reviews

### Analytics (`/analytics`)
- Profile views over time
- Popular search terms
- Visitor demographics (planned)

### Verification (`/verification`)
- Request church verification
- Upload verification documents
- Track verification status

## Project Structure

```
apps/church-portal/
├── app/
│   ├── (auth)/              # Auth pages (login)
│   ├── (dashboard)/         # Dashboard layout
│   │   ├── dashboard/       # Main dashboard
│   │   ├── profile/         # Profile editor
│   │   ├── staff/           # Staff management
│   │   ├── sermons/         # Sermon management
│   │   ├── events/          # Event management
│   │   ├── photos/          # Photo gallery
│   │   ├── reviews/         # Review management
│   │   ├── analytics/       # Analytics dashboard
│   │   └── verification/    # Verification request
│   ├── api/                 # API routes
│   │   └── upload/          # File upload handler
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing/redirect
├── components/              # React components
│   ├── dashboard/           # Dashboard components
│   ├── forms/               # Form components
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
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-secret-key-here"

# App URLs
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# File Upload (optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
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
pnpm --filter church-portal dev

# Or from this directory
pnpm dev
```

App runs on http://localhost:3002

### Build for Production

```bash
# From root
pnpm --filter church-portal build

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

Users must have `CHURCH_ADMIN` role to access the portal.

### Middleware Protection

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === 'CHURCH_ADMIN',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    // ... other protected routes
  ],
}
```

### Server-Side Protection

```typescript
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CHURCH_ADMIN') {
    redirect('/login')
  }

  // Render page
}
```

### Getting Church ID

Church admins are linked to their church:

```typescript
const church = await prisma.church.findUnique({
  where: { adminUserId: session.user.id },
})
```

## Key Features

### Profile Completeness Checker

Tracks which sections are complete:

```typescript
const completeness = {
  basicInfo: !!church.address && !!church.phone,
  about: !!church.profile?.whoWeAre,
  serviceTimes: church.serviceTimes.length > 0,
  staff: church.staff.length > 0,
  photos: church.photos.length >= 3,
  social: !!(church.social?.youtubeUrl || church.social?.facebookUrl),
}

const percentage = Object.values(completeness).filter(Boolean).length / 6 * 100
```

### Rich Text Editor

For about sections, use a WYSIWYG editor:

```typescript
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@/components/editor'), {
  ssr: false,
})

<Editor
  value={content}
  onChange={setContent}
/>
```

### Image Upload

```typescript
'use client'

import { useState } from 'react'

export function ImageUpload() {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const { url } = await res.json()
    setUploading(false)

    return url
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
    />
  )
}
```

### Staff Reordering

Drag-and-drop to reorder staff:

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'

function StaffList({ staff, onReorder }) {
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = staff.findIndex(s => s.id === active.id)
      const newIndex = staff.findIndex(s => s.id === over.id)
      const newStaff = arrayMove(staff, oldIndex, newIndex)
      onReorder(newStaff)
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={staff}>
        {staff.map(member => (
          <StaffCard key={member.id} staff={member} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

### Form Validation

Use Zod for form validation:

```typescript
import { z } from 'zod'

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  bio: z.string().optional(),
  email: z.string().email().optional(),
  photoUrl: z.string().url().optional(),
})

type StaffFormData = z.infer<typeof staffSchema>
```

## GraphQL Mutations

### Update Church Profile

```graphql
mutation UpdateChurchProfile($input: UpdateChurchProfileInput!) {
  updateChurchProfile(input: $input) {
    id
    name
    profile {
      whoWeAre
      vision
    }
  }
}
```

### Add Staff Member

```graphql
mutation AddStaff($input: AddStaffInput!) {
  addChurchStaff(input: $input) {
    id
    name
    title
    bio
    photoUrl
  }
}
```

### Respond to Review

```graphql
mutation RespondToReview($reviewId: String!, $content: String!) {
  respondToReview(reviewId: $reviewId, content: $content) {
    id
    content
    respondedBy
  }
}
```

## UI Components

### Dashboard Card

```typescript
export function DashboardCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  )
}
```

### Completeness Progress

```typescript
export function CompletenessProgress({ percentage }: { percentage: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Profile Completeness</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

## Testing

### Manual Testing Checklist

- [ ] Login with church admin account
- [ ] Dashboard displays correct data
- [ ] Update profile information
- [ ] Add/edit/delete staff member
- [ ] Upload staff photo
- [ ] Create event
- [ ] Create sermon entry
- [ ] Upload church photos
- [ ] Respond to review
- [ ] Request verification
- [ ] View analytics

### Test Data

Create a test church admin user:

```sql
INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES (
  'test-church-admin-id',
  'admin@testchurch.jp',
  'Test Admin',
  'CHURCH_ADMIN',
  NOW(),
  NOW()
);

UPDATE "Church"
SET "adminUserId" = 'test-church-admin-id'
WHERE slug = 'test-church';
```

## Deployment

See [Deployment Guide](../../docs/DEPLOYMENT.md) for production deployment.

### Environment Variables

Set in hosting platform:
- All variables from `.env.local`
- Update `NEXTAUTH_URL` to production domain
- Configure file upload service (Cloudinary/S3)

## Troubleshooting

### Can't access portal

- Verify user has `CHURCH_ADMIN` role
- Check user is linked to a church (`adminUserId`)
- Clear cookies and login again

### Uploads failing

- Check file size limits
- Verify upload API key is correct
- Check CORS settings on upload service

### GraphQL mutations fail

- Verify user is authenticated
- Check user has permission for their church
- Validate input data format

### Build errors

- Clear `.next` folder: `rm -rf .next`
- Regenerate Prisma client
- Reinstall dependencies

## Future Enhancements

- [ ] Bulk photo upload
- [ ] Sermon series management
- [ ] Event recurrence patterns
- [ ] Email notifications for reviews
- [ ] Advanced analytics (heatmaps, funnels)
- [ ] Multi-language content management
- [ ] Calendar integration
- [ ] Automated social media posting

## Contributing

1. Create feature branch
2. Make changes
3. Test with church admin account
4. Submit pull request

## License

MIT
