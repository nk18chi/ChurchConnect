# ChurchConnect Production-Ready Deployment Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare ChurchConnect MVP for production deployment with all necessary configurations, testing, monitoring, and documentation.

**Architecture:** Deploy 4 apps (web, church-portal, admin, api) to Render with PostgreSQL database, configure third-party services (Cloudinary, Resend, reCAPTCHA, Stripe), set up monitoring, and create operational documentation.

**Tech Stack:** Render (hosting), PostgreSQL (managed database), Docker (containerization), GitHub Actions (CI/CD), Sentry (error tracking)

---

## Phase 1: Database Preparation & Deployment

### Task 1: Apply All Pending Migrations

**Files:**
- Check: `packages/database/prisma/migrations/`
- Verify: Database schema matches migrations

**Step 1: Check migration status**

```bash
cd packages/database
npx prisma migrate status
```

Expected: List of pending migrations or "Database schema is up to date"

**Step 2: Apply all pending migrations**

```bash
npx prisma migrate deploy
```

Expected: All migrations applied successfully

**Step 3: Verify schema integrity**

```bash
npx prisma db pull
```

Expected: No changes to schema.prisma (confirms database matches schema)

**Step 4: Regenerate Prisma Client**

```bash
npx prisma generate
```

Expected: Prisma Client generated with all new types

**Step 5: Run full-text search test suite**

```bash
psql "$DATABASE_URL" < prisma/test-fulltext-search.sql
```

Expected: All tests pass, search vectors populated

**Step 6: Commit if any files changed**

```bash
git add .
git commit -m "chore(database): apply all migrations and verify schema"
```

---

### Task 2: Create Database Seed Script

**Files:**
- Modify: `packages/database/prisma/seed.ts`
- Verify: `packages/database/package.json` has seed script

**Step 1: Update seed script with reference data**

File: `packages/database/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { prefectures } from './data/prefectures'
import { cities } from './data/cities'
import { languages } from './data/languages'
import { denominations } from './data/denominations'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed Prefectures
  console.log('Seeding prefectures...')
  for (const prefecture of prefectures) {
    await prisma.prefecture.upsert({
      where: { name: prefecture.name },
      update: prefecture,
      create: prefecture,
    })
  }
  console.log(`✓ Seeded ${prefectures.length} prefectures`)

  // Seed Cities
  console.log('Seeding cities...')
  for (const city of cities) {
    const prefecture = await prisma.prefecture.findUnique({
      where: { name: city.prefectureName },
    })
    if (prefecture) {
      await prisma.city.upsert({
        where: { name_prefectureId: { name: city.name, prefectureId: prefecture.id } },
        update: { nameJa: city.nameJa },
        create: {
          name: city.name,
          nameJa: city.nameJa,
          prefectureId: prefecture.id,
        },
      })
    }
  }
  console.log(`✓ Seeded ${cities.length} cities`)

  // Seed Languages
  console.log('Seeding languages...')
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: language,
      create: language,
    })
  }
  console.log(`✓ Seeded ${languages.length} languages`)

  // Seed Denominations
  console.log('Seeding denominations...')
  for (const denomination of denominations) {
    await prisma.denomination.upsert({
      where: { name: denomination.name },
      update: denomination,
      create: denomination,
    })
  }
  console.log(`✓ Seeded ${denominations.length} denominations`)

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Step 2: Verify seed data files exist**

Check these files exist:
- `packages/database/prisma/data/prefectures.ts`
- `packages/database/prisma/data/cities.ts`
- `packages/database/prisma/data/languages.ts`
- `packages/database/prisma/data/denominations.ts`

**Step 3: Run seed script**

```bash
cd packages/database
pnpm db:seed
```

Expected: All reference data seeded successfully

**Step 4: Verify seeded data**

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Prefecture\";"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Language\";"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Denomination\";"
```

Expected: 47 prefectures, 8+ languages, 12+ denominations

**Step 5: Commit**

```bash
git add packages/database/prisma/seed.ts
git commit -m "feat(database): add comprehensive seed script for reference data"
```

---

### Task 3: Create Database Backup Strategy

**Files:**
- Create: `packages/database/scripts/backup.sh`
- Create: `packages/database/scripts/restore.sh`
- Create: `docs/DATABASE_BACKUP.md`

**Step 1: Create backup script**

File: `packages/database/scripts/backup.sh`

```bash
#!/bin/bash
set -e

# Database backup script for ChurchConnect
# Usage: ./backup.sh [backup-name]

BACKUP_NAME=${1:-"backup-$(date +%Y%m%d-%H%M%S)"}
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Get database URL from environment
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

echo "Creating backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE.gz"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +11 | xargs rm -f 2>/dev/null || true
echo "✅ Old backups cleaned up"
```

**Step 2: Make script executable**

```bash
chmod +x packages/database/scripts/backup.sh
```

**Step 3: Create restore script**

File: `packages/database/scripts/restore.sh`

```bash
#!/bin/bash
set -e

# Database restore script for ChurchConnect
# Usage: ./restore.sh <backup-file>

if [ -z "$1" ]; then
  echo "Error: Please provide backup file path"
  echo "Usage: ./restore.sh <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
echo "Database: $DATABASE_URL"
echo "Backup file: $BACKUP_FILE"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled"
  exit 1
fi

echo "Restoring database..."

# Decompress if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
  psql "$DATABASE_URL" < "$BACKUP_FILE"
fi

echo "✅ Database restored successfully"
```

**Step 4: Make restore script executable**

```bash
chmod +x packages/database/scripts/restore.sh
```

**Step 5: Create backup documentation**

File: `docs/DATABASE_BACKUP.md`

```markdown
# Database Backup & Restore

## Automated Backups

### Creating a Backup

```bash
cd packages/database
./scripts/backup.sh
```

This creates a compressed backup in `backups/` directory with timestamp.

### Restoring from Backup

```bash
cd packages/database
./scripts/restore.sh backups/backup-20251031-120000.sql.gz
```

⚠️ **Warning:** This will overwrite your current database!

## Manual Backups

### Backup

```bash
pg_dump "$DATABASE_URL" > backup.sql
gzip backup.sql
```

### Restore

```bash
psql "$DATABASE_URL" < backup.sql
```

## Production Backup Strategy

1. **Automated Daily Backups** - Set up cron job or Render scheduled task
2. **Before Migrations** - Always backup before applying migrations
3. **Before Major Changes** - Backup before any risky operations
4. **Retention Policy** - Keep last 10 daily backups, 4 weekly backups

### Render Managed Database Backups

Render provides automatic daily backups for managed PostgreSQL:
- Available in dashboard under "Backups" tab
- Point-in-time recovery available
- Manual snapshots can be triggered

## Testing Backups

Regularly test backup restoration:

```bash
# 1. Create test database
createdb churchconnect_test

# 2. Restore backup to test database
DATABASE_URL="postgresql://localhost/churchconnect_test" ./scripts/restore.sh backups/latest.sql.gz

# 3. Verify data
psql churchconnect_test -c "SELECT COUNT(*) FROM \"Church\";"

# 4. Clean up
dropdb churchconnect_test
```
```

**Step 6: Test backup script**

```bash
cd packages/database
./scripts/backup.sh test-backup
```

Expected: Backup file created in backups/ directory

**Step 7: Commit**

```bash
git add packages/database/scripts/ docs/DATABASE_BACKUP.md
git commit -m "feat(database): add backup and restore scripts with documentation"
```

---

## Phase 2: Environment Configuration

### Task 4: Create Production Environment Template

**Files:**
- Create: `.env.production.template`
- Create: `docs/ENVIRONMENT_SETUP.md`
- Update: `.env.example`

**Step 1: Create production environment template**

File: `.env.production.template`

```bash
# ChurchConnect Production Environment Variables

# ==========================================
# DATABASE
# ==========================================
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
# For connection pooling (optional)
DATABASE_URL_POOLED="postgresql://user:password@host:6543/database?schema=public&pgbouncer=true"

# ==========================================
# NEXTAUTH (All Apps)
# ==========================================
NEXTAUTH_SECRET="GENERATE_WITH_openssl_rand_base64_32"
NEXTAUTH_URL="https://yoursite.com"

# ==========================================
# APP URLS
# ==========================================
NEXT_PUBLIC_WEB_URL="https://churchconnect.jp"
NEXT_PUBLIC_API_URL="https://api.churchconnect.jp"
NEXT_PUBLIC_PORTAL_URL="https://portal.churchconnect.jp"
NEXT_PUBLIC_ADMIN_URL="https://admin.churchconnect.jp"
NEXT_PUBLIC_GRAPHQL_URL="https://api.churchconnect.jp/graphql"

# ==========================================
# CLOUDINARY (Image Upload)
# ==========================================
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ==========================================
# RESEND (Email Service)
# ==========================================
RESEND_API_KEY="re_live_your_api_key"
EMAIL_FROM="ChurchConnect Japan <noreply@churchconnect.jp>"
ADMIN_EMAIL="admin@churchconnect.jp"

# ==========================================
# RECAPTCHA (Spam Prevention)
# ==========================================
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"

# ==========================================
# STRIPE (Platform Donations)
# ==========================================
STRIPE_SECRET_KEY="sk_live_your_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# ==========================================
# MONITORING (Optional)
# ==========================================
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ENVIRONMENT="production"

# ==========================================
# FEATURE FLAGS (Optional)
# ==========================================
ENABLE_ANALYTICS="true"
ENABLE_EMAIL_NOTIFICATIONS="true"
ENABLE_SEARCH="true"
```

**Step 2: Create comprehensive environment setup guide**

File: `docs/ENVIRONMENT_SETUP.md`

```markdown
# Environment Setup Guide

## Overview

ChurchConnect requires environment variables for:
- Database connection
- Authentication
- Third-party services (Cloudinary, Resend, reCAPTCHA, Stripe)
- Application URLs

## Development Setup

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Database

**Local PostgreSQL:**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/churchconnect?schema=public"
```

**Docker:**
```bash
docker run --name churchconnect-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=churchconnect \
  -p 5432:5432 \
  -d postgres:14

DATABASE_URL="postgresql://postgres:password@localhost:5432/churchconnect?schema=public"
```

### 3. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Add to .env:
```bash
NEXTAUTH_SECRET="<generated-secret>"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Configure Third-Party Services

**Cloudinary (Development):**
1. Sign up at https://cloudinary.com (free tier)
2. Get credentials from dashboard
3. Add to .env:
```bash
CLOUDINARY_CLOUD_NAME="your-dev-cloud-name"
CLOUDINARY_API_KEY="your-dev-api-key"
CLOUDINARY_API_SECRET="your-dev-api-secret"
```

**Resend (Development):**
1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Get API key
3. For testing, use onboarding email:
```bash
RESEND_API_KEY="re_your_test_key"
EMAIL_FROM="onboarding@resend.dev"
ADMIN_EMAIL="you@example.com"
```

**reCAPTCHA (Development):**
1. Register at https://www.google.com/recaptcha/admin
2. Choose reCAPTCHA v3
3. Add localhost to domains
4. Add keys to .env:
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-test-site-key"
RECAPTCHA_SECRET_KEY="your-test-secret-key"
```

**Stripe (Development):**
1. Use test mode keys from Stripe dashboard
```bash
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # From Stripe CLI
```

2. Install Stripe CLI for webhook testing:
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

### 5. Set Application URLs

```bash
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_PORTAL_URL="http://localhost:3002"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3003"
NEXT_PUBLIC_GRAPHQL_URL="http://localhost:3001/graphql"
```

## Production Setup

### 1. Use Production Template

```bash
cp .env.production.template .env.production
```

### 2. Configure Managed Database (Render)

1. Create PostgreSQL database on Render
2. Copy Internal Database URL:
```bash
DATABASE_URL="postgresql://user:pass@dpg-xxx-a.oregon-postgres.render.com/db_name"
```

3. For connection pooling, use External URL with pgbouncer:
```bash
DATABASE_URL_POOLED="postgresql://user:pass@dpg-xxx-a.oregon-postgres.render.com/db_name?pgbouncer=true"
```

### 3. Generate Strong NextAuth Secret

```bash
openssl rand -base64 32
```

Use different secret for production!

### 4. Configure Production Services

**Cloudinary (Production):**
- Upgrade to paid plan if needed
- Use production credentials
- Configure allowed origins in dashboard

**Resend (Production):**
- Verify custom sending domain
- Use production API key
- Set up proper FROM address

**reCAPTCHA (Production):**
- Register production domains
- Use production site key and secret

**Stripe (Production):**
- Activate live mode
- Use live API keys
- Set up production webhook endpoint
- Configure webhook events

### 5. Set Production URLs

```bash
NEXT_PUBLIC_WEB_URL="https://churchconnect.jp"
NEXT_PUBLIC_API_URL="https://api.churchconnect.jp"
NEXT_PUBLIC_PORTAL_URL="https://portal.churchconnect.jp"
NEXT_PUBLIC_ADMIN_URL="https://admin.churchconnect.jp"
```

### 6. Add Monitoring (Optional)

**Sentry:**
1. Create project on Sentry
2. Add DSN:
```bash
SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_ENVIRONMENT="production"
```

## Environment Variables by App

### Web App (`apps/web`)
- DATABASE_URL
- NEXTAUTH_URL, NEXTAUTH_SECRET
- NEXT_PUBLIC_* (all)
- RECAPTCHA_SECRET_KEY, NEXT_PUBLIC_RECAPTCHA_SITE_KEY
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL

### Church Portal (`apps/church-portal`)
- DATABASE_URL
- NEXTAUTH_URL, NEXTAUTH_SECRET
- NEXT_PUBLIC_*
- CLOUDINARY_*
- RESEND_API_KEY, EMAIL_FROM

### Admin Dashboard (`apps/admin`)
- DATABASE_URL
- NEXTAUTH_URL, NEXTAUTH_SECRET
- NEXT_PUBLIC_*
- RESEND_API_KEY, EMAIL_FROM

### API (`apps/api`)
- DATABASE_URL
- NEXTAUTH_URL, NEXTAUTH_SECRET (for session verification)

## Verification Checklist

- [ ] Database connection works
- [ ] NextAuth authentication works
- [ ] Cloudinary image upload works
- [ ] Resend emails send successfully
- [ ] reCAPTCHA validates correctly
- [ ] Stripe checkout works
- [ ] Stripe webhooks process events
- [ ] All app URLs are correct
- [ ] CORS is configured properly
```

**Step 3: Update .env.example with all variables**

Ensure .env.example has all variables listed above

**Step 4: Commit**

```bash
git add .env.production.template docs/ENVIRONMENT_SETUP.md .env.example
git commit -m "docs: add production environment template and setup guide"
```

---

### Task 5: Create Deployment Scripts

**Files:**
- Create: `scripts/deploy-check.sh`
- Create: `scripts/health-check.sh`
- Create: `docs/DEPLOYMENT.md` (enhance existing)

**Step 1: Create pre-deployment check script**

File: `scripts/deploy-check.sh`

```bash
#!/bin/bash
set -e

echo "🔍 ChurchConnect Pre-Deployment Checks"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to print status
check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check Node version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -ge 20 ]; then
  check_pass "Node.js version $NODE_VERSION.x (required: >=20)"
else
  check_fail "Node.js version $NODE_VERSION.x (required: >=20)"
fi
echo ""

# 2. Check pnpm
echo "2. Checking pnpm..."
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm -v)
  check_pass "pnpm installed ($PNPM_VERSION)"
else
  check_fail "pnpm not installed"
fi
echo ""

# 3. Check environment variables
echo "3. Checking environment variables..."

required_vars=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "NEXT_PUBLIC_WEB_URL"
  "CLOUDINARY_CLOUD_NAME"
  "RESEND_API_KEY"
  "NEXT_PUBLIC_RECAPTCHA_SITE_KEY"
  "STRIPE_SECRET_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    check_fail "$var not set"
  else
    check_pass "$var is set"
  fi
done
echo ""

# 4. Check database connection
echo "4. Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
  if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
    check_pass "Database connection successful"
  else
    check_fail "Database connection failed"
  fi
else
  check_fail "DATABASE_URL not set"
fi
echo ""

# 5. Check migrations
echo "5. Checking database migrations..."
cd packages/database
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)
if echo "$MIGRATION_STATUS" | grep -q "up to date"; then
  check_pass "All migrations applied"
elif echo "$MIGRATION_STATUS" | grep -q "pending"; then
  check_fail "Pending migrations found"
else
  check_warn "Could not determine migration status"
fi
cd ../..
echo ""

# 6. Run type check
echo "6. Running TypeScript type check..."
if pnpm type-check &> /dev/null; then
  check_pass "Type check passed"
else
  check_fail "Type check failed"
fi
echo ""

# 7. Run build
echo "7. Running production build..."
if pnpm build &> /dev/null; then
  check_pass "Build successful"
else
  check_fail "Build failed"
fi
echo ""

# Summary
echo "========================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS check(s) failed. Please fix errors before deploying.${NC}"
  exit 1
fi
```

**Step 2: Make script executable**

```bash
chmod +x scripts/deploy-check.sh
```

**Step 3: Create health check script**

File: `scripts/health-check.sh`

```bash
#!/bin/bash

# Health check script for monitoring deployed apps
# Usage: ./health-check.sh

echo "🏥 ChurchConnect Health Check"
echo "=============================="
echo ""

check_endpoint() {
  local name=$1
  local url=$2
  local expected=$3

  echo -n "Checking $name... "

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

  if [ "$status" = "$expected" ]; then
    echo "✓ OK ($status)"
    return 0
  else
    echo "✗ FAIL (got $status, expected $expected)"
    return 1
  fi
}

# Check all apps
check_endpoint "Web App" "$NEXT_PUBLIC_WEB_URL" "200"
check_endpoint "Church Portal" "$NEXT_PUBLIC_PORTAL_URL/login" "200"
check_endpoint "Admin Dashboard" "$NEXT_PUBLIC_ADMIN_URL/login" "200"
check_endpoint "GraphQL API" "$NEXT_PUBLIC_GRAPHQL_URL" "400"  # GraphQL returns 400 for GET without query

echo ""
echo "Health check complete!"
```

**Step 4: Make health check script executable**

```bash
chmod +x scripts/health-check.sh
```

**Step 5: Enhance DEPLOYMENT.md with checklist**

Add to existing `docs/DEPLOYMENT.md`:

```markdown
## Pre-Deployment Checklist

Run the pre-deployment check script:

```bash
./scripts/deploy-check.sh
```

This verifies:
- [ ] Node.js version >=20
- [ ] pnpm installed
- [ ] All environment variables set
- [ ] Database connection works
- [ ] All migrations applied
- [ ] TypeScript type check passes
- [ ] Production build succeeds

## Post-Deployment Verification

After deploying, run health checks:

```bash
./scripts/health-check.sh
```

Manual verification:
- [ ] Web app loads at public URL
- [ ] Church portal loads and login works
- [ ] Admin dashboard loads and login works
- [ ] GraphQL API responds
- [ ] Image upload to Cloudinary works
- [ ] Contact form sends emails
- [ ] Stripe checkout works
- [ ] Stripe webhooks process events
- [ ] reCAPTCHA validates on contact forms
- [ ] Full-text search returns results
```

**Step 6: Commit**

```bash
git add scripts/ docs/DEPLOYMENT.md
git commit -m "feat(deployment): add pre-deployment check and health check scripts"
```

---

## Phase 3: Testing & Quality Assurance

### Task 6: Create Manual Testing Checklist

**Files:**
- Enhance: `docs/TESTING.md`
- Create: `docs/CRITICAL_PATHS.md`

**Step 1: Add critical path testing document**

File: `docs/CRITICAL_PATHS.md`

```markdown
# Critical Path Testing

These are the most important user flows that MUST work in production.

## Critical Path 1: User Can Discover Churches

**Steps:**
1. Visit homepage
2. Enter search query "church"
3. Filter by prefecture (Tokyo)
4. Click on a church from results
5. View church profile with all tabs

**Expected:**
- Search returns relevant results
- Filters work correctly
- Church profile loads with all content
- All tabs display correctly (About, Leadership, Worship, Events, Sermons, Give, Connect)

**Test Data Required:**
- At least 5 published churches
- Churches with complete profiles
- Service times, staff, photos

---

## Critical Path 2: User Can Submit Review

**Steps:**
1. Create user account / login
2. Navigate to church profile
3. Scroll to reviews section
4. Click "Write a Review"
5. Fill out review form
6. Submit review

**Expected:**
- User can register/login
- Review form appears
- Review submits successfully
- User sees "awaiting moderation" message
- User receives confirmation email

**Test Data Required:**
- Test user account
- Published church

---

## Critical Path 3: Church Admin Can Manage Profile

**Steps:**
1. Login as church admin
2. Navigate to profile editor
3. Update "Who We Are" section
4. Add a staff member
5. Upload a photo
6. Save changes

**Expected:**
- Church admin can login
- Profile editor loads with current data
- Changes save successfully
- Public profile updates immediately
- No errors or data loss

**Test Data Required:**
- Church admin account linked to a church
- Test images for upload

---

## Critical Path 4: Admin Can Moderate Review

**Steps:**
1. Login as platform admin
2. Navigate to reviews moderation
3. View pending review
4. Read review content
5. Approve review

**Expected:**
- Admin can login
- Pending reviews display
- Review can be approved
- Emails sent (to church admin and reviewer)
- Review appears on public church profile

**Test Data Required:**
- Admin account
- Pending review in database

---

## Critical Path 5: User Can Make Platform Donation

**Steps:**
1. Visit /donate page
2. Select one-time donation
3. Choose ¥1,000 amount
4. Click "Donate Now"
5. Complete Stripe Checkout
6. Return to success page

**Expected:**
- Donate page loads
- Stripe Checkout opens
- Payment processes successfully
- User redirected to success page
- User receives receipt email
- Donation recorded in database

**Test Data Required:**
- Stripe test mode enabled
- Test credit card (4242 4242 4242 4242)

---

## Critical Path 6: Contact Form Works

**Steps:**
1. Visit church profile
2. Navigate to Connect tab
3. Fill out contact form
4. Solve reCAPTCHA (invisible)
5. Submit form

**Expected:**
- Contact form displays
- reCAPTCHA validates
- Form submits successfully
- Church receives email
- Success message displays

**Test Data Required:**
- Church with email address
- reCAPTCHA configured

---

## Testing All Critical Paths

Run through all 6 critical paths in sequence on:
- [ ] Local development
- [ ] Staging environment
- [ ] Production (after deployment)

Record results and any issues found.
```

**Step 2: Enhance TESTING.md with production testing section**

Add to `docs/TESTING.md`:

```markdown
## Production Testing

### Pre-Launch Testing (Staging)

Before launching to production:

1. **Deploy to staging environment**
2. **Run all critical paths** (see CRITICAL_PATHS.md)
3. **Test with realistic data**
   - Import 20-30 real churches
   - Create test accounts for all roles
   - Generate sample reviews, events, sermons

4. **Performance testing**
   - Load test with 100+ concurrent users
   - Check page load times (<3s target)
   - Monitor database query performance

5. **Cross-browser testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Android)

6. **Mobile responsiveness**
   - iPhone 13, Samsung Galaxy S21
   - Tablet (iPad)
   - Different screen sizes (375px to 1920px)

### Post-Launch Monitoring

After production launch:

**Week 1:**
- [ ] Daily health checks
- [ ] Monitor error rates (Sentry)
- [ ] Check email delivery rates
- [ ] Verify Stripe webhooks working
- [ ] Review Cloudinary usage
- [ ] Check database performance

**Week 2-4:**
- [ ] Weekly health checks
- [ ] Review user feedback
- [ ] Monitor critical metrics:
  - New user registrations
  - Churches added/verified
  - Reviews submitted/approved
  - Donations received
  - Page load times
  - Error rates

### Smoke Testing Script

Quick verification after deployment:

```bash
# Run health check
./scripts/health-check.sh

# Manual checks
1. Open web app - can browse churches?
2. Open church portal - can login?
3. Open admin dashboard - can login?
4. Test contact form - email received?
5. Test image upload - image appears?
6. Test donation - payment processes?
```
```

**Step 3: Commit**

```bash
git add docs/CRITICAL_PATHS.md docs/TESTING.md
git commit -m "docs: add critical path testing guide and production testing procedures"
```

---

## Phase 4: Monitoring & Operations

### Task 7: Set Up Error Tracking with Sentry

**Files:**
- Create: `packages/monitoring/package.json`
- Create: `packages/monitoring/src/sentry.ts`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/church-portal/app/layout.tsx`
- Modify: `apps/admin/app/layout.tsx`

**Step 1: Create monitoring package**

```bash
mkdir -p packages/monitoring/src
cd packages/monitoring
pnpm init
```

File: `packages/monitoring/package.json`

```json
{
  "name": "@repo/monitoring",
  "version": "0.0.0",
  "private": true,
  "main": "./src/sentry.ts",
  "types": "./src/sentry.ts",
  "dependencies": {
    "@sentry/nextjs": "^7.114.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.4.5"
  }
}
```

**Step 2: Create Sentry configuration**

File: `packages/monitoring/src/sentry.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

export function initSentry(app: 'web' | 'church-portal' | 'admin') {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured - error tracking disabled')
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Set app-specific tags
    initialScope: {
      tags: {
        app,
      },
    },

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive data from event
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers
      }
      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors that are out of our control
      'NetworkError',
      'Failed to fetch',
    ],
  })
}

export { Sentry }
```

**Step 3: Install Sentry in packages**

```bash
cd packages/monitoring
pnpm install
```

**Step 4: Add Sentry to web app**

File: `apps/web/app/layout.tsx` (add to top of file)

```typescript
import { initSentry } from '@repo/monitoring'

// Initialize Sentry
if (typeof window !== 'undefined') {
  initSentry('web')
}

// ... rest of layout
```

**Step 5: Add to package.json dependencies**

Add to `apps/web/package.json`:
```json
{
  "dependencies": {
    "@repo/monitoring": "workspace:*"
  }
}
```

Repeat for `apps/church-portal` and `apps/admin`

**Step 6: Install dependencies**

```bash
pnpm install
```

**Step 7: Commit**

```bash
git add packages/monitoring apps/*/app/layout.tsx apps/*/package.json
git commit -m "feat(monitoring): add Sentry error tracking to all apps"
```

---

### Task 8: Create Operational Documentation

**Files:**
- Create: `docs/OPERATIONS.md`
- Create: `docs/TROUBLESHOOTING.md`
- Create: `docs/MONITORING.md`

**Step 1: Create operations guide**

File: `docs/OPERATIONS.md`

```markdown
# Operations Guide

## Daily Operations

### Health Monitoring

**Morning Check (5 minutes):**
1. Run health check script: `./scripts/health-check.sh`
2. Check Sentry dashboard for new errors
3. Review email delivery stats (Resend dashboard)
4. Check Stripe dashboard for donations

**If Issues Found:**
- Check error logs in Sentry
- Review Render deployment logs
- Check database status
- Verify third-party service status

### Database Maintenance

**Daily Backup:**
```bash
cd packages/database
./scripts/backup.sh daily-$(date +%Y%m%d)
```

**Weekly Tasks:**
- Review database size and growth
- Check slow queries
- Verify backup integrity (test restore)

### Email Monitoring

**Check Resend Dashboard:**
- Delivery rate should be >95%
- Bounce rate should be <2%
- Spam complaint rate should be <0.1%

**If Issues:**
- Check email templates for spam triggers
- Verify sender domain authentication
- Review bounce reasons

### Image Storage

**Monitor Cloudinary Usage:**
- Check bandwidth usage
- Review storage limits
- Verify upload success rate

**Optimize if needed:**
- Reduce image quality settings
- Implement additional compression
- Clean up unused images

## Weekly Operations

### Review Analytics

**Metrics to Track:**
- New user registrations
- Churches added/verified
- Reviews submitted/approved
- Platform donations
- Page views
- Search queries

**Tools:**
- Google Analytics
- Database queries
- Render metrics

### User Support

**Check Support Channels:**
- Email inquiries (admin@churchconnect.jp)
- Flagged reviews
- Verification requests
- Church admin questions

**Response Time Goals:**
- Critical issues: <4 hours
- Verification requests: <24 hours
- General inquiries: <48 hours

## Monthly Operations

### Security Review

- Review user access logs
- Check for suspicious activity
- Update dependencies with security patches
- Review CORS and CSP policies

### Performance Review

- Analyze page load times
- Review database query performance
- Check CDN cache hit rates
- Optimize slow pages

### Backup Verification

- Test database restore from backup
- Verify backup retention policy
- Ensure backups stored securely

## Incident Response

### Severity Levels

**P0 - Critical (Site Down):**
- Response time: Immediate
- Examples: Database down, all apps unreachable
- Action: Page on-call engineer, investigate immediately

**P1 - High (Major Feature Broken):**
- Response time: <1 hour
- Examples: Donations failing, login broken
- Action: Investigate and fix within 4 hours

**P2 - Medium (Minor Feature Broken):**
- Response time: <4 hours
- Examples: Contact form not working, image upload failing
- Action: Fix within 24 hours

**P3 - Low (Cosmetic Issue):**
- Response time: <24 hours
- Examples: Styling issue, typo
- Action: Fix in next release

### Incident Checklist

When incident detected:
1. [ ] Assess severity
2. [ ] Notify stakeholders
3. [ ] Create incident ticket
4. [ ] Investigate root cause
5. [ ] Implement fix
6. [ ] Verify fix deployed
7. [ ] Monitor for recurrence
8. [ ] Document incident
9. [ ] Conduct post-mortem (P0/P1 only)

## Deployment

### Pre-Deployment

1. Run pre-deployment check: `./scripts/deploy-check.sh`
2. Create database backup
3. Review recent commits
4. Test on staging

### Deployment Process

1. Merge to main branch
2. Wait for CI/CD to build
3. Deploy to production (Render auto-deploys)
4. Run smoke tests
5. Monitor for errors

### Post-Deployment

1. Run health check: `./scripts/health-check.sh`
2. Monitor Sentry for new errors
3. Check key metrics
4. Announce in team channel

### Rollback Procedure

If critical issue after deployment:

1. Identify last known good commit
2. Deploy previous version on Render
3. Verify services restored
4. Investigate issue in staging
5. Fix and redeploy

## Scaling

### When to Scale

**Database:**
- CPU >80% for sustained period
- Query latency >100ms
- Connection pool exhausted

**App Servers:**
- CPU >80% for sustained period
- Memory >80%
- Response time >3s

### How to Scale

**Render:**
- Increase instance size
- Add more instances
- Enable autoscaling

**Database:**
- Upgrade plan
- Add read replicas
- Implement caching

## Third-Party Service Management

### Cloudinary
- Monitor bandwidth (5GB free tier)
- Optimize images if approaching limit
- Upgrade plan if needed

### Resend
- Monitor email volume (100 emails/day free)
- Upgrade to paid plan at ~50 emails/day
- Set up custom sending domain

### Stripe
- Monitor transaction volume
- Review failed payments
- Keep webhook endpoint healthy

### reCAPTCHA
- Monitor API usage
- Review false positive rate
- Adjust score threshold if needed
```

**Step 2: Create troubleshooting guide**

File: `docs/TROUBLESHOOTING.md`

```markdown
# Troubleshooting Guide

## Common Issues

### Database Connection Failed

**Symptoms:**
- Apps can't connect to database
- "Connection refused" errors
- Timeout errors

**Solutions:**
1. Check DATABASE_URL is correct
2. Verify database is running (Render dashboard)
3. Check connection limits
4. Verify network connectivity
5. Check if IP is whitelisted (if using restricted access)

**Prevention:**
- Use connection pooling
- Set up database monitoring alerts

---

### Email Not Sending

**Symptoms:**
- Contact forms submit but no email received
- Review notifications not arriving
- Donation receipts not sending

**Solutions:**
1. Check RESEND_API_KEY is valid
2. Verify EMAIL_FROM domain is verified
3. Check Resend dashboard for failed sends
4. Review error logs in Sentry
5. Verify email rate limits not exceeded

**Testing:**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@yourdomain.com",
    "to": "you@example.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

---

### Image Upload Failing

**Symptoms:**
- Upload button doesn't work
- Error message after selecting image
- Images don't appear after upload

**Solutions:**
1. Check CLOUDINARY_* environment variables
2. Verify Cloudinary credentials are correct
3. Check file size (must be <5MB)
4. Check file type (must be image)
5. Review Cloudinary dashboard for failed uploads
6. Check browser console for errors

**Testing:**
```bash
# Test Cloudinary API
curl "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/image/upload" \
  -X POST \
  -d "api_key=$CLOUDINARY_API_KEY" \
  -d "timestamp=$(date +%s)" \
  -d "file=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
```

---

### Stripe Checkout Not Working

**Symptoms:**
- Checkout button doesn't redirect
- Stripe Checkout shows error
- Payment doesn't process

**Solutions:**
1. Check STRIPE_SECRET_KEY is valid (use live key in production)
2. Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY matches secret key mode
3. Check Stripe dashboard for API errors
4. Verify webhook endpoint is configured
5. Test with Stripe test cards

**Testing:**
```bash
# List recent checkout sessions
stripe checkout sessions list --limit 5
```

---

### reCAPTCHA Blocking Legitimate Users

**Symptoms:**
- Users report contact form not submitting
- "reCAPTCHA failed" errors
- High false positive rate

**Solutions:**
1. Check score threshold (currently 0.5)
2. Review reCAPTCHA dashboard for scoring
3. Lower threshold if needed (0.3-0.4)
4. Verify RECAPTCHA_SECRET_KEY is correct
5. Check that site key matches domain

**Adjust threshold:**
In `apps/web/lib/recaptcha.ts`, change:
```typescript
if (data.score < 0.3) { // Lower from 0.5
```

---

### Search Not Returning Results

**Symptoms:**
- Search returns empty results
- Relevant churches not appearing
- Search seems broken

**Solutions:**
1. Check search vectors are populated:
```sql
SELECT COUNT(*) FROM "Church" WHERE "searchVector" IS NOT NULL;
```

2. Rebuild search vectors:
```sql
UPDATE "Church" SET "updatedAt" = NOW();
```

3. Verify full-text search triggers are active:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%search%';
```

4. Test search directly in PostgreSQL:
```sql
SELECT name FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', 'church');
```

---

### Performance Issues

**Symptoms:**
- Pages loading slowly (>5s)
- High CPU usage
- Database queries taking too long

**Solutions:**

**Identify slow queries:**
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Add missing indexes:**
```sql
-- Check for slow sequential scans
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 1000
ORDER BY seq_tup_read DESC;
```

**Enable query logging:**
Set in Render database settings:
- `log_min_duration_statement = 500` (log queries >500ms)

**Optimize Next.js:**
- Enable ISR (Incremental Static Regeneration)
- Add proper cache headers
- Optimize images with next/image

---

### Out of Memory Errors

**Symptoms:**
- Apps crashing randomly
- "Out of memory" errors
- Render instance restarts

**Solutions:**
1. Check instance size (upgrade if needed)
2. Review memory usage in Render metrics
3. Optimize database queries (reduce data fetched)
4. Add pagination to large lists
5. Clear Next.js cache: `rm -rf .next/cache`

**Monitor memory:**
```bash
# In Render SSH
free -h
top
```

---

## Debugging Tools

### Check Logs

**Render Dashboard:**
- Navigate to service
- Click "Logs" tab
- Filter by severity

**Sentry:**
- Check error dashboard
- Review breadcrumbs
- Analyze stack traces

**Database Logs:**
- Enable query logging
- Review slow query log
- Check connection errors

### Test API Endpoints

```bash
# Health check
curl https://api.churchconnect.jp/health

# GraphQL
curl https://api.churchconnect.jp/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Webhook test
stripe trigger checkout.session.completed
```

### Database Debugging

```sql
-- Active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Getting Help

### Support Channels

**Technical Issues:**
- Create GitHub issue
- Check documentation
- Review error logs

**Third-Party Service Issues:**
- Cloudinary support: https://support.cloudinary.com
- Resend support: support@resend.com
- Stripe support: https://support.stripe.com
- Render support: support@render.com

### Escalation

**Critical Issues (Site Down):**
1. Check status pages (Render, Cloudinary, Stripe)
2. Create incident ticket
3. Contact on-call engineer
4. Post in #incidents channel

**Non-Critical Issues:**
1. Document issue
2. Search for similar issues
3. Create GitHub issue
4. Assign to appropriate team member
```

**Step 3: Create monitoring guide**

File: `docs/MONITORING.md`

```markdown
# Monitoring Guide

## Metrics to Track

### Application Metrics

**Availability:**
- Uptime percentage (target: 99.9%)
- Response time (target: <3s)
- Error rate (target: <1%)

**Usage:**
- Daily active users
- Page views
- Search queries
- Form submissions
- Donations

### Business Metrics

**Growth:**
- New user registrations/week
- Churches added/week
- Churches verified/week
- Reviews submitted/week
- Donations received/week

**Engagement:**
- Average session duration
- Bounce rate
- Pages per session
- Return visitor rate

**Conversion:**
- Church profile completion rate
- Review approval rate
- Donation conversion rate
- Contact form submission rate

## Monitoring Tools

### Render Dashboard

**What to Monitor:**
- CPU usage (alert if >80%)
- Memory usage (alert if >80%)
- Request rate
- Response time
- Error rate
- Deployment status

**How to Access:**
1. Login to Render dashboard
2. Select service
3. Click "Metrics" tab
4. Set up alerts in "Alerts" section

### Sentry (Error Tracking)

**What to Monitor:**
- New error events
- Error frequency
- Affected users
- Performance issues

**Alerts to Set Up:**
- New error types
- Error spike (>100 errors/hour)
- Performance regression (>3s load time)

**How to Access:**
1. Login to Sentry
2. Select ChurchConnect project
3. Review "Issues" dashboard

### Database (PostgreSQL)

**What to Monitor:**
- Connection count
- Query latency
- Slow queries (>500ms)
- Table sizes
- Index usage
- Cache hit ratio

**Render Database Metrics:**
- CPU usage
- Memory usage
- Disk usage
- Connection count

**Custom Queries:**
```sql
-- Daily active users
SELECT COUNT(DISTINCT "userId")
FROM "ChurchAnalytics"
WHERE "viewedAt" > NOW() - INTERVAL '1 day';

-- Churches added today
SELECT COUNT(*)
FROM "Church"
WHERE "createdAt" > NOW() - INTERVAL '1 day';

-- Review approval rate
SELECT
  COUNT(*) FILTER (WHERE status = 'APPROVED') * 100.0 / COUNT(*) as approval_rate
FROM "Review"
WHERE "createdAt" > NOW() - INTERVAL '7 days';
```

### Cloudinary (Image Storage)

**What to Monitor:**
- Bandwidth usage
- Storage used
- Transformations
- Failed uploads

**Alerts:**
- Approaching bandwidth limit (80%)
- High error rate (>5%)

**How to Access:**
1. Login to Cloudinary
2. Click "Usage" in dashboard
3. Review graphs and stats

### Resend (Email)

**What to Monitor:**
- Emails sent/day
- Delivery rate (target: >95%)
- Bounce rate (target: <2%)
- Spam complaints (target: <0.1%)
- Open rate (for marketing emails)

**Alerts:**
- Delivery rate drops below 90%
- Bounce rate exceeds 5%
- Approaching email limit

**How to Access:**
1. Login to Resend
2. View "Analytics" tab
3. Review email logs

### Stripe (Payments)

**What to Monitor:**
- Successful payments
- Failed payments
- Refunds
- Disputes
- Webhook delivery

**Alerts:**
- Payment failure spike (>10%)
- Webhook endpoint down
- New dispute

**How to Access:**
1. Login to Stripe dashboard
2. View "Payments" section
3. Check webhook logs

### Google reCAPTCHA

**What to Monitor:**
- API calls/day
- Score distribution
- False positive rate
- Blocked requests

**How to Access:**
1. Login to reCAPTCHA admin
2. Select site
3. View "Analytics" tab

## Alert Configuration

### Critical Alerts (Immediate Response)

**Trigger:** Site completely down
- **Action:** Page on-call engineer
- **Channel:** PagerDuty/phone

**Trigger:** Database connection errors spike
- **Action:** Check database status, restart if needed
- **Channel:** Slack #alerts + SMS

**Trigger:** Payment processing fails
- **Action:** Check Stripe status, verify webhook
- **Channel:** Email + Slack #payments

### Warning Alerts (Within 1 hour)

**Trigger:** Error rate >5% for 15 minutes
- **Action:** Investigate via Sentry
- **Channel:** Slack #alerts

**Trigger:** Response time >5s for 10 minutes
- **Action:** Check CPU/memory, optimize queries
- **Channel:** Slack #alerts

**Trigger:** Email delivery rate <90%
- **Action:** Check Resend status, review bounces
- **Channel:** Email

### Info Alerts (Nice to Know)

**Trigger:** New user milestone (100, 500, 1000)
- **Action:** Celebrate!
- **Channel:** Slack #general

**Trigger:** First donation of the day
- **Action:** Note for daily report
- **Channel:** Slack #donations

## Daily Monitoring Routine

### Morning (10 minutes)

1. **Run health check:**
   ```bash
   ./scripts/health-check.sh
   ```

2. **Check dashboards:**
   - [ ] Render: All services running?
   - [ ] Sentry: Any new critical errors?
   - [ ] Stripe: Any payment issues?

3. **Review key metrics:**
   - [ ] Users active yesterday
   - [ ] Churches added/verified yesterday
   - [ ] Donations received yesterday

### Weekly (30 minutes)

1. **Review trends:**
   - [ ] User growth rate
   - [ ] Church growth rate
   - [ ] Review submission rate
   - [ ] Donation trends

2. **Check service usage:**
   - [ ] Cloudinary bandwidth
   - [ ] Resend email quota
   - [ ] Database size growth
   - [ ] API rate limits

3. **Security review:**
   - [ ] Failed login attempts
   - [ ] Suspicious activity
   - [ ] Dependency vulnerabilities

### Monthly (2 hours)

1. **Performance review:**
   - [ ] Page load times
   - [ ] Database query performance
   - [ ] API response times
   - [ ] Error rates by type

2. **Cost review:**
   - [ ] Render hosting costs
   - [ ] Cloudinary usage costs
   - [ ] Resend email costs
   - [ ] Stripe fees

3. **Planning:**
   - [ ] Capacity planning
   - [ ] Feature prioritization
   - [ ] Technical debt

## Monitoring Queries

Save these queries for regular use:

**File:** `packages/database/prisma/monitoring-queries.sql`

```sql
-- Daily Active Users
SELECT DATE(\"viewedAt\") as date, COUNT(DISTINCT \"userId\") as dau
FROM \"ChurchAnalytics\"
WHERE \"viewedAt\" > NOW() - INTERVAL '30 days'
GROUP BY DATE(\"viewedAt\")
ORDER BY date DESC;

-- Top Viewed Churches
SELECT c.name, COUNT(*) as views
FROM \"ChurchAnalytics\" ca
JOIN \"Church\" c ON ca.\"churchId\" = c.id
WHERE ca.\"viewedAt\" > NOW() - INTERVAL '7 days'
GROUP BY c.name
ORDER BY views DESC
LIMIT 10;

-- Review Approval Rate by Day
SELECT
  DATE(\"createdAt\") as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
  ROUND(COUNT(*) FILTER (WHERE status = 'APPROVED') * 100.0 / COUNT(*), 1) as approval_rate
FROM \"Review\"
WHERE \"createdAt\" > NOW() - INTERVAL '30 days'
GROUP BY DATE(\"createdAt\")
ORDER BY date DESC;

-- Donation Summary
SELECT
  DATE(\"createdAt\") as date,
  COUNT(*) as donations,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM \"PlatformDonation\"
WHERE \"createdAt\" > NOW() - INTERVAL '30 days'
  AND status = 'succeeded'
GROUP BY DATE(\"createdAt\")
ORDER BY date DESC;

-- Church Completion Stats
SELECT
  COUNT(*) as total_churches,
  COUNT(*) FILTER (WHERE \"isVerified\" = true) as verified,
  COUNT(*) FILTER (WHERE \"isComplete\" = true) as complete,
  COUNT(*) FILTER (WHERE \"isVerified\" = true AND \"isComplete\" = true) as verified_complete
FROM \"Church\"
WHERE \"isDeleted\" = false AND \"isPublished\" = true;
```

## Dashboard Setup

### Recommended Dashboards

**1. Operations Dashboard** (Render + Sentry)
- Services uptime
- Error count
- Response time
- Active users

**2. Business Dashboard** (Database queries)
- User growth
- Church growth
- Review activity
- Donation revenue

**3. Performance Dashboard** (Render + Database)
- Page load times
- Database query times
- API response times
- Cache hit rates

### Tools for Dashboards

**Free Options:**
- Grafana + Prometheus
- Google Data Studio (for business metrics)
- Custom Next.js admin page

**Paid Options:**
- Datadog
- New Relic
- Grafana Cloud

## Monitoring Best Practices

1. **Alert fatigue:** Only alert on actionable issues
2. **False positives:** Tune alert thresholds to reduce noise
3. **Documentation:** Document all alerts and response procedures
4. **Testing:** Test alerts regularly
5. **Escalation:** Have clear escalation paths
6. **Postmortems:** Document and learn from incidents
7. **Continuous improvement:** Review and adjust metrics quarterly
```

**Step 4: Commit**

```bash
git add docs/OPERATIONS.md docs/TROUBLESHOOTING.md docs/MONITORING.md
git commit -m "docs: add comprehensive operations, troubleshooting, and monitoring guides"
```

---

## Phase 5: Final Polish & Documentation

### Task 9: Create User Documentation

**Files:**
- Create: `docs/user-guides/CHURCH_ADMIN_GUIDE.md`
- Create: `docs/user-guides/PLATFORM_ADMIN_GUIDE.md`
- Create: `docs/user-guides/USER_GUIDE.md`

**Step 1: Create church admin guide**

File: `docs/user-guides/CHURCH_ADMIN_GUIDE.md`

```markdown
# Church Admin Guide

Welcome to ChurchConnect Japan! This guide will help you manage your church's profile and engage with your community.

## Getting Started

### Logging In

1. Visit https://portal.churchconnect.jp
2. Enter your email and password
3. Click "Sign In"

**Forgot Password?** Click "Forgot Password" to reset.

### Dashboard Overview

After logging in, you'll see your dashboard with:
- **Profile Completeness:** Progress bar showing how complete your profile is
- **Recent Reviews:** Latest reviews from visitors
- **Quick Stats:** Profile views, photos, events
- **Quick Actions:** Links to common tasks

## Managing Your Profile

### Basic Information

1. Click "Profile" in the sidebar
2. Update these sections:
   - Church name and description
   - Address and contact information
   - Website and phone number
   - Service times and languages

3. Click "Save Changes"

**Tips:**
- Use a clear, descriptive name
- Write a welcoming description
- Keep contact info up to date
- Add service times for all regular services

### About Sections

Make your church's story come alive:

**Who We Are:**
- Describe your church's mission and values
- Share what makes your community special
- Keep it welcoming and authentic

**Our Vision:**
- Share your church's vision for the future
- Describe your goals and aspirations
- Make it inspiring and clear

**Statement of Faith:**
- Outline your core beliefs
- Be clear about your denominational affiliation
- Use language newcomers can understand

**Our Story:**
- Share your church's history
- Highlight key milestones
- Tell your unique story

### How to Give

Help supporters contribute to your ministry:

1. Navigate to "Profile" → "How to Give"
2. Fill in these sections:
   - **Giving Instructions:** General information about giving
   - **Bank Transfer:** Your bank details for direct transfers
   - **External Link:** Link to online donation platform (if you have one)

3. Click "Save Changes"

**Note:** This information will appear in the "Give" tab on your public profile.

## Managing Photos

### Uploading Photos

1. Click "Photos" in the sidebar
2. Click "Upload Photo"
3. Select an image from your computer
4. Choose a category:
   - Worship Service
   - Fellowship
   - Ministry
   - Building/Facility
   - Events
   - Other
5. Add a caption (optional but recommended)
6. Click "Upload"

**Photo Guidelines:**
- Max size: 5MB
- Recommended: High-quality photos showing your community
- Categories help visitors find relevant photos
- Captions provide context

### Editing Captions

1. Hover over a photo
2. Click the "Edit" button
3. Update the caption
4. Click "Save"

### Deleting Photos

1. Hover over a photo
2. Click the "Delete" button
3. Confirm deletion

**Warning:** Deleted photos cannot be recovered.

## Managing Staff

### Adding Staff Members

1. Click "Staff" in the sidebar
2. Click "Add Staff Member"
3. Fill in:
   - Name
   - Title (e.g., "Senior Pastor", "Worship Leader")
   - Role (e.g., "Leadership", "Ministry", "Administration")
   - Bio (tell their story!)
   - Photo (recommended)
4. Click "Save"

**Tips:**
- Include all key leaders
- Write personal, warm bios
- Add photos for a personal touch
- Order by importance (drag to reorder)

### Editing Staff

1. Find the staff member
2. Click "Edit"
3. Update information
4. Click "Save"

### Reordering Staff

1. Drag staff cards to reorder
2. Changes save automatically

## Managing Events

### Creating Events

1. Click "Events" in the sidebar
2. Click "Create Event"
3. Fill in:
   - Event name
   - Description
   - Date and time
   - Location (or "Online" if virtual)
   - Registration link (optional)
   - Event image (recommended)
4. Click "Publish"

**Tips:**
- Create events at least 2 weeks in advance
- Include clear details about location/parking
- Add engaging images
- Update or delete past events

### Editing Events

1. Find the event
2. Click "Edit"
3. Update information
4. Click "Save"

### Deleting Events

1. Find the event
2. Click "Delete"
3. Confirm deletion

## Managing Sermons

### Adding Sermons

1. Click "Sermons" in the sidebar
2. Click "Add Sermon"
3. Fill in:
   - Title
   - Preacher name
   - Bible passage
   - Date preached
   - Description/summary
   - YouTube URL (if available)
   - Podcast URL (if available)
4. Click "Publish"

**Tips:**
- Add sermons regularly
- Include passage references
- Link to video/audio if possible
- Write helpful summaries

### Editing Sermons

1. Find the sermon
2. Click "Edit"
3. Update information
4. Click "Save"

## Responding to Reviews

### Viewing Reviews

1. Click "Reviews" in the sidebar
2. See all reviews with status:
   - Pending: Waiting for admin approval
   - Approved: Visible on your profile
   - Rejected: Not approved by admin

### Responding to Reviews

1. Find the review
2. Click "Respond"
3. Write your response
4. Click "Submit"

**Tips:**
- Respond promptly
- Be gracious and welcoming
- Address any concerns
- Thank reviewers
- Keep responses professional

### Flagging Inappropriate Reviews

If you receive an inappropriate review:

1. Click "Flag" on the review
2. Provide reason for flagging
3. Submit to platform admin

**Platform admin will review and may remove the review.**

## Viewing Analytics

### Understanding Your Stats

1. Click "Analytics" in the sidebar
2. View:
   - Profile views over time
   - Most viewed tabs
   - Popular search terms that led to your profile

**Use analytics to:**
- Understand visitor interests
- Optimize your content
- Track growth over time

## Verification

### Requesting Verification

Verified churches get:
- ✓ Verified badge on profile
- Higher ranking in search results
- Increased trust from visitors

**To request verification:**

1. Click "Verification" in the sidebar
2. Fill out verification form
3. Upload proof of church ownership:
   - Official church document
   - Letter on church letterhead
   - Recent utility bill showing church address
4. Submit request

**What happens next:**
- Platform admin reviews your request (usually within 24-48 hours)
- You'll receive an email when approved/rejected
- Once verified, the ✓ badge appears on your profile

## Best Practices

### Profile Completeness

Aim for 100% profile completeness:
- [ ] Hero image uploaded
- [ ] All "About" sections filled
- [ ] At least one staff member
- [ ] Service times added
- [ ] Contact information complete
- [ ] Photos added
- [ ] Social media linked

**Complete profiles rank higher in search!**

### Regular Updates

Keep your profile fresh:
- Upload new photos monthly
- Add sermons weekly (if you record them)
- Create upcoming events
- Update staff when changes occur
- Respond to reviews promptly

### Engage with Visitors

Build relationships:
- Respond to contact form messages within 24 hours
- Thank reviewers for their feedback
- Keep events up to date
- Share your church's story authentically

## Need Help?

### Support

Email: support@churchconnect.jp

Response time: Usually within 24-48 hours

### Common Questions

**Q: How do I change my password?**
A: Click your profile icon → Settings → Change Password

**Q: Can I have multiple admins?**
A: Not currently, but this feature is coming soon.

**Q: How do I unpublish my church temporarily?**
A: Contact platform admin at admin@churchconnect.jp

**Q: Why isn't my profile appearing in search?**
A: Make sure your profile is published and complete. Verified churches rank higher.

**Q: Can I customize my church's page design?**
A: Not currently, but you can customize content, photos, and organization.

## Tips for Success

1. **Complete your profile ASAP** - Complete profiles get more views
2. **Use high-quality photos** - Show your community at its best
3. **Keep information current** - Update service times, events, and staff
4. **Engage with reviews** - Respond to build trust
5. **Tell your story** - Be authentic and welcoming
6. **Get verified** - Verified churches rank higher and build trust

Welcome to ChurchConnect! We're excited to help you reach your community.
```

**Step 2: Commit user documentation**

```bash
git add docs/user-guides/
git commit -m "docs: add comprehensive church admin user guide"
```

---

### Task 10: Create README and Project Overview

**Files:**
- Update: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`

**Step 1: Create comprehensive README**

File: `README.md`

```markdown
# ChurchConnect Japan

> A cross-denominational church directory platform connecting Christians with churches across Japan.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

## Overview

ChurchConnect Japan helps Christians discover churches, read authentic community reviews, and connect with church communities. Each church gets a beautiful, feature-rich profile page with content management capabilities.

**🌐 Live Site:** [churchconnect.jp](https://churchconnect.jp) *(Coming Soon)*

## Features

### For Church Seekers
- 🔍 **Search & Filter** - Find churches by location, denomination, language, worship style
- 📖 **Rich Profiles** - View detailed church information, sermons, events, staff
- 💬 **Reviews** - Read authentic reviews from community members
- 🗺️ **Interactive Map** - Discover churches near you
- 📧 **Contact Forms** - Connect with churches directly

### For Church Leaders
- ✏️ **Profile Management** - Complete control over your church's online presence
- 📷 **Photo Gallery** - Showcase your community with unlimited photos
- 👥 **Staff Profiles** - Introduce your leadership team
- 📅 **Events Calendar** - Promote upcoming events
- 🎙️ **Sermon Archive** - Share sermons with links to YouTube/podcasts
- 📊 **Analytics** - Track profile views and engagement

### For Platform Supporters
- 💝 **Platform Donations** - Support this free resource with one-time or monthly giving
- ✅ **Verified Badge** - Verified churches get priority in search results

## Tech Stack

**Frontend:**
- [Next.js 14](https://nextjs.org/) (App Router) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

**Backend:**
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Prisma](https://www.prisma.io/) - ORM
- [GraphQL](https://graphql.org/) with [Pothos](https://pothos-graphql.dev/) - API
- [Apollo Server](https://www.apollographql.com/) - GraphQL server

**Infrastructure:**
- [Render](https://render.com/) - Hosting
- [Cloudinary](https://cloudinary.com/) - Image storage & CDN
- [Resend](https://resend.com/) - Email delivery
- [Stripe](https://stripe.com/) - Payment processing

**Monorepo:**
- [Turborepo](https://turbo.build/) - Build system
- [pnpm](https://pnpm.io/) - Package manager

## Project Structure

```
churchconnect/
├── apps/
│   ├── web/              # Public website (Next.js)
│   ├── church-portal/    # Church admin dashboard (Next.js)
│   ├── admin/            # Platform admin dashboard (Next.js)
│   └── api/              # GraphQL API (Apollo Server)
├── packages/
│   ├── database/         # Prisma schema & migrations
│   ├── graphql/          # Pothos GraphQL schema
│   ├── ui/               # Shared UI components
│   ├── cloudinary/       # Image upload utilities
│   ├── email/            # Email templates & sending
│   └── monitoring/       # Sentry error tracking
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js >=20
- pnpm >=8
- PostgreSQL 14+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/churchconnect.git
   cd churchconnect
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   See [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) for details.

4. **Set up database**
   ```bash
   cd packages/database
   npx prisma migrate deploy
   npx prisma db seed
   cd ../..
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

**Apps will be available at:**
- Web: http://localhost:3000
- Church Portal: http://localhost:3002
- Admin: http://localhost:3003
- GraphQL API: http://localhost:3001/graphql

## Documentation

- [Development Guide](docs/DEVELOPMENT.md)
- [Environment Setup](docs/ENVIRONMENT_SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Guide](docs/TESTING.md)
- [Operations Guide](docs/OPERATIONS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [API Documentation](docs/API.md)
- [Contributing Guide](CONTRIBUTING.md)

**User Guides:**
- [Church Admin Guide](docs/user-guides/CHURCH_ADMIN_GUIDE.md)
- [Platform Admin Guide](docs/user-guides/PLATFORM_ADMIN_GUIDE.md)

## Scripts

```bash
# Development
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps for production
pnpm lint         # Lint all packages
pnpm type-check   # Run TypeScript type checking
pnpm clean        # Clean build artifacts

# Database
pnpm db:generate  # Generate Prisma Client
pnpm db:push      # Push schema to database (dev)
pnpm db:migrate   # Run migrations (prod)
pnpm db:seed      # Seed reference data
pnpm db:studio    # Open Prisma Studio

# Testing
pnpm test         # Run tests (when implemented)

# Deployment
./scripts/deploy-check.sh   # Pre-deployment checks
./scripts/health-check.sh   # Post-deployment health check
```

## Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

**Quick Deploy to Render:**

1. Create PostgreSQL database
2. Create 4 web services (web, church-portal, admin, api)
3. Set environment variables
4. Connect to GitHub repository
5. Deploy!

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Email:** support@churchconnect.jp
- **Issues:** [GitHub Issues](https://github.com/yourusername/churchconnect/issues)
- **Documentation:** [docs/](docs/)

## Acknowledgments

- Design inspiration: [Coastal Church](https://coastalchurch.org)
- Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), and [Pothos GraphQL](https://pothos-graphql.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

**🙏 Made with love for the Christian community in Japan**
```

**Step 2: Create contributing guide**

File: `CONTRIBUTING.md`

```markdown
# Contributing to ChurchConnect

Thank you for considering contributing to ChurchConnect! This document provides guidelines for contributing to the project.

## Code of Conduct

This project adheres to Christian values of love, respect, and service. We expect all contributors to:
- Be respectful and considerate in discussions
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards others

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/churchconnect/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (browser, OS, etc.)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Mockups or examples if applicable

### Pull Requests

1. **Fork the repository**
2. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Write clear, concise commit messages
   - Follow the code style guide
   - Add tests if applicable
   - Update documentation if needed
4. **Test your changes**
   ```bash
   pnpm type-check
   pnpm lint
   pnpm build
   ```
5. **Submit a pull request**
   - Provide clear description of changes
   - Reference any related issues
   - Ensure CI checks pass

## Development Setup

See [Development Guide](docs/DEVELOPMENT.md) for detailed setup instructions.

## Code Style Guide

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and return values
- Use meaningful variable names
- Prefer `const` over `let`
- Use async/await instead of promises

### React

- Use functional components
- Use hooks for state management
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use Server Components when possible (Next.js)

### Naming Conventions

- **Files:** kebab-case (e.g., `church-profile.tsx`)
- **Components:** PascalCase (e.g., `ChurchProfile`)
- **Functions:** camelCase (e.g., `getChurchById`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_UPLOAD_SIZE`)

### Code Organization

- Group related files together
- Keep files under 300 lines
- Extract complex logic into separate functions
- Use barrel exports (index.ts) for public APIs

## Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

**Examples:**
```
feat(church-portal): add sermon upload feature
fix(web): resolve search pagination bug
docs(readme): update installation instructions
```

## Testing

### Manual Testing

- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices
- Follow critical paths (see docs/CRITICAL_PATHS.md)

### Future: Automated Tests

We plan to add:
- Unit tests (Jest/Vitest)
- Integration tests (Testing Library)
- E2E tests (Playwright)

## Documentation

When adding features:
- Update relevant docs/ files
- Add JSDoc comments for public APIs
- Include examples in code comments
- Update user guides if user-facing

## Review Process

1. Pull requests require approval from maintainer
2. All CI checks must pass
3. Code review focuses on:
   - Correctness
   - Performance
   - Security
   - Code quality
   - Documentation

## Getting Help

- Check [documentation](docs/)
- Search existing [issues](https://github.com/yourusername/churchconnect/issues)
- Ask in pull request comments
- Email: dev@churchconnect.jp

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Appreciated in the community!

Thank you for contributing to ChurchConnect! 🙏
```

**Step 3: Create changelog**

File: `CHANGELOG.md`

```markdown
# Changelog

All notable changes to ChurchConnect will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### MVP Features Completed (2025-10-31)

#### Added
- Complete Turborepo monorepo structure with 4 apps
- PostgreSQL database with Prisma ORM and comprehensive schema
- GraphQL API with Pothos (code-first schema)
- Public web app with church directory and search
- Church portal app for profile management
- Admin dashboard app for platform management
- NextAuth.js v5 authentication with role-based access control
- Platform donations via Stripe (one-time and monthly)
- Cloudinary image upload integration
- Resend email notification system (contact forms, reviews, donations)
- Google reCAPTCHA v3 spam protection
- PostgreSQL full-text search for churches, sermons, and events
- All 10 required content sections for church profiles

#### Infrastructure
- Database migrations and seeding
- Server-side signed Cloudinary uploads
- Stripe webhook integration
- Email templates (contact, review, donation)
- Rate limiting on contact forms
- Automatic search vector updates via triggers
- Backup and restore scripts
- Health check and deployment scripts

#### Documentation
- Comprehensive README
- Environment setup guide
- Deployment guide
- Testing guide
- Operations guide
- Troubleshooting guide
- Monitoring guide
- Church admin user guide
- Database backup guide
- Critical paths testing guide
- API documentation
- Contributing guide

### Security
- NextAuth.js session-based authentication
- Role-based access control (USER, CHURCH_ADMIN, ADMIN)
- Server-side upload signature generation
- reCAPTCHA v3 for spam prevention
- Rate limiting (5 requests/hour per IP)
- Input validation with Zod
- Secure Stripe webhook validation
- Prisma parameterized queries (SQL injection prevention)

## [1.0.0] - TBD

### Planned
- Public launch
- Initial 50 churches
- Production deployment on Render
- Custom domain setup
- Sentry error tracking
- Production monitoring

## Future Versions

### v2.0 - Church Donations
- Stripe Connect integration
- Church-specific donation processing
- Monthly giving management
- Donation analytics for churches

### v2.1 - Enhanced Content
- Blog posts feature
- Sermon series grouping
- Video sermon hosting
- Photo gallery enhancements

### v2.2 - User Features
- User sermon logs
- Visit history tracking
- Church subscriptions
- Email notifications for followed churches
- Personalized recommendations

### v2.3 - Mobile Apps
- iOS app (React Native)
- Android app (React Native)
- Push notifications
- Offline support

### v3.0 - International Expansion
- Multi-language support (Korean, Chinese)
- Expansion to other countries
- Country-specific features
- Currency support

---

For detailed commit history, see [GitHub Commits](https://github.com/yourusername/churchconnect/commits/main)
```

**Step 4: Commit final documentation**

```bash
git add README.md CONTRIBUTING.md CHANGELOG.md
git commit -m "docs: create comprehensive README, contributing guide, and changelog"
```

---

## Summary

This plan covers the remaining work to make ChurchConnect production-ready:

**Phase 1: Database Preparation**
- Apply all migrations
- Create seed scripts
- Set up backup/restore

**Phase 2: Environment Configuration**
- Production environment template
- Comprehensive setup guide
- Deployment scripts

**Phase 3: Testing & QA**
- Critical path testing
- Manual testing checklists
- Production testing procedures

**Phase 4: Monitoring & Operations**
- Sentry error tracking
- Operations guide
- Troubleshooting guide
- Monitoring guide

**Phase 5: Final Polish**
- User documentation
- README and project overview
- Contributing guide
- Changelog

**Total Estimated Time:** 8-12 hours of focused work

## Execution Handoff

Plan complete and saved to `docs/plans/2025-10-31-production-ready-deployment.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
