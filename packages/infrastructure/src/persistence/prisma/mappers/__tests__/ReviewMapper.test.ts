import { describe, it, expect } from '@jest/globals'
import { ReviewMapper } from '../ReviewMapper'
import { ReviewId, ReviewContent, ChurchId } from '@repo/domain'
import { Review as PrismaReview, ReviewResponse as PrismaReviewResponse, ReviewStatus } from '@prisma/client'

describe('ReviewMapper', () => {
  describe('toDomain', () => {
    it('should map pending review from Prisma to domain', () => {
      const prismaReview: PrismaReview & { response?: PrismaReviewResponse | null } = {
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        churchId: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: 'Great church with welcoming community',
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        status: 'PENDING' as ReviewStatus,
        moderatedAt: null,
        moderatedBy: null,
        moderationNote: null,
        isFlagged: false,
        flagReason: null,
        flaggedAt: null,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20'),
      }

      const result = ReviewMapper.toDomain(prismaReview)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Pending')
        expect(result.value.id.toString()).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
        expect(result.value.churchId.toString()).toBe('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e')
        expect(result.value.userId).toBe('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f')
        expect(result.value.content.toString()).toBe('Great church with welcoming community')
        expect(result.value.visitDate).toEqual(new Date('2025-01-15'))
        expect(result.value.experienceType).toBe('VISITOR')
        expect(result.value.createdAt).toEqual(new Date('2025-01-20'))
      }
    })

    it('should map approved review from Prisma to domain', () => {
      const prismaReview: PrismaReview & { response?: PrismaReviewResponse | null } = {
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        churchId: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: 'Great church with welcoming community',
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        status: 'APPROVED' as ReviewStatus,
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        moderationNote: 'Approved for publication',
        isFlagged: false,
        flagReason: null,
        flaggedAt: null,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-21'),
      }

      const result = ReviewMapper.toDomain(prismaReview)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Approved')
        if (result.value.tag === 'Approved') {
          expect(result.value.approvedAt).toEqual(new Date('2025-01-21'))
          expect(result.value.approvedBy).toBe('admin-111')
          expect(result.value.moderationNote).toBe('Approved for publication')
        }
      }
    })

    it('should map rejected review from Prisma to domain', () => {
      const prismaReview: PrismaReview & { response?: PrismaReviewResponse | null } = {
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        churchId: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: 'Great church with welcoming community',
        visitDate: null,
        experienceType: null,
        status: 'REJECTED' as ReviewStatus,
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        moderationNote: 'Contains inappropriate content',
        isFlagged: false,
        flagReason: null,
        flaggedAt: null,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-21'),
      }

      const result = ReviewMapper.toDomain(prismaReview)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Rejected')
        if (result.value.tag === 'Rejected') {
          expect(result.value.rejectedAt).toEqual(new Date('2025-01-21'))
          expect(result.value.rejectedBy).toBe('admin-111')
          expect(result.value.moderationNote).toBe('Contains inappropriate content')
        }
      }
    })

    it('should map responded review with approved base state from Prisma to domain', () => {
      const prismaReview: PrismaReview & { response: PrismaReviewResponse } = {
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        churchId: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: 'Great church with welcoming community',
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        status: 'APPROVED' as ReviewStatus,
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        moderationNote: 'Approved for publication',
        isFlagged: false,
        flagReason: null,
        flaggedAt: null,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-22'),
        response: {
          id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
          reviewId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          content: 'Thank you for your kind words!',
          respondedBy: 'church-admin-222',
          createdAt: new Date('2025-01-22'),
          updatedAt: new Date('2025-01-22'),
        },
      }

      const result = ReviewMapper.toDomain(prismaReview)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Responded')
        if (result.value.tag === 'Responded') {
          expect(result.value.baseState).toBe('Approved')
          expect(result.value.moderatedAt).toEqual(new Date('2025-01-21'))
          expect(result.value.moderatedBy).toBe('admin-111')
          expect(result.value.moderationNote).toBe('Approved for publication')
          expect(result.value.responseContent).toBe('Thank you for your kind words!')
          expect(result.value.respondedAt).toEqual(new Date('2025-01-22'))
          expect(result.value.respondedBy).toBe('church-admin-222')
        }
      }
    })

    it('should map responded review with rejected base state from Prisma to domain', () => {
      const prismaReview: PrismaReview & { response: PrismaReviewResponse } = {
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        churchId: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: 'Great church with welcoming community',
        visitDate: null,
        experienceType: null,
        status: 'REJECTED' as ReviewStatus,
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        moderationNote: 'Contains inappropriate content',
        isFlagged: false,
        flagReason: null,
        flaggedAt: null,
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-22'),
        response: {
          id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
          reviewId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          content: 'We appreciate your feedback and are addressing your concerns',
          respondedBy: 'church-admin-222',
          createdAt: new Date('2025-01-22'),
          updatedAt: new Date('2025-01-22'),
        },
      }

      const result = ReviewMapper.toDomain(prismaReview)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Responded')
        if (result.value.tag === 'Responded') {
          expect(result.value.baseState).toBe('Rejected')
          expect(result.value.responseContent).toBe('We appreciate your feedback and are addressing your concerns')
        }
      }
    })
  })

  describe('toPrisma', () => {
    it('should map pending review from domain to Prisma', () => {
      const idResult = ReviewId.create('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
      const churchIdResult = ChurchId.create('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e')
      const contentResult = ReviewContent.create('Great church with welcoming community')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const pendingReview = {
        tag: 'Pending' as const,
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: contentResult.value,
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        createdAt: new Date('2025-01-20'),
      }

      const prismaData = ReviewMapper.toPrisma(pendingReview)

      expect(prismaData.id).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
      expect(prismaData.churchId).toBe('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e')
      expect(prismaData.userId).toBe('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f')
      expect(prismaData.content).toBe('Great church with welcoming community')
      expect(prismaData.status).toBe('PENDING')
      expect(prismaData.moderatedAt).toBeNull()
      expect(prismaData.moderatedBy).toBeNull()
      expect(prismaData.moderationNote).toBeNull()
    })

    it('should map approved review from domain to Prisma', () => {
      const idResult = ReviewId.create('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
      const churchIdResult = ChurchId.create('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e')
      const contentResult = ReviewContent.create('Great church with welcoming community')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const approvedReview = {
        tag: 'Approved' as const,
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: contentResult.value,
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        approvedAt: new Date('2025-01-21'),
        approvedBy: 'admin-111',
        moderationNote: 'Approved for publication',
        createdAt: new Date('2025-01-20'),
      }

      const prismaData = ReviewMapper.toPrisma(approvedReview)

      expect(prismaData.status).toBe('APPROVED')
      expect(prismaData.moderatedAt).toEqual(new Date('2025-01-21'))
      expect(prismaData.moderatedBy).toBe('admin-111')
      expect(prismaData.moderationNote).toBe('Approved for publication')
    })

    it('should map rejected review from domain to Prisma', () => {
      const idResult = ReviewId.create('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
      const churchIdResult = ChurchId.create('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e')
      const contentResult = ReviewContent.create('Great church with welcoming community')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const rejectedReview = {
        tag: 'Rejected' as const,
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: contentResult.value,
        rejectedAt: new Date('2025-01-21'),
        rejectedBy: 'admin-111',
        moderationNote: 'Contains inappropriate content',
        createdAt: new Date('2025-01-20'),
      }

      const prismaData = ReviewMapper.toPrisma(rejectedReview)

      expect(prismaData.status).toBe('REJECTED')
      expect(prismaData.moderatedAt).toEqual(new Date('2025-01-21'))
      expect(prismaData.moderatedBy).toBe('admin-111')
      expect(prismaData.moderationNote).toBe('Contains inappropriate content')
    })

    it('should map responded review from domain to Prisma', () => {
      const idResult = ReviewId.create('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d')
      const churchIdResult = ChurchId.create('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e')
      const contentResult = ReviewContent.create('Great church with welcoming community')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const respondedReview = {
        tag: 'Responded' as const,
        baseState: 'Approved' as const,
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
        content: contentResult.value,
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        moderationNote: 'Approved for publication',
        responseContent: 'Thank you for your kind words!',
        respondedAt: new Date('2025-01-22'),
        respondedBy: 'church-admin-222',
        createdAt: new Date('2025-01-20'),
      }

      const prismaData = ReviewMapper.toPrisma(respondedReview)

      expect(prismaData.status).toBe('APPROVED')
      expect(prismaData.moderatedAt).toEqual(new Date('2025-01-21'))
      expect(prismaData.moderatedBy).toBe('admin-111')
      expect(prismaData.moderationNote).toBe('Approved for publication')
    })
  })
})
