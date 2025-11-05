import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { PrismaReviewRepository } from '../PrismaReviewRepository'
import { ReviewId, ReviewContent, ChurchId, PendingReview, ApprovedReview, RejectedReview, RespondedReview } from '@repo/domain'

// Note: These are integration tests that require a test database
describe('PrismaReviewRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaReviewRepository
  let testChurchId: string
  let testUserId: string

  beforeEach(async () => {
    // Use test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })

    // Get test user
    const user = await prisma.user.findFirst()
    if (!user) {
      throw new Error('Database not seeded with user data')
    }
    testUserId = user.id

    // Get test church
    const church = await prisma.church.findFirst()
    if (!church) {
      throw new Error('Database not seeded with church data')
    }
    testChurchId = church.id

    repository = new PrismaReviewRepository(prisma)

    // Clean up ALL reviews for the test church to avoid CUID ID issues
    await prisma.reviewResponse.deleteMany({
      where: {
        review: {
          churchId: testChurchId,
        },
      },
    })
    await prisma.review.deleteMany({
      where: {
        churchId: testChurchId,
      },
    })
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('save and findById', () => {
    it('should save and retrieve pending review', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for pending state')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const pendingReview: PendingReview = {
        tag: 'Pending',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        createdAt: new Date(),
      }

      // Save
      const saveResult = await repository.save(pendingReview)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      expect(saveResult.value.tag).toBe('Pending')

      // Find
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Pending')
        if (findResult.value?.tag === 'Pending') {
          expect(findResult.value.content.toString()).toBe('Test review content for pending state')
          expect(findResult.value.userId).toBe(testUserId)
        }
      }
    })

    it('should save and retrieve approved review', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for approved state')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const approvedReview: ApprovedReview = {
        tag: 'Approved',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        approvedAt: new Date('2025-01-21'),
        approvedBy: 'admin-111',
        moderationNote: 'Approved for publication',
        createdAt: new Date(),
      }

      // Save
      const saveResult = await repository.save(approvedReview)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      expect(saveResult.value.tag).toBe('Approved')

      // Find
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Approved')
        if (findResult.value?.tag === 'Approved') {
          expect(findResult.value.approvedBy).toBe('admin-111')
          expect(findResult.value.moderationNote).toBe('Approved for publication')
        }
      }
    })

    it('should save and retrieve rejected review', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for rejected state')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const rejectedReview: RejectedReview = {
        tag: 'Rejected',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        rejectedAt: new Date('2025-01-21'),
        rejectedBy: 'admin-111',
        moderationNote: 'Contains inappropriate content',
        createdAt: new Date(),
      }

      // Save
      const saveResult = await repository.save(rejectedReview)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      expect(saveResult.value.tag).toBe('Rejected')

      // Find
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Rejected')
        if (findResult.value?.tag === 'Rejected') {
          expect(findResult.value.rejectedBy).toBe('admin-111')
          expect(findResult.value.moderationNote).toBe('Contains inappropriate content')
        }
      }
    })

    it('should save and retrieve responded review with approved base state', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for responded state')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const respondedReview: RespondedReview = {
        tag: 'Responded',
        baseState: 'Approved',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        visitDate: new Date('2025-01-15'),
        experienceType: 'VISITOR',
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        moderationNote: 'Approved for publication',
        responseContent: 'Thank you for your kind words!',
        respondedAt: new Date('2025-01-22'),
        respondedBy: 'church-admin-222',
        createdAt: new Date(),
      }

      // Save
      const saveResult = await repository.save(respondedReview)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      expect(saveResult.value.tag).toBe('Responded')

      // Find
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Responded')
        if (findResult.value?.tag === 'Responded') {
          expect(findResult.value.baseState).toBe('Approved')
          expect(findResult.value.responseContent).toBe('Thank you for your kind words!')
          expect(findResult.value.respondedBy).toBe('church-admin-222')
        }
      }
    })

    it('should save and retrieve responded review with rejected base state', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for responded rejected state')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const respondedReview: RespondedReview = {
        tag: 'Responded',
        baseState: 'Rejected',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        moderationNote: 'Contains inappropriate content',
        responseContent: 'We appreciate your feedback',
        respondedAt: new Date('2025-01-22'),
        respondedBy: 'church-admin-222',
        createdAt: new Date(),
      }

      // Save
      const saveResult = await repository.save(respondedReview)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      expect(saveResult.value.tag).toBe('Responded')

      // Find
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Responded')
        if (findResult.value?.tag === 'Responded') {
          expect(findResult.value.baseState).toBe('Rejected')
          expect(findResult.value.responseContent).toBe('We appreciate your feedback')
        }
      }
    })

    it('should update existing review when saving', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for update')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      // Save pending
      const pendingReview: PendingReview = {
        tag: 'Pending',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        createdAt: new Date(),
      }

      const savePendingResult = await repository.save(pendingReview)
      expect(savePendingResult.isOk()).toBe(true)

      // Update to approved
      const approvedReview: ApprovedReview = {
        tag: 'Approved',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        approvedAt: new Date('2025-01-21'),
        approvedBy: 'admin-111',
        createdAt: new Date(),
      }

      const saveApprovedResult = await repository.save(approvedReview)
      expect(saveApprovedResult.isOk()).toBe(true)
      if (saveApprovedResult.isErr()) return

      expect(saveApprovedResult.value.tag).toBe('Approved')

      // Verify update
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value?.tag).toBe('Approved')
      }
    })

    it('should return null for non-existent review', async () => {
      const idResult = ReviewId.create('00000000-0000-0000-0000-000000000000')
      expect(idResult.isOk()).toBe(true)
      if (idResult.isErr()) return

      const findResult = await repository.findById(idResult.value)

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })
  })

  describe('findByChurchId', () => {
    it('should find all reviews for a church', async () => {
      const churchIdResult = ChurchId.create(testChurchId)
      expect(churchIdResult.isOk()).toBe(true)
      if (churchIdResult.isErr()) return

      // Create multiple reviews
      const review1Id = ReviewId.create(ReviewId.createNew())
      const review2Id = ReviewId.create(ReviewId.createNew())
      const content1Result = ReviewContent.create('Test review content 1 for church')
      const content2Result = ReviewContent.create('Test review content 2 for church')

      expect(review1Id.isOk() && review2Id.isOk() && content1Result.isOk() && content2Result.isOk()).toBe(true)
      if (review1Id.isErr() || review2Id.isErr() || content1Result.isErr() || content2Result.isErr()) return

      const pendingReview: PendingReview = {
        tag: 'Pending',
        id: review1Id.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: content1Result.value,
        createdAt: new Date(),
      }

      const approvedReview: ApprovedReview = {
        tag: 'Approved',
        id: review2Id.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: content2Result.value,
        approvedAt: new Date('2025-01-21'),
        approvedBy: 'admin-111',
        createdAt: new Date(),
      }

      await repository.save(pendingReview)
      await repository.save(approvedReview)

      // Find all
      const findResult = await repository.findByChurchId(churchIdResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value.length).toBeGreaterThanOrEqual(2)
        const tags = findResult.value.map(r => r.tag)
        expect(tags).toContain('Pending')
        expect(tags).toContain('Approved')
      }
    })

    it('should return empty array for church with no reviews', async () => {
      // Create a new church with no reviews
      const testDenomination = await prisma.denomination.findFirst()
      const testPrefecture = await prisma.prefecture.findFirst()
      const testCity = await prisma.city.findFirst()

      if (!testDenomination || !testPrefecture || !testCity) {
        throw new Error('Database not seeded with reference data')
      }

      const newChurch = await prisma.church.create({
        data: {
          name: 'Test Church With No Reviews',
          slug: 'test-church-no-reviews-' + Date.now(),
          denominationId: testDenomination.id,
          prefectureId: testPrefecture.id,
          cityId: testCity.id,
          address: 'Test Address',
          postalCode: '100-0001',
        },
      })

      const churchIdResult = ChurchId.create(newChurch.id)
      expect(churchIdResult.isOk()).toBe(true)
      if (churchIdResult.isErr()) return

      const findResult = await repository.findByChurchId(churchIdResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toEqual([])
      }

      // Clean up
      await prisma.church.delete({ where: { id: newChurch.id } })
    })
  })

  describe('delete', () => {
    it('should delete review by id', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for delete')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const pendingReview: PendingReview = {
        tag: 'Pending',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        createdAt: new Date(),
      }

      await repository.save(pendingReview)

      // Delete
      const deleteResult = await repository.delete(idResult.value)
      expect(deleteResult.isOk()).toBe(true)

      // Verify deleted
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })

    it('should delete review with response (cascade)', async () => {
      const idResult = ReviewId.create(ReviewId.createNew())
      const churchIdResult = ChurchId.create(testChurchId)
      const contentResult = ReviewContent.create('Test review content for cascade delete')

      expect(idResult.isOk() && churchIdResult.isOk() && contentResult.isOk()).toBe(true)
      if (idResult.isErr() || churchIdResult.isErr() || contentResult.isErr()) return

      const respondedReview: RespondedReview = {
        tag: 'Responded',
        baseState: 'Approved',
        id: idResult.value,
        churchId: churchIdResult.value,
        userId: testUserId,
        content: contentResult.value,
        moderatedAt: new Date('2025-01-21'),
        moderatedBy: 'admin-111',
        responseContent: 'Thank you!',
        respondedAt: new Date('2025-01-22'),
        respondedBy: 'church-admin-222',
        createdAt: new Date(),
      }

      await repository.save(respondedReview)

      // Delete (should cascade to response)
      const deleteResult = await repository.delete(idResult.value)
      expect(deleteResult.isOk()).toBe(true)

      // Verify deleted
      const findResult = await repository.findById(idResult.value)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })

    it('should return error for non-existent review', async () => {
      const idResult = ReviewId.create('00000000-0000-0000-0000-000000000000')
      expect(idResult.isOk()).toBe(true)
      if (idResult.isErr()) return

      const deleteResult = await repository.delete(idResult.value)

      expect(deleteResult.isErr()).toBe(true)
      if (deleteResult.isErr()) {
        expect(deleteResult.error.code).toBe('NOT_FOUND')
      }
    })
  })
})
