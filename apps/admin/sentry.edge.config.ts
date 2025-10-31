import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Add tags for app identification
  initialScope: {
    tags: {
      app: 'admin',
      runtime: 'edge',
    },
  },

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from event
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers
    }

    return event
  },
})
