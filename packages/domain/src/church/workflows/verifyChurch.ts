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
 * Authorized verification input
 */
interface AuthorizedVerificationInput {
  church: PublishedChurch
  verifiedBy: string
}

/**
 * Step 1: Check authorization
 */
type CheckAuthorization = (input: VerifyChurchInput) => Result<AuthorizedVerificationInput, AuthorizationError>

const checkAuthorization: CheckAuthorization = (input) => {
  if (input.verifierRole !== 'ADMIN') {
    return err(new AuthorizationError('Only platform admins can verify churches', 'ADMIN'))
  }

  return ok({
    church: input.church,
    verifiedBy: input.verifiedBy,
  })
}

/**
 * Step 2: Create verified church from authorized input
 */
type CreateVerifiedChurch = (input: AuthorizedVerificationInput) => Result<VerifiedChurch, AuthorizationError>

const createVerifiedChurch: CreateVerifiedChurch = (input) =>
  ok({
    tag: 'Verified' as const,
    id: input.church.id,
    name: input.church.name,
    slug: input.church.slug,
    publishedAt: input.church.publishedAt,
    verifiedAt: new Date(),
    verifiedBy: input.verifiedBy,
    createdAt: input.church.createdAt,
  })

/**
 * Verify a published church.
 * Only platform admins can verify churches.
 * Pure function with no side effects.
 *
 * Pipeline: input → authorization check → verified church
 *
 * @param input - Verification data
 * @returns Verified church or authorization error
 */
export const verifyChurch = (input: VerifyChurchInput): Result<VerifiedChurch, AuthorizationError> =>
  ok(input).andThen(checkAuthorization).andThen(createVerifiedChurch)
