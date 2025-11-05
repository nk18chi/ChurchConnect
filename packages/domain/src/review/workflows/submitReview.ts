import { Result, ok } from '../../shared/types/Result'
import { PendingReview } from '../entities/ReviewState'
import { ReviewId, ReviewContent } from '../valueObjects'
import { ChurchId } from '../../church/valueObjects'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Input for submitting a new review (invalidated)
 */
export interface InvalidatedReviewInput {
  churchId: string
  userId: string
  content: string
  visitDate?: Date
  experienceType?: string
}

/**
 * Validated review input with domain types
 */
interface ValidatedReviewInput {
  churchId: ChurchId
  userId: string
  content: ReviewContent
  visitDate?: Date
  experienceType?: string
}

/**
 * Step 1: Validate review input
 */
type ValidateReviewInput = (input: InvalidatedReviewInput) => Result<ValidatedReviewInput, ValidationError>

const validateReviewInput: ValidateReviewInput = (input) =>
  ChurchId.create(input.churchId).andThen((churchId) =>
    ReviewContent.create(input.content).map((content) => ({
      churchId,
      userId: input.userId,
      content,
      visitDate: input.visitDate,
      experienceType: input.experienceType,
    }))
  )

/**
 * Step 2: Create pending review from validated input
 */
type CreatePendingReview = (input: ValidatedReviewInput) => Result<PendingReview, ValidationError>

const createPendingReview: CreatePendingReview = (input) =>
  ok({
    tag: 'Pending' as const,
    id: ReviewId.createNew(),
    churchId: input.churchId,
    userId: input.userId,
    content: input.content,
    visitDate: input.visitDate,
    experienceType: input.experienceType,
    createdAt: new Date(),
  })

/**
 * Submit a new review for moderation.
 * Pure function with no side effects.
 *
 * Pipeline: InvalidatedReviewInput → ValidatedReviewInput → PendingReview
 *
 * @param input - Review submission data
 * @returns Pending review or validation error
 */
export const submitReview = (input: InvalidatedReviewInput): Result<PendingReview, ValidationError> =>
  ok(input).andThen(validateReviewInput).andThen(createPendingReview)
