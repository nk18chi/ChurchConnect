# ChurchConnect Japan

> A cross-denominational church directory platform connecting Christians with churches across Japan.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748)](https://www.prisma.io/)

## Overview

ChurchConnect Japan helps Christians discover churches, read authentic community reviews, and connect with church communities across Japan. Each church gets a beautiful, feature-rich profile page with comprehensive content management capabilities.

**Live Site:** [churchconnect.jp](https://churchconnect.jp) *(Coming Soon)*

## Features

### For Church Seekers
- **Search & Filter** - Find churches by location, denomination, language, worship style
- **Rich Profiles** - View detailed church information, sermons, events, staff
- **Community Reviews** - Read authentic reviews from community members
- **Interactive Map** - Discover churches near you
- **Direct Contact** - Connect with churches through contact forms

### For Church Leaders
- **Profile Management** - Complete control over your church's online presence
- **Photo Gallery** - Showcase your community with unlimited photos
- **Staff Profiles** - Introduce your leadership team
- **Events Calendar** - Promote upcoming events
- **Sermon Archive** - Share sermons with links to YouTube/podcasts
- **Analytics Dashboard** - Track profile views and engagement
- **Review Management** - Respond to community reviews

### For Platform Supporters
- **Platform Donations** - Support this free resource with one-time or monthly giving via Stripe
- **Verified Badge** - Verified churches get priority in search results

## Tech Stack

**Frontend:**
- [Next.js 14](https://nextjs.org/) (App Router) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

**Backend:**
- [PostgreSQL](https://www.postgresql.org/) - Database with full-text search
- [Prisma](https://www.prisma.io/) - ORM and type-safe database client
- [GraphQL](https://graphql.org/) with [Pothos](https://pothos-graphql.dev/) - Type-safe API
- [Apollo Server](https://www.apollographql.com/) - GraphQL server

**Authentication & Payments:**
- [NextAuth.js v5](https://next-auth.js.org/) - Authentication with role-based access control
- [Stripe](https://stripe.com/) - Payment processing for donations

**Infrastructure:**
- [Render](https://render.com/) - Hosting and PostgreSQL database
- [Cloudinary](https://cloudinary.com/) - Image storage & CDN
- [Resend](https://resend.com/) - Transactional email delivery
- [Sentry](https://sentry.io/) - Error tracking and monitoring

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
│   ├── auth/             # NextAuth.js configuration
│   ├── ui/               # Shared UI components
│   ├── cloudinary/       # Image upload utilities
│   ├── email/            # Email templates & sending
│   ├── monitoring/       # Sentry error tracking
│   ├── typescript-config/# Shared TypeScript configs
│   ├── eslint-config/    # Shared ESLint configs
│   └── tailwind-config/  # Shared Tailwind configs
├── docs/                 # Documentation
│   ├── guides/           # User guides
│   └── plans/            # Implementation plans
└── scripts/              # Utility scripts
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8.15.0+
- Docker Desktop (for local PostgreSQL database)

### Installation (< 10 minutes)

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

   Copy the example environment files:
   ```bash
   # API environment
   cp apps/api/.env.example apps/api/.env

   # Database already has .env configured
   # Other apps use .env.local (already set up)
   ```

   The default `.env` files are pre-configured for local development. You only need to add:
   ```bash
   # Generate a secret for NextAuth
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> apps/web/.env.local
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> apps/church-portal/.env.local
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> apps/admin/.env.local
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> apps/api/.env
   ```

4. **Start everything (database + all apps)**
   ```bash
   pnpm dev
   ```

   This single command will:
   - Start PostgreSQL database (via Docker)
   - Wait for database to be ready
   - Push Prisma schema to database
   - Seed reference data
   - Start all 4 applications

**Apps will be available at:**
- Web: http://localhost:3000
- API: http://localhost:4000/graphql (Apollo Studio)
- Church Portal: http://localhost:3001
- Admin: http://localhost:3002

**First time setup:**
After running `pnpm dev`, run the database migrations and seed:
```bash
pnpm db:push
pnpm db:seed
```

## Documentation

**Developer Documentation:**
- [Development Guide](docs/DEVELOPMENT.md) - Complete development setup and workflow
- [Architecture Documentation](docs/ARCHITECTURE.md) - System design and architecture
- [Environment Setup](docs/ENVIRONMENT_SETUP.md) - Environment variables configuration
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Testing Guide](docs/TESTING.md) - Testing procedures and critical paths
- [Operations Guide](docs/OPERATIONS.md) - Daily operations and maintenance
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Database Backup](docs/DATABASE_BACKUP.md) - Backup and restore procedures
- [Monitoring](docs/MONITORING.md) - Monitoring and alerting setup
- [Security](docs/SECURITY.md) - Security best practices
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project

**User Guides:**
- [Church Admin Guide](docs/guides/CHURCH_ADMIN_GUIDE.md) - For church administrators
- [Platform Admin Guide](docs/guides/PLATFORM_ADMIN_GUIDE.md) - For platform administrators
- [User Guide](docs/guides/USER_GUIDE.md) - For general users

**App-Specific:**
- [Web App README](apps/web/README.md)
- [Church Portal README](apps/church-portal/README.md)
- [Admin Dashboard README](apps/admin/README.md)
- [GraphQL API README](apps/api/README.md)

## Scripts

```bash
# Development
pnpm dev          # Start database + all apps (recommended)
pnpm dev:no-db    # Start apps only (database already running)
pnpm build        # Build all apps for production
pnpm lint         # Lint all packages
pnpm type-check   # Run TypeScript type checking
pnpm clean        # Clean build artifacts
pnpm format       # Format code with Prettier

# Database Management
pnpm db:start     # Start PostgreSQL database (Docker)
pnpm db:stop      # Stop PostgreSQL database
pnpm db:restart   # Restart PostgreSQL database
pnpm db:reset     # Reset database (delete data + recreate + seed)
pnpm db:push      # Push Prisma schema to database (dev)
pnpm db:seed      # Seed reference data (prefectures, cities, etc.)

# Database Operations (from packages/database)
cd packages/database
pnpm db:generate  # Generate Prisma Client
pnpm db:migrate   # Create new migration (prod)
pnpm db:studio    # Open Prisma Studio

# Deployment
./scripts/deploy-check.sh   # Pre-deployment checks
./scripts/health-check.sh   # Post-deployment health check
```

## Key Features

### Complete Church Profiles
- **About Sections**: Who We Are, Our Vision, Statement of Faith, Our Story
- **Worship**: Service times, languages, worship style
- **Leadership**: Staff/pastor profiles with photos and bios
- **Events**: Upcoming events calendar
- **Sermons**: Sermon archive with YouTube/podcast links
- **Photos**: Unlimited photo gallery with categories
- **Give**: Donation information and links
- **Connect**: Contact forms with reCAPTCHA protection

### Platform Features
- **Full-Text Search**: PostgreSQL full-text search for churches, sermons, and events
- **Review System**: User reviews with moderation and church responses
- **Authentication**: Role-based access control (USER, CHURCH_ADMIN, ADMIN)
- **Platform Donations**: One-time and recurring donations via Stripe
- **Email Notifications**: Automated emails for reviews, verifications, and donations
- **Image Upload**: Server-side signed uploads to Cloudinary
- **Analytics**: Profile views and engagement tracking
- **Verification**: Church verification with badge display

## Database Schema

Core models:
- **Prefecture** - Japanese prefectures (47)
- **City** - Cities within prefectures
- **Language** - Service languages
- **Denomination** - Church denominations
- **Church** - Core church data with full-text search
- **ChurchProfile** - Extended church information
- **ChurchStaff** - Pastors and leaders
- **ChurchSocial** - Social media links
- **ServiceTime** - Service schedules
- **Event** - Church events
- **Sermon** - Sermon archive
- **Photo** - Church photos
- **Review** - User reviews with moderation
- **ReviewResponse** - Church responses to reviews
- **User** - Platform users with role-based access
- **PlatformDonation** - Donation records
- **PlatformDonationSubscription** - Recurring donations

See `packages/database/prisma/schema.prisma` for full schema.

## Apps

### Web App (`apps/web`)
Public-facing website where users can browse churches, view profiles, submit reviews, and make donations.
- **URL**: http://localhost:3000
- **README**: [apps/web/README.md](apps/web/README.md)

### Church Portal (`apps/church-portal`)
Church administrators can manage their profile, photos, staff, events, sermons, and respond to reviews.
- **URL**: http://localhost:3002
- **README**: [apps/church-portal/README.md](apps/church-portal/README.md)

### Admin Dashboard (`apps/admin`)
Platform administrators can manage churches, verify churches, moderate reviews, and view analytics.
- **URL**: http://localhost:3003
- **README**: [apps/admin/README.md](apps/admin/README.md)

### GraphQL API (`apps/api`)
GraphQL API with type-safe schema, authentication, and role-based access control.
- **URL**: http://localhost:3001/graphql
- **README**: [apps/api/README.md](apps/api/README.md)

## Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

**Quick Deploy to Render:**

1. Create PostgreSQL database on Render
2. Create 4 web services (web, church-portal, admin, api)
3. Set environment variables for each service
4. Connect to GitHub repository (auto-deploy on push)
5. Run migrations: `npx prisma migrate deploy`
6. Configure custom domains
7. Set up Stripe webhooks
8. Configure Cloudinary, Resend, and reCAPTCHA

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick contribution steps:**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm type-check && pnpm lint`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Email**: support@churchconnect.jp
- **Issues**: [GitHub Issues](https://github.com/yourusername/churchconnect/issues)
- **Documentation**: [docs/](docs/)

## Roadmap

### Current Version (MVP)
- Church directory with search and filters
- Complete church profiles with 10 content sections
- User authentication and reviews
- Platform donations via Stripe
- Church and admin portals
- Full-text search

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

## Acknowledgments

- Design inspiration: [Coastal Church](https://coastalchurch.org)
- Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), and [Pothos GraphQL](https://pothos-graphql.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with love for the Christian community in Japan**
