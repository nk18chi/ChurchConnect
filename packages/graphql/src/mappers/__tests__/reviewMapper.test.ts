import { describe, it, expect } from '@jest/globals'
import { toGraphQLReview } from '../reviewMapper'
import {
  ReviewId,
  ReviewContent,
  ChurchId,
  type PendingReview,
  type ApprovedReview,
  type RejectedReview,
  type RespondedReview,
} from '@repo/domain'

describe('reviewMapper', () => {
  const testReviewId = ReviewId.createNew()
  const testChurchId = ChurchId.createNew()
  const testContent = ReviewContent.create('This is a great church with amazing community!').value as any
  const testUserId = 'user-123'
  const testCreatedAt = new Date('2024-01-15T10:00:00Z')

  describe('toGraphQLReview', () => {
    it('should map Pending review to GraphQL', () => {
      const pendingReview: PendingReview = {
        tag: 'Pending',
        id: testReviewId,
        churchId: testChurchId,
        userId: testUserId,
        content: testContent,
        visitDate: new Date('2024-01-01'),
        experienceType: 'Sunday Service',
        createdAt: testCreatedAt,
      }

      const result = toGraphQLReview(pendingReview)

      expect(result).toMatchObject({
        id: String(testReviewId),
        churchId: String(testChurchId),
        userId: testUserId,
        content: String(testContent),
        status: 'PENDING',
        moderatedAt: null,
        moderatedBy: null,
        moderationNote: null,
        response: null,
      })
    })

    it('should map Approved review to GraphQL', () => {
      const approvedReview: ApprovedReview = {
        tag: 'Approved',
        id: testReviewId,
        churchId: testChurchId,
        userId: testUserId,
        content: testContent,
        visitDate: new Date('2024-01-01'),
        experienceType: 'Sunday Service',
        approvedAt: new Date('2024-01-16T10:00:00Z'),
        approvedBy: 'admin-123',
        moderationNote: 'Looks good',
        createdAt: testCreatedAt,
      }

      const result = toGraphQLReview(approvedReview)

      expect(result).toMatchObject({
        id: String(testReviewId),
        churchId: String(testChurchId),
        userId: testUserId,
        content: String(testContent),
        status: 'APPROVED',
        moderatedAt: approvedReview.approvedAt,
        moderatedBy: 'admin-123',
        moderationNote: 'Looks good',
        response: null,
      })
    })

    it('should map Rejected review to GraphQL', () => {
      const rejectedReview: RejectedReview = {
        tag: 'Rejected',
        id: testReviewId,
        churchId: testChurchId,
        userId: testUserId,
        content: testContent,
        visitDate: new Date('2024-01-01'),
        experienceType: 'Sunday Service',
        rejectedAt: new Date('2024-01-16T10:00:00Z'),
        rejectedBy: 'admin-123',
        moderationNote: 'Inappropriate content',
        createdAt: testCreatedAt,
      }

      const result = toGraphQLReview(rejectedReview)

      expect(result).toMatchObject({
        id: String(testReviewId),
        churchId: String(testChurchId),
        userId: testUserId,
        content: String(testContent),
        status: 'REJECTED',
        moderatedAt: rejectedReview.rejectedAt,
        moderatedBy: 'admin-123',
        moderationNote: 'Inappropriate content',
        response: null,
      })
    })

    it('should map Responded review (Approved base) to GraphQL', () => {
      const respondedReview: RespondedReview = {
        tag: 'Responded',
        baseState: 'Approved',
        id: testReviewId,
        churchId: testChurchId,
        userId: testUserId,
        content: testContent,
        visitDate: new Date('2024-01-01'),
        experienceType: 'Sunday Service',
        moderatedAt: new Date('2024-01-16T10:00:00Z'),
        moderatedBy: 'admin-123',
        moderationNote: 'Approved',
        responseContent: 'Thank you for your feedback!',
        respondedAt: new Date('2024-01-17T10:00:00Z'),
        respondedBy: 'church-admin-123',
        createdAt: testCreatedAt,
      }

      const result = toGraphQLReview(respondedReview)

      expect(result).toMatchObject({
        id: String(testReviewId),
        churchId: String(testChurchId),
        userId: testUserId,
        content: String(testContent),
        status: 'APPROVED', // baseState is Approved
        moderatedAt: respondedReview.moderatedAt,
        moderatedBy: 'admin-123',
        moderationNote: 'Approved',
        response: {
          content: 'Thank you for your feedback!',
          respondedBy: 'church-admin-123',
          createdAt: respondedReview.respondedAt,
        },
      })
    })

    it('should map Responded review (Rejected base) to GraphQL', () => {
      const respondedReview: RespondedReview = {
        tag: 'Responded',
        baseState: 'Rejected',
        id: testReviewId,
        churchId: testChurchId,
        userId: testUserId,
        content: testContent,
        moderatedAt: new Date('2024-01-16T10:00:00Z'),
        moderatedBy: 'admin-123',
        moderationNote: 'Rejected but responded',
        responseContent: 'We appreciate your feedback and will work on improvements.',
        respondedAt: new Date('2024-01-17T10:00:00Z'),
        respondedBy: 'church-admin-123',
        createdAt: testCreatedAt,
      }

      const result = toGraphQLReview(respondedReview)

      expect(result).toMatchObject({
        id: String(testReviewId),
        churchId: String(testChurchId),
        userId: testUserId,
        content: String(testContent),
        status: 'REJECTED', // baseState is Rejected
        moderatedAt: respondedReview.moderatedAt,
        moderatedBy: 'admin-123',
        moderationNote: 'Rejected but responded',
        response: {
          content: 'We appreciate your feedback and will work on improvements.',
          respondedBy: 'church-admin-123',
          createdAt: respondedReview.respondedAt,
        },
      })
    })

    it('should handle optional fields (visitDate, experienceType) as null', () => {
      const pendingReview: PendingReview = {
        tag: 'Pending',
        id: testReviewId,
        churchId: testChurchId,
        userId: testUserId,
        content: testContent,
        // No visitDate or experienceType
        createdAt: testCreatedAt,
      }

      const result = toGraphQLReview(pendingReview)

      expect(result.visitDate).toBeNull()
      expect(result.experienceType).toBeNull()
    })

    it('should handle optional moderation note as null', () => {
      const approvedReview: ApprovedReview = {
        tag: 'Approved',
        id: testReviewId,
        churchId: testChurchId,
        userId: testUserId,
        content: testContent,
        approvedAt: new Date('2024-01-16T10:00:00Z'),
        approvedBy: 'admin-123',
        // No moderationNote
        createdAt: testCreatedAt,
      }

      const result = toGraphQLReview(approvedReview)

      expect(result.moderationNote).toBeNull()
    })
  })
})
