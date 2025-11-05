import { describe, it, expect } from '@jest/globals'
import { respondToReview, RespondToReviewInput } from '../respondToReview'
import { ApprovedReview, isResponded } from '../../entities/ReviewState'
import { ReviewId } from '../../valueObjects/ReviewId'
import { ReviewContent } from '../../valueObjects/ReviewContent'
import { ChurchId } from '../../../church/valueObjects/ChurchId'

describe('respondToReview workflow', () => {
  const createApprovedReview = (): ApprovedReview => {
    const contentResult = ReviewContent.create('Great church with wonderful community!')
    if (contentResult.isErr()) throw new Error('Failed to create content')

    return {
      tag: 'Approved',
      id: ReviewId.createNew(),
      churchId: ChurchId.createNew(),
      userId: 'user-123',
      content: contentResult.value,
      approvedAt: new Date(),
      approvedBy: 'admin-123',
      createdAt: new Date(),
    }
  }

  it('should respond to approved review with valid input', () => {
    const approvedReview = createApprovedReview()
    const input: RespondToReviewInput = {
      review: approvedReview,
      responseContent: 'Thank you for your wonderful review! We appreciate your feedback.',
      respondedBy: 'church-admin-123',
    }

    const result = respondToReview(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const review = result.value
      expect(isResponded(review)).toBe(true)
      expect(review.baseState).toBe('Approved')
      expect(review.responseContent).toBe('Thank you for your wonderful review! We appreciate your feedback.')
      expect(review.respondedBy).toBe('church-admin-123')
      expect(review.respondedAt).toBeInstanceOf(Date)
    }
  })

  it('should fail with too short response content', () => {
    const approvedReview = createApprovedReview()
    const input: RespondToReviewInput = {
      review: approvedReview,
      responseContent: 'Too short',
      respondedBy: 'church-admin-123',
    }

    const result = respondToReview(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('at least 10 characters')
    }
  })

  it('should fail with too long response content', () => {
    const approvedReview = createApprovedReview()
    const input: RespondToReviewInput = {
      review: approvedReview,
      responseContent: 'A'.repeat(2001),
      respondedBy: 'church-admin-123',
    }

    const result = respondToReview(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('2000 characters')
    }
  })
})
