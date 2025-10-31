# ChurchConnect Japan

A cross-denominational church directory platform for Japan, helping people discover and connect with churches across the country.

## Overview

ChurchConnect Japan is a comprehensive platform that provides:

- **Public Directory**: Browse churches by location, denomination, and language
- **Church Profiles**: Detailed information about each church including services, staff, events, and sermons
- **Church Portal**: Self-service content management for church administrators
- **Admin Dashboard**: Platform management and verification tools
- **Platform Donations**: Support the platform through Stripe-powered donations
- **Reviews**: Community feedback and church responses

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **API**: GraphQL with Pothos (code-first schema)
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe Checkout
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Render (or Vercel)

## Project Structure

```
churchconnect/
├── apps/
│   ├── web/              # Public website (Next.js)
│   ├── church-portal/    # Church admin portal (Next.js)
│   ├── admin/            # Platform admin dashboard (Next.js)
│   └── api/              # GraphQL API (Express + Apollo Server)
├── packages/
│   ├── database/         # Prisma schema and client
│   ├── graphql/          # Pothos GraphQL schema
│   ├── auth/             # NextAuth.js configuration
│   ├── ui/               # Shared UI components (shadcn/ui)
│   ├── typescript-config/# Shared TypeScript configs
│   ├── eslint-config/    # Shared ESLint configs
│   └── tailwind-config/  # Shared Tailwind configs
└── docs/
    └── plans/            # Implementation plans
```

## Quick Start

### Prerequisites

- Node.js 20+ (check with `node --version`)
- pnpm 8.15.0+ (install with `npm install -g pnpm`)
- PostgreSQL 14+ (local or remote)
- Stripe account (for donations feature)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ChurchConnect
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/churchconnect"
NEXTAUTH_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Also copy env files for each app:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/church-portal/.env.example apps/church-portal/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

4. **Set up the database**

Generate Prisma client:

```bash
cd packages/database
pnpm db:generate
```

Push schema to database:

```bash
pnpm db:push
```

Seed initial data (prefectures, cities, languages, denominations):

```bash
pnpm db:seed
```

5. **Start development servers**

From the root directory:

```bash
pnpm dev
```

This will start all apps concurrently:

- Web app: http://localhost:3000
- Church Portal: http://localhost:3002
- Admin Dashboard: http://localhost:3003
- GraphQL API: http://localhost:3001/graphql

## Available Scripts

From the root directory:

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts
- `pnpm format` - Format code with Prettier

## Database Management

From `packages/database`:

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Prisma Studio (database GUI)
- `pnpm db:migrate` - Create and run migrations
- `pnpm db:seed` - Seed the database with initial data

## Apps

### Web App (`apps/web`)

Public-facing website where users can:
- Browse church directory
- View detailed church profiles
- Submit reviews
- Make platform donations
- Contact churches

**URL**: http://localhost:3000

### Church Portal (`apps/church-portal`)

Church administrators can:
- Manage church profile and content
- Upload photos
- Add/edit staff, sermons, events
- Respond to reviews
- Request verification

**URL**: http://localhost:3002

### Admin Dashboard (`apps/admin`)

Platform administrators can:
- Manage all churches
- Approve verification requests
- Moderate reviews
- Manage users
- View platform analytics

**URL**: http://localhost:3003

### GraphQL API (`apps/api`)

GraphQL API with:
- Type-safe schema (Pothos)
- Authentication context
- Role-based access control
- Optimized queries with DataLoader

**URL**: http://localhost:3001/graphql

## Authentication

The platform uses NextAuth.js v5 with three user roles:

- **USER**: Can browse directory, submit reviews, make donations
- **CHURCH_ADMIN**: Can manage one church's content
- **ADMIN**: Platform administrator with full access

## Payments

Platform donations are processed through Stripe Checkout:

- One-time donations
- Monthly recurring donations
- Preset amounts: ¥500, ¥1,000, ¥3,000, ¥5,000
- Custom amounts (minimum ¥100)
- Secure webhook handling

## Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Run `pnpm format` before committing

### Git Workflow

- Feature branches from `main`
- Descriptive commit messages
- Squash merge to main

### Adding Dependencies

Use workspace protocol for internal packages:

```bash
pnpm add @repo/database --filter @repo/graphql
```

For external dependencies:

```bash
pnpm add <package> --filter <app-or-package>
```

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Checklist

1. Set up PostgreSQL database (Render, Supabase, etc.)
2. Run migrations: `pnpm db:push` or `pnpm db:migrate`
3. Seed data: `pnpm db:seed`
4. Set environment variables in hosting platform
5. Deploy apps (Render, Vercel, etc.)
6. Configure Stripe webhooks with production URL
7. Test payment flow end-to-end

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random string for session encryption
- `NEXTAUTH_URL` - Base URL for authentication

### Optional Variables

- `STRIPE_SECRET_KEY` - For donations feature
- `STRIPE_PUBLISHABLE_KEY` - For donations feature
- `STRIPE_WEBHOOK_SECRET` - For webhook verification

## Database Schema

The platform uses the following main models:

- **Prefecture** - Japanese prefectures
- **City** - Cities within prefectures
- **Language** - Service languages
- **Denomination** - Church denominations
- **Church** - Core church data
- **ChurchProfile** - Extended church information
- **ChurchStaff** - Pastors and leaders
- **ServiceTime** - Service schedules
- **Event** - Church events
- **Sermon** - Sermon archive
- **Review** - User reviews
- **User** - Platform users
- **PlatformDonation** - Donation records

See `packages/database/prisma/schema.prisma` for full schema.

## License

MIT

## Support

For questions or issues:
- Create an issue in GitHub
- Email: support@churchconnect.jp

---

Built with [Claude Code](https://claude.com/claude-code)
