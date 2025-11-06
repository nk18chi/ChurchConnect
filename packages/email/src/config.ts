import { Resend } from 'resend'

// Allow development without RESEND_API_KEY, but warn
// Note: During Next.js build, we allow missing keys since routes are only being analyzed
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_placeholder_dev_key'

if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  RESEND_API_KEY not set - email sending will not work')
}

export const resend = new Resend(RESEND_API_KEY)

export const EMAIL_FROM = process.env.EMAIL_FROM || 'ChurchConnect <noreply@churchconnect.jp>'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@churchconnect.jp'
