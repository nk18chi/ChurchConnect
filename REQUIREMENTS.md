# ChurchConnect Japan - Requirements Document

## Project Overview

**ChurchConnect Japan** is a cross-denominational church directory platform that gives each church a beautiful, feature-rich profile page with content management capabilities, essentially a mini-website. The platform helps Christians in Japan discover churches, read authentic community reviews, and connect with church communities.

**Design Inspiration**: Clean, modern design inspired by coastalchurch.org - bold hero images, clear navigation, mobile-first responsive design.

**Sustainability Model**: Platform donations from users (100% to platform minus Stripe fees).

---

## Core Value Proposition

- **Complete church presence** - Not just contact info, but full ministry showcase
- **Rich content management** - Sermons, events, staff profiles, beliefs, stories
- **Social integration** - Connect to YouTube, Instagram, Spotify, LINE, podcasts
- **Smart search ranking** - Rewards verified and complete church profiles
- **Community insights** - Reviews without ratings (no church competition)
- **Cross-denominational** - All churches welcome

---

## Target Users

1. **New believers** seeking their first church (reduce anxiety, explain basics)
2. **Church seekers** comparing options (reviews, photos, detailed information)
3. **Church leaders** who want to manage their church's online presence
4. **Platform supporters** who want to sustain this free resource through donations

---

## MVP Scope (Phase 1)

### ✅ INCLUDED in MVP

**Core Features:**
- Church directory with advanced search and filters
- Normalized database (Prefecture, City, Language, Church models)
- Church profile pages with tabs (About, Leadership, Worship, Events, Connect, Give)
- Church Portal for verified church owners to manage content
- Service times and languages
- Photo management
- Social media links integration
- Contact form (with reCAPTCHA spam prevention)
- Review system (comment-based, no ratings, moderated)
- Church verification workflow
- Admin dashboard
- Platform donations via Stripe (one-time and monthly)
- Simple ranking algorithm (verified + complete)

**Content Sections:**
- Who We Are, Vision, Story, What We Believe (statement of faith)
- Church staff/leadership profiles
- Kid Church ministry info
- Individual sermons (YouTube/podcast links)
- Events calendar
- What to Expect (first-timer guide)
- How to Give (bank instructions, external donation links)

### ⏸️ DEFERRED to v2 (Post-MVP)

- Church donations via Stripe Connect (payment processing)
- Blog posts feature
- Sermon series grouping
- User sermon logs (personal tracking)
- User visit history
- Email subscriptions/follow churches
- Mobile apps (iOS/Android)
- Expansion to other countries

---

## Technical Stack

### Frontend
- **Next.js 14+** (App Router) - All apps (web, church-portal, admin)
- **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **React Server Components**
- **Tanstack Query** for client-side data fetching

### Backend
- **GraphQL API** with **Pothos GraphQL** (code-first, excellent Prisma integration)
- **Apollo Server**
- **PostgreSQL** database
- **Prisma ORM** (migrations, type-safe queries)
- **PostgreSQL full-text search** (for sermons, events, church search)

### Authentication
- **NextAuth.js v5 (Auth.js)**
- Email/password authentication
- Role-based access (USER, CHURCH_ADMIN, ADMIN)

### Payments
- **Stripe** for platform donations
- Stripe Checkout for payment pages
- Webhook handling for payment events

### Infrastructure
- **Hosting**: Render
  - Web services for Next.js apps
  - Background worker for GraphQL API
  - PostgreSQL managed database
- **File Storage**: Cloudinary
  - Image uploads (5MB limit, 2000x2000px max)
  - Automatic optimization and CDN
- **Email**: Resend or SendGrid
  - Contact form delivery
  - Review notifications
  - Donation receipts

### Monorepo
- **Turborepo** for build orchestration
- **pnpm** workspaces

```
apps/
  web/              # Public-facing Next.js site
  church-portal/    # Church owner dashboard
  admin/            # Admin dashboard
  api/              # GraphQL API server

packages/
  database/         # Prisma schema, migrations, seed data
  graphql/          # Pothos schema, resolvers, types
  ui/               # Shared React components (@repo/ui)
  utils/            # Shared utilities (@repo/utils)
  auth/             # NextAuth configuration
  eslint-config/    # Shared linting (@repo/eslint-config)
  typescript-config/# Shared tsconfig (@repo/typescript-config)
  tailwind-config/  # Shared Tailwind config (@repo/tailwind-config)
```

### Development Tools
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks
- **TypeScript** strict mode throughout

---

## Database Schema (Normalized)

### Core Models

**Location Models (Pre-seeded):**
- `Prefecture` - All Japan prefectures (47 total)
- `City` - Cities within prefectures
- `Language` - Languages (Japanese, English, Korean, etc.)

**Church Models:**
- `Church` - Core identity, location, contact (normalized refs to Prefecture, City)
- `ChurchProfile` - About content (whoWeAre, vision, storyOfChurch, statementOfFaith, kidChurchInfo)
- `ChurchSocial` - Social media links (YouTube, Instagram, X, Facebook, Spotify, LINE, Podcast)
- `ChurchLanguage` - Many-to-many junction table for church languages
- `ChurchStaff` - Pastor/leader profiles (name, title, role, bio, photo, social links)
- `ServiceTime` - Service schedule (dayOfWeek, startTime, language)
- `ChurchPhoto` - Photo gallery (url, caption, category, order)

**Content Models:**
- `Sermon` - Individual sermons (title, preacher, passage, date, YouTube/podcast links)
- `Event` - Events calendar (title, description, date, location, registration link)

**Engagement Models:**
- `Review` - User reviews (comment-based, no ratings)
- `ReviewResponse` - Church responses to reviews

**Platform Models:**
- `PlatformDonation` - One-time donations to platform
- `PlatformDonationSubscription` - Recurring monthly donations

**Admin Models:**
- `User` - Users with roles (USER, CHURCH_ADMIN, ADMIN)
- `VerificationRequest` - Church ownership verification
- `ChurchAnalytics` - Profile view tracking
- `Denomination` - Denominations (Protestant, Catholic, Orthodox)

### Data Policies

**Soft Delete:**
- Churches use soft delete (`isDeleted` flag) to preserve history
- Deleted churches hidden from public but preserved for records

**Duplicate Prevention:**
- Admin adds all churches initially (no self-registration in MVP)
- Slug uniqueness prevents duplicates (based on name + city)

**Image Validation:**
- Max file size: 5MB
- Max dimensions: 2000x2000px
- Cloudinary handles optimization and CDN delivery

**Donation Minimum:**
- Platform donations: ¥100 minimum to reduce Stripe fee impact

---

## Search & Ranking

### Simplified Ranking Algorithm

**4-Tier Ranking System:**
1. ✅ Verified + Complete (appears first)
2. ✅ Verified + Incomplete
3. Unverified + Complete
4. Unverified + Incomplete

**Completeness Check (Binary - All 4 Required):**
- ✅ Has hero/main photo
- ✅ Has at least one of: Who We Are OR Vision OR Story (some about content)
- ✅ Has at least one church staff/leader profile
- ✅ Has service times

Within each tier, sort alphabetically by church name.

### Search Filters

- Prefecture and City (normalized dropdowns)
- Denomination
- Service language(s)
- Worship style (Traditional, Contemporary, Blended)
- Has Kid Church ministry
- Accessibility features (Wheelchair, Parking, Nursery)

### Search Implementation

- PostgreSQL full-text search on church name, description, about content
- Indexed queries on prefecture, city, denomination, languages
- Result caching for performance

---

## User Flows

### 1. Church Discovery (Public Users)

```
1. User visits homepage
2. Can search/filter churches
3. Views church profile page (tabs: About, Leadership, Worship, Events, Connect, Give)
4. Can submit contact form to church
5. Can read reviews from other users
6. Can click social media links
7. Can view donation instructions (bank transfer, external links)
```

### 2. Church Portal (Verified Church Owners)

```
1. Church requests verification (upload proof documents)
2. Admin reviews and approves
3. Admin creates church admin account, grants access
4. Church admin logs in to portal
5. Dashboard shows profile completeness checklist
6. Can edit all content sections (self-publish immediately)
7. Can upload/manage photos
8. Can add/edit church staff profiles
9. Can add/edit sermons and events
10. Can respond to user reviews
11. Can flag inappropriate reviews
12. Can view analytics (profile views)
```

### 3. User Reviews

```
1. User creates account
2. Writes review (comment only, no rating)
3. Review goes to PENDING status
4. Admin receives notification
5. Admin approves/rejects review
6. If approved, review appears on church profile
7. Church receives notification
8. Church can respond publicly or flag for removal
```

### 4. Platform Donations

```
1. User clicks "Support Us" in header
2. Lands on /donate page with mission statement
3. Selects one-time or monthly donation
4. Chooses amount (¥500, ¥1000, ¥3000, or custom)
5. Redirected to Stripe Checkout
6. Completes payment
7. Redirected to success page
8. Receives thank you email
9. (If monthly) Subscription created, charged monthly
```

### 5. Admin Dashboard

```
1. Admin logs in
2. Can add/edit/delete churches
3. Can review pending church verifications
4. Can moderate pending reviews
5. Can handle flagged reviews
6. Can view platform analytics (churches, users, donations)
7. Can manually mark churches as closed
8. Can transfer church admin ownership
```

---

## Design System

### Visual Design (Inspired by Coastal Church)

**Colors:**
- Primary accent: Customizable per church (default: #ed1c24 red)
- Dark text: #3a3a3a
- Light gray: #f5f5f5 (section backgrounds)
- White: #ffffff

**Typography:**
- Headings: Bold, clean sans-serif
- Body: 16px, 1.5 line-height
- Uppercase for navigation/CTAs

**Layout:**
- Full-width hero images
- Max content width: 1200px centered
- Generous whitespace
- Clear visual hierarchy
- Grid-based content layout
- Card-based design for sermons/events

**Components:**
- Hero section with overlay text
- Tab navigation for church profiles
- Bold CTAs (red background, white text)
- Mobile-first responsive breakpoints (768px, 544px)
- Sticky header on scroll

---

## Security & Privacy

### Authentication
- JWT tokens for API authentication
- HTTP-only cookies for sessions
- Role-based access control (RBAC)

### Data Protection
- User reviews always attributed (no anonymous reviews)
- Contact form uses reCAPTCHA to prevent spam
- Rate limiting on contact form (5 per hour per IP)
- XSS protection via content sanitization
- SQL injection prevented by Prisma parameterized queries

### Privacy
- User sermon logs: Not implemented in MVP
- User visit history: Not implemented in MVP
- Review attribution: User name shown, email private
- Contact form: Church receives message via email, no data stored

### Moderation
- All reviews require admin approval before publishing
- Churches can flag reviews for removal
- Admin can reject/remove inappropriate content

---

## Email Notifications

**To Churches:**
- New review notification (after approval)
- Contact form submission forwarded
- Verification approved notification

**To Users:**
- Review submitted (awaiting moderation)
- Review approved notification
- Contact form confirmation (auto-reply)

**To Platform Donors:**
- Donation receipt (one-time)
- Monthly donation receipt
- Subscription confirmation
- Subscription cancellation confirmation

**To Admin:**
- New verification request
- New review pending moderation
- Flagged review notification

---

## Performance & Scalability

### Caching Strategy
- Next.js ISR for church profile pages (revalidate: 1 hour)
- Static generation for search results pages
- CDN caching for images via Cloudinary
- Apollo Server response caching

### Database Optimization
- Indexes on frequently queried fields:
  - `Church`: `[isVerified, isComplete]`, `[prefectureId, cityId]`
  - `Review`: `[churchId, status]`
  - `ServiceTime`: `[churchId]`
- Connection pooling via Prisma
- Pagination for large result sets

### Image Optimization
- Cloudinary automatic format conversion (WebP)
- Responsive images with srcset
- Lazy loading for images below fold

---

## Risk Mitigation

### Technical Complexity (Primary Concern)
- ✅ Simplified MVP (deferred Stripe Connect, blogs, series, user tracking)
- ✅ Use proven stack (Next.js, Prisma, Pothos)
- ✅ Monorepo keeps code organized but manageable
- ✅ Focus on core value: church discovery and profiles

### Church Adoption
- Pre-seed with 20-30 churches before public launch
- Provide excellent church portal UX
- Clear value prop: free website-like presence
- Profile completeness guidance

### Content Moderation Load
- Start with manual review (admin approves all reviews)
- Can add auto-approval for trusted users later
- Keep review volume low initially (limited users)

### Spam & Abuse
- reCAPTCHA on contact forms
- Rate limiting on submissions
- Soft delete preserves evidence
- Admin tools to ban abusive users

---

## Future Vision (Post-MVP)

**2-Year Goals:**
- Expand to other countries (Korea, Taiwan, Southeast Asia)
- Mobile apps (iOS/Android) for better mobile experience
- Church donation processing (Stripe Connect)
- User features (sermon logs, visit tracking, subscriptions)
- Advanced features (blog posts, sermon series, small group finder)

---

## Success Metrics

### Phase 1 (MVP - 3 months)
- 50+ churches listed
- 20+ verified churches with complete profiles
- 100+ user accounts
- 50+ reviews submitted
- Basic donation revenue (¥50,000/month goal)

### Phase 2 (6 months)
- 200+ churches listed
- 100+ verified churches
- 1,000+ user accounts
- 500+ reviews
- Growing donation revenue (¥200,000/month)

### Long-term (12+ months)
- 500+ churches (major cities covered)
- 5,000+ users
- 2,000+ reviews
- Sustainable revenue model
- Mobile apps launched
- Expansion to second country

---

## Open Questions / Decisions Needed

1. ✅ GraphQL library: **Pothos** (code-first, excellent Prisma integration)
2. ✅ All apps use Next.js (web, portal, admin)
3. ✅ NextAuth.js v5 for authentication
4. ✅ MVP scope: Defer church donations, blogs, series, user tracking
5. ✅ Admin handoff: Contact platform admin for ownership transfer
6. ✅ No public API for MVP
7. ✅ Churches marked as closed by admin manually
8. ✅ Donation minimum: ¥100
9. ✅ Location data: Admin pre-seeds all Japan prefectures/cities
10. ✅ Soft delete for churches (isDeleted flag)

---

## Implementation Approach

**Next Steps:**
1. Create comprehensive implementation plan using `/superpowers:write-plan`
2. Set up Turborepo monorepo structure
3. Initialize Prisma database with seed data (prefectures, cities, languages)
4. Build core church profile page (public view)
5. Build church portal (content management)
6. Build admin dashboard
7. Implement authentication and authorization
8. Add review system with moderation
9. Integrate Stripe for platform donations
10. Deploy to Render
11. Beta testing with 10-20 churches
12. Public launch

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Status:** Ready for Implementation Planning
