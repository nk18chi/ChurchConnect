import { prisma } from '@repo/database'

export interface Context {
  prisma: typeof prisma
  userId?: string
  userRole?: string
}

export async function createContext(): Promise<Context> {
  // TODO: Extract user info from JWT token in Authorization header
  // For now, return a context with just the Prisma client
  return {
    prisma,
    userId: undefined,
    userRole: undefined,
  }
}
