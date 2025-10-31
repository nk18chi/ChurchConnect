import { prisma } from '@repo/database'
import { auth } from '@repo/auth'

export interface Context {
  prisma: typeof prisma
  userId?: string
  userRole?: string
}

export async function createContext({ req }: { req: Request }): Promise<Context> {
  // Extract session from NextAuth
  const session = await auth()

  return {
    prisma,
    userId: session?.user?.id,
    userRole: session?.user?.role,
  }
}
