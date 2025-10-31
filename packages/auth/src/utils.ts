import bcrypt from "bcryptjs"
import { prisma, type UserRole } from "@repo/database"

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compare a password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Create a new user with hashed password
 */
export async function createUser(
  email: string,
  password: string,
  name?: string,
  role: UserRole = "USER"
) {
  const hashedPassword = await hashPassword(password)

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  })
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    USER: 1,
    CHURCH_ADMIN: 2,
    ADMIN: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if user is authenticated and has required role
 */
export function requireRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) {
    return false
  }
  return hasRole(userRole, requiredRole)
}
