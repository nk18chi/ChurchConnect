# Sentry Error Tracking

ChurchConnect uses Sentry for error tracking and performance monitoring across all applications.

## Overview

Sentry is configured for:
- **Web App** (`apps/web`) - Public website with Session Replay
- **Church Portal** (`apps/church-portal`) - Church admin dashboard with Session Replay
- **Admin Dashboard** (`apps/admin`) - Platform admin dashboard with Session Replay
- **API** (`apps/api`) - GraphQL API with profiling

## Setup

### 1. Create Sentry Project

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project for ChurchConnect
3. Choose "Next.js" as the platform
4. Copy the DSN (Data Source Name)

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/your-project-id"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="development"  # or "production", "staging"

# For API app (uses SENTRY_DSN instead of NEXT_PUBLIC_SENTRY_DSN)
SENTRY_DSN="https://your-dsn@sentry.io/your-project-id"
SENTRY_ENVIRONMENT="development"
```

**Important:**
- Use `NEXT_PUBLIC_SENTRY_DSN` for Next.js apps (web, church-portal, admin)
- Use `SENTRY_DSN` for the API app
- Set `SENTRY_ENVIRONMENT` to match your deployment environment

### 3. Production Configuration

For production, add these to your Render environment variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
```

## Configuration

### Next.js Apps (Web, Church Portal, Admin)

Each Next.js app has three Sentry configuration files:

**Client-side (`sentry.client.config.ts`):**
- Tracks errors in the browser
- Includes Session Replay (10% of sessions in production)
- Filters out browser extension errors
- Removes sensitive data (cookies, headers)

**Server-side (`sentry.server.config.ts`):**
- Tracks errors in Next.js server components and API routes
- Removes sensitive data from requests
- 10% sampling rate for performance monitoring

**Edge Runtime (`sentry.edge.config.ts`):**
- Tracks errors in Edge Runtime (middleware, edge functions)
- Minimal configuration for edge environments

### API App

**API Configuration (`apps/api/src/sentry.ts`):**
- Tracks errors in GraphQL API
- Includes Node.js profiling
- 10% sampling rate for performance monitoring
- Filters out expected GraphQL validation errors

## Features

### 1. Error Tracking

All JavaScript errors are automatically captured and sent to Sentry:

```typescript
// Errors are automatically captured
throw new Error('Something went wrong')

// You can also manually capture errors
import * as Sentry from '@sentry/nextjs'

try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'checkout',
    },
  })
}
```

### 2. Performance Monitoring

Sentry automatically tracks:
- Page load times
- API response times
- Database queries
- GraphQL operations

Sample rate: 10% in production (configurable in config files)

### 3. Session Replay

Sentry records user sessions when errors occur:
- Captures DOM interactions
- Masks sensitive text
- Blocks all media content
- 10% sampling rate for normal sessions
- 100% sampling rate when errors occur

### 4. User Context

Errors include user context when available:

```typescript
import * as Sentry from '@sentry/nextjs'

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
})

// Clear user context (on logout)
Sentry.setUser(null)
```

### 5. Custom Tags

Add custom tags to errors for better organization:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.setTag('feature', 'church-profile')
Sentry.setTag('church_id', churchId)
```

### 6. Breadcrumbs

Sentry automatically captures breadcrumbs:
- Console logs
- Network requests
- User clicks
- Navigation events

Add custom breadcrumbs:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.addBreadcrumb({
  category: 'donation',
  message: 'User initiated checkout',
  level: 'info',
  data: {
    amount: 1000,
    currency: 'JPY',
  },
})
```

## Error Boundaries

All Next.js apps have global error boundaries that:
- Catch React errors
- Display user-friendly error messages
- Report errors to Sentry
- Provide recovery options (reload, go home)

Error boundaries are located at:
- `apps/web/components/error-boundary.tsx`
- `apps/church-portal/components/error-boundary.tsx`
- `apps/admin/components/error-boundary.tsx`

## Best Practices

### 1. Don't Send Sensitive Data

Sentry configurations automatically filter:
- Cookies
- Headers
- Query parameters

Always review data before manually sending to Sentry.

### 2. Add Context

When capturing errors manually, add helpful context:

```typescript
Sentry.captureException(error, {
  tags: {
    feature: 'church-search',
    search_type: 'text',
  },
  contexts: {
    search: {
      query: searchTerm,
      filters: appliedFilters,
      results_count: results.length,
    },
  },
})
```

### 3. Use Appropriate Severity

```typescript
Sentry.captureMessage('User tried invalid search', 'info')
Sentry.captureMessage('Database connection slow', 'warning')
Sentry.captureException(error, { level: 'error' })
Sentry.captureException(criticalError, { level: 'fatal' })
```

### 4. Group Related Errors

Use fingerprinting to group similar errors:

```typescript
Sentry.captureException(error, {
  fingerprint: ['database-connection-error', databaseName],
})
```

### 5. Monitor Third-Party Integrations

Track third-party API errors:

```typescript
try {
  await cloudinary.upload(file)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      integration: 'cloudinary',
      operation: 'upload',
    },
  })
  throw error
}
```

## Ignored Errors

Sentry is configured to ignore:

**Client-side:**
- Browser extension errors
- Network errors (Failed to fetch, NetworkError)
- ResizeObserver errors (harmless)
- Aborted requests
- Next.js cancelled requests

**Server-side:**
- Database connection errors (logged elsewhere)
- Next.js cancelled requests

**API:**
- Expected GraphQL validation errors
- Database connection timeouts

## Alert Configuration

### Recommended Alerts

Set up alerts in Sentry dashboard for:

**Critical (Immediate notification):**
- New error types (never seen before)
- Error spike: >100 errors in 1 hour
- Error rate: >5% of requests fail

**Warning (Email notification):**
- Error frequency: >50 errors in 1 hour for known issue
- Performance regression: P95 response time >3s

**Info (Weekly digest):**
- New issues this week
- Resolved issues
- Performance trends

### Alert Channels

Configure in Sentry:
1. Email notifications
2. Slack integration (recommended)
3. PagerDuty (for production critical alerts)

## Debugging with Sentry

### 1. View Error Details

In Sentry dashboard:
- Click on issue
- Review stack trace
- Check breadcrumbs (user actions before error)
- View user session replay (if available)

### 2. Source Maps

Sentry automatically uploads source maps during build:
- Production builds include source maps
- Stack traces show original TypeScript code
- Line numbers match your source code

### 3. Release Tracking

Track errors by release version:

```bash
# Set SENTRY_RELEASE in your environment
SENTRY_RELEASE=$(git rev-parse HEAD)
```

Errors will be associated with specific commits.

### 4. Search and Filter

Use Sentry's search to find specific errors:
- `app:web` - Errors from web app only
- `environment:production` - Production errors only
- `user.id:123` - Errors affecting specific user
- `tag:feature:donations` - Errors in donations feature

## Performance Monitoring

### 1. View Performance Data

Sentry tracks:
- **Page Load**: How long pages take to load
- **API Calls**: GraphQL query performance
- **Database Queries**: Slow database operations

### 2. Custom Transactions

Track custom operations:

```typescript
import * as Sentry from '@sentry/nextjs'

const transaction = Sentry.startTransaction({
  name: 'Church Search',
  op: 'search',
})

try {
  const results = await searchChurches(query)
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

### 3. Custom Spans

Add spans to track specific operations:

```typescript
const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()

const span = transaction?.startChild({
  op: 'db.query',
  description: 'Fetch church profile',
})

try {
  const church = await prisma.church.findUnique({ where: { id } })
  span?.setStatus('ok')
} finally {
  span?.finish()
}
```

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN is set:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Verify environment:**
   - Development: Errors logged to console AND Sentry
   - Production: Errors sent to Sentry only

3. **Check ignored errors:**
   - Review `ignoreErrors` in config files
   - Ensure error isn't filtered out

### Source Maps Not Working

1. **Verify build includes source maps:**
   ```bash
   ls .next/.sentry
   ```

2. **Check Sentry release:**
   - Set `SENTRY_RELEASE` environment variable
   - Ensure source maps uploaded during build

### Too Many Errors

1. **Increase sample rate:**
   - Decrease `tracesSampleRate` in config
   - Reduce `replaysSessionSampleRate`

2. **Add more ignore rules:**
   - Identify noisy errors in Sentry
   - Add to `ignoreErrors` array

### Performance Data Missing

1. **Check sample rate:**
   - Increase `tracesSampleRate` for more data
   - 1.0 = 100%, 0.1 = 10%

2. **Verify performance monitoring enabled:**
   - Check Sentry project settings
   - Ensure performance quota not exceeded

## Cost Management

Sentry pricing is based on:
- **Events**: Each error sent to Sentry
- **Replays**: Session replay recordings
- **Attachments**: Screenshots, files

### Free Tier Limits

- 5,000 errors/month
- 1,000 performance transactions/month
- 1 team member

### Optimization Tips

1. **Filter noise:**
   - Add common errors to `ignoreErrors`
   - Group similar errors with fingerprints

2. **Adjust sample rates:**
   ```typescript
   tracesSampleRate: 0.1,  // 10% of transactions
   replaysSessionSampleRate: 0.1,  // 10% of sessions
   ```

3. **Use release health:**
   - Track error-free sessions
   - Identify problematic releases

4. **Archive old issues:**
   - Resolve fixed issues
   - Archive issues that won't be fixed

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

## Support

If you have questions about Sentry configuration:
- Check [Sentry documentation](https://docs.sentry.io)
- Email: dev@churchconnect.jp
- Sentry support: https://sentry.io/support/
