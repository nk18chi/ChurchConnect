import { Result, ok, err } from '../../shared/types/Result'
import { PublishedChurch, VerifiedChurch } from '../entities/ChurchState'
import { AuthorizationError } from '../../shared/errors/DomainError'

/**
 * User role enum
 */
export type UserRole = 'ADMIN' | 'CHURCH_ADMIN' | 'USER'

/**
 * Input for verifying a church
 */
export type VerifyChurchInput = {
  church: PublishedChurch
  verifiedBy: string // Admin user ID
  verifierRole: UserRole
}

/**
 * Verify a published church.
 * Only platform admins can verify churches.
 * Pure function with no side effects.
 *
 * @param input - Verification data
 * @returns Verified church or authorization error
 */
export const verifyChurch = (input: VerifyChurchInput): Result<VerifiedChurch, AuthorizationError> => {
  // Only admins can verify churches
  if (input.verifierRole !== 'ADMIN') {
    return err(new AuthorizationError('Only platform admins can verify churches', 'ADMIN'))
  }

  return ok({
    tag: 'Verified' as const,
    id: input.church.id,
    name: input.church.name,
    slug: input.church.slug,
    publishedAt: input.church.publishedAt,
    verifiedAt: new Date(),
    verifiedBy: input.verifiedBy,
    createdAt: input.church.createdAt,
  })
}
