import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = process.env.EMAIL_FROM || 'ChurchConnect <noreply@churchconnect.jp>'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@churchconnect.jp'
