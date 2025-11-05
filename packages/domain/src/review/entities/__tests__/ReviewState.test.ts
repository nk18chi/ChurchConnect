import { describe, it, expect } from '@jest/globals'
import {
  ReviewState,
  PendingReview,
  ApprovedReview,
  RejectedReview,
  RespondedReview,
  isPending,
  isApproved,
  isRejected,
  isResponded,
} from '../ReviewState'
import { ReviewId } from '../../valueObjects/ReviewId'
import { ReviewContent } from '../../valueObjects/ReviewContent'
import { ChurchId } from '../../../church/valueObjects/ChurchId'

describe('ReviewState', () => {
  describe('Type Guards', () => {
    it('should identify Pending state', () => {
      const contentResult = ReviewContent.create('Great church with wonderful community!')
      expect(contentResult.isOk()).toBe(true)
      if (contentResult.isErr()) return

      const pending: PendingReview = {
        tag: 'Pending',
        id: ReviewId.createNew(),
        churchId: ChurchId.createNew(),
        userId: 'user-123',
        content: contentResult.value,
        createdAt: new Date(),
      }

      expect(isPending(pending)).toBe(true)
      expect(isApproved(pending)).toBe(false)
      expect(isRejected(pending)).toBe(false)
      expect(isResponded(pending)).toBe(false)
    })

    it('should identify Approved state', () => {
      const contentResult = ReviewContent.create('Great church with wonderful community!')
      expect(contentResult.isOk()).toBe(true)
      if (contentResult.isErr()) return

      const approved: ApprovedReview = {
        tag: 'Approved',
        id: ReviewId.createNew(),
        churchId: ChurchId.createNew(),
        userId: 'user-123',
        content: contentResult.value,
        approvedAt: new Date(),
        approvedBy: 'admin-123',
        createdAt: new Date(),
      }

      expect(isPending(approved)).toBe(false)
      expect(isApproved(approved)).toBe(true)
      expect(isRejected(approved)).toBe(false)
      expect(isResponded(approved)).toBe(false)
    })

    it('should identify Rejected state', () => {
      const contentResult = ReviewContent.create('Great church with wonderful community!')
      expect(contentResult.isOk()).toBe(true)
      if (contentResult.isErr()) return

      const rejected: RejectedReview = {
        tag: 'Rejected',
        id: ReviewId.createNew(),
        churchId: ChurchId.createNew(),
        userId: 'user-123',
        content: contentResult.value,
        rejectedAt: new Date(),
        rejectedBy: 'admin-123',
        createdAt: new Date(),
      }

      expect(isPending(rejected)).toBe(false)
      expect(isApproved(rejected)).toBe(false)
      expect(isRejected(rejected)).toBe(true)
      expect(isResponded(rejected)).toBe(false)
    })

    it('should identify Responded state', () => {
      const contentResult = ReviewContent.create('Great church with wonderful community!')
      expect(contentResult.isOk()).toBe(true)
      if (contentResult.isErr()) return

      const responded: RespondedReview = {
        tag: 'Responded',
        baseState: 'Approved',
        id: ReviewId.createNew(),
        churchId: ChurchId.createNew(),
        userId: 'user-123',
        content: contentResult.value,
        moderatedAt: new Date(),
        moderatedBy: 'admin-123',
        responseContent: 'Thank you for your review!',
        respondedAt: new Date(),
        respondedBy: 'church-admin-123',
        createdAt: new Date(),
      }

      expect(isPending(responded)).toBe(false)
      expect(isApproved(responded)).toBe(false)
      expect(isRejected(responded)).toBe(false)
      expect(isResponded(responded)).toBe(true)
    })
  })
})
