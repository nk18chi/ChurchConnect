import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@repo/database'
import { submitReview, moderateReview, respondToReview, isPending, isApproved } from '@repo/domain'
import { PrismaReviewRepository } from '@repo/infrastructure'

/**
 * Integration tests for Review mutations
 * Tests the full stack: GraphQL inputs → Domain workflows → Infrastructure → Database
 *
 * Note: These tests use the repository directly rather than GraphQL executor
 * because setting up full GraphQL context (auth, session) is complex.
 * We're testing the business logic integration, not GraphQL parsing.
 */
describe('Review Mutations Integration', () => {
  let prisma: PrismaClient
  let reviewRepo: PrismaReviewRepository
  let testChurchId: string
  let testUserId: string

  beforeEach(async () => {
    prisma = new PrismaClient()
    reviewRepo = new PrismaReviewRepository(prisma)

    // Get test church (from seeded database)
    const church = await prisma.church.findFirst({
      where: { isPublished: true },
    })

    if (!church) {
      throw new Error('Database not seeded with published church')
    }

    testChurchId = church.id

    // Create or get test user
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      create: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      },
      update: {},
    })

    testUserId = user.id

    // Clean up any existing test reviews
    await prisma.review.deleteMany({
      where: {
        churchId: testChurchId,
        content: { contains: 'Integration Test' },
      },
    })
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('submitReview → save flow', () => {
    it('should create pending review and persist to database', async () => {
      // 1. Execute domain workflow
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'Integration Test: Great church with amazing community!',
        visitDate: new Date('2024-01-15'),
        experienceType: 'Sunday Service',
      })

      expect(reviewResult.isOk()).toBe(true)
      if (reviewResult.isErr()) return

      // 2. Verify it's a pending review
      expect(isPending(reviewResult.value)).toBe(true)

      // 3. Persist via repository
      const savedResult = await reviewRepo.save(reviewResult.value)

      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      // 4. Verify database state
      const dbReview = await prisma.review.findUnique({
        where: { id: String(savedResult.value.id) },
      })

      expect(dbReview).not.toBeNull()
      expect(dbReview?.content).toBe('Integration Test: Great church with amazing community!')
      expect(dbReview?.status).toBe('PENDING')
      expect(dbReview?.userId).toBe(testUserId)
      expect(dbReview?.churchId).toBe(testChurchId)
    })

    it('should reject invalid review content (too short)', async () => {
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'Short', // Too short (< 10 chars)
      })

      expect(reviewResult.isErr()).toBe(true)
      if (reviewResult.isOk()) return

      expect(reviewResult.error.code).toBe('VALIDATION_ERROR')
      expect(reviewResult.error.message).toContain('10 and 2000 characters')
    })

    it('should reject invalid review content (too long)', async () => {
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'a'.repeat(2001), // Too long (> 2000 chars)
      })

      expect(reviewResult.isErr()).toBe(true)
      if (reviewResult.isOk()) return

      expect(reviewResult.error.code).toBe('VALIDATION_ERROR')
      expect(reviewResult.error.message).toContain('10 and 2000 characters')
    })
  })

  describe('moderateReview → save flow', () => {
    it('should approve pending review and persist to database', async () => {
      // 1. Create pending review
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'Integration Test: This church has a great worship team!',
      })

      expect(reviewResult.isOk()).toBe(true)
      if (reviewResult.isErr()) return

      const savedPendingResult = await reviewRepo.save(reviewResult.value)
      expect(savedPendingResult.isOk()).toBe(true)
      if (savedPendingResult.isErr()) return

      // 2. Moderate (approve)
      if (!isPending(savedPendingResult.value)) {
        throw new Error('Expected pending review')
      }

      const moderatedResult = moderateReview({
        review: savedPendingResult.value,
        decision: 'APPROVED',
        moderatedBy: 'admin-123',
        moderatorRole: 'ADMIN',
        moderationNote: 'Looks good',
      })

      expect(moderatedResult.isOk()).toBe(true)
      if (moderatedResult.isErr()) return

      expect(isApproved(moderatedResult.value)).toBe(true)

      // 3. Persist
      const savedModeratedResult = await reviewRepo.save(moderatedResult.value)
      expect(savedModeratedResult.isOk()).toBe(true)
      if (savedModeratedResult.isErr()) return

      // 4. Verify database state
      const dbReview = await prisma.review.findUnique({
        where: { id: String(savedModeratedResult.value.id) },
      })

      expect(dbReview).not.toBeNull()
      expect(dbReview?.status).toBe('APPROVED')
      expect(dbReview?.moderatedBy).toBe('admin-123')
      expect(dbReview?.moderationNote).toBe('Looks good')
      expect(dbReview?.moderatedAt).not.toBeNull()
    })

    it('should reject pending review and persist to database', async () => {
      // 1. Create pending review
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'Integration Test: Inappropriate content here',
      })

      expect(reviewResult.isOk()).toBe(true)
      if (reviewResult.isErr()) return

      const savedPendingResult = await reviewRepo.save(reviewResult.value)
      expect(savedPendingResult.isOk()).toBe(true)
      if (savedPendingResult.isErr()) return

      // 2. Moderate (reject)
      if (!isPending(savedPendingResult.value)) {
        throw new Error('Expected pending review')
      }

      const moderatedResult = moderateReview({
        review: savedPendingResult.value,
        decision: 'REJECTED',
        moderatedBy: 'admin-123',
        moderatorRole: 'ADMIN',
        moderationNote: 'Contains inappropriate content',
      })

      expect(moderatedResult.isOk()).toBe(true)
      if (moderatedResult.isErr()) return

      // 3. Persist
      const savedModeratedResult = await reviewRepo.save(moderatedResult.value)
      expect(savedModeratedResult.isOk()).toBe(true)
      if (savedModeratedResult.isErr()) return

      // 4. Verify database state
      const dbReview = await prisma.review.findUnique({
        where: { id: String(savedModeratedResult.value.id) },
      })

      expect(dbReview).not.toBeNull()
      expect(dbReview?.status).toBe('REJECTED')
      expect(dbReview?.moderatedBy).toBe('admin-123')
      expect(dbReview?.moderationNote).toBe('Contains inappropriate content')
      expect(dbReview?.moderatedAt).not.toBeNull()
    })

    it('should reject moderation from non-admin', async () => {
      // Create pending review first
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'Integration Test: Auth test review',
      })

      expect(reviewResult.isOk()).toBe(true)
      if (reviewResult.isErr()) return

      const savedPendingResult = await reviewRepo.save(reviewResult.value)
      expect(savedPendingResult.isOk()).toBe(true)
      if (savedPendingResult.isErr()) return

      // Try to moderate as USER
      if (!isPending(savedPendingResult.value)) {
        throw new Error('Expected pending review')
      }

      const moderatedResult = moderateReview({
        review: savedPendingResult.value,
        decision: 'APPROVED',
        moderatedBy: 'user-123',
        moderatorRole: 'USER', // Not ADMIN or CHURCH_ADMIN
        moderationNote: 'Trying to moderate',
      })

      expect(moderatedResult.isErr()).toBe(true)
      if (moderatedResult.isOk()) return

      expect(moderatedResult.error.code).toBe('AUTHORIZATION_ERROR')
      expect(moderatedResult.error.message).toContain('Only administrators')
    })
  })

  describe('respondToReview → save flow', () => {
    it('should add response to approved review and persist to database', async () => {
      // 1. Create and approve review
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'Integration Test: Looking forward to visiting again!',
      })

      expect(reviewResult.isOk()).toBe(true)
      if (reviewResult.isErr()) return

      const savedPendingResult = await reviewRepo.save(reviewResult.value)
      expect(savedPendingResult.isOk()).toBe(true)
      if (savedPendingResult.isErr()) return

      if (!isPending(savedPendingResult.value)) {
        throw new Error('Expected pending review')
      }

      const moderatedResult = moderateReview({
        review: savedPendingResult.value,
        decision: 'APPROVED',
        moderatedBy: 'admin-123',
        moderatorRole: 'ADMIN',
      })

      expect(moderatedResult.isOk()).toBe(true)
      if (moderatedResult.isErr()) return

      const savedModeratedResult = await reviewRepo.save(moderatedResult.value)
      expect(savedModeratedResult.isOk()).toBe(true)
      if (savedModeratedResult.isErr()) return

      // 2. Respond to review
      if (!isApproved(savedModeratedResult.value)) {
        throw new Error('Expected approved review')
      }

      const respondedResult = respondToReview({
        review: savedModeratedResult.value,
        responseContent: 'Thank you for visiting! We look forward to seeing you again.',
        respondedBy: 'church-admin-123',
      })

      expect(respondedResult.isOk()).toBe(true)
      if (respondedResult.isErr()) return

      // 3. Persist
      const savedRespondedResult = await reviewRepo.save(respondedResult.value)
      expect(savedRespondedResult.isOk()).toBe(true)
      if (savedRespondedResult.isErr()) return

      // 4. Verify database state
      const dbReview = await prisma.review.findUnique({
        where: { id: String(savedRespondedResult.value.id) },
        include: { response: true },
      })

      expect(dbReview).not.toBeNull()
      expect(dbReview?.status).toBe('APPROVED')
      expect(dbReview?.response).not.toBeNull()
      expect(dbReview?.response?.content).toBe('Thank you for visiting! We look forward to seeing you again.')
      expect(dbReview?.response?.respondedBy).toBe('church-admin-123')
    })

    it('should reject response content that is too short', async () => {
      // Create and approve review first
      const reviewResult = submitReview({
        churchId: testChurchId,
        userId: testUserId,
        content: 'Integration Test: Response validation test',
      })

      expect(reviewResult.isOk()).toBe(true)
      if (reviewResult.isErr()) return

      const savedPendingResult = await reviewRepo.save(reviewResult.value)
      if (savedPendingResult.isErr()) return

      if (!isPending(savedPendingResult.value)) {
        throw new Error('Expected pending review')
      }

      const moderatedResult = moderateReview({
        review: savedPendingResult.value,
        decision: 'APPROVED',
        moderatedBy: 'admin-123',
        moderatorRole: 'ADMIN',
      })

      if (moderatedResult.isErr()) return

      const savedModeratedResult = await reviewRepo.save(moderatedResult.value)
      if (savedModeratedResult.isErr()) return

      if (!isApproved(savedModeratedResult.value)) {
        throw new Error('Expected approved review')
      }

      // Try to respond with too-short content
      const respondedResult = respondToReview({
        review: savedModeratedResult.value,
        responseContent: 'Short', // Too short (< 10 chars)
        respondedBy: 'church-admin-123',
      })

      expect(respondedResult.isErr()).toBe(true)
      if (respondedResult.isOk()) return

      expect(respondedResult.error.code).toBe('VALIDATION_ERROR')
      expect(respondedResult.error.message).toContain('at least 10 characters')
    })
  })
})
