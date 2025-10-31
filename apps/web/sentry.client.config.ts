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
      app: 'web',
      runtime: 'client',
    },
  },

  // Replay sample rate - captures 10% of sessions for Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content
      maskAllText: true,
      // Block all media
      blockAllMedia: true,
    }),
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from event
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers
    }

    // Don't send errors from browser extensions
    if (event.exception) {
      const values = event.exception.values
      if (values) {
        const chromeExtension = values.find(
          (value) =>
            value.stacktrace?.frames?.some((frame) =>
              frame.filename?.includes('chrome-extension://')
            )
        )
        if (chromeExtension) {
          return null
        }
      }
    }

    return event
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Network errors that are out of our control
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // ResizeObserver errors (harmless)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Aborted requests
    'AbortError',
    'The operation was aborted',
    // Next.js specific errors that are safe to ignore
    'cancelled',
  ],
})
