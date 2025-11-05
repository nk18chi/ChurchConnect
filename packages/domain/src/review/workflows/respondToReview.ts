import { Result, ok, err } from '../../shared/types/Result'
import { ApprovedReview, RejectedReview, RespondedReview } from '../entities/ReviewState'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Input for responding to a review
 */
export interface RespondToReviewInput {
  review: ApprovedReview | RejectedReview
  responseContent: string
  respondedBy: string
}

/**
 * Validated response input
 */
interface ValidatedResponseInput {
  review: ApprovedReview | RejectedReview
  responseContent: string
  respondedBy: string
}

/**
 * Step 1: Validate response content
 */
type ValidateResponseContent = (input: RespondToReviewInput) => Result<ValidatedResponseInput, ValidationError>

const validateResponseContent: ValidateResponseContent = (input) => {
  const trimmed = input.responseContent.trim()

  if (trimmed.length < 10) {
    return err(new ValidationError('Response content must be at least 10 characters'))
  }

  if (trimmed.length > 2000) {
    return err(new ValidationError('Response content must not exceed 2000 characters'))
  }

  return ok({
    review: input.review,
    responseContent: trimmed,
    respondedBy: input.respondedBy,
  })
}

/**
 * Step 2: Create responded review
 */
type CreateRespondedReview = (input: ValidatedResponseInput) => Result<RespondedReview, ValidationError>

const createRespondedReview: CreateRespondedReview = (input) => {
  const baseState = input.review.tag === 'Approved' ? 'Approved' : 'Rejected'
  const moderatedAt = input.review.tag === 'Approved' ? input.review.approvedAt : input.review.rejectedAt
  const moderatedBy = input.review.tag === 'Approved' ? input.review.approvedBy : input.review.rejectedBy

  return ok({
    tag: 'Responded' as const,
    baseState: baseState as 'Approved' | 'Rejected',
    id: input.review.id,
    churchId: input.review.churchId,
    userId: input.review.userId,
    content: input.review.content,
    visitDate: input.review.visitDate,
    experienceType: input.review.experienceType,
    moderatedAt,
    moderatedBy,
    moderationNote: input.review.moderationNote,
    responseContent: input.responseContent,
    respondedAt: new Date(),
    respondedBy: input.respondedBy,
    createdAt: input.review.createdAt,
  })
}

/**
 * Respond to an approved or rejected review.
 * Pure function with no side effects.
 *
 * Pipeline: RespondToReviewInput → ValidatedResponseInput → RespondedReview
 *
 * @param input - Response data
 * @returns Responded review or validation error
 */
export const respondToReview = (input: RespondToReviewInput): Result<RespondedReview, ValidationError> =>
  ok(input).andThen(validateResponseContent).andThen(createRespondedReview)
