import NextAuth, { DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@repo/database"
import bcrypt from "bcryptjs"
import type { UserRole } from "@repo/database"

// Extend NextAuth types to include role
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}

const nextAuthConfig = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
})

// Export individual functions
// Note: Type assertions needed due to NextAuth v5 beta type inference issues with monorepo setup
export const handlers = nextAuthConfig.handlers as typeof nextAuthConfig.handlers
export const auth = nextAuthConfig.auth as typeof nextAuthConfig.auth
export const signIn = nextAuthConfig.signIn as typeof nextAuthConfig.signIn
export const signOut = nextAuthConfig.signOut as typeof nextAuthConfig.signOut
