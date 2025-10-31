# Sentry Implementation Summary - Task 7

## Overview
Successfully implemented Sentry error tracking and performance monitoring for all 4 ChurchConnect applications.

## Packages Installed

### Next.js Apps (web, church-portal, admin)
- **@sentry/nextjs** v10.22.0
  - Includes client-side error tracking
  - Server-side error tracking
  - Edge runtime support
  - Session Replay
  - Performance monitoring
  - Source map upload

### API App
- **@sentry/node** v10.22.0
  - Node.js error tracking
  - Express middleware integration
  - GraphQL error capture
- **@sentry/profiling-node** v10.22.0
  - CPU profiling
  - Performance monitoring

## Files Created

### Sentry Configuration Files

#### Web App (`apps/web/`)
1. `sentry.client.config.ts` - Client-side Sentry config with Session Replay
2. `sentry.server.config.ts` - Server-side Sentry config
3. `sentry.edge.config.ts` - Edge runtime Sentry config
4. `components/error-boundary.tsx` - Global React error boundary
5. `app/error.tsx` - Next.js app-level error page

#### Church Portal (`apps/church-portal/`)
1. `sentry.client.config.ts` - Client-side Sentry config with Session Replay
2. `sentry.server.config.ts` - Server-side Sentry config
3. `sentry.edge.config.ts` - Edge runtime Sentry config
4. `components/error-boundary.tsx` - Global React error boundary
5. `app/error.tsx` - Next.js app-level error page

#### Admin Dashboard (`apps/admin/`)
1. `sentry.client.config.ts` - Client-side Sentry config with Session Replay
2. `sentry.server.config.ts` - Server-side Sentry config
3. `sentry.edge.config.ts` - Edge runtime Sentry config
4. `components/error-boundary.tsx` - Global React error boundary
5. `app/error.tsx` - Next.js app-level error page

#### API (`apps/api/`)
1. `src/sentry.ts` - Sentry initialization with profiling

### Documentation
1. `docs/SENTRY.md` - Comprehensive Sentry documentation (400+ lines)
   - Setup instructions
   - Configuration guide
   - Usage examples
   - Best practices
   - Alert configuration
   - Troubleshooting
   - Cost management

## Files Modified

### Next.js Configuration
1. `apps/web/next.config.mjs` - Added Sentry webpack plugin
2. `apps/church-portal/next.config.js` - Added Sentry webpack plugin
3. `apps/admin/next.config.mjs` - Added Sentry webpack plugin

### Layout Files (Error Boundary Integration)
1. `apps/web/app/layout.tsx` - Wrapped app in ErrorBoundary
2. `apps/church-portal/app/layout.tsx` - Wrapped app in ErrorBoundary
3. `apps/admin/app/layout.tsx` - Wrapped app in ErrorBoundary

### API Server
1. `apps/api/src/index.ts` - Added Sentry initialization and error handler

### Environment Configuration
1. `.env.example` - Added Sentry environment variables with detailed comments

## Sentry Features Configured

### 1. Error Tracking
- **Automatic error capture** on all apps
- **Stack traces** with source map support
- **User context** (when available)
- **Custom tags** for app identification
- **Breadcrumbs** for debugging context

### 2. Performance Monitoring
- **10% sampling rate** in production
- **100% sampling rate** in development
- **Page load time** tracking
- **API response time** tracking
- **Database query** performance

### 3. Session Replay
- **10% of normal sessions** recorded
- **100% of error sessions** recorded
- **Sensitive data masked** (all text)
- **Media blocked** for privacy

### 4. Node.js Profiling (API only)
- **CPU profiling** enabled
- **10% sampling rate** in production
- **Function-level performance** insights

### 5. Error Filtering
Configured to ignore:
- Browser extension errors
- Network errors (Failed to fetch, etc.)
- ResizeObserver errors (harmless)
- Aborted requests
- Expected GraphQL validation errors
- Database connection timeouts

### 6. Privacy & Security
- **Cookies removed** from error events
- **Headers removed** from error events
- **Query parameters filtered** from requests
- **Sensitive text masked** in Session Replay
- **Media blocked** in Session Replay

## Environment Variables Required

### Next.js Apps
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

### API App
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

### Optional (for source maps)
```bash
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=churchconnect-web
SENTRY_AUTH_TOKEN=your-auth-token
```

## Error Boundaries

All Next.js apps now have:

1. **Global Error Boundary** (React class component)
   - Catches React render errors
   - Reports to Sentry with component stack
   - Shows user-friendly error UI
   - Provides recovery options (reload, go home)

2. **App-level Error Page** (Next.js error.tsx)
   - Catches Next.js route errors
   - Reports to Sentry
   - Shows user-friendly error UI
   - Provides recovery options

## Sample Rates Configured

### Production
- **Performance Monitoring**: 10% of transactions
- **Session Replay (normal)**: 10% of sessions
- **Session Replay (errors)**: 100% of error sessions
- **Profiling (API)**: 10% of transactions

### Development
- **Performance Monitoring**: 100% of transactions
- **Session Replay**: 0% (disabled)
- **Profiling**: 100% of transactions

## Alert Recommendations

Set up in Sentry dashboard:

### Critical (Immediate notification)
- New error types (never seen before)
- Error spike: >100 errors in 1 hour
- Error rate: >5% of requests fail

### Warning (Email notification)
- Error frequency: >50 errors in 1 hour for known issue
- Performance regression: P95 response time >3s

### Info (Weekly digest)
- New issues this week
- Resolved issues
- Performance trends

## Testing Sentry Setup

### 1. Test Error Capture
```typescript
// In any client component
throw new Error('Test error from web app')

// Or manually
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(new Error('Manual test error'))
```

### 2. Test User Context
```typescript
Sentry.setUser({
  id: 'test-user-123',
  email: 'test@example.com',
})
```

### 3. Test Performance
Just use the app normally - Sentry will track:
- Page loads
- API calls
- Database queries

### 4. Test Session Replay
Navigate through the app with Sentry enabled. Trigger an error to see replay.

## Next Steps

1. **Create Sentry Project**
   - Sign up at https://sentry.io
   - Create project for ChurchConnect
   - Copy DSN

2. **Configure Environment Variables**
   - Add SENTRY_DSN to all app environments
   - Set SENTRY_ENVIRONMENT appropriately

3. **Set Up Alerts**
   - Configure email notifications
   - Set up Slack integration (recommended)
   - Configure PagerDuty for critical alerts

4. **Test in Development**
   - Trigger test errors
   - Verify errors appear in Sentry
   - Check breadcrumbs and context

5. **Deploy to Production**
   - Set production environment variables
   - Monitor error dashboard
   - Adjust sample rates if needed

## Benefits

1. **Proactive Error Detection**
   - Know about errors before users report them
   - See exact stack traces and context

2. **Better Debugging**
   - Session Replay shows what user did before error
   - Breadcrumbs show sequence of events
   - Source maps show original TypeScript code

3. **Performance Insights**
   - Identify slow pages and API calls
   - Track performance over time
   - Optimize based on real data

4. **User Impact Analysis**
   - See how many users affected
   - Track error frequency
   - Prioritize fixes based on impact

5. **Release Tracking**
   - Associate errors with specific releases
   - Track error-free sessions
   - Identify problematic deployments

## Cost (Sentry Free Tier)
- 5,000 errors/month
- 1,000 performance transactions/month
- 1 team member
- 30 day retention

Should be sufficient for initial launch. Monitor usage and upgrade if needed.

## Documentation
- Full documentation available in `docs/SENTRY.md`
- Includes setup, configuration, best practices, and troubleshooting

## Status
✅ **COMPLETE** - All apps configured with Sentry error tracking and performance monitoring
