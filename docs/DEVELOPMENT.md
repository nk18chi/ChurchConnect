# Development Guide

This guide covers everything you need to know to develop ChurchConnect Japan locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Database Setup](#database-setup)
- [Running the Apps](#running-the-apps)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js 20+**
   ```bash
   node --version  # Should be 20.0.0 or higher
   ```
   Download from: https://nodejs.org/

2. **pnpm 8.15.0+**
   ```bash
   npm install -g pnpm
   pnpm --version  # Should be 8.15.0 or higher
   ```

3. **PostgreSQL 14+**

   **Option A: Local Installation**
   - macOS: `brew install postgresql@14`
   - Ubuntu: `sudo apt install postgresql-14`
   - Windows: Download from https://www.postgresql.org/download/

   **Option B: Docker**
   ```bash
   docker run --name churchconnect-db \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=churchconnect \
     -p 5432:5432 \
     -d postgres:14
   ```

   **Option C: Cloud Database** (Recommended for simplicity)
   - Supabase (free tier): https://supabase.com/
   - Render PostgreSQL (free tier): https://render.com/
   - Neon (free tier): https://neon.tech/

4. **Git**
   ```bash
   git --version
   ```

### Optional Tools

- **Prisma Studio** (included as dependency)
- **VSCode** with extensions:
  - Prisma
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
- **Postman** or **GraphQL Playground** for API testing

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ChurchConnect
```

### 2. Install Dependencies

Install all dependencies for all packages and apps:

```bash
pnpm install
```

This will:
- Install root dependencies
- Install dependencies for all apps (`web`, `api`, `church-portal`, `admin`)
- Install dependencies for all packages (`database`, `graphql`, `ui`, `auth`, etc.)
- Create symlinks between workspace packages

### 3. Environment Variables

#### Root Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/churchconnect?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Stripe (Platform Donations)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret_here"

# App URLs
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

#### Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET`.

#### Get Stripe Keys

1. Sign up at https://stripe.com/
2. Get your test API keys from the Dashboard
3. For webhook secret, you'll set up webhooks locally later

#### App-Specific Environment Files

```bash
# Web app
cp apps/web/.env.example apps/web/.env.local

# API app
cp apps/api/.env.example apps/api/.env

# Church Portal app
cp apps/church-portal/.env.example apps/church-portal/.env.local

# Admin app
cp apps/admin/.env.example apps/admin/.env.local
```

Edit each file with the same values from the root `.env`.

## Database Setup

### 1. Create Database

If using local PostgreSQL:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE churchconnect;

# Create user (optional)
CREATE USER churchconnect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE churchconnect TO churchconnect_user;

# Exit
\q
```

### 2. Generate Prisma Client

```bash
cd packages/database
pnpm db:generate
cd ../..
```

This generates the Prisma client and Pothos types.

### 3. Push Schema to Database

```bash
cd packages/database
pnpm db:push
```

This creates all tables in your database without migrations.

**Alternative: Use Migrations (Production)**

```bash
cd packages/database
pnpm db:migrate
```

This creates migration files and applies them.

### 4. Seed Initial Data

```bash
cd packages/database
pnpm db:seed
```

This will seed:
- 47 Prefectures
- Major cities (Tokyo, Osaka, Kyoto, etc.)
- 8 Languages
- 12 Denominations

### 5. Verify Database Setup

Open Prisma Studio to browse your database:

```bash
cd packages/database
pnpm db:studio
```

This opens http://localhost:5555 with a GUI for your database.

## Running the Apps

### Development Mode (All Apps)

From the root directory:

```bash
pnpm dev
```

This starts all apps concurrently:

- **Web App**: http://localhost:3000
- **GraphQL API**: http://localhost:3001 (GraphQL Playground: http://localhost:3001/graphql)
- **Church Portal**: http://localhost:3002
- **Admin Dashboard**: http://localhost:3003

### Individual Apps

Run specific apps:

```bash
# Web app only
pnpm --filter web dev

# API only
pnpm --filter api dev

# Church portal only
pnpm --filter church-portal dev

# Admin dashboard only
pnpm --filter admin dev
```

### Build for Production

Build all apps:

```bash
pnpm build
```

Build specific app:

```bash
pnpm --filter web build
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit files in the appropriate package or app.

### 3. Database Schema Changes

If you modify `packages/database/prisma/schema.prisma`:

```bash
cd packages/database

# Generate client
pnpm db:generate

# Push changes to database
pnpm db:push

# OR create a migration (preferred for production)
pnpm db:migrate
```

### 4. GraphQL Schema Changes

If you modify GraphQL types in `packages/graphql/src/types/`:

The schema is code-first (Pothos), so just restart the API server:

```bash
pnpm --filter api dev
```

### 5. Testing

```bash
# Lint all code
pnpm lint

# Type check all code
pnpm type-check

# Format code
pnpm format
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

## Common Tasks

### Adding a New Package

```bash
# Create package directory
mkdir -p packages/new-package/src

# Create package.json
cd packages/new-package
pnpm init

# Add to pnpm-workspace.yaml (already configured)
```

### Adding Dependencies

**External dependency to a specific package:**

```bash
pnpm add <package-name> --filter <workspace-name>

# Examples:
pnpm add zod --filter @repo/database
pnpm add react-query --filter web
```

**Internal workspace dependency:**

```bash
pnpm add @repo/database --filter @repo/graphql
```

**Dev dependency:**

```bash
pnpm add -D <package-name> --filter <workspace-name>
```

### Resetting Database

```bash
cd packages/database

# Reset database (drops all data)
pnpm db:push --force-reset

# Re-seed
pnpm db:seed
```

### Creating Sample Churches

You can manually create churches using Prisma Studio or write a seed script:

```typescript
// packages/database/prisma/seed-churches.ts
import { prisma } from '../src/client'

async function seedChurches() {
  const tokyo = await prisma.prefecture.findUnique({
    where: { name: 'Tokyo' }
  })

  const shibuya = await prisma.city.findFirst({
    where: { name: 'Shibuya', prefectureId: tokyo?.id }
  })

  const denomination = await prisma.denomination.findFirst({
    where: { name: 'Non-denominational' }
  })

  await prisma.church.create({
    data: {
      name: 'Sample Church Tokyo',
      slug: 'sample-church-tokyo',
      denominationId: denomination!.id,
      prefectureId: tokyo!.id,
      cityId: shibuya!.id,
      address: '1-1-1 Shibuya, Shibuya-ku, Tokyo',
      isPublished: true,
      isVerified: true,
      isComplete: true,
    }
  })
}
```

### Viewing GraphQL Schema

1. Start the API: `pnpm --filter api dev`
2. Open http://localhost:3001/graphql
3. Click "Docs" to browse schema

### Testing Stripe Webhooks Locally

Install Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

Login:

```bash
stripe login
```

Forward webhooks to local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This will output a webhook secret starting with `whsec_`. Add it to your `.env`:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Test a payment:

```bash
stripe trigger payment_intent.succeeded
```

### Debugging

**Enable Prisma Query Logging:**

Edit `packages/database/src/client.ts`:

```typescript
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

**Enable Next.js Debug Mode:**

```bash
NODE_OPTIONS='--inspect' pnpm --filter web dev
```

**View Database Queries:**

```bash
cd packages/database
pnpm db:studio
```

## Troubleshooting

### Port Already in Use

If ports 3000-3003 are in use:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

Or change ports in each app's `package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 4000"
  }
}
```

### Prisma Client Not Found

```bash
cd packages/database
pnpm db:generate
cd ../..
pnpm install
```

### Database Connection Failed

1. Check PostgreSQL is running:
   ```bash
   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql

   # Docker
   docker ps
   ```

2. Verify `DATABASE_URL` in `.env`

3. Test connection:
   ```bash
   psql "postgresql://user:password@localhost:5432/churchconnect"
   ```

### TypeScript Errors

```bash
# Clean and rebuild
pnpm clean
pnpm build

# Regenerate types
cd packages/database
pnpm db:generate
```

### Stripe Webhooks Not Working

1. Make sure webhook secret is set in `.env`
2. Verify webhook signature verification in code
3. Use Stripe CLI for local testing
4. Check webhook logs in Stripe Dashboard

### Next.js Build Errors

```bash
# Clear Next.js cache
rm -rf apps/web/.next
rm -rf apps/church-portal/.next
rm -rf apps/admin/.next

# Rebuild
pnpm build
```

### Module Not Found Errors

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## Best Practices

### Code Organization

- Keep business logic in packages, not apps
- Use shared UI components from `packages/ui`
- Keep API logic in GraphQL resolvers
- Use Prisma for all database queries

### Type Safety

- Never use `any` type
- Use Prisma types for database models
- Use GraphQL types for API contracts
- Enable strict mode in TypeScript

### Performance

- Use Prisma's `include` and `select` wisely
- Implement pagination for large lists
- Use Next.js Image component for images
- Lazy load heavy components

### Security

- Never commit `.env` files
- Validate all user inputs
- Use parameterized queries (Prisma does this)
- Implement rate limiting for API
- Sanitize HTML content

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Pothos GraphQL](https://pothos-graphql.dev/)
- [NextAuth.js](https://next-auth.js.org/)
- [Stripe API](https://stripe.com/docs/api)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

Need help? Create an issue on GitHub or contact the team.
