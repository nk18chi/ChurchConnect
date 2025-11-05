import { Result, ok, err } from '../../shared/types/Result'
import { PendingReview, ApprovedReview, RejectedReview } from '../entities/ReviewState'
import { ValidationError, AuthorizationError } from '../../shared/errors/DomainError'

/**
 * Input for moderating a review
 */
export interface ModerateReviewInput {
  review: PendingReview
  decision: 'APPROVED' | 'REJECTED'
  moderatedBy: string
  moderatorRole: 'ADMIN' | 'CHURCH_ADMIN' | 'USER'
  moderationNote?: string
}

/**
 * Authorized moderation input
 */
interface AuthorizedModerationInput {
  review: PendingReview
  decision: 'APPROVED' | 'REJECTED'
  moderatedBy: string
  moderationNote?: string
}

/**
 * Step 1: Authorize moderator
 * Only ADMIN and CHURCH_ADMIN can moderate reviews
 */
type AuthorizeModerator = (input: ModerateReviewInput) => Result<AuthorizedModerationInput, AuthorizationError>

const authorizeModerator: AuthorizeModerator = (input) => {
  if (input.moderatorRole !== 'ADMIN' && input.moderatorRole !== 'CHURCH_ADMIN') {
    return err(
      new AuthorizationError('Only administrators and church administrators can moderate reviews', 'ADMIN')
    )
  }

  return ok({
    review: input.review,
    decision: input.decision,
    moderatedBy: input.moderatedBy,
    moderationNote: input.moderationNote,
  })
}

/**
 * Step 2: Apply moderation decision
 */
type ApplyModerationDecision = (
  input: AuthorizedModerationInput
) => Result<ApprovedReview | RejectedReview, ValidationError>

const applyModerationDecision: ApplyModerationDecision = (input) => {
  if (input.decision === 'APPROVED') {
    return ok({
      tag: 'Approved' as const,
      id: input.review.id,
      churchId: input.review.churchId,
      userId: input.review.userId,
      content: input.review.content,
      visitDate: input.review.visitDate,
      experienceType: input.review.experienceType,
      approvedAt: new Date(),
      approvedBy: input.moderatedBy,
      moderationNote: input.moderationNote,
      createdAt: input.review.createdAt,
    })
  }

  return ok({
    tag: 'Rejected' as const,
    id: input.review.id,
    churchId: input.review.churchId,
    userId: input.review.userId,
    content: input.review.content,
    visitDate: input.review.visitDate,
    experienceType: input.review.experienceType,
    rejectedAt: new Date(),
    rejectedBy: input.moderatedBy,
    moderationNote: input.moderationNote,
    createdAt: input.review.createdAt,
  })
}

/**
 * Moderate a pending review (approve or reject).
 * Pure function with no side effects.
 *
 * Pipeline: ModerateReviewInput → AuthorizedModerationInput → (ApprovedReview | RejectedReview)
 *
 * @param input - Moderation decision data
 * @returns Moderated review or authorization/validation error
 */
export const moderateReview = (
  input: ModerateReviewInput
): Result<ApprovedReview | RejectedReview, AuthorizationError | ValidationError> =>
  ok(input).andThen(authorizeModerator).andThen(applyModerationDecision)
