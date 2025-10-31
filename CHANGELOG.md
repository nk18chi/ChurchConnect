# Changelog

All notable changes to ChurchConnect Japan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In Progress
- Production deployment preparation
- User acceptance testing
- Performance optimization
- Initial church onboarding

---

## [0.1.0] - 2025-10-31 - MVP Complete

### Overview
Complete MVP implementation with all core features for public launch.

### Added - Applications

**Public Web App (`apps/web`)**
- Church directory with search and filtering
- Detailed church profile pages with 10 content sections
- User authentication (registration and login)
- Review submission system
- Platform donation system (Stripe Checkout)
- Contact forms with reCAPTCHA protection
- Responsive design for mobile and desktop

**Church Portal (`apps/church-portal`)**
- Church admin authentication and authorization
- Complete profile management interface
- Photo gallery management with Cloudinary upload
- Staff/pastor profile management
- Event creation and management
- Sermon archive management
- Review response system
- Analytics dashboard (profile views)
- Verification request system

**Admin Dashboard (`apps/admin`)**
- Platform admin authentication
- Church management (CRUD operations)
- Church verification queue
- Review moderation system
- User management with role assignment
- Platform analytics and reporting
- System configuration

**GraphQL API (`apps/api`)**
- Apollo Server with Express
- Code-first schema with Pothos
- Authentication context integration
- Role-based access control
- Optimized queries with Prisma

### Added - Core Features

**Authentication & Authorization**
- NextAuth.js v5 implementation
- Email/password authentication
- Role-based access control (USER, CHURCH_ADMIN, ADMIN)
- Session management with HTTP-only cookies
- Protected routes and API endpoints

**Church Profiles (10 Content Sections)**
1. About - Who We Are, Our Vision, Statement of Faith, Our Story
2. Worship - Service times, languages, worship style
3. Leadership - Staff profiles with photos and bios
4. Events - Upcoming events calendar
5. Sermons - Sermon archive with YouTube/podcast links
6. Photos - Church photo gallery with categories
7. Give - Donation information and instructions
8. Connect - Contact form with church info
9. Reviews - Community reviews and ratings
10. Analytics - Profile views and engagement metrics

**Search & Discovery**
- PostgreSQL full-text search implementation
- Search across churches, sermons, and events
- Filter by prefecture, city, denomination, language
- Sort by relevance, verification status, completeness
- Auto-updating search vectors via database triggers

**Review System**
- User review submission
- Three-status moderation (PENDING, APPROVED, REJECTED)
- Church response capability
- Email notifications for reviews and responses
- Flag inappropriate content

**Platform Donations**
- Stripe Checkout integration
- One-time donations (¥500, ¥1,000, ¥3,000, ¥5,000, custom)
- Monthly recurring donations
- Secure webhook handling
- Donation receipts via email
- Donation history tracking

**Email Notifications**
- Resend integration for transactional emails
- Contact form notifications
- Review notifications (to church and admin)
- Verification status notifications
- Donation receipts
- HTML email templates

**Image Management**
- Cloudinary integration for storage and CDN
- Server-side signed uploads for security
- Automatic image optimization
- Photo categorization (Worship, Fellowship, Ministry, etc.)
- Unlimited photo uploads per church

**Spam Prevention**
- Google reCAPTCHA v3 integration
- Score-based validation (threshold: 0.5)
- Rate limiting on contact forms (5 requests/hour per IP)
- Invisible reCAPTCHA for better UX

### Added - Database

**Schema Implementation**
- Complete Prisma schema with 20+ models
- Full-text search with tsvector columns
- Automatic search vector updates via triggers
- Comprehensive indexes for performance
- Foreign key constraints
- Unique constraints

**Reference Data**
- 47 Japanese prefectures
- 500+ major cities
- 8+ service languages
- 12+ denominations

**Migrations**
- Initial schema migration
- Full-text search migration
- Search triggers migration
- Analytics tables migration

**Seed Scripts**
- Reference data seeding (prefectures, cities, languages, denominations)
- Idempotent seed operations (upsert)

### Added - Infrastructure

**Monorepo Setup**
- Turborepo configuration
- pnpm workspace setup
- Shared packages architecture
- Build optimization with caching

**Development Tools**
- TypeScript 5.4 with strict mode
- ESLint configuration
- Prettier formatting
- Prisma Studio for database GUI

**Deployment Preparation**
- Database backup scripts
- Database restore scripts
- Health check script
- Pre-deployment check script
- Environment configuration templates

**Monitoring**
- Sentry error tracking setup
- Error filtering and sanitization
- Performance monitoring (10% sample rate)
- Environment-specific configuration

### Added - Documentation

**Developer Documentation**
- Comprehensive README with quick start
- Development guide with complete setup instructions
- Architecture documentation with diagrams
- Environment setup guide
- Deployment guide
- Testing guide with critical paths
- Operations guide for daily maintenance
- Troubleshooting guide
- Database backup guide
- Monitoring guide
- Security best practices

**User Guides**
- Church admin guide (complete church management)
- Platform admin guide (moderation and management)
- User guide (browsing and reviews)

**Contributing**
- Contributing guidelines
- Code of conduct
- Coding standards
- Commit conventions
- Pull request process

**Changelog**
- Version history
- Feature tracking
- Breaking changes documentation

### Security

**Authentication Security**
- Bcrypt password hashing (10 rounds)
- HTTP-only session cookies
- CSRF protection via NextAuth.js
- Session expiration (30 days)

**API Security**
- Role-based access control on all mutations
- Resource ownership validation
- Input validation with Zod
- SQL injection prevention (Prisma parameterized queries)

**Third-Party Security**
- Server-side signed Cloudinary uploads
- Stripe webhook signature validation
- reCAPTCHA validation
- Secure environment variable handling

**Data Protection**
- No credit card storage (handled by Stripe)
- Password hashing (never plain text)
- Secure database connections (SSL)
- HTTPS enforcement (production)

### Performance

**Database Optimization**
- Indexes on all foreign keys
- GIN index for full-text search
- Composite indexes for common queries
- Connection pooling support

**Frontend Optimization**
- Next.js Server Components (reduced client JS)
- Automatic code splitting
- Image optimization with next/image
- Cloudinary CDN for images

**API Optimization**
- Efficient Prisma queries with includes
- Pagination for large data sets
- Select only needed fields

### Dependencies

**Core**
- Next.js 14.x
- React 18.x
- TypeScript 5.4.x
- Node.js 20+ required

**Database**
- Prisma 5.x
- PostgreSQL 14+
- @prisma/client

**GraphQL**
- Apollo Server 4.x
- @pothos/core
- @pothos/plugin-prisma

**Authentication**
- NextAuth.js 5.x (beta)
- bcrypt

**Payments**
- Stripe 14.x

**Email**
- Resend 3.x

**Image Upload**
- Cloudinary SDK

**UI**
- Tailwind CSS 3.4.x
- shadcn/ui components
- Lucide icons

**Monitoring**
- @sentry/nextjs

**Build Tools**
- Turborepo 1.x
- pnpm 8.15.x

### Known Issues

- Search relevance ranking needs tuning
- Mobile navigation could be improved
- No automated tests yet (manual testing only)
- Limited analytics (only profile views)

---

## [1.0.0] - TBD - Public Launch

### Planned

**Launch Requirements**
- Production deployment on Render
- Custom domain configuration (churchconnect.jp)
- SSL certificates
- Initial 50 churches onboarded
- All church profiles verified
- Performance testing completed
- Security audit completed

**Monitoring**
- Sentry error tracking active
- Database monitoring configured
- Uptime monitoring
- Performance metrics tracking

**Operations**
- Backup automation configured
- Incident response procedures documented
- On-call rotation established (if applicable)

---

## Future Versions

### [2.0.0] - Church Donations

**Church-Specific Donations**
- Stripe Connect integration
- Individual church payment processing
- Monthly giving management
- Donation analytics per church
- Donation campaign features
- Church financial reporting

**Features:**
- Church admins can configure Stripe Connect
- Donors can give directly to specific churches
- Automatic receipt generation
- Donation tracking and reporting
- Recurring donation management
- Campaign goal tracking

### [2.1.0] - Enhanced Content

**Blog Posts**
- Church blog functionality
- Rich text editor
- Categories and tags
- Comments (moderated)
- RSS feed

**Sermon Enhancements**
- Sermon series grouping
- Direct video hosting (alternative to YouTube)
- Sermon notes and slides
- Audio-only sermons
- Downloadable content

**Photo Enhancements**
- Album organization
- Bulk upload (multiple files)
- Photo captions and descriptions
- Automatic tagging
- Social sharing

### [2.2.0] - User Features

**User Engagement**
- User sermon logs (track sermons watched)
- Church visit history
- Favorite churches
- Church subscriptions
- Personalized church recommendations
- User profile customization

**Notifications**
- Email notifications for followed churches
- Event reminders
- New sermon alerts
- Weekly digest emails
- Push notifications (when mobile app available)

### [2.3.0] - Mobile Applications

**iOS & Android Apps**
- React Native implementation
- Native navigation
- Offline support
- Push notifications
- Location-based church discovery
- In-app donations
- Sermon downloads
- Event calendar integration

### [3.0.0] - International Expansion

**Multi-Language Support**
- Korean language interface
- Chinese language interface
- Multi-language content management
- Language-specific search

**Country Expansion**
- Expand to South Korea
- Expand to China (if feasible)
- Expand to other Asian countries
- Country-specific features
- Multi-currency support
- Localized payment methods

**Features:**
- Country selection
- Location-based defaults
- International phone number support
- Time zone handling
- Regional denomination lists

---

## Version History Summary

| Version | Date       | Description                  |
|---------|------------|------------------------------|
| 0.1.0   | 2025-10-31 | MVP Complete                |
| 1.0.0   | TBD        | Public Launch (Planned)     |
| 2.0.0   | TBD        | Church Donations (Planned)  |
| 2.1.0   | TBD        | Enhanced Content (Planned)  |
| 2.2.0   | TBD        | User Features (Planned)     |
| 2.3.0   | TBD        | Mobile Apps (Planned)       |
| 3.0.0   | TBD        | International (Planned)     |

---

## Notes

### Versioning Strategy

- **Major versions (X.0.0)**: Breaking changes or significant new features
- **Minor versions (0.X.0)**: New features, backwards compatible
- **Patch versions (0.0.X)**: Bug fixes, backwards compatible

### Release Process

1. Complete all features for version
2. Update CHANGELOG.md
3. Test thoroughly (manual + automated)
4. Create release branch
5. Tag release
6. Deploy to production
7. Monitor for issues
8. Announce release

### Migration Strategy

When database schema changes:
1. Create Prisma migration
2. Test migration on dev database
3. Test rollback procedure
4. Document breaking changes
5. Create backup before production migration
6. Apply migration during maintenance window
7. Verify migration success

---

For detailed commit history, see [GitHub Commits](https://github.com/yourusername/churchconnect/commits/main).

For current development status, see [GitHub Projects](https://github.com/yourusername/churchconnect/projects).
