import { prisma } from '@repo/database'
import type { Request, Response } from 'express'
import { decode } from 'next-auth/jwt'

export interface Context {
  prisma: typeof prisma
  userId?: string
  userRole?: string
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  // Extract session from NextAuth JWT cookie
  let userId: string | undefined
  let userRole: string | undefined

  try {
    // NextAuth stores the session in a cookie named based on environment
    // In development: next-auth.session-token
    // In production: __Secure-next-auth.session-token
    const cookieName = process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'

    const token = req.cookies?.[cookieName] || req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      const decoded = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET || '',
      })

      if (decoded) {
        userId = decoded.id as string | undefined
        userRole = decoded.role as string | undefined
      }
    }
  } catch (error) {
    // If token decode fails, continue without authentication
    console.error('Failed to decode session token:', error)
  }

  return {
    prisma,
    userId,
    userRole,
  }
}
