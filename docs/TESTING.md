# Testing Guide

Comprehensive testing guide for ChurchConnect Japan platform.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Manual Testing](#manual-testing)
- [Testing Environments](#testing-environments)
- [Test Data](#test-data)
- [Testing Workflows](#testing-workflows)
  - [Public Web App Testing](#1-public-website-testing)
  - [Church Portal Testing](#2-church-portal-testing)
  - [Admin Dashboard Testing](#3-admin-dashboard-testing)
- [Stripe Testing](#stripe-testing)
- [Database Testing](#database-testing)
- [API Testing](#api-testing)
- [GraphQL API Testing](#graphql-api-testing)
- [Integration Testing](#integration-testing)
- [Cross-Browser Testing](#cross-browser-testing)
- [Accessibility Testing](#accessibility-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Regression Testing](#regression-testing-checklist)
- [Production Testing](#production-testing)
- [Bug Reporting](#bug-reporting)

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

## GraphQL API Testing

### All Queries Testing

#### Reference Data Queries

**Test: Get all prefectures**
```graphql
query {
  prefectures {
    id
    name
    nameJa
  }
}
```
- Expected: Returns 47 prefectures
- Verify: Tokyo, Osaka, Kyoto are present

**Test: Get all languages**
```graphql
query {
  languages {
    id
    name
    code
  }
}
```
- Expected: Returns 8+ languages including English, Japanese, Korean

**Test: Get all denominations**
```graphql
query {
  denominations {
    id
    name
  }
}
```
- Expected: Returns 12+ denominations including Non-denominational, Baptist, etc.

#### Church Queries

**Test: Get churches with filters**
```graphql
query {
  churches(
    limit: 10
    offset: 0
    prefectureId: "tokyo-id"
    languageCode: "en"
  ) {
    id
    name
    slug
    isVerified
    city {
      name
    }
  }
}
```
- Expected: Returns max 10 churches
- Expected: All churches in Tokyo with English services
- Verify: isVerified badge displays correctly

**Test: Get church by slug**
```graphql
query {
  church(slug: "test-church-tokyo") {
    id
    name
    slug
    description
    profile {
      whoWeAre
      vision
      statementOfFaith
      ourStory
      whatToExpect
      parkingInfo
      howToGive
      bankTransferInfo
      externalGivingUrl
    }
    serviceTimes {
      dayOfWeek
      startTime
      endTime
      language {
        name
      }
      serviceType
    }
    staff {
      name
      title
      role
      bio
      photoUrl
      order
    }
    photos {
      url
      caption
      category
    }
    events {
      title
      description
      startDate
      endDate
      location
      isOnline
    }
    sermons {
      title
      preacher
      biblePassage
      preachedAt
      youtubeUrl
      podcastUrl
    }
    reviews(status: APPROVED) {
      id
      content
      experienceType
      user {
        name
      }
      createdAt
    }
  }
}
```
- Expected: Returns complete church data
- Verify: All 10 profile sections present
- Verify: Service times include language
- Verify: Only approved reviews returned

**Test: Full-text search**
```graphql
query {
  searchChurches(query: "worship family friendly") {
    id
    name
    description
  }
}
```
- Expected: Returns churches matching search terms
- Verify: Results ranked by relevance

#### Analytics Queries (Admin Only)

**Test: Get church analytics**
```graphql
query {
  churchAnalytics(churchId: "test-church-1") {
    totalViews
    viewsByDate {
      date
      count
    }
  }
}
```
- Expected: Returns view statistics
- Verify: Requires admin authentication

### All Mutations Testing

#### Review Mutations

**Test: Create review (Requires auth)**
```graphql
mutation {
  createReview(input: {
    churchId: "test-church-1"
    content: "Wonderful community! Very welcoming to visitors."
    experienceType: VISITOR
  }) {
    id
    content
    status
    createdAt
  }
}
```
- Expected: Creates review with PENDING status
- Expected: Returns review ID
- Verify: Review appears in church admin dashboard
- Verify: Email notification sent to church admin

**Test: Update review**
```graphql
mutation {
  updateReview(
    id: "review-id"
    input: {
      content: "Updated review content"
    }
  ) {
    id
    content
    updatedAt
  }
}
```
- Expected: Updates review content
- Expected: Only allows user to update their own review
- Verify: Returns 403 if not review owner

**Test: Delete review**
```graphql
mutation {
  deleteReview(id: "review-id")
}
```
- Expected: Deletes review
- Expected: Only allows user or admin to delete
- Verify: Review removed from public profile

#### Church Profile Mutations (Church Admin)

**Test: Update church profile**
```graphql
mutation {
  updateChurchProfile(input: {
    churchId: "test-church-1"
    whoWeAre: "Updated description"
    vision: "Updated vision"
  }) {
    churchId
    whoWeAre
    vision
  }
}
```
- Expected: Updates profile sections
- Expected: Only church admin can update
- Verify: Changes appear on public profile immediately

#### Staff Mutations

**Test: Create staff member**
```graphql
mutation {
  createStaff(input: {
    churchId: "test-church-1"
    name: "John Smith"
    title: "Lead Pastor"
    role: "Leadership"
    bio: "John has been serving..."
    order: 1
  }) {
    id
    name
    title
  }
}
```
- Expected: Creates staff member
- Expected: Only church admin can create
- Verify: Staff appears on public profile

#### Admin Mutations

**Test: Approve review (Admin only)**
```graphql
mutation {
  approveReview(
    id: "review-id"
    note: "Review approved - appropriate content"
  ) {
    id
    status
  }
}
```
- Expected: Changes status to APPROVED
- Expected: Only admin can approve
- Verify: Review appears on public profile
- Verify: Emails sent to reviewer and church admin

**Test: Verify church (Admin only)**
```graphql
mutation {
  verifyChurch(
    id: "test-church-1"
    note: "Church ownership verified"
  ) {
    id
    isVerified
  }
}
```
- Expected: Sets isVerified to true
- Expected: Only admin can verify
- Verify: Verified badge appears on public profile

### Authentication Testing

**Test: Query without auth (should succeed)**
```graphql
query {
  churches(limit: 5) {
    name
  }
}
```
- Expected: Returns public data

**Test: Mutation without auth (should fail)**
```graphql
mutation {
  createReview(input: {
    churchId: "test-church-1"
    content: "Test"
  }) {
    id
  }
}
```
- Expected: Returns 401 Unauthorized
- Verify: Error message clear

**Test: Query with valid session**
- Set session cookie
- Make authenticated request
- Expected: Returns protected data

### Authorization Testing

**Test: Church admin accessing own church**
- Login as church admin
- Update church profile
- Expected: Success

**Test: Church admin accessing other church**
- Login as church admin for Church A
- Attempt to update Church B profile
- Expected: Returns 403 Forbidden

**Test: User accessing admin endpoints**
- Login as regular user
- Attempt admin mutation (verify church)
- Expected: Returns 403 Forbidden

**Test: Admin accessing all resources**
- Login as admin
- Access any church data
- Expected: Success

### Error Handling Testing

**Test: Invalid input**
```graphql
mutation {
  createReview(input: {
    churchId: "invalid-id"
    content: ""
  }) {
    id
  }
}
```
- Expected: Returns validation error
- Verify: Error message is helpful

**Test: Missing required fields**
```graphql
mutation {
  createStaff(input: {
    churchId: "test-church-1"
    # Missing required 'name' field
    title: "Pastor"
  }) {
    id
  }
}
```
- Expected: Returns error about missing field

**Test: Not found**
```graphql
query {
  church(slug: "non-existent-church") {
    name
  }
}
```
- Expected: Returns null or 404 error
- Verify: Error message clear

**Test: Database constraint violation**
- Attempt to create duplicate resource
- Expected: Returns appropriate error
- Verify: Error doesn't expose internal details

## Integration Testing

### Stripe Webhooks Integration

**Test: Checkout session completed (one-time)**
1. Create donation checkout session
2. Complete payment with test card
3. Trigger webhook: `checkout.session.completed`
4. **Expected Results:**
   - Donation record created in database
   - Status set to 'succeeded'
   - Amount matches payment
   - Email receipt sent to donor
   - Admin notification sent

**Test: Checkout session completed (subscription)**
1. Create monthly donation checkout
2. Complete payment
3. Trigger webhook: `checkout.session.completed`
4. **Expected Results:**
   - Subscription record created
   - Status set to 'active'
   - First payment recorded
   - Thank you email sent

**Test: Invoice payment succeeded**
1. Create monthly subscription
2. Trigger webhook: `invoice.payment_succeeded`
3. **Expected Results:**
   - New payment recorded
   - Subscription status updated
   - Receipt email sent

**Test: Subscription cancelled**
1. Cancel subscription in Stripe Dashboard
2. Trigger webhook: `customer.subscription.deleted`
3. **Expected Results:**
   - Subscription status set to 'cancelled'
   - Cancellation email sent

**Test: Payment failed**
1. Use card that will fail: 4000 0000 0000 9995
2. Trigger webhook: `invoice.payment_failed`
3. **Expected Results:**
   - Subscription status updated
   - Retry scheduled
   - Payment failure email sent

**Test: Webhook signature validation**
1. Send webhook with invalid signature
2. **Expected:** Returns 400 Bad Request
3. **Expected:** No data processed
4. **Expected:** Error logged

**Test: Webhook idempotency**
1. Send same webhook event twice
2. **Expected:** Event processed once only
3. **Expected:** Duplicate event ignored
4. Verify: No duplicate records in database

### Email Delivery Integration

**Test: Contact form email**
1. Go to church profile
2. Fill out contact form
3. Submit with valid reCAPTCHA
4. **Expected Results:**
   - Email sent to church
   - Success message displayed
   - Form resets
   - No errors logged

**Test: Review notification email (to church admin)**
1. Submit new review
2. **Expected Results:**
   - Email sent to church admin
   - Email contains review content
   - Email links to church portal

**Test: Review approved email (to reviewer)**
1. Admin approves review
2. **Expected Results:**
   - Email sent to reviewer
   - Email confirms approval
   - Email links to public profile

**Test: Donation receipt email**
1. Complete donation
2. **Expected Results:**
   - Receipt email sent immediately
   - Contains donation amount
   - Contains tax information
   - Contains thank you message

**Test: Verification approved email**
1. Admin approves verification request
2. **Expected Results:**
   - Email sent to church admin
   - Email confirms verification
   - Email explains benefits

**Test: Email delivery failures**
1. Use invalid email address
2. **Expected Results:**
   - Graceful error handling
   - Error logged
   - User notified (if applicable)

### Cloudinary Integration

**Test: Image upload (church portal)**
1. Login as church admin
2. Navigate to photo upload
3. Select image (< 5MB)
4. Upload
5. **Expected Results:**
   - Image uploads successfully
   - Image URL returned
   - Image displays on public profile
   - Image optimized by Cloudinary
   - Thumbnail generated

**Test: Hero image upload**
1. Upload hero image
2. **Expected Results:**
   - Image resized to appropriate dimensions
   - Image compressed
   - Old hero image replaced
   - Public profile updated

**Test: Staff photo upload**
1. Add staff member with photo
2. **Expected Results:**
   - Photo uploaded to Cloudinary
   - Photo URL stored in database
   - Photo displays in staff section

**Test: Upload size limit**
1. Attempt to upload > 5MB image
2. **Expected:** Error message displayed
3. **Expected:** Upload prevented

**Test: Invalid file type**
1. Attempt to upload .pdf or .txt file
2. **Expected:** Error message displayed
3. **Expected:** Upload prevented

**Test: Upload error handling**
1. Simulate Cloudinary error (disconnect network)
2. Attempt upload
3. **Expected:** Graceful error message
4. **Expected:** User can retry

### reCAPTCHA Integration

**Test: Contact form with valid reCAPTCHA**
1. Fill out contact form
2. Submit (reCAPTCHA runs invisibly)
3. **Expected:** Form submits successfully
4. **Expected:** reCAPTCHA score > 0.5

**Test: Contact form with low score (bot-like)**
1. Simulate low reCAPTCHA score (< 0.5)
2. Submit form
3. **Expected:** Form submission blocked
4. **Expected:** User-friendly error message

**Test: Contact form rate limiting**
1. Submit contact form 5 times from same IP
2. Attempt 6th submission within 1 hour
3. **Expected:** Rate limit error
4. **Expected:** User informed to wait

**Test: reCAPTCHA token validation**
1. Submit form with invalid token
2. **Expected:** Validation fails
3. **Expected:** Error returned

**Test: reCAPTCHA timeout**
1. Load contact form
2. Wait > 2 minutes
3. Submit form
4. **Expected:** Token refreshed automatically
5. **Expected:** Form submits successfully

### Full-Text Search Integration

**Test: Church search by name**
```sql
SELECT name FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', 'Grace Community');
```
- Expected: Returns churches matching name

**Test: Church search by description**
```sql
SELECT name, description FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', 'family friendly worship');
```
- Expected: Returns churches with matching descriptions

**Test: Search with Japanese text**
```sql
SELECT name FROM "Church"
WHERE "searchVector" @@ plainto_tsquery('english', '東京 教会');
```
- Expected: Returns Tokyo churches

**Test: Sermon search**
```sql
SELECT title, "biblePassage" FROM "Sermon"
WHERE "searchVector" @@ plainto_tsquery('english', 'faith hope love');
```
- Expected: Returns sermons matching keywords

**Test: Event search**
```sql
SELECT title, description FROM "Event"
WHERE "searchVector" @@ plainto_tsquery('english', 'christmas concert');
```
- Expected: Returns matching events

**Test: Search vector auto-update**
1. Create new church via admin dashboard
2. Check search vector populated
3. Update church description
4. Verify search vector updated automatically
5. **Expected:** Trigger updates search vector

**Test: Search ranking**
1. Search for common term
2. **Expected:** Results ranked by relevance
3. **Expected:** Verified churches rank higher
4. **Expected:** Complete profiles rank higher

## Cross-Browser Testing

### Desktop Browsers

#### Chrome (Latest)
- [ ] Homepage loads correctly
- [ ] Search and filters work
- [ ] Church profiles display properly
- [ ] Forms submit successfully
- [ ] Image uploads work
- [ ] Stripe Checkout opens
- [ ] Responsive design works
- [ ] No console errors

#### Firefox (Latest)
- [ ] All Chrome tests pass
- [ ] CSS Grid/Flexbox layouts correct
- [ ] Font rendering acceptable
- [ ] Video embeds work

#### Safari (Latest)
- [ ] All Chrome tests pass
- [ ] Date pickers work
- [ ] Input autofill works
- [ ] No webkit-specific issues

#### Edge (Latest)
- [ ] All Chrome tests pass
- [ ] No Chromium-specific issues

### Mobile Browsers

#### iOS Safari (iPhone 13)
- [ ] Touch interactions work
- [ ] Viewport scales correctly
- [ ] Forms usable on mobile
- [ ] Image uploads work
- [ ] Hamburger menu works
- [ ] No horizontal scrolling
- [ ] Text readable without zoom

#### Chrome Android (Samsung Galaxy S21)
- [ ] All iOS tests pass
- [ ] Back button works correctly
- [ ] PWA installable (future)

### Browser-Specific Testing

**Test: File uploads (Safari)**
- Issue: Safari file input quirks
- Test: Upload church photo on iOS Safari
- Verify: File selection works
- Verify: Upload completes

**Test: Date pickers (Firefox)**
- Issue: Different date picker implementations
- Test: Set event date in Firefox
- Verify: Date selection works
- Verify: Format correct

**Test: Payment forms (All browsers)**
- Issue: Stripe Checkout compatibility
- Test: Complete donation in each browser
- Verify: Checkout opens
- Verify: Payment processes
- Verify: Redirects work

### Responsive Breakpoints

Test at these exact widths:
- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 13)
- [ ] 768px (iPad portrait)
- [ ] 1024px (iPad landscape)
- [ ] 1366px (Laptop)
- [ ] 1920px (Desktop)

## Accessibility Testing

### Keyboard Navigation

**Test: Tab through forms**
1. Open contact form
2. Press Tab to move through fields
3. **Expected:**
   - All form fields focusable
   - Focus indicator visible
   - Tab order logical
   - Can submit with Enter

**Test: Navigate site without mouse**
1. Use only keyboard
2. Navigate through homepage
3. Navigate to church profile
4. **Expected:**
   - All interactive elements reachable
   - Skip to main content link present
   - Dropdown menus accessible

**Test: Esc key behavior**
1. Open modal/dialog
2. Press Esc
3. **Expected:** Modal closes

### Screen Reader Testing

**Test with NVDA (Windows) or VoiceOver (Mac)**

**Test: Homepage**
- [ ] Page title announced
- [ ] Main navigation announced correctly
- [ ] Headings announce hierarchy (h1, h2, h3)
- [ ] Search form labeled properly
- [ ] Links have descriptive text

**Test: Church profile**
- [ ] Church name announced
- [ ] Tabs announced and navigable
- [ ] Images have alt text
- [ ] Form labels associated with inputs
- [ ] Error messages announced

**Test: Forms**
- [ ] Form labels read aloud
- [ ] Required fields indicated
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Help text associated with fields

### ARIA Attributes

**Test: ARIA labels present**
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-labelledby` on sections
- [ ] `aria-describedby` on form fields with help text
- [ ] `aria-live` regions for dynamic content
- [ ] `aria-expanded` on dropdowns

**Test: ARIA landmarks**
- [ ] `role="navigation"` on nav
- [ ] `role="main"` on main content
- [ ] `role="search"` on search form
- [ ] `role="banner"` on header
- [ ] `role="contentinfo"` on footer

### Color Contrast

**Test: WCAG AA compliance (4.5:1 ratio)**
- [ ] Body text vs background
- [ ] Link text vs background
- [ ] Button text vs button background
- [ ] Form field labels vs background
- [ ] Error messages vs background

Use tools:
- Chrome DevTools Lighthouse
- WebAIM Contrast Checker
- axe DevTools extension

### Focus Indicators

**Test: Visible focus states**
- [ ] Links show focus outline
- [ ] Buttons show focus state
- [ ] Form inputs show focus ring
- [ ] Custom components maintain focus
- [ ] Focus visible in all browsers

### Alternative Text

**Test: Images have alt text**
- [ ] Church photos have descriptive alt
- [ ] Staff photos have name in alt
- [ ] Decorative images have empty alt=""
- [ ] Complex images have detailed descriptions

### Form Accessibility

**Test: Form labels**
- [ ] All inputs have associated labels
- [ ] Labels use `for` attribute
- [ ] Placeholders not used as labels
- [ ] Error messages clear and helpful

**Test: Error handling**
- [ ] Errors announced to screen readers
- [ ] Errors associated with fields (aria-describedby)
- [ ] Multiple errors listed clearly
- [ ] Focus moved to first error

## Performance Testing

### Page Load Performance

**Test: Homepage load time**
1. Open Chrome DevTools
2. Go to Performance tab
3. Record page load
4. **Target:** < 3 seconds on 3G
5. **Expected:**
   - First Contentful Paint < 1.8s
   - Largest Contentful Paint < 2.5s
   - Time to Interactive < 3.8s
   - Cumulative Layout Shift < 0.1

**Test: Church profile load time**
1. Navigate to church with many images
2. Measure load time
3. **Target:** < 3 seconds
4. **Expected:**
   - Images lazy-loaded
   - Above-fold content loads first
   - No blocking resources

**Test: Search results load time**
1. Search for common term
2. Measure results load
3. **Target:** < 1 second
4. **Expected:**
   - Results paginated
   - Database query optimized

### Database Query Performance

**Test: N+1 query prevention**
```sql
-- Enable query logging
SET log_min_duration_statement = 0;

-- Then navigate through site
-- Check logs for duplicate queries
```
- **Expected:** No repeated similar queries
- **Expected:** Related data loaded with includes

**Test: Slow query detection**
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```
- **Expected:** All queries < 100ms
- **Expected:** Indexes used appropriately

**Test: Church list query**
```sql
EXPLAIN ANALYZE
SELECT * FROM "Church"
WHERE "isPublished" = true
AND "prefectureId" = 'tokyo-id'
LIMIT 20;
```
- **Expected:** Uses index scan
- **Expected:** < 50ms execution time

### Asset Optimization

**Test: Image optimization**
1. Inspect church photos
2. **Expected:**
   - Images served from Cloudinary CDN
   - Next.js Image component used
   - WebP format when supported
   - Proper sizes attribute set
   - Lazy loading enabled

**Test: Bundle size**
```bash
pnpm build
# Check .next/analyze output
```
- **Target:** First load JS < 300KB
- **Expected:** Code splitting enabled
- **Expected:** Dynamic imports used for large components

**Test: Font optimization**
1. Check font loading strategy
2. **Expected:**
   - `font-display: swap` used
   - Font subsetting enabled
   - Only used weights loaded

### Caching

**Test: Static asset caching**
1. Load homepage
2. Check Network tab
3. Refresh page
4. **Expected:**
   - Static assets cached (304 status)
   - Cache headers set correctly
   - CDN serving images

**Test: API response caching**
1. Query prefectures list
2. Query again
3. **Expected:** Results cached (if applicable)

### Performance Benchmarks

**Lighthouse Scores (Targets)**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Run Lighthouse:**
```bash
# Install globally if needed
npm install -g lighthouse

# Run test
lighthouse http://localhost:3000 --view
```

**Core Web Vitals**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Load Testing

**Test: Concurrent users (using k6 or Artillery)**
```javascript
// Load test script (example)
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function() {
  let res = http.get('http://localhost:3000');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });
}
```

**Expected Results:**
- Server handles 100 concurrent users
- Response time stays < 3s
- No errors or timeouts
- Database connections managed properly

## Security Testing

### Authentication Security

**Test: Password hashing**
1. Create user account
2. Check database
3. **Expected:**
   - Password is hashed (bcrypt)
   - Original password not visible
   - Hash starts with $2a$ or $2b$

**Test: Session security**
1. Login and check cookies
2. **Expected:**
   - HttpOnly flag set
   - Secure flag set (in production)
   - SameSite attribute set
   - Session expires after inactivity

**Test: Password reset flow**
1. Request password reset
2. **Expected:**
   - Reset token is random and secure
   - Token expires after 1 hour
   - Token can only be used once
   - Old password still works until reset

**Test: Brute force protection**
1. Attempt login 10 times with wrong password
2. **Expected:**
   - Account locked after 5-10 attempts
   - User notified via email
   - Lock expires after time period

### Authorization Security

**Test: Role enforcement**
1. Login as regular user
2. Attempt to access admin URL
3. **Expected:**
   - Redirected to login or 403 page
   - Cannot access protected resources

**Test: Church admin isolation**
1. Login as church admin for Church A
2. Modify URL to edit Church B
3. **Expected:**
   - Access denied
   - Error message shown
   - Action logged

**Test: API authorization**
1. Call admin mutation without admin role
2. **Expected:** 403 Forbidden error
3. **Expected:** Error message clear

### Input Validation

**Test: XSS prevention**
1. Submit form with script tag:
   ```
   <script>alert('XSS')</script>
   ```
2. **Expected:**
   - Script not executed
   - Content escaped/sanitized
   - No JavaScript runs

**Test: SQL injection prevention (Prisma handles this)**
1. Enter SQL in search:
   ```
   '; DROP TABLE "Church"; --
   ```
2. **Expected:**
   - No SQL executed
   - Treated as search string
   - Prisma parameterizes queries

**Test: CSRF protection**
1. Create malicious form on different domain
2. Submit to ChurchConnect endpoint
3. **Expected:**
   - Request blocked
   - CSRF token validated
   - NextAuth protects endpoints

**Test: File upload validation**
1. Attempt to upload .exe file
2. **Expected:** Rejected - invalid type
3. Attempt to upload 10MB image
4. **Expected:** Rejected - too large

### Data Protection

**Test: Sensitive data exposure**
1. Check API responses
2. **Expected:**
   - Passwords never returned
   - User email only visible to owner/admin
   - API keys not exposed
   - Environment variables secured

**Test: HTTPS enforcement (Production)**
1. Access site via HTTP
2. **Expected:** Redirects to HTTPS
3. **Expected:** HSTS header set

**Test: Headers security**
Check response headers:
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Content-Security-Policy set
- [ ] Referrer-Policy set

### Rate Limiting

**Test: Contact form rate limiting**
1. Submit contact form 5 times in 1 hour
2. Attempt 6th submission
3. **Expected:**
   - Request blocked
   - Error: "Too many requests"
   - Can retry after 1 hour

**Test: API rate limiting (if implemented)**
1. Make 100 API requests rapidly
2. **Expected:**
   - Rate limit kicks in
   - 429 status code returned
   - Retry-After header present

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

### Cross-Browser Testing (Quick Checklist)

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Responsive Design (Quick Checklist)

Test on:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Production Testing

### Pre-Launch Testing (Staging)

Before launching to production, complete comprehensive testing on staging environment:

**1. Deploy to Staging Environment**
```bash
# Deploy all apps to staging
# Use staging environment variables
# Connect to staging database
```

**2. Run All Critical Paths**
See [Critical Paths Document](CRITICAL_PATHS.md) for detailed flows:
- [ ] User can discover churches
- [ ] User can submit review
- [ ] Church admin can manage profile
- [ ] Admin can moderate review
- [ ] User can make platform donation
- [ ] Contact form works

**3. Test with Realistic Data**

Setup staging with production-like data:
```bash
# Import real church data (20-30 churches)
cd packages/database
pnpm db:seed

# Create test accounts for all roles
# Regular user: test-user@example.com
# Church admin: test-admin@testchurch.jp
# Platform admin: admin@staging.churchconnect.jp
```

Generate sample content:
- [ ] 20-30 churches with complete profiles
- [ ] 10-15 churches with partial profiles
- [ ] 5-10 verified churches
- [ ] 20+ reviews (mix of pending/approved)
- [ ] 15+ events across churches
- [ ] 30+ sermons with YouTube links
- [ ] 50+ church photos
- [ ] 10+ staff members per church

**4. Performance Testing**

Load test with realistic traffic:

```bash
# Install k6 for load testing
brew install k6

# Run load test
k6 run scripts/load-test.js
```

Performance targets:
- [ ] Homepage loads < 3s (3G connection)
- [ ] Church profile loads < 3s
- [ ] Search results load < 1s
- [ ] Database queries < 100ms
- [ ] API responses < 500ms
- [ ] 100 concurrent users without errors

Monitor metrics:
- [ ] CPU usage stays < 70%
- [ ] Memory usage stays < 80%
- [ ] Database connections managed properly
- [ ] No memory leaks over time

**5. Cross-Browser Testing**

Test all features on:

**Desktop:**
- [ ] Chrome 120+ (Windows/Mac)
- [ ] Firefox 120+ (Windows/Mac)
- [ ] Safari 17+ (Mac only)
- [ ] Edge 120+ (Windows)

**Mobile:**
- [ ] iOS Safari (iPhone 13, iPhone SE)
- [ ] Chrome Android (Samsung Galaxy S21)
- [ ] iPad Safari (portrait and landscape)

Test these features in each browser:
- [ ] Homepage navigation
- [ ] Church search and filters
- [ ] Church profile (all tabs)
- [ ] Contact form submission
- [ ] Image uploads (church portal)
- [ ] Stripe Checkout flow
- [ ] Review submission
- [ ] Admin dashboard functions

**6. Mobile Responsiveness Testing**

Test at exact breakpoints:
- [ ] 375px - iPhone SE (portrait)
- [ ] 390px - iPhone 13 (portrait)
- [ ] 428px - iPhone 13 Pro Max (portrait)
- [ ] 768px - iPad (portrait)
- [ ] 1024px - iPad (landscape)
- [ ] 1366px - Laptop
- [ ] 1920px - Desktop

Verify for each:
- [ ] No horizontal scrolling
- [ ] Text readable without zooming
- [ ] Buttons/links easily tappable (44x44px minimum)
- [ ] Forms usable on mobile
- [ ] Images scale properly
- [ ] Navigation accessible
- [ ] Content reflows correctly

**7. Integration Testing**

Test all third-party integrations:

**Stripe:**
- [ ] One-time donation processes
- [ ] Monthly subscription processes
- [ ] Webhooks receive events
- [ ] Payment success/failure handling
- [ ] Receipt emails sent

**Cloudinary:**
- [ ] Image uploads succeed
- [ ] Images display on profiles
- [ ] Thumbnails generated
- [ ] CDN serving images
- [ ] Upload errors handled

**Resend:**
- [ ] Contact form emails send
- [ ] Review notification emails send
- [ ] Donation receipt emails send
- [ ] Verification emails send
- [ ] Email templates render correctly

**reCAPTCHA:**
- [ ] Contact forms protected
- [ ] Score threshold appropriate (< 5% false positives)
- [ ] Bot submissions blocked

**PostgreSQL Full-Text Search:**
- [ ] Church search returns results
- [ ] Search ranking works correctly
- [ ] Japanese text searchable
- [ ] Search vectors auto-update

**8. Security Testing**

Run security checks:
- [ ] SQL injection attempts fail
- [ ] XSS attempts sanitized
- [ ] CSRF protection working
- [ ] File upload validation
- [ ] Rate limiting enforced
- [ ] Authentication required for protected routes
- [ ] Authorization enforced by role
- [ ] Session security configured
- [ ] HTTPS enforced (staging)
- [ ] Security headers present

**9. Accessibility Testing**

Run automated and manual tests:

```bash
# Run Lighthouse accessibility audit
lighthouse https://staging.churchconnect.jp --only-categories=accessibility

# Run axe DevTools
# (Chrome extension)
```

- [ ] Lighthouse accessibility score > 90
- [ ] All images have alt text
- [ ] Forms keyboard navigable
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast ratios meet WCAG AA
- [ ] ARIA labels present
- [ ] Semantic HTML used

**10. End-to-End User Flows**

Complete these full user journeys:

**Journey 1: New User Discovers Church**
1. Visit homepage
2. Search for "english church tokyo"
3. Filter by denomination
4. Click church profile
5. View all tabs
6. Submit contact form
7. Receive confirmation

**Journey 2: User Submits Review**
1. Create account
2. Browse churches
3. Select church to review
4. Write review
5. Submit review
6. Receive pending status
7. Get notification when approved

**Journey 3: Church Admin Updates Profile**
1. Login to church portal
2. Update "Who We Are" section
3. Add staff member
4. Upload staff photo
5. Add upcoming event
6. Add sermon with YouTube link
7. Upload church photos
8. Verify changes on public profile

**Journey 4: Platform Admin Moderates Content**
1. Login to admin dashboard
2. View pending reviews
3. Approve appropriate review
4. Reject inappropriate review
5. Verify church profile
6. Send verification email
7. Check analytics

**Journey 5: Donor Makes Donation**
1. Visit /donate
2. Select monthly donation
3. Choose ¥3,000 amount
4. Complete Stripe Checkout
5. Return to success page
6. Receive receipt email
7. Verify donation in database

### Post-Launch Monitoring (Production)

After production launch, implement ongoing monitoring:

**Week 1: Daily Monitoring**
- [ ] Health check script runs daily
- [ ] Error rates monitored (target: < 1%)
- [ ] Email delivery rates checked (target: > 95%)
- [ ] Stripe webhooks processing (100% success)
- [ ] Cloudinary upload success rate (> 99%)
- [ ] Database performance monitored
- [ ] Page load times tracked
- [ ] User registrations tracked
- [ ] Church additions tracked

**Daily Health Check Routine:**
```bash
# Run automated health check
./scripts/health-check.sh

# Check dashboards
# - Render: CPU/Memory/Errors
# - Sentry: New errors
# - Stripe: Payments
# - Resend: Email delivery
# - Cloudinary: Upload stats
```

**Week 1: Critical Metrics to Track**
- [ ] Site uptime: 99.9% target
- [ ] Average response time: < 3s
- [ ] Error rate: < 1%
- [ ] User registrations: 0+ (track growth)
- [ ] Churches added: 0+ (track growth)
- [ ] Reviews submitted: 0+ (track activity)
- [ ] Donations received: 0+ (track revenue)
- [ ] Search queries: Track popular terms

**Week 2-4: Weekly Monitoring**
- [ ] Review error logs in Sentry
- [ ] Analyze user behavior (Google Analytics)
- [ ] Check database size/growth
- [ ] Review email delivery stats
- [ ] Monitor third-party service usage
- [ ] Check Stripe transaction volume
- [ ] Verify backup integrity
- [ ] Update documentation based on issues

**Week 2-4: Business Metrics**
- [ ] User growth rate
- [ ] Church growth rate
- [ ] Review submission rate
- [ ] Review approval rate (target: > 80%)
- [ ] Donation conversion rate
- [ ] Return visitor rate
- [ ] Average session duration
- [ ] Bounce rate (target: < 50%)

**Ongoing: Performance Monitoring**

Setup alerts for:
- [ ] Response time > 5s for 10 minutes
- [ ] Error rate > 5% for 15 minutes
- [ ] Database CPU > 80% for 10 minutes
- [ ] Disk space < 20% remaining
- [ ] Email delivery rate < 90%
- [ ] Stripe webhook failures

Monitor weekly:
- [ ] Slowest database queries
- [ ] Largest database tables
- [ ] Cache hit rates
- [ ] CDN bandwidth usage
- [ ] API endpoint performance

**Ongoing: User Feedback**

Collect and track:
- [ ] Support email responses
- [ ] Bug reports
- [ ] Feature requests
- [ ] Church admin feedback
- [ ] User satisfaction (surveys)

### Smoke Testing Script

Quick verification after any deployment:

```bash
#!/bin/bash
# smoke-test.sh

echo "Running smoke tests..."

# 1. Health check
./scripts/health-check.sh || exit 1

# 2. Test homepage
curl -f https://churchconnect.jp > /dev/null || {
  echo "❌ Homepage failed"
  exit 1
}
echo "✓ Homepage OK"

# 3. Test API
curl -f https://api.churchconnect.jp/health > /dev/null || {
  echo "❌ API health check failed"
  exit 1
}
echo "✓ API OK"

# 4. Test GraphQL
curl -X POST https://api.churchconnect.jp/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' \
  --fail > /dev/null || {
  echo "❌ GraphQL failed"
  exit 1
}
echo "✓ GraphQL OK"

# 5. Test database connection (via API)
# Add a health endpoint that checks DB
curl -f https://api.churchconnect.jp/health/db > /dev/null || {
  echo "❌ Database connection failed"
  exit 1
}
echo "✓ Database OK"

echo "✅ All smoke tests passed!"
```

Run after every deployment:
```bash
chmod +x smoke-test.sh
./smoke-test.sh
```

### Rollback Procedure

If critical issues discovered in production:

**Step 1: Assess Severity**
- P0 (site down): Rollback immediately
- P1 (major feature broken): Rollback within 30 minutes
- P2 (minor issue): Fix forward or schedule rollback

**Step 2: Execute Rollback**
```bash
# On Render
1. Go to service dashboard
2. Click "Manual Deploy"
3. Select previous successful commit
4. Click "Deploy"

# Or via git
git revert HEAD
git push origin main
# Render auto-deploys
```

**Step 3: Verify Rollback**
```bash
./smoke-test.sh
./scripts/health-check.sh
```

**Step 4: Post-Rollback**
- [ ] Monitor error rates
- [ ] Verify issue resolved
- [ ] Investigate root cause
- [ ] Create incident report
- [ ] Fix issue in development
- [ ] Test thoroughly before redeploying

### Production Testing Checklist Summary

Complete before production launch:

**Pre-Launch:**
- [ ] All critical paths tested
- [ ] Cross-browser testing complete
- [ ] Mobile responsive on all devices
- [ ] Performance benchmarks met
- [ ] Security testing passed
- [ ] Accessibility score > 90
- [ ] All integrations working
- [ ] Realistic data loaded
- [ ] Backup/restore tested
- [ ] Monitoring configured

**Launch Day:**
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor closely for 4 hours
- [ ] Check all critical paths manually
- [ ] Verify emails sending
- [ ] Test donation flow
- [ ] Monitor error rates

**Post-Launch:**
- [ ] Daily health checks (Week 1)
- [ ] Error monitoring active
- [ ] Metrics being tracked
- [ ] User feedback collected
- [ ] Performance monitored
- [ ] Backups running daily

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
