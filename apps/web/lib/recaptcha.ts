interface RecaptchaVerificationResult {
  success: boolean
  score?: number
  error?: string
  action?: string
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

interface VerifyRecaptchaTokenResult {
  success: boolean
  score?: number
  error?: string
}

export async function verifyRecaptchaToken(
  token: string,
  expectedAction?: string
): Promise<VerifyRecaptchaTokenResult> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY

    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not configured')
      return { success: false, error: 'reCAPTCHA not configured' }
    }

    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    )

    const data: RecaptchaVerificationResult = await response.json()

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes'])
      return { success: false, error: 'reCAPTCHA verification failed' }
    }

    // Check action matches (optional but recommended)
    if (expectedAction && data.action !== expectedAction) {
      console.error(
        `reCAPTCHA action mismatch. Expected: ${expectedAction}, Got: ${data.action}`
      )
      return { success: false, error: 'Action mismatch' }
    }

    // Check score (0.0 - 1.0, higher is more human)
    // Typical threshold: 0.5
    const score = data.score ?? 0
    if (score < 0.5) {
      console.warn(`reCAPTCHA low score: ${score}`)
      return { success: false, score, error: 'Low score' }
    }

    // Log successful verification with score for monitoring
    console.log(`reCAPTCHA verified successfully. Score: ${score}, Action: ${data.action}`)

    return { success: true, score }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return { success: false, error: 'Verification error' }
  }
}
