import { ReviewId } from '../valueObjects/ReviewId'
import { ReviewContent } from '../valueObjects/ReviewContent'
import { ChurchId } from '../../church/valueObjects/ChurchId'

/**
 * Review state machine using tagged unions
 *
 * State transitions:
 * Pending → Approved → Responded
 *        ↘ Rejected → Responded
 */
export type ReviewState =
  | PendingReview
  | ApprovedReview
  | RejectedReview
  | RespondedReview

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

export type ApprovedReview = {
  readonly tag: 'Approved'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly moderatedAt: Date
  readonly moderatedBy: string
  readonly createdAt: Date
}

export type RejectedReview = {
  readonly tag: 'Rejected'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly moderatedAt: Date
  readonly moderatedBy: string
  readonly moderationNote?: string
  readonly createdAt: Date
}

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
  readonly respondedBy: string
  readonly respondedAt: Date
  readonly createdAt: Date
}

// Type guards
export const isPending = (review: ReviewState): review is PendingReview =>
  review.tag === 'Pending'

export const isApproved = (review: ReviewState): review is ApprovedReview =>
  review.tag === 'Approved'

export const isRejected = (review: ReviewState): review is RejectedReview =>
  review.tag === 'Rejected'

export const isResponded = (review: ReviewState): review is RespondedReview =>
  review.tag === 'Responded'
