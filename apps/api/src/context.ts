import { prisma } from '@repo/database'
import type { Request, Response } from 'express'

export interface Context {
  prisma: typeof prisma
  userId?: string
  userRole?: string
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  // TODO: Extract session from request headers/cookies
  // For now, return context without authentication
  // This will need to be implemented based on your auth strategy

  return {
    prisma,
    userId: undefined,
    userRole: undefined,
  }
}
