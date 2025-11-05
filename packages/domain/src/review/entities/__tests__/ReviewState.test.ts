import {
  isPending,
  isApproved,
  isRejected,
  isResponded,
  PendingReview,
  ApprovedReview,
  RejectedReview,
  RespondedReview
} from '../ReviewState'
import { ReviewId } from '../../valueObjects/ReviewId'
import { ReviewContent } from '../../valueObjects/ReviewContent'
import { ChurchId } from '../../../church/valueObjects/ChurchId'

describe('ReviewState type guards', () => {
  const reviewId = ReviewId.createNew()
  const churchId = ChurchId.createNew()
  const userId = 'user-123'
  const contentResult = ReviewContent.create('Great church!')

  if (contentResult.isErr()) throw new Error('Test setup failed')
  const content = contentResult.value

  it('should identify pending review', () => {
    const review: PendingReview = {
      tag: 'Pending',
      id: reviewId,
      churchId,
      userId,
      content,
      createdAt: new Date(),
    }

    expect(isPending(review)).toBe(true)
    expect(isApproved(review)).toBe(false)
  })

  it('should identify approved review', () => {
    const review: ApprovedReview = {
      tag: 'Approved',
      id: reviewId,
      churchId,
      userId,
      content,
      moderatedAt: new Date(),
      moderatedBy: 'admin-123',
      createdAt: new Date(),
    }

    expect(isApproved(review)).toBe(true)
    expect(isPending(review)).toBe(false)
  })

  it('should identify rejected review', () => {
    const review: RejectedReview = {
      tag: 'Rejected',
      id: reviewId,
      churchId,
      userId,
      content,
      moderatedAt: new Date(),
      moderatedBy: 'admin-123',
      moderationNote: 'Spam',
      createdAt: new Date(),
    }

    expect(isRejected(review)).toBe(true)
    expect(isPending(review)).toBe(false)
  })

  it('should identify responded review', () => {
    const review: RespondedReview = {
      tag: 'Responded',
      baseState: 'Approved' as const,
      id: reviewId,
      churchId,
      userId,
      content,
      moderatedAt: new Date(),
      moderatedBy: 'admin-123',
      responseContent: 'Thank you for your feedback!',
      respondedBy: 'church-admin-456',
      respondedAt: new Date(),
      createdAt: new Date(),
    }

    expect(isResponded(review)).toBe(true)
    expect(isApproved(review)).toBe(false)
  })
})
