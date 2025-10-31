'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    grecaptcha: any
  }
}

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if reCAPTCHA is already loaded
    if (window.grecaptcha) {
      setIsLoaded(true)
      return
    }

    // Load reCAPTCHA script
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script')
      setIsLoaded(false)
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(
        `script[src^="https://www.google.com/recaptcha/api.js"]`
      )
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  const executeRecaptcha = async (action: string): Promise<string> => {
    if (!isLoaded || !window.grecaptcha) {
      throw new Error('reCAPTCHA not loaded')
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action })
          .then(resolve)
          .catch(reject)
      })
    })
  }

  return { isLoaded, executeRecaptcha }
}
