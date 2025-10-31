'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@repo/ui/components/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600">
            We're sorry for the inconvenience. The error has been reported to
            our team.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => reset()} className="w-full">
            Try Again
          </Button>

          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          If this problem persists, please contact support at{' '}
          <a
            href="mailto:support@churchconnect.jp"
            className="text-blue-600 hover:underline"
          >
            support@churchconnect.jp
          </a>
        </p>
      </div>
    </div>
  )
}
