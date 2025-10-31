# Deployment Guide

This guide covers deploying ChurchConnect Japan to production.

## Table of Contents

- [Overview](#overview)
- [Deployment Scripts](#deployment-scripts)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
- [Render Deployment](#render-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)

## Overview

The ChurchConnect platform consists of 4 deployable apps:

1. **Web App** (`apps/web`) - Public website
2. **Church Portal** (`apps/church-portal`) - Church admin interface
3. **Admin Dashboard** (`apps/admin`) - Platform admin interface
4. **GraphQL API** (`apps/api`) - API server

## Deployment Scripts

The repository includes several deployment scripts to help with the deployment process:

### Pre-Deployment Script

Run before deploying to verify everything is ready:

```bash
./scripts/pre-deploy.sh
```

**What it checks:**
- TypeScript type checking across all apps
- Environment variables are set
- Database connection works
- Migration status
- Production build succeeds

### Deployment Script

Run to build and prepare all apps for deployment:

```bash
./scripts/deploy.sh
```

**What it does:**
- Installs dependencies with frozen lockfile
- Generates Prisma client
- Runs database migrations
- Builds all apps
- Verifies deployment readiness

### Post-Deployment Verification Script

Run after deployment to verify everything is working:

```bash
./scripts/verify-deployment.sh
```

**What it checks:**
- All apps are accessible
- Database connection works
- GraphQL API responds correctly
- Critical API endpoints work

### Additional Scripts

**Health Check** (for monitoring):
```bash
./scripts/health-check.sh
```

**Deployment Check** (alternative pre-deployment check):
```bash
./scripts/deploy-check.sh
```

## Prerequisites

Before deploying, ensure you have:

- [ ] Production PostgreSQL database
- [ ] Stripe production account and API keys
- [ ] Domain names (optional but recommended)
- [ ] Git repository (GitHub, GitLab, etc.)
- [ ] Hosting platform account (Render, Vercel, etc.)

## Pre-Deployment Checklist

Run the pre-deployment check script before deploying:

```bash
./scripts/deploy-check.sh
```

This script verifies:
- [ ] Node.js version >=20
- [ ] pnpm installed
- [ ] All required environment variables set
- [ ] Database connection works
- [ ] All migrations applied
- [ ] TypeScript type check passes
- [ ] Production build succeeds

**Important:** All checks must pass before proceeding with deployment.

### Manual Pre-Deployment Tasks

Additional tasks to complete before deploying:

- [ ] Review recent commits for any issues
- [ ] Create database backup
- [ ] Update CHANGELOG.md with new version
- [ ] Test critical paths on staging (see docs/CRITICAL_PATHS.md)
- [ ] Verify all third-party services are configured:
  - [ ] Cloudinary credentials
  - [ ] Resend API key and domain
  - [ ] reCAPTCHA site keys
  - [ ] Stripe production keys
- [ ] Review security checklist (see Security Checklist section below)

## Database Setup

### Option 1: Render PostgreSQL (Recommended)

1. **Create PostgreSQL Database**
   - Go to https://render.com/
   - Click "New" → "PostgreSQL"
   - Choose a name: `churchconnect-db`
   - Select region (closest to your users)
   - Choose plan (Free tier available)
   - Click "Create Database"

2. **Get Connection String**
   - Copy "Internal Database URL" for production
   - Format: `postgresql://user:password@host:port/database`

3. **Connect to Database**
   ```bash
   # Install PostgreSQL client
   brew install postgresql  # macOS

   # Connect
   psql "postgresql://user:password@host:port/database"
   ```

### Option 2: Supabase

1. Create project at https://supabase.com/
2. Get connection string from Settings → Database
3. Use "Connection pooling" URL for production

### Option 3: Neon

1. Create project at https://neon.tech/
2. Copy connection string
3. Enable connection pooling

## Environment Variables

### Production Environment Variables

Create a `.env.production` file (DO NOT COMMIT):

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# NextAuth.js
NEXTAUTH_URL="https://churchconnect.jp"
NEXTAUTH_SECRET="<generate-new-secret-for-production>"

# For multi-app setup
NEXTAUTH_URL_WEB="https://churchconnect.jp"
NEXTAUTH_URL_PORTAL="https://portal.churchconnect.jp"
NEXTAUTH_URL_ADMIN="https://admin.churchconnect.jp"

# Stripe (Production Keys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URLs
NEXT_PUBLIC_WEB_URL="https://churchconnect.jp"
NEXT_PUBLIC_API_URL="https://api.churchconnect.jp"

# Node Environment
NODE_ENV="production"
```

### Generate Production Secrets

```bash
# NextAuth Secret
openssl rand -base64 32

# Generate a new one for production, different from development
```

### Stripe Production Setup

1. **Switch to Production Mode**
   - Go to Stripe Dashboard
   - Toggle "Test mode" to "Production"

2. **Get Production API Keys**
   - Developers → API keys
   - Copy "Secret key" and "Publishable key"

3. **Set Up Webhooks**
   - Developers → Webhooks
   - Add endpoint: `https://churchconnect.jp/api/stripe/webhooks`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy "Signing secret" (starts with `whsec_`)

## Deployment Options

### Option A: Render (Recommended for Full Stack)

Best for deploying all apps including the API server.

### Option B: Vercel (Recommended for Next.js Apps)

Best for Next.js apps (web, portal, admin). You'll need separate hosting for the API.

### Option C: Railway, Fly.io, or other platforms

Similar process to Render.

## Render Deployment

### Option 1: Using render.yaml (Recommended)

The repository includes a `render.yaml` file that defines all services and their configurations.

**Step 1: Connect Repository to Render**

1. Go to https://render.com/
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`

**Step 2: Configure Environment Variables**

Before deploying, you'll need to set environment variables in the Render dashboard. The `render.yaml` file references these variables but doesn't include their values for security.

Required environment variables (set for each service):
- `NEXTAUTH_URL` - Your app URL (e.g., https://churchconnect.jp)
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_WEB_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PORTAL_URL`
- `NEXT_PUBLIC_ADMIN_URL`
- `NEXT_PUBLIC_GRAPHQL_URL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SENTRY_DSN` (optional)

**Step 3: Deploy**

1. Click "Apply" to create all services
2. Render will create:
   - PostgreSQL database
   - 4 web services (web, church-portal, admin, api)
3. Wait for deployment to complete
4. Run database migrations (see Step 6 in manual deployment)

### Option 2: Manual Deployment

### Step 1: Push Code to Git

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### Step 2: Deploy API App

1. **Create Web Service**
   - Go to Render Dashboard
   - New → Web Service
   - Connect your repository
   - Settings:
     - **Name**: `churchconnect-api`
     - **Root Directory**: `apps/api`
     - **Environment**: `Node`
     - **Build Command**: `cd ../.. && pnpm install && pnpm --filter api build`
     - **Start Command**: `pnpm start`
     - **Plan**: Free (or Starter)

2. **Environment Variables**
   Add all variables from `.env.production`:
   - `DATABASE_URL`
   - `NODE_ENV=production`

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the URL: `https://churchconnect-api.onrender.com`

### Step 3: Deploy Web App

1. **Create Web Service**
   - New → Web Service
   - Connect repository
   - Settings:
     - **Name**: `churchconnect-web`
     - **Root Directory**: `apps/web`
     - **Environment**: `Node`
     - **Build Command**: `cd ../.. && pnpm install && pnpm --filter web build`
     - **Start Command**: `cd apps/web && pnpm start`

2. **Environment Variables**
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_WEB_URL`
   - `NEXT_PUBLIC_API_URL` (use API URL from Step 2)
   - `NODE_ENV=production`

3. **Deploy**

### Step 4: Deploy Church Portal

1. **Create Web Service**
   - Settings:
     - **Name**: `churchconnect-portal`
     - **Root Directory**: `apps/church-portal`
     - **Build Command**: `cd ../.. && pnpm install && pnpm --filter church-portal build`
     - **Start Command**: `cd apps/church-portal && pnpm start`

2. **Environment Variables** (same as Web App)

3. **Deploy**

### Step 5: Deploy Admin Dashboard

1. **Create Web Service**
   - Settings:
     - **Name**: `churchconnect-admin`
     - **Root Directory**: `apps/admin`
     - **Build Command**: `cd ../.. && pnpm install && pnpm --filter admin build`
     - **Start Command**: `cd apps/admin && pnpm start`

2. **Environment Variables** (same as Web App)

3. **Deploy**

### Step 6: Run Database Migrations

1. **Connect to Database**
   ```bash
   psql "postgresql://user:password@host:port/database"
   ```

2. **Run from Local Machine**
   ```bash
   # Set production DATABASE_URL temporarily
   export DATABASE_URL="postgresql://user:password@host:port/database"

   # Run migrations
   cd packages/database
   pnpm db:push

   # Seed data
   pnpm db:seed
   ```

   **Alternative: Use Render Shell**
   - Go to API service → Shell
   - Run:
     ```bash
     cd packages/database
     pnpm db:push
     pnpm db:seed
     ```

### Step 7: Configure Custom Domains (Optional)

1. **Add Custom Domain**
   - Go to each service → Settings → Custom Domain
   - Add domain:
     - Web: `churchconnect.jp`
     - Portal: `portal.churchconnect.jp`
     - Admin: `admin.churchconnect.jp`
     - API: `api.churchconnect.jp`

2. **Update DNS Records**
   - Add CNAME records pointing to Render URLs
   - Wait for DNS propagation (up to 48 hours)

3. **Update Environment Variables**
   - Update `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_API_URL`, etc.
   - Redeploy services

4. **Update Stripe Webhooks**
   - Update webhook URL to `https://churchconnect.jp/api/stripe/webhooks`

## Vercel Deployment

### Step 1: Deploy Web App

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd apps/web
   vercel
   ```

3. **Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all production variables

4. **Deploy Production**
   ```bash
   vercel --prod
   ```

### Step 2: Deploy Portal and Admin

Repeat Step 1 for `apps/church-portal` and `apps/admin`.

### Step 3: Deploy API

For the API, use Render or Railway (Vercel doesn't support long-running processes well).

## Post-Deployment

### Step 1: Run Health Check

After deployment, run the health check script:

```bash
./scripts/health-check.sh
```

This script verifies that all apps are accessible and returning expected status codes.

### Step 2: Verify Deployments

Test each app manually:

- [ ] Web app loads: https://churchconnect.jp
- [ ] Church portal loads: https://portal.churchconnect.jp
- [ ] Admin dashboard loads: https://admin.churchconnect.jp
- [ ] GraphQL API works: https://api.churchconnect.jp/graphql

### Step 3: Test Critical Flows

Run through all critical paths (see docs/CRITICAL_PATHS.md for details):

**Critical Path 1: User Can Discover Churches**
- [ ] Search for churches
- [ ] Filter by prefecture
- [ ] View church profile
- [ ] Navigate through all tabs

**Critical Path 2: User Can Submit Review**
- [ ] Create user account / login
- [ ] Submit a review
- [ ] Receive confirmation email

**Critical Path 3: Church Admin Can Manage Profile**
- [ ] Login as church admin
- [ ] Update church profile
- [ ] Upload photos
- [ ] Add staff member
- [ ] Verify changes appear on public profile

**Critical Path 4: Platform Admin Can Moderate**
- [ ] Login as platform admin
- [ ] View pending reviews
- [ ] Approve/reject review
- [ ] Verify emails sent

**Critical Path 5: Platform Donations Work**
- [ ] Visit /donate page
- [ ] Complete Stripe Checkout (use test card in test mode: 4242 4242 4242 4242)
- [ ] Verify donation recorded
- [ ] Receive receipt email

**Critical Path 6: Contact Form Works**
- [ ] Fill out contact form
- [ ] Submit with reCAPTCHA validation
- [ ] Verify email received

### Step 4: Verify Third-Party Integrations

**Cloudinary (Image Upload):**
- [ ] Upload image in church portal
- [ ] Verify image appears in gallery
- [ ] Check image is properly optimized

**Resend (Email Delivery):**
- [ ] Test contact form submission
- [ ] Test review notification
- [ ] Test donation receipt
- [ ] Check Resend dashboard for delivery status

**Stripe (Payments):**
- [ ] Test donation checkout
- [ ] Verify webhook receives events
- [ ] Check donation in Stripe dashboard
- [ ] Verify donation recorded in database

**reCAPTCHA (Spam Protection):**
- [ ] Submit contact form
- [ ] Verify reCAPTCHA validation works
- [ ] Check reCAPTCHA dashboard for requests

### Step 5: Monitor for Errors

Check logs in hosting platform for the first 24 hours:
- Render: Service → Logs
- Vercel: Project → Deployments → Logs

Watch for:
- [ ] 500 errors
- [ ] Failed API requests
- [ ] Database connection errors
- [ ] Webhook failures
- [ ] Email delivery failures

**Note:** Consider setting up Sentry for error tracking (see docs/MONITORING.md)

### Step 6: Set Up Production Admin User

```bash
# Connect to production database
psql "postgresql://user:password@host:port/database"

# Create admin user
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@churchconnect.jp',
  'Admin',
  -- Hash password with bcrypt (you'll need to generate this separately)
  '$2a$10$...',
  'ADMIN',
  NOW(),
  NOW()
);
```

**To hash password:**

```javascript
// Run in Node.js
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('your-secure-password', 10);
console.log(hash);
```

## Monitoring

### Application Monitoring

**Render:**
- Built-in metrics (CPU, Memory, Response time)
- Service → Metrics

**Vercel:**
- Analytics (included in Pro plan)
- Project → Analytics

**Third-party options:**
- Sentry (error tracking)
- LogRocket (session replay)
- DataDog (full-stack monitoring)

### Database Monitoring

**Render PostgreSQL:**
- Dashboard shows connections, storage
- Set up alerts for high usage

**Supabase:**
- Database → Reports
- Real-time monitoring

### Uptime Monitoring

Free options:
- UptimeRobot: https://uptimerobot.com/
- Pingdom (free tier): https://www.pingdom.com/
- Better Uptime: https://betteruptime.com/

### Performance Monitoring

- **Lighthouse CI**: Automated performance testing
- **Web Vitals**: Monitor Core Web Vitals
- **Vercel Analytics**: Real user monitoring

## Backup Strategy

### Database Backups

**Render:**
- Automatic daily backups (included)
- Manual backups: Dashboard → Backups

**Manual Backup:**
```bash
pg_dump "postgresql://user:password@host:port/database" > backup.sql
```

**Restore:**
```bash
psql "postgresql://user:password@host:port/database" < backup.sql
```

### Code Backups

- Keep code in Git repository
- Use tags for releases:
  ```bash
  git tag -a v1.0.0 -m "Release v1.0.0"
  git push origin v1.0.0
  ```

## Rollback Strategy

### Render Rollback

1. Go to Service → Deployments
2. Find previous successful deployment
3. Click "Redeploy"

### Vercel Rollback

1. Go to Project → Deployments
2. Find previous deployment
3. Click "⋯" → Promote to Production

### Database Rollback

```bash
# Restore from backup
psql "postgresql://user:password@host:port/database" < backup.sql
```

## Security Checklist

Before going live:

- [ ] All secrets are in environment variables (not in code)
- [ ] `NEXTAUTH_SECRET` is production-only (different from dev)
- [ ] Stripe production keys (not test keys)
- [ ] PostgreSQL uses SSL connection
- [ ] Rate limiting enabled on API
- [ ] CORS configured properly
- [ ] CSP headers set
- [ ] HTTPS enabled on all domains
- [ ] Webhook signatures verified
- [ ] User input sanitized
- [ ] SQL injection protected (Prisma handles this)
- [ ] XSS protection enabled

## Cost Estimation

### Render (Full Stack Hosting)

**Free Tier:**
- Web Services: $0 (with limitations)
- PostgreSQL: $0 (90 days, then $7/month)

**Starter ($7/month per service):**
- 4 services × $7 = $28/month
- PostgreSQL: $7/month
- **Total: ~$35/month**

### Vercel + Render

**Vercel:**
- Hobby: Free (non-commercial)
- Pro: $20/month per user

**Render (API + Database):**
- API service: $7/month
- PostgreSQL: $7/month
- **Total: $14-34/month**

### Other Costs

- Domain: $10-15/year
- Stripe fees: 3.6% + ¥15 per transaction
- Image storage (Cloudinary): Free tier or $0/month

## Troubleshooting

### Build Fails

**Issue**: "Module not found" errors

**Solution**:
```bash
# Make sure build command includes pnpm install from root
cd ../.. && pnpm install && pnpm --filter <app> build
```

### Database Connection Fails

**Issue**: "Cannot connect to database"

**Solutions**:
1. Check `DATABASE_URL` is correct
2. Ensure database allows connections from your hosting IP
3. Use "Internal Database URL" for Render services
4. Enable SSL: Add `?sslmode=require` to connection string

### Environment Variables Not Loading

**Issue**: Variables work locally but not in production

**Solutions**:
1. Make sure they're set in hosting platform
2. Restart service after adding variables
3. For Next.js, `NEXT_PUBLIC_*` variables must be set at build time

### Stripe Webhooks Fail

**Issue**: Webhooks return 400 or 500

**Solutions**:
1. Verify webhook secret is correct
2. Check webhook URL is correct
3. Test with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed --api-key sk_live_...
   ```
4. Check service logs for errors

### Images Not Loading

**Issue**: Images work locally but not in production

**Solutions**:
1. Check image URLs are absolute (not relative)
2. Configure Next.js Image domains in `next.config.js`
3. Verify image storage (Cloudinary) is configured

## Support

For deployment issues:
- Check hosting platform documentation
- Review service logs
- Create issue on GitHub
- Contact support@churchconnect.jp

---

**Congratulations on deploying ChurchConnect Japan!**
