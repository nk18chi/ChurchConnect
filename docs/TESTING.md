# Testing Guide

Comprehensive testing guide for ChurchConnect Japan platform.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Manual Testing](#manual-testing)
- [Testing Environments](#testing-environments)
- [Test Data](#test-data)
- [Testing Workflows](#testing-workflows)
- [Stripe Testing](#stripe-testing)
- [Database Testing](#database-testing)
- [API Testing](#api-testing)

## Testing Overview

ChurchConnect uses manual testing for the MVP phase. This guide covers:
- Manual testing procedures
- Test data setup
- Common test scenarios
- Stripe payment testing
- Database verification

## Manual Testing

### Pre-Testing Checklist

Before starting testing:

- [ ] All apps are running (`pnpm dev`)
- [ ] Database is seeded with initial data
- [ ] Environment variables are set correctly
- [ ] Stripe test keys are configured
- [ ] Test user accounts are created

### Testing Environments

#### Local Development

- **Web App**: http://localhost:3000
- **Church Portal**: http://localhost:3002
- **Admin Dashboard**: http://localhost:3003
- **GraphQL API**: http://localhost:3001/graphql

#### Test Accounts

Create these test accounts:

**1. Regular User**
```sql
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'test-user-id',
  'user@test.com',
  'Test User',
  -- Password: 'password123'
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'USER',
  NOW(),
  NOW()
);
```

**2. Church Admin**
```sql
-- Create user
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'test-church-admin-id',
  'admin@testchurch.jp',
  'Church Admin',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'CHURCH_ADMIN',
  NOW(),
  NOW()
);

-- Link to church (assumes test church exists)
UPDATE "Church"
SET "adminUserId" = 'test-church-admin-id'
WHERE slug = 'test-church';
```

**3. Platform Admin**
```sql
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'test-admin-id',
  'admin@churchconnect.jp',
  'Platform Admin',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'ADMIN',
  NOW(),
  NOW()
);
```

**Test Password**: `password123` for all accounts

## Test Data

### Creating Test Churches

```sql
-- Get reference data
WITH ref_data AS (
  SELECT
    (SELECT id FROM "Prefecture" WHERE name = 'Tokyo') as prefecture_id,
    (SELECT id FROM "City" WHERE name = 'Shibuya') as city_id,
    (SELECT id FROM "Denomination" WHERE name = 'Non-denominational') as denomination_id
)
INSERT INTO "Church" (id, name, slug, "denominationId", "prefectureId", "cityId", address, phone, email, website, "isPublished", "isVerified", "isComplete", "createdAt", "updatedAt")
SELECT
  'test-church-1',
  'Test Church Tokyo',
  'test-church-tokyo',
  denomination_id,
  prefecture_id,
  city_id,
  '1-1-1 Shibuya, Shibuya-ku, Tokyo 150-0002',
  '03-1234-5678',
  'info@testchurch.jp',
  'https://testchurch.jp',
  true,
  true,
  true,
  NOW(),
  NOW()
FROM ref_data;

-- Add profile
INSERT INTO "ChurchProfile" ("churchId", "whoWeAre", "vision", "createdAt", "updatedAt")
VALUES (
  'test-church-1',
  'We are a welcoming community of believers in Tokyo.',
  'To spread the love of Christ throughout Japan.',
  NOW(),
  NOW()
);

-- Add service time
INSERT INTO "ServiceTime" (id, "churchId", "dayOfWeek", "startTime", "endTime", "languageId", "serviceType", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'test-church-1',
  0, -- Sunday
  '10:00',
  '11:30',
  (SELECT id FROM "Language" WHERE code = 'en'),
  'Sunday Service',
  NOW(),
  NOW();
```

### Generating Sample Data

Use Prisma Studio for quick data entry:

```bash
cd packages/database
pnpm db:studio
```

Or create a seed script:

```bash
npx tsx packages/database/prisma/seed-test-data.ts
```

## Testing Workflows

### 1. Public Website Testing

#### Homepage (`/`)

- [ ] Page loads correctly
- [ ] Hero section displays
- [ ] Search bar is functional
- [ ] Featured churches display (if any)
- [ ] Statistics show correct counts
- [ ] Navigation links work

#### Church Directory (`/churches`)

- [ ] Church list displays
- [ ] Filters work (prefecture, city, denomination, language)
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Church cards display correct information
- [ ] Clicking church card navigates to profile

#### Church Profile (`/churches/[slug]`)

- [ ] Church details display correctly
- [ ] Hero image loads
- [ ] Tabs are functional (About, Services, Staff, etc.)
- [ ] Service times display
- [ ] Staff members display
- [ ] Photos load in gallery
- [ ] Events display (if any)
- [ ] Sermons display (if any)
- [ ] Reviews display (if approved)
- [ ] Contact form works
- [ ] Map displays (if coordinates set)

#### Donation Flow (`/donate`)

- [ ] Page loads
- [ ] Amount selection works
- [ ] One-time/monthly toggle works
- [ ] Custom amount input works
- [ ] Stripe Checkout redirects correctly
- [ ] Success page displays after payment
- [ ] Donation recorded in database
- [ ] Webhook processes payment

#### Reviews

**Logged Out:**
- [ ] Can view approved reviews
- [ ] Cannot submit reviews (login required)

**Logged In:**
- [ ] Can submit review
- [ ] Review appears as pending
- [ ] Can edit own review
- [ ] Can delete own review

### 2. Church Portal Testing

Login: `admin@testchurch.jp` / `password123`

#### Dashboard (`/dashboard`)

- [ ] Dashboard loads
- [ ] Stats display correctly
- [ ] Profile completeness shows
- [ ] Recent reviews display
- [ ] Quick links work

#### Profile Management (`/profile`)

- [ ] Current information loads
- [ ] Can edit basic info (name, address, phone)
- [ ] Can edit about sections
- [ ] Can add/remove languages
- [ ] Can add/edit service times
- [ ] Can upload hero image
- [ ] Can add social media links
- [ ] Changes save correctly
- [ ] Preview shows updated info

#### Staff Management (`/staff`)

- [ ] Staff list displays
- [ ] Can add new staff member
- [ ] Can upload staff photo
- [ ] Can edit staff member
- [ ] Can delete staff member
- [ ] Can reorder staff (drag-drop)
- [ ] Changes reflect on public profile

#### Content Management

**Sermons:**
- [ ] Can create sermon entry
- [ ] Can add YouTube/podcast URLs
- [ ] Can edit sermon
- [ ] Can delete sermon
- [ ] Sermons display on public profile

**Events:**
- [ ] Can create event
- [ ] Can set date/time
- [ ] Can upload event image
- [ ] Can mark as online/in-person
- [ ] Can edit event
- [ ] Can delete event
- [ ] Events display on public profile

**Photos:**
- [ ] Can upload photos
- [ ] Can add captions
- [ ] Can delete photos
- [ ] Can reorder photos
- [ ] Photos display in public gallery

#### Reviews Management

- [ ] Can view all reviews
- [ ] Can respond to reviews
- [ ] Response displays on public site
- [ ] Can flag inappropriate reviews

#### Verification

- [ ] Can request verification
- [ ] Can upload documents
- [ ] Can view request status

### 3. Admin Dashboard Testing

Login: `admin@churchconnect.jp` / `password123`

#### Dashboard (`/dashboard`)

- [ ] Platform stats display
- [ ] Pending actions show
- [ ] Recent activity displays
- [ ] Charts render correctly

#### Church Management

- [ ] Can view all churches
- [ ] Can search churches
- [ ] Can filter churches
- [ ] Can create new church
- [ ] Can edit any church
- [ ] Can publish/unpublish church
- [ ] Can verify church
- [ ] Can delete church
- [ ] Can export church list

#### Verification Queue

- [ ] Pending requests display
- [ ] Can view documents
- [ ] Can approve with note
- [ ] Can reject with reason
- [ ] Church verification status updates
- [ ] Email sent to church (if configured)

#### Review Moderation

- [ ] Pending reviews display
- [ ] Can approve review
- [ ] Can reject review
- [ ] Can add moderation note
- [ ] Bulk actions work

#### User Management

- [ ] Can view all users
- [ ] Can search users
- [ ] Can filter by role
- [ ] Can create user
- [ ] Can edit user
- [ ] Can change user role
- [ ] Can link church admin to church
- [ ] Can delete user

#### Analytics

- [ ] Charts display correctly
- [ ] Metrics are accurate
- [ ] Date filters work
- [ ] Export works

## Stripe Testing

### Test Cards

Use Stripe test cards: https://stripe.com/docs/testing

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any ZIP code (e.g., 12345)
```

**Requires Authentication (3D Secure):**
```
Card: 4000 0025 0000 3155
```

**Declined:**
```
Card: 4000 0000 0000 9995
```

### Testing Donations

**One-Time Donation:**
1. Go to `/donate`
2. Select "One-time"
3. Choose amount (¥1,000)
4. Click "Donate"
5. Enter test card: 4242 4242 4242 4242
6. Complete checkout
7. Verify redirect to success page
8. Check database for donation record

**Monthly Donation:**
1. Go to `/donate`
2. Select "Monthly"
3. Choose amount (¥3,000)
4. Click "Subscribe"
5. Enter test card
6. Complete checkout
7. Verify subscription created in Stripe Dashboard
8. Check database for subscription record

### Testing Webhooks Locally

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Forward webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   ```

4. **Trigger event:**
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger checkout.session.completed
   ```

5. **Verify:**
   - Check terminal for webhook output
   - Check database for donation record
   - Check application logs

### Webhook Testing Checklist

- [ ] `checkout.session.completed` creates donation
- [ ] One-time donation records correctly
- [ ] Monthly subscription creates subscription record
- [ ] `invoice.payment_succeeded` updates subscription
- [ ] `customer.subscription.deleted` marks subscription cancelled
- [ ] Invalid signature returns 400
- [ ] Duplicate events are handled (idempotency)

## Database Testing

### Verifying Data Integrity

```bash
# Connect to database
psql "$DATABASE_URL"
```

**Check seeded data:**
```sql
-- Prefectures
SELECT COUNT(*) FROM "Prefecture"; -- Should be 47

-- Cities
SELECT COUNT(*) FROM "City"; -- Should be > 0

-- Languages
SELECT COUNT(*) FROM "Language"; -- Should be 8

-- Denominations
SELECT COUNT(*) FROM "Denomination"; -- Should be 12
```

**Check relationships:**
```sql
-- Churches with all relations
SELECT
  c.name,
  p.name as prefecture,
  ci.name as city,
  d.name as denomination,
  COUNT(DISTINCT st.id) as service_times,
  COUNT(DISTINCT s.id) as staff
FROM "Church" c
LEFT JOIN "Prefecture" p ON c."prefectureId" = p.id
LEFT JOIN "City" ci ON c."cityId" = ci.id
LEFT JOIN "Denomination" d ON c."denominationId" = d.id
LEFT JOIN "ServiceTime" st ON c.id = st."churchId"
LEFT JOIN "ChurchStaff" s ON c.id = s."churchId"
GROUP BY c.id, c.name, p.name, ci.name, d.name;
```

**Check constraints:**
```sql
-- Churches must have valid prefecture, city, denomination
SELECT c.name
FROM "Church" c
WHERE c."prefectureId" NOT IN (SELECT id FROM "Prefecture")
   OR c."cityId" NOT IN (SELECT id FROM "City")
   OR c."denominationId" NOT IN (SELECT id FROM "Denomination");
-- Should return 0 rows
```

### Testing Migrations

```bash
# Check migration status
cd packages/database
pnpm prisma migrate status

# Apply pending migrations
pnpm db:migrate

# Verify schema matches database
pnpm prisma db pull
# This should not change your schema.prisma file
```

## API Testing

### GraphQL Playground

1. Open http://localhost:3001/graphql

2. **Test queries:**

```graphql
# Get prefectures
query {
  prefectures {
    id
    name
    nameJa
  }
}

# Get churches
query {
  churches(limit: 10) {
    id
    name
    slug
    city {
      name
      prefecture {
        name
      }
    }
  }
}

# Get church by slug
query {
  church(slug: "test-church-tokyo") {
    id
    name
    profile {
      whoWeAre
    }
    serviceTimes {
      dayOfWeek
      startTime
      language {
        name
      }
    }
  }
}
```

3. **Test mutations (requires auth):**

```graphql
# Create review
mutation {
  createReview(
    input: {
      churchId: "test-church-1"
      content: "Great church!"
      experienceType: "VISITOR"
    }
  ) {
    id
    content
    status
  }
}
```

### Using curl

```bash
# Simple query
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ prefectures { name } }"}'

# With variables
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetChurch($slug: String!) { church(slug: $slug) { name } }",
    "variables": {"slug": "test-church-tokyo"}
  }'
```

## Regression Testing Checklist

Before each release, test:

### Critical Paths

- [ ] User can register and login
- [ ] User can browse churches
- [ ] User can view church profile
- [ ] User can submit review
- [ ] User can make donation
- [ ] Church admin can login
- [ ] Church admin can edit profile
- [ ] Platform admin can login
- [ ] Platform admin can approve verification
- [ ] Platform admin can moderate review
- [ ] Stripe webhooks process correctly
- [ ] Email notifications send (if configured)

### Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Responsive Design

Test on:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Performance Testing

### Basic Performance Checks

**Load time:**
- [ ] Homepage loads < 3s
- [ ] Church profile loads < 3s
- [ ] Dashboard loads < 3s

**Database queries:**
- [ ] No N+1 query issues
- [ ] Queries use indexes
- [ ] Large lists are paginated

**Asset optimization:**
- [ ] Images are optimized
- [ ] CSS/JS is minified in production
- [ ] Fonts are optimized

## Security Testing

### Basic Security Checks

**Authentication:**
- [ ] Protected routes require login
- [ ] Roles are enforced (CHURCH_ADMIN, ADMIN)
- [ ] Session expires correctly
- [ ] Password reset works

**Authorization:**
- [ ] Users can only edit own reviews
- [ ] Church admins can only edit own church
- [ ] Admins can access all features

**Input Validation:**
- [ ] SQL injection prevented (Prisma handles this)
- [ ] XSS prevented (React escapes by default)
- [ ] CSRF protection enabled (NextAuth handles this)

**Data Protection:**
- [ ] Passwords are hashed
- [ ] Secrets not exposed in client
- [ ] Environment variables used correctly

## Bug Reporting

When you find a bug:

1. **Document the issue:**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/videos
   - Environment (browser, OS, etc.)

2. **Check if it's already reported**

3. **Create issue on GitHub** with template:

```markdown
## Bug Description
[Clear description]

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: Chrome 120
- OS: macOS 14
- App: Web / Portal / Admin
- User Role: USER / CHURCH_ADMIN / ADMIN

## Screenshots
[Attach screenshots]

## Additional Context
[Any other relevant information]
```

## Resources

- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Next.js Testing Docs](https://nextjs.org/docs/testing)
- [Prisma Testing Docs](https://www.prisma.io/docs/guides/testing)

---

Happy testing!
