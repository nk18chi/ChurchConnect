# Environment Variables Reference

Complete reference for all environment variables used in ChurchConnect Japan.

## Table of Contents

- [Overview](#overview)
- [Database](#database)
- [Authentication](#authentication)
- [Cloudinary (Image Storage)](#cloudinary-image-storage)
- [Resend (Email Service)](#resend-email-service)
- [Google reCAPTCHA](#google-recaptcha)
- [Stripe Payments](#stripe-payments)
- [Application URLs](#application-urls)
- [Monitoring (Sentry)](#monitoring-sentry)
- [Node Environment](#node-environment)
- [Setting Up Environment Files](#setting-up-environment-files)
- [Validation Script](#validation-script)
- [Security Best Practices](#security-best-practices)

## Overview

Environment variables are used to configure the application for different environments (development, staging, production). They contain sensitive information like API keys and should **never** be committed to version control.

## Database

### `DATABASE_URL`

**Required**: Yes
**Type**: String (PostgreSQL connection string)
**Used by**: All apps and packages

PostgreSQL database connection string.

**Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Examples**:

Development (local):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/churchconnect?schema=public"
```

Development (Docker):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/churchconnect?schema=public"
```

Production (Render):
```env
DATABASE_URL="postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/churchconnect_db?ssl=true"
```

Production (Supabase):
```env
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

**Important**:
- Use SSL in production: Add `?ssl=true` or `?sslmode=require`
- Use connection pooling URLs for production (if available)
- Keep credentials secure

## Authentication

### `NEXTAUTH_URL`

**Required**: Yes
**Type**: String (URL)
**Used by**: All Next.js apps

The canonical URL of your application. Used by NextAuth.js for callbacks.

**Examples**:

Development:
```env
NEXTAUTH_URL="http://localhost:3000"
```

Production (single domain):
```env
NEXTAUTH_URL="https://churchconnect.jp"
```

Production (multiple apps):
```env
NEXTAUTH_URL_WEB="https://churchconnect.jp"
NEXTAUTH_URL_PORTAL="https://portal.churchconnect.jp"
NEXTAUTH_URL_ADMIN="https://admin.churchconnect.jp"
```

**Important**:
- Must match the domain where the app is hosted
- Include protocol (`http://` or `https://`)
- No trailing slash
- For multiple apps, use app-specific variables

### `NEXTAUTH_SECRET`

**Required**: Yes
**Type**: String (random secret)
**Used by**: All Next.js apps

Secret key used to encrypt JWT tokens and session cookies.

**How to generate**:
```bash
openssl rand -base64 32
```

**Examples**:

Development:
```env
NEXTAUTH_SECRET="your-dev-secret-key-min-32-chars"
```

Production:
```env
NEXTAUTH_SECRET="lhk89aH...different-from-dev...X9kL2p"
```

**Important**:
- Use different secrets for dev and production
- Must be at least 32 characters
- Keep this secret secure
- Changing this will invalidate all sessions

### `NEXTAUTH_URL_WEB`, `NEXTAUTH_URL_PORTAL`, `NEXTAUTH_URL_ADMIN`

**Required**: Only for multi-domain deployments
**Type**: String (URL)
**Used by**: Respective apps

Allows different NextAuth URLs for each app when deployed to different domains.

**Example**:
```env
NEXTAUTH_URL_WEB="https://churchconnect.jp"
NEXTAUTH_URL_PORTAL="https://portal.churchconnect.jp"
NEXTAUTH_URL_ADMIN="https://admin.churchconnect.jp"
```

## Cloudinary (Image Storage)

Cloudinary is used for image upload, storage, and optimization. Church admins upload photos through the church portal.

**Sign up**: https://cloudinary.com (Free tier: 25GB storage, 25GB bandwidth/month)

### `CLOUDINARY_CLOUD_NAME`

**Required**: Yes (for church-portal app)
**Type**: String
**Used by**: Church Portal app

Your Cloudinary cloud name (account identifier).

**Where to find**:
1. Go to https://cloudinary.com/console
2. Dashboard > Account Details
3. Copy "Cloud name"

**Example**:
```env
CLOUDINARY_CLOUD_NAME="my-church-cloud"
```

**Important**:
- This is NOT secret - visible in browser
- Used in upload URLs and image transformations

### `CLOUDINARY_API_KEY`

**Required**: Yes (for church-portal app)
**Type**: String
**Used by**: Church Portal app (server-side)

Your Cloudinary API key for authentication.

**Where to find**:
1. Go to https://cloudinary.com/console
2. Dashboard > Settings > Access Keys
3. Copy "API Key"

**Example**:
```env
CLOUDINARY_API_KEY="123456789012345"
```

**Important**:
- Keep this secret
- Used for server-side upload signature generation

### `CLOUDINARY_API_SECRET`

**Required**: Yes (for church-portal app)
**Type**: String
**Used by**: Church Portal app (server-side)

Your Cloudinary API secret for secure uploads.

**Where to find**:
1. Go to https://cloudinary.com/console
2. Dashboard > Settings > Access Keys
3. Copy "API Secret"

**Example**:
```env
CLOUDINARY_API_SECRET="AbCdEfGhIjKlMnOpQrStUvWxYz12345"
```

**Important**:
- **NEVER expose this in client-side code**
- Used to sign upload requests
- If compromised, rotate immediately in Cloudinary dashboard

**Troubleshooting**:
- If upload fails: Verify all three credentials are correct
- Check Cloudinary dashboard for upload errors and quota usage
- Ensure account is active and not over bandwidth limit
- Test with: `curl https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/image/upload`

## Resend (Email Service)

Resend is used for sending transactional emails (contact forms, review notifications, donation receipts).

**Sign up**: https://resend.com (Free tier: 100 emails/day, 3,000/month)

### `RESEND_API_KEY`

**Required**: Yes
**Type**: String (starts with `re_`)
**Used by**: Web, Church Portal, Admin apps

Your Resend API key for sending emails.

**Where to find**:
1. Go to https://resend.com/dashboard
2. Click "API Keys"
3. Create new API key
4. Copy the key (starts with `re_`)

**Example**:
```env
RESEND_API_KEY="re_AbCdEfGh_1234567890AbCdEfGhIjKlMnOp"
```

**Important**:
- Use test API key for development
- Use production API key with verified domain for production
- Keys are shown only once - save securely

### `EMAIL_FROM`

**Required**: Yes
**Type**: String (email address with name)
**Used by**: All apps sending email

Email address to send from. Must include sender name.

**Format**: `Name <email@domain.com>`

**Examples**:

Development (using Resend onboarding domain):
```env
EMAIL_FROM="onboarding@resend.dev"
```

Production (with verified domain):
```env
EMAIL_FROM="ChurchConnect <noreply@churchconnect.jp>"
```

**Where to verify domain**:
1. Go to https://resend.com/dashboard
2. Click "Domains"
3. Add your domain
4. Follow DNS verification steps

**Important**:
- For production, domain MUST be verified in Resend
- Use `noreply@` for automated emails
- Name part is optional but recommended

### `ADMIN_EMAIL`

**Required**: Yes
**Type**: String (email address)
**Used by**: Web app

Email address to receive admin notifications.

**Example**:
```env
ADMIN_EMAIL="admin@churchconnect.jp"
```

**Receives notifications for**:
- New church registrations
- Flagged reviews
- Platform donations
- System errors (if configured)

**Troubleshooting**:
- If emails not sending: Check Resend dashboard for failed sends
- Verify API key is valid and not expired
- Check email rate limits (100/day on free tier)
- For production: Ensure EMAIL_FROM domain is verified
- Test with: `curl -X POST https://api.resend.com/emails -H "Authorization: Bearer $RESEND_API_KEY"`

## Google reCAPTCHA

Google reCAPTCHA v3 protects contact forms from spam and abuse.

**Sign up**: https://www.google.com/recaptcha/admin

**Setup**:
1. Create a new site
2. Choose reCAPTCHA v3
3. Add domains:
   - Development: `localhost`
   - Production: `churchconnect.jp`
4. Get keys from settings

### `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

**Required**: Yes (for web app)
**Type**: String
**Used by**: Web app (client-side)

reCAPTCHA site key (public key).

**Where to find**:
1. Go to https://www.google.com/recaptcha/admin
2. Select your site
3. Settings > reCAPTCHA keys
4. Copy "Site key"

**Example**:
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LcAbCdEfGhIjKlMnOpQrStUvWxYz1234567890"
```

**Important**:
- Prefix `NEXT_PUBLIC_` exposes to browser (required)
- This is safe to expose - it's a public key
- Different keys for different domains

### `RECAPTCHA_SECRET_KEY`

**Required**: Yes (for web app)
**Type**: String
**Used by**: Web app (server-side)

reCAPTCHA secret key for verifying responses.

**Where to find**:
1. Go to https://www.google.com/recaptcha/admin
2. Select your site
3. Settings > reCAPTCHA keys
4. Copy "Secret key"

**Example**:
```env
RECAPTCHA_SECRET_KEY="6LcAbCdEfGhIjKlMnOpQrStUvWxYz0987654321"
```

**Important**:
- **NEVER expose this in client-side code**
- Used to verify user responses server-side
- Keep this secret

**Configuration**:
- Score threshold: 0.5 (configurable in `apps/web/lib/recaptcha.ts`)
- Lower threshold (0.3) = more permissive, fewer false positives
- Higher threshold (0.7) = stricter, more false positives

**Troubleshooting**:
- If legitimate users can't submit forms: Check reCAPTCHA dashboard for score distribution
- Adjust threshold in `apps/web/lib/recaptcha.ts` if needed
- Verify domain is registered in reCAPTCHA admin console
- Check that both site key and secret key are from same reCAPTCHA site

## Stripe Payments

### `STRIPE_SECRET_KEY`

**Required**: Yes (for donations feature)
**Type**: String (Stripe API key)
**Used by**: Web app

Your Stripe secret API key. Used for server-side operations.

**Format**:
- Test: `sk_test_...`
- Production: `sk_live_...`

**Examples**:

Development:
```env
STRIPE_SECRET_KEY="sk_test_51Abc123..."
```

Production:
```env
STRIPE_SECRET_KEY="sk_live_51Abc123..."
```

**Where to find**:
1. Go to https://dashboard.stripe.com/
2. Toggle "Test mode" or "Production mode"
3. Developers → API keys
4. Copy "Secret key"

**Important**:
- Never expose this key in client-side code
- Use test keys in development
- Use production keys only in production

### `STRIPE_PUBLISHABLE_KEY`

**Required**: Yes (for donations feature)
**Type**: String (Stripe publishable key)
**Used by**: Web app (client-side)

Your Stripe publishable API key. Safe to use in client-side code.

**Format**:
- Test: `pk_test_...`
- Production: `pk_live_...`

**Examples**:

Development:
```env
STRIPE_PUBLISHABLE_KEY="pk_test_51Abc123..."
```

Production:
```env
STRIPE_PUBLISHABLE_KEY="pk_live_51Abc123..."
```

**Where to find**: Same location as secret key

**Important**:
- This key is safe to expose in client code
- Still use environment variables for consistency

### `STRIPE_WEBHOOK_SECRET`

**Required**: Yes (for webhook verification)
**Type**: String (Webhook signing secret)
**Used by**: Web app (webhook endpoint)

Webhook signing secret used to verify webhook requests from Stripe.

**Format**: `whsec_...`

**Examples**:

Development (using Stripe CLI):
```env
STRIPE_WEBHOOK_SECRET="whsec_abc123..."
```

Production:
```env
STRIPE_WEBHOOK_SECRET="whsec_xyz789..."
```

**Where to find**:

Development:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
# Secret will be displayed in terminal
```

Production:
1. Go to https://dashboard.stripe.com/
2. Developers → Webhooks
3. Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy "Signing secret"

**Important**:
- Different secrets for dev and production
- Used to prevent webhook spoofing
- Webhooks will fail without correct secret

## Application URLs

### `NEXT_PUBLIC_WEB_URL`

**Required**: Yes
**Type**: String (URL)
**Used by**: All apps

Public URL of the main web app. Used for redirects, links, etc.

**Examples**:

Development:
```env
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
```

Production:
```env
NEXT_PUBLIC_WEB_URL="https://churchconnect.jp"
```

**Important**:
- Prefix `NEXT_PUBLIC_` makes it available in client-side code
- Include protocol
- No trailing slash

### `NEXT_PUBLIC_API_URL`

**Required**: Yes
**Type**: String (URL)
**Used by**: All Next.js apps

Public URL of the GraphQL API.

**Examples**:

Development:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Production:
```env
NEXT_PUBLIC_API_URL="https://api.churchconnect.jp"
```

**Important**:
- Used by Apollo Client for GraphQL requests
- Must be accessible from browser

### `NEXT_PUBLIC_PORTAL_URL`, `NEXT_PUBLIC_ADMIN_URL`

**Required**: Optional
**Type**: String (URL)
**Used by**: For cross-app linking

URLs of other apps for navigation links.

**Examples**:
```env
NEXT_PUBLIC_PORTAL_URL="https://portal.churchconnect.jp"
NEXT_PUBLIC_ADMIN_URL="https://admin.churchconnect.jp"
```

## Monitoring (Sentry)

Sentry provides error tracking and performance monitoring for production applications.

**Sign up**: https://sentry.io (Free tier: 5,000 errors/month)

### `SENTRY_DSN`

**Required**: No (recommended for production)
**Type**: String (URL)
**Used by**: All apps (optional)

Sentry Data Source Name (DSN) for error tracking.

**Where to find**:
1. Go to https://sentry.io
2. Create a project (or use existing)
3. Settings > Client Keys (DSN)
4. Copy the DSN

**Example**:
```env
SENTRY_DSN="https://1234567890abcdef@o123456.ingest.sentry.io/7654321"
```

**Benefits**:
- Automatic error tracking and reporting
- Performance monitoring and profiling
- Breadcrumbs for debugging context
- User impact analysis
- Release tracking

**Important**:
- Optional but highly recommended for production
- Errors are automatically captured and reported
- Sensitive data is filtered before sending

### `SENTRY_ENVIRONMENT`

**Required**: No
**Type**: String
**Used by**: All apps (if Sentry is configured)

Environment name to tag errors in Sentry.

**Examples**:
```env
SENTRY_ENVIRONMENT="development"
SENTRY_ENVIRONMENT="staging"
SENTRY_ENVIRONMENT="production"
```

**Benefits**:
- Filter errors by environment in Sentry dashboard
- Track issues across different deployments
- Set up environment-specific alerts

**Note**: If not set, defaults to `NODE_ENV` value

## Node Environment

### `NODE_ENV`

**Required**: Automatically set by framework
**Type**: String (`development` | `production` | `test`)
**Used by**: All apps

Indicates the environment the app is running in.

**Examples**:

Development (automatic):
```env
NODE_ENV="development"
```

Production (automatic):
```env
NODE_ENV="production"
```

**Important**:
- Usually set automatically
- Affects build optimizations
- Affects logging verbosity
- Affects error messages

## Setting Up Environment Files

### Development

1. **Root `.env`**
   ```bash
   cp .env.example .env
   ```

   Edit with your values:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/churchconnect?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="dev-secret-min-32-chars-long"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   NEXT_PUBLIC_WEB_URL="http://localhost:3000"
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

2. **Web App `.env.local`**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

   Use same values as root `.env`.

3. **API App `.env`**
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

4. **Church Portal `.env.local`**
   ```bash
   cp apps/church-portal/.env.example apps/church-portal/.env.local
   ```

5. **Admin Dashboard `.env.local`**
   ```bash
   cp apps/admin/.env.example apps/admin/.env.local
   ```

### Production

**Do not use `.env` files in production.** Instead, set environment variables in your hosting platform:

**Render**:
1. Go to Service → Environment
2. Add each variable
3. Click "Save Changes"
4. Service will redeploy automatically

**Vercel**:
1. Go to Project → Settings → Environment Variables
2. Add each variable
3. Select environment (Production, Preview, Development)
4. Save
5. Redeploy

## Validation Script

ChurchConnect includes a validation script to check your environment configuration before deployment.

### Running the Validator

**Development mode:**
```bash
node scripts/validate-env.js
```

**Production mode:**
```bash
node scripts/validate-env.js --production
```

### What It Checks

1. **Required variables are set** - Ensures all necessary environment variables exist
2. **No placeholder values** - Detects common placeholders like "your-api-key" or "GENERATE"
3. **Valid URL formats** - Validates all URL variables have correct format
4. **Database URL format** - Checks DATABASE_URL is a valid PostgreSQL connection string
5. **Stripe keys match** - Verifies secret and publishable keys are from same environment (test vs live)
6. **Pattern matching** - Validates specific patterns (e.g., Resend keys start with `re_`)
7. **Production checks** - Additional validation for production deployments

### Exit Codes

- **0** - All checks passed (or warnings only)
- **1** - Errors found, must fix before deploying

### Sample Output

```
🔍 ChurchConnect Environment Validation
==========================================

Mode: DEVELOPMENT

1. Checking Database Configuration...

✓ DATABASE_URL is set and valid

2. Checking NextAuth Configuration...

✓ NEXTAUTH_SECRET is set
✓ NEXTAUTH_URL is set
✓ NEXTAUTH_URL is a valid URL

3. Checking Application URLs...

✓ NEXT_PUBLIC_WEB_URL is a valid URL
✓ NEXT_PUBLIC_API_URL is a valid URL
✓ NEXT_PUBLIC_PORTAL_URL is a valid URL
✓ NEXT_PUBLIC_ADMIN_URL is a valid URL
✓ NEXT_PUBLIC_GRAPHQL_URL is a valid URL

...

==========================================
✅ All checks passed!
Environment is properly configured.
```

### Integration with CI/CD

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Validate Environment
  run: node scripts/validate-env.js --production
```

**Render** (render.yaml):
```yaml
services:
  - type: web
    name: web
    buildCommand: node scripts/validate-env.js && pnpm build
```

## Security Best Practices

### ✅ Do

- **Use different secrets** for development and production
- **Store secrets securely** (1Password, AWS Secrets Manager, etc.)
- **Rotate secrets periodically** (especially after team changes)
- **Use environment variables** for all sensitive data
- **Validate environment variables** on startup
- **Use `.env.example`** as a template (without real values)
- **Set restrictive permissions** on `.env` files: `chmod 600 .env`

### ❌ Don't

- **Never commit `.env` files** to version control
- **Never share secrets** in Slack, email, or unencrypted channels
- **Never hardcode secrets** in source code
- **Never use production secrets** in development
- **Never expose secrets** in client-side code (except `NEXT_PUBLIC_*`)
- **Never log secrets** or include in error messages

### Git Ignore

Ensure `.gitignore` includes:

```gitignore
# Environment files
.env
.env.local
.env.production
.env.production.local
.env.development.local
.env.test.local

# Except example files
!.env.example
!**/.env.example
```

### Verifying Secrets Are Not Exposed

```bash
# Check if .env is tracked by git (should show nothing)
git ls-files | grep .env

# Search for potential leaked secrets
git log -p | grep -i "secret\|password\|api_key"
```

### If Secrets Are Leaked

1. **Immediately rotate** the leaked secret
2. **Generate new secret** in respective service
3. **Update environment variables** everywhere
4. **Remove from git history** using BFG Repo-Cleaner or git-filter-repo
5. **Notify team** if applicable

## Troubleshooting

### Variable Not Loading

**Problem**: Environment variable is undefined

**Solutions**:
1. Check variable is in correct `.env` file
2. Restart dev server after changing `.env`
3. For Next.js: `NEXT_PUBLIC_*` variables need rebuild
4. Check syntax: No spaces around `=`
   - ✅ `API_KEY="value"`
   - ❌ `API_KEY = "value"`

### Different Values in Different Apps

**Problem**: Variable has different values in different apps

**Solution**: Check each app's `.env.local` file:
- `apps/web/.env.local`
- `apps/church-portal/.env.local`
- `apps/admin/.env.local`
- `apps/api/.env`

### Production Variables Not Working

**Problem**: Variables work locally but not in production

**Solutions**:
1. Make sure variables are set in hosting platform
2. Check variable names are exactly the same
3. Restart/redeploy service after adding variables
4. For `NEXT_PUBLIC_*` variables, must redeploy (not just restart)

### Database Connection Fails

**Problem**: "Cannot connect to database"

**Solutions**:
1. Verify `DATABASE_URL` format is correct
2. Check database is running and accessible
3. For production: Use internal/private URL if available
4. Add SSL parameter: `?ssl=true` or `?sslmode=require`
5. Check firewall allows connections

## Example Configurations

### Complete Development Setup

`.env`:
```env
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/churchconnect?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-min-32-characters-long"

# Application URLs
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_PORTAL_URL="http://localhost:3002"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3003"
NEXT_PUBLIC_GRAPHQL_URL="http://localhost:3001/graphql"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-dev-cloud"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="AbCdEfGhIjKlMnOpQrStUvWxYz"

# Resend (Email - use test domain)
RESEND_API_KEY="re_123456789_AbCdEfGhIjKlMnOpQrSt"
EMAIL_FROM="onboarding@resend.dev"
ADMIN_EMAIL="you@example.com"

# reCAPTCHA Test Keys
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LcAbCdEfGhIjKlMnOpQrStUvWxYz1234567890"
RECAPTCHA_SECRET_KEY="6LcAbCdEfGhIjKlMnOpQrStUvWxYz0987654321"

# Stripe Test Keys
STRIPE_SECRET_KEY="sk_test_YOUR_TEST_SECRET_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"
```

### Complete Production Setup

Environment variables in hosting platform:

```env
# Database (Render PostgreSQL)
DATABASE_URL="postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/db_name?ssl=true"

# Authentication
NEXTAUTH_URL="https://churchconnect.jp"
NEXTAUTH_SECRET="production-secret-COMPLETELY-DIFFERENT-from-dev"

# Application URLs
NEXT_PUBLIC_WEB_URL="https://churchconnect.jp"
NEXT_PUBLIC_API_URL="https://api.churchconnect.jp"
NEXT_PUBLIC_PORTAL_URL="https://portal.churchconnect.jp"
NEXT_PUBLIC_ADMIN_URL="https://admin.churchconnect.jp"
NEXT_PUBLIC_GRAPHQL_URL="https://api.churchconnect.jp/graphql"

# Cloudinary (Production credentials)
CLOUDINARY_CLOUD_NAME="your-production-cloud"
CLOUDINARY_API_KEY="987654321098765"
CLOUDINARY_API_SECRET="ZyXwVuTsRqPoNmLkJiHgFeDcBa"

# Resend (Production with verified domain)
RESEND_API_KEY="re_prod_987654321_ZyXwVuTsRqPoNm"
EMAIL_FROM="ChurchConnect <noreply@churchconnect.jp>"
ADMIN_EMAIL="admin@churchconnect.jp"

# reCAPTCHA Production Keys
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LcProduction1234567890SiteKey"
RECAPTCHA_SECRET_KEY="6LcProduction0987654321SecretKey"

# Stripe Production Keys
STRIPE_SECRET_KEY="sk_live_YOUR_PRODUCTION_SECRET_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE"

# Monitoring (Optional but recommended)
SENTRY_DSN="https://1234567890abcdef@o123456.ingest.sentry.io/7654321"
SENTRY_ENVIRONMENT="production"

# Node Environment
NODE_ENV="production"
```

---

For more information, see:
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)
