import { ReviewId } from '../valueObjects/ReviewId'
import { ReviewContent } from '../valueObjects/ReviewContent'
import { ChurchId } from '../../church/valueObjects/ChurchId'

/**
 * Review aggregate states as a tagged union.
 * This makes invalid state transitions impossible at compile time.
 *
 * State transitions:
 * Pending → Approved/Rejected
 * Approved/Rejected → Responded (with baseState preserved)
 */
export type ReviewState = PendingReview | ApprovedReview | RejectedReview | RespondedReview

/**
 * Pending state: Review submitted but not yet moderated
 * - Awaiting admin/church admin moderation
 * - Not visible to public
 */
export type PendingReview = {
  readonly tag: 'Pending'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly createdAt: Date
}

/**
 * Approved state: Review approved by moderator
 * - Visible to public
 * - Can receive response from church
 */
export type ApprovedReview = {
  readonly tag: 'Approved'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly approvedAt: Date
  readonly approvedBy: string
  readonly moderationNote?: string
  readonly createdAt: Date
}

/**
 * Rejected state: Review rejected by moderator
 * - Not visible to public
 * - Can still receive response from church (private)
 */
export type RejectedReview = {
  readonly tag: 'Rejected'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly rejectedAt: Date
  readonly rejectedBy: string
  readonly moderationNote?: string
  readonly createdAt: Date
}

/**
 * Responded state: Review with church response
 * - Maintains base state (Approved or Rejected)
 * - Has response from church
 */
export type RespondedReview = {
  readonly tag: 'Responded'
  readonly baseState: 'Approved' | 'Rejected'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly moderatedAt: Date
  readonly moderatedBy: string
  readonly moderationNote?: string
  readonly responseContent: string
  readonly respondedAt: Date
  readonly respondedBy: string
  readonly createdAt: Date
}

/**
 * Type guard for Pending state
 */
export const isPending = (review: ReviewState): review is PendingReview => {
  return review.tag === 'Pending'
}

/**
 * Type guard for Approved state
 */
export const isApproved = (review: ReviewState): review is ApprovedReview => {
  return review.tag === 'Approved'
}

/**
 * Type guard for Rejected state
 */
export const isRejected = (review: ReviewState): review is RejectedReview => {
  return review.tag === 'Rejected'
}

/**
 * Type guard for Responded state
 */
export const isResponded = (review: ReviewState): review is RespondedReview => {
  return review.tag === 'Responded'
}

/**
 * Check if review is publicly visible (Approved or Responded with Approved base)
 */
export const isPubliclyVisible = (review: ReviewState): boolean => {
  return isApproved(review) || (isResponded(review) && review.baseState === 'Approved')
}

/**
 * Check if review can receive response
 */
export const canReceiveResponse = (review: ReviewState): boolean => {
  return isApproved(review) || isRejected(review)
}
