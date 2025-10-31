# ChurchConnect Database Package

Shared database package with Prisma ORM for ChurchConnect Japan.

## Overview

This package provides:
- Prisma schema with all database models
- Prisma client for database queries
- Migration files for schema versioning
- Seed scripts for initial data

## Tech Stack

- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Language**: TypeScript

## Database Schema

The schema includes the following models:

### Location Models
- **Prefecture** - Japanese prefectures (47 total)
- **City** - Cities within prefectures

### Reference Data
- **Language** - Languages for church services
- **Denomination** - Church denominations

### Core Church Models
- **Church** - Main church entity
- **ChurchProfile** - Extended church information (About sections)
- **ChurchSocial** - Social media links
- **ChurchLanguage** - Many-to-many relationship for languages
- **ChurchStaff** - Pastors and church leaders
- **ChurchPhoto** - Photo gallery
- **ServiceTime** - Service schedules

### Content Models
- **Sermon** - Sermon archive
- **Event** - Church events

### Review Models
- **Review** - User reviews
- **ReviewResponse** - Church responses to reviews

### User Models
- **User** - Platform users (with roles: USER, CHURCH_ADMIN, ADMIN)

### Donation Models
- **PlatformDonation** - One-time and recurring donations
- **PlatformDonationSubscription** - Subscription management

### Administrative Models
- **VerificationRequest** - Church verification requests
- **ChurchAnalytics** - View tracking and analytics

## Environment Variables

Create `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/churchconnect?schema=public"
```

## Available Scripts

```bash
# Generate Prisma client and types
pnpm db:generate

# Push schema to database (no migrations, for development)
pnpm db:push

# Create and run migrations (for production)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio

# Seed initial data
pnpm db:seed
```

## Initial Setup

### 1. Install Dependencies

From the root directory:

```bash
pnpm install
```

### 2. Create Database

**Local PostgreSQL:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE churchconnect;

# Exit
\q
```

**Docker:**

```bash
docker run --name churchconnect-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=churchconnect \
  -p 5432:5432 \
  -d postgres:14
```

**Cloud Database** (Recommended):
- Supabase: https://supabase.com/
- Render: https://render.com/
- Neon: https://neon.tech/

### 3. Set Database URL

Update `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/churchconnect?schema=public"
```

### 4. Generate Prisma Client

```bash
cd packages/database
pnpm db:generate
```

This generates:
- Prisma Client in `node_modules/@prisma/client`
- TypeScript types for Prisma Client
- Pothos types for GraphQL in `node_modules/@pothos/plugin-prisma/generated`

### 5. Push Schema to Database

**Development (recommended):**

```bash
pnpm db:push
```

This creates all tables in the database without creating migration files. Perfect for rapid development.

**Production:**

```bash
pnpm db:migrate
```

This creates migration files in `prisma/migrations/` and applies them. Use this for production deployments.

### 6. Seed Initial Data

```bash
pnpm db:seed
```

This populates the database with:
- 47 Japanese prefectures
- Major cities (Tokyo, Osaka, Kyoto, Kanagawa, Fukuoka)
- 8 languages (Japanese, English, Korean, Chinese, etc.)
- 12 denominations (Baptist, Presbyterian, Catholic, etc.)

## Database Migrations

### Development Workflow

**1. Modify Schema**

Edit `prisma/schema.prisma`:

```prisma
model Church {
  // ... existing fields
  websiteUrl String? // Add new field
}
```

**2. Push Changes**

```bash
pnpm db:push
```

This applies changes immediately without creating migration files.

**3. Regenerate Client**

```bash
pnpm db:generate
```

### Production Workflow

**1. Create Migration**

```bash
pnpm db:migrate
```

Enter migration name when prompted (e.g., "add_website_url_to_church")

This creates:
- Migration SQL file in `prisma/migrations/`
- Applies migration to database
- Updates Prisma Client

**2. Commit Migration Files**

```bash
git add prisma/migrations
git commit -m "migration: add website url to church"
```

**3. Deploy to Production**

On production server:

```bash
pnpm db:migrate
```

This applies all pending migrations.

### Migration Commands

```bash
# Create migration without applying
prisma migrate dev --create-only

# Apply pending migrations
prisma migrate deploy

# Reset database (WARNING: deletes all data)
prisma migrate reset

# View migration status
prisma migrate status

# Resolve migration issues
prisma migrate resolve
```

## Seeding

### Seed Script

Location: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { prefectures } from './data/prefectures'
import { cities } from './data/cities'
import { languages } from './data/languages'
import { denominations } from './data/denominations'

const prisma = new PrismaClient()

async function main() {
  // Seed prefectures
  for (const prefecture of prefectures) {
    await prisma.prefecture.upsert({
      where: { name: prefecture.name },
      update: {},
      create: prefecture,
    })
  }

  // ... seed other data
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Seed Data Files

**Prefectures** (`prisma/data/prefectures.ts`):
- All 47 Japanese prefectures
- English and Japanese names

**Cities** (`prisma/data/cities.ts`):
- Major cities in Tokyo, Osaka, Kyoto, Kanagawa, Fukuoka
- English and Japanese names

**Languages** (`prisma/data/languages.ts`):
- Japanese, English, Korean, Chinese, Spanish, Portuguese, Tagalog, Vietnamese

**Denominations** (`prisma/data/denominations.ts`):
- Protestant denominations (Non-denominational, Baptist, Presbyterian, etc.)
- Catholic
- Orthodox

### Running Seeds

```bash
# Run seed script
pnpm db:seed

# Or directly
cd packages/database
npx tsx prisma/seed.ts
```

### Custom Seed Scripts

Create additional seed scripts:

```typescript
// prisma/seed-churches.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedChurches() {
  // Get reference data
  const tokyo = await prisma.prefecture.findUnique({
    where: { name: 'Tokyo' },
  })

  const denomination = await prisma.denomination.findFirst({
    where: { name: 'Non-denominational' },
  })

  // Create sample churches
  await prisma.church.create({
    data: {
      name: 'Sample Church Tokyo',
      slug: 'sample-church-tokyo',
      denominationId: denomination!.id,
      prefectureId: tokyo!.id,
      // ... other fields
    },
  })
}

seedChurches()
```

Run:

```bash
npx tsx prisma/seed-churches.ts
```

## Prisma Client Usage

### Basic Queries

```typescript
import { prisma } from '@repo/database'

// Find all churches
const churches = await prisma.church.findMany()

// Find church by slug
const church = await prisma.church.findUnique({
  where: { slug: 'sample-church' },
})

// Find with relations
const churchWithData = await prisma.church.findUnique({
  where: { slug: 'sample-church' },
  include: {
    city: true,
    prefecture: true,
    profile: true,
    staff: true,
    serviceTimes: {
      include: {
        language: true,
      },
    },
  },
})

// Create church
const newChurch = await prisma.church.create({
  data: {
    name: 'New Church',
    slug: 'new-church',
    // ... other fields
  },
})

// Update church
const updated = await prisma.church.update({
  where: { id: 'church-id' },
  data: { isVerified: true },
})

// Delete church
await prisma.church.delete({
  where: { id: 'church-id' },
})
```

### Advanced Queries

```typescript
// Filtering
const churches = await prisma.church.findMany({
  where: {
    isPublished: true,
    isDeleted: false,
    prefectureId: 'tokyo-id',
    languages: {
      some: {
        languageId: 'english-id',
      },
    },
  },
})

// Sorting
const churches = await prisma.church.findMany({
  orderBy: [
    { isVerified: 'desc' },
    { name: 'asc' },
  ],
})

// Pagination
const churches = await prisma.church.findMany({
  skip: 20,
  take: 10,
})

// Counting
const count = await prisma.church.count({
  where: { isPublished: true },
})

// Aggregation
const stats = await prisma.church.aggregate({
  _count: true,
  _avg: { latitude: true },
})

// Transactions
await prisma.$transaction([
  prisma.church.create({ data: churchData }),
  prisma.churchProfile.create({ data: profileData }),
])
```

## Prisma Studio

### Accessing Prisma Studio

```bash
pnpm db:studio
```

Opens http://localhost:5555

Prisma Studio provides a GUI to:
- Browse all tables
- View, edit, and delete records
- Run queries
- Visualize relationships

### Use Cases

- Debugging data issues
- Manual data entry
- Verifying seed data
- Testing relationships
- Quick database exploration

## Database Maintenance

### Resetting Database

**WARNING: This deletes all data!**

```bash
# Reset and re-run migrations
pnpm db:migrate reset

# Or manually
pnpm db:push --force-reset
pnpm db:seed
```

### Backing Up Database

```bash
# PostgreSQL dump
pg_dump "postgresql://user:password@host:port/database" > backup.sql

# Restore
psql "postgresql://user:password@host:port/database" < backup.sql
```

### Optimizing Performance

**Add indexes:**

```prisma
model Church {
  id   String @id
  name String

  @@index([name])
  @@index([prefectureId, cityId])
}
```

Then regenerate and migrate:

```bash
pnpm db:generate
pnpm db:migrate
```

## Troubleshooting

### Prisma Client Not Found

```bash
# Regenerate client
cd packages/database
pnpm db:generate
cd ../..
pnpm install
```

### Migration Failed

```bash
# Check status
pnpm prisma migrate status

# Mark migration as applied (if already applied manually)
pnpm prisma migrate resolve --applied "migration-name"

# Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back "migration-name"
```

### Connection Failed

```bash
# Test connection
psql "$DATABASE_URL"

# Check PostgreSQL is running
# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# Docker:
docker ps
```

### Schema Out of Sync

```bash
# Reset and start fresh
pnpm db:push --force-reset
pnpm db:seed
```

## Production Considerations

### Connection Pooling

Use PgBouncer or Prisma's connection pooling:

```env
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true&connection_limit=10"
```

### Read Replicas

Configure read replicas for scalability:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Read from replica
const prismRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL,
    },
  },
})
```

### Logging

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Duration: ' + e.duration + 'ms')
})
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## License

MIT
