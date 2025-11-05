import { describe, it, expect } from '@jest/globals'
import { submitReview, InvalidatedReviewInput } from '../submitReview'
import { isPending } from '../../entities/ReviewState'
import { ChurchId } from '../../../church/valueObjects/ChurchId'

describe('submitReview workflow', () => {
  it('should create pending review with valid input', () => {
    const input: InvalidatedReviewInput = {
      churchId: ChurchId.createNew(),
      userId: 'user-123',
      content: 'Great church with wonderful community and inspiring sermons!',
      visitDate: new Date('2025-01-01'),
      experienceType: 'Sunday Service',
    }

    const result = submitReview(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const review = result.value
      expect(isPending(review)).toBe(true)
      expect(review.content).toBe('Great church with wonderful community and inspiring sermons!')
      expect(review.userId).toBe('user-123')
      expect(review.visitDate).toEqual(new Date('2025-01-01'))
      expect(review.experienceType).toBe('Sunday Service')
      expect(review.id).toBeDefined()
      expect(review.createdAt).toBeInstanceOf(Date)
    }
  })

  it('should fail with invalid content (too short)', () => {
    const input: InvalidatedReviewInput = {
      churchId: ChurchId.createNew(),
      userId: 'user-123',
      content: 'Too short',
    }

    const result = submitReview(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000')
    }
  })

  it('should fail with empty church ID', () => {
    const input: InvalidatedReviewInput = {
      churchId: '',
      userId: 'user-123',
      content: 'Great church with wonderful community!',
    }

    const result = submitReview(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('Church ID')
    }
  })
})
