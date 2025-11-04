import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@repo/database'
import { createChurch, publishChurch, verifyChurch, ChurchId, isDraft, isPublished } from '@repo/domain'
import { PrismaChurchRepository } from '@repo/infrastructure'

/**
 * Integration tests for Church mutations
 * Tests the full stack: GraphQL inputs → Domain workflows → Infrastructure → Database
 *
 * Note: These tests use the repository directly rather than GraphQL executor
 * because setting up full GraphQL context (auth, session) is complex.
 * We're testing the business logic integration, not GraphQL parsing.
 */
describe('Church Mutations Integration', () => {
  let prisma: PrismaClient
  let churchRepo: PrismaChurchRepository
  let testDenominationId: string
  let testPrefectureId: string
  let testCityId: string

  beforeEach(async () => {
    prisma = new PrismaClient()

    // Get reference data IDs (from seeded database)
    const denomination = await prisma.denomination.findFirst()
    const prefecture = await prisma.prefecture.findFirst()
    const city = await prisma.city.findFirst()

    if (!denomination || !prefecture || !city) {
      throw new Error('Database not seeded with reference data')
    }

    testDenominationId = denomination.id
    testPrefectureId = prefecture.id
    testCityId = city.id

    // Create repository with default values for testing
    churchRepo = new PrismaChurchRepository(prisma, {
      denominationId: testDenominationId,
      prefectureId: testPrefectureId,
      cityId: testCityId,
      address: 'Test Address',
    })

    // Clean up any existing test data
    await prisma.church.deleteMany({
      where: {
        name: {
          contains: 'Test Church',
        },
      },
    })
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('createChurch → save flow', () => {
    it('should create draft church and persist to database', async () => {
      // 1. Execute domain workflow
      const churchResult = createChurch({
        name: 'Integration Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      // 2. Persist via repository
      const savedResult = await churchRepo.save(churchResult.value)

      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      // 3. Verify database state
      const dbChurch = await prisma.church.findUnique({
        where: { id: savedResult.value.id.toString() },
      })

      expect(dbChurch).not.toBeNull()
      expect(dbChurch?.name).toBe('Integration Test Church')
      expect(dbChurch?.isPublished).toBe(false)
      expect(dbChurch?.slug).toMatch(/^draft-/)
    })

    it('should reject invalid church name', async () => {
      const churchResult = createChurch({
        name: 'A', // Too short
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isErr()).toBe(true)
      if (churchResult.isOk()) return

      expect(churchResult.error.code).toBe('VALIDATION_ERROR')
      expect(churchResult.error.message).toContain('2 and 200 characters')
    })
  })

  describe('publishChurch → save flow', () => {
    it('should publish draft church and persist to database', async () => {
      // 1. Create draft
      const churchResult = createChurch({
        name: 'Publish Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const savedDraftResult = await churchRepo.save(churchResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      // 2. Publish
      if (!isDraft(savedDraftResult.value)) {
        throw new Error('Expected draft church')
      }
      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      // 3. Persist
      const savedPublishedResult = await churchRepo.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      // 4. Verify database state
      const dbChurch = await prisma.church.findUnique({
        where: { id: savedPublishedResult.value.id.toString() },
      })

      expect(dbChurch).not.toBeNull()
      expect(dbChurch?.isPublished).toBe(true)
      expect(dbChurch?.slug).toBe('publish-test-church')
      expect(dbChurch?.publishedAt).not.toBeNull()
    })
  })

  describe('verifyChurch → save flow', () => {
    it('should verify published church and persist to database', async () => {
      // 1. Create and publish
      const churchResult = createChurch({
        name: 'Verify Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const savedDraftResult = await churchRepo.save(churchResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      if (!isDraft(savedDraftResult.value)) {
        throw new Error('Expected draft church')
      }
      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      const savedPublishedResult = await churchRepo.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      // 2. Verify
      if (!isPublished(savedPublishedResult.value)) {
        throw new Error('Expected published church')
      }
      const verifiedResult = verifyChurch({
        church: savedPublishedResult.value,
        verifiedBy: 'admin-123',
        verifierRole: 'ADMIN',
      })

      expect(verifiedResult.isOk()).toBe(true)
      if (verifiedResult.isErr()) return

      // 3. Persist
      const savedVerifiedResult = await churchRepo.save(verifiedResult.value)
      expect(savedVerifiedResult.isOk()).toBe(true)
      if (savedVerifiedResult.isErr()) return

      // 4. Verify database state
      const dbChurch = await prisma.church.findUnique({
        where: { id: savedVerifiedResult.value.id.toString() },
      })

      expect(dbChurch).not.toBeNull()
      expect(dbChurch?.isPublished).toBe(true)
      expect(dbChurch?.verifiedAt).not.toBeNull()
      expect(dbChurch?.verifiedBy).toBe('admin-123')
    })

    it('should reject verification from non-admin', async () => {
      // Create and publish first
      const churchResult = createChurch({
        name: 'Auth Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const savedDraftResult = await churchRepo.save(churchResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      if (!isDraft(savedDraftResult.value)) {
        throw new Error('Expected draft church')
      }
      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      const savedPublishedResult = await churchRepo.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      // Try to verify as non-admin
      if (!isPublished(savedPublishedResult.value)) {
        throw new Error('Expected published church')
      }
      const verifiedResult = verifyChurch({
        church: savedPublishedResult.value,
        verifiedBy: 'user-123',
        verifierRole: 'USER', // Not ADMIN
      })

      expect(verifiedResult.isErr()).toBe(true)
      if (verifiedResult.isOk()) return

      expect(verifiedResult.error.code).toBe('AUTHORIZATION_ERROR')
      expect(verifiedResult.error.message).toContain('Only platform admins')
    })
  })
})
