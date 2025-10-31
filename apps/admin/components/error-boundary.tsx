'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@repo/ui/components/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold text-gray-900">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We're sorry for the inconvenience. The error has been reported
                to our team.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.reload()
                }}
                className="w-full"
              >
                Reload Page
              </Button>

              <Button
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.href = '/dashboard'
                }}
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              If this problem persists, please contact support at{' '}
              <a
                href="mailto:admin@churchconnect.jp"
                className="text-blue-600 hover:underline"
              >
                admin@churchconnect.jp
              </a>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
