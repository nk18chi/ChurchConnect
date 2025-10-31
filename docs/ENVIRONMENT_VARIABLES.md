# Environment Variables Reference

Complete reference for all environment variables used in ChurchConnect Japan.

## Table of Contents

- [Overview](#overview)
- [Database](#database)
- [Authentication](#authentication)
- [Stripe Payments](#stripe-payments)
- [Application URLs](#application-urls)
- [Node Environment](#node-environment)
- [Setting Up Environment Files](#setting-up-environment-files)
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

# Stripe Test Keys
STRIPE_SECRET_KEY="sk_test_YOUR_TEST_SECRET_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Application URLs
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Complete Production Setup

Environment variables in hosting platform:

```env
# Database (Render PostgreSQL)
DATABASE_URL="postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/db_name?ssl=true"

# Authentication
NEXTAUTH_URL="https://churchconnect.jp"
NEXTAUTH_SECRET="production-secret-COMPLETELY-DIFFERENT-from-dev"

# Stripe Production Keys
STRIPE_SECRET_KEY="sk_live_YOUR_PRODUCTION_SECRET_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Application URLs
NEXT_PUBLIC_WEB_URL="https://churchconnect.jp"
NEXT_PUBLIC_API_URL="https://api.churchconnect.jp"

# Node Environment
NODE_ENV="production"
```

---

For more information, see:
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)
