import { describe, it, expect } from '@jest/globals'
import { moderateReview, ModerateReviewInput } from '../moderateReview'
import { PendingReview, isApproved, isRejected } from '../../entities/ReviewState'
import { ReviewId } from '../../valueObjects/ReviewId'
import { ReviewContent } from '../../valueObjects/ReviewContent'
import { ChurchId } from '../../../church/valueObjects/ChurchId'

describe('moderateReview workflow', () => {
  const createPendingReview = (): PendingReview => {
    const contentResult = ReviewContent.create('Great church with wonderful community!')
    if (contentResult.isErr()) throw new Error('Failed to create content')

    return {
      tag: 'Pending',
      id: ReviewId.createNew(),
      churchId: ChurchId.createNew(),
      userId: 'user-123',
      content: contentResult.value,
      createdAt: new Date(),
    }
  }

  it('should approve review with valid admin input', () => {
    const pendingReview = createPendingReview()
    const input: ModerateReviewInput = {
      review: pendingReview,
      decision: 'APPROVED',
      moderatedBy: 'admin-123',
      moderatorRole: 'ADMIN',
      moderationNote: 'Looks good',
    }

    const result = moderateReview(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const review = result.value
      expect(isApproved(review)).toBe(true)
      if (isApproved(review)) {
        expect(review.approvedBy).toBe('admin-123')
        expect(review.moderationNote).toBe('Looks good')
        expect(review.approvedAt).toBeInstanceOf(Date)
      }
    }
  })

  it('should reject review with valid admin input', () => {
    const pendingReview = createPendingReview()
    const input: ModerateReviewInput = {
      review: pendingReview,
      decision: 'REJECTED',
      moderatedBy: 'admin-123',
      moderatorRole: 'ADMIN',
      moderationNote: 'Inappropriate content',
    }

    const result = moderateReview(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const review = result.value
      expect(isRejected(review)).toBe(true)
      if (isRejected(review)) {
        expect(review.rejectedBy).toBe('admin-123')
        expect(review.moderationNote).toBe('Inappropriate content')
        expect(review.rejectedAt).toBeInstanceOf(Date)
      }
    }
  })

  it('should fail with unauthorized role', () => {
    const pendingReview = createPendingReview()
    const input: ModerateReviewInput = {
      review: pendingReview,
      decision: 'APPROVED',
      moderatedBy: 'user-123',
      moderatorRole: 'USER',
    }

    const result = moderateReview(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('administrators')
      expect(result.error.code).toBe('AUTHORIZATION_ERROR')
    }
  })
})
