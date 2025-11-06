import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { expressIntegration } from '@sentry/node'

let sentryInitialized = false

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured - error tracking disabled')
    return false
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Environment
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling - samples 10% of transactions
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Enable profiling and Express integration
    integrations: [
      nodeProfilingIntegration(),
      expressIntegration(),
    ],

    // Add tags for app identification
    initialScope: {
      tags: {
        app: 'api',
        runtime: 'node',
      },
    },

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from event
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers
      }

      // Remove query parameters that might contain sensitive data
      if (event.request?.query_string) {
        delete event.request.query_string
      }

      // Remove sensitive data from context
      if (event.contexts?.runtime) {
        delete event.contexts.runtime
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Database connection errors (will be logged elsewhere)
      'ECONNREFUSED',
      'ETIMEDOUT',
      // GraphQL validation errors (expected)
      'GraphQLError',
    ],
  })

  sentryInitialized = true
  return true
}

export function isSentryInitialized() {
  return sentryInitialized
}

export { Sentry }
