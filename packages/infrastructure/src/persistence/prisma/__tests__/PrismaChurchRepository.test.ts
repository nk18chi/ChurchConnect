import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { PrismaChurchRepository } from '../PrismaChurchRepository'
import { ChurchId, ChurchName, createChurch, publishChurch } from '@repo/domain'

// Note: These are integration tests that require a test database
describe('PrismaChurchRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaChurchRepository
  let testDenominationId: string
  let testPrefectureId: string
  let testCityId: string

  beforeEach(async () => {
    // Use test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
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
    repository = new PrismaChurchRepository(prisma, {
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

  describe('save', () => {
    it('should save draft church to database', async () => {
      const churchResult = createChurch({
        name: 'Test Church for Save',
        adminUserId: 'user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const saveResult = await repository.save(churchResult.value)

      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isOk()) {
        expect(saveResult.value.tag).toBe('Draft')
        expect(saveResult.value.name.toString()).toBe('Test Church for Save')
      }
    })

    it('should update existing church when saving', async () => {
      // Create draft
      const draftResult = createChurch({
        name: 'Test Church for Update',
        adminUserId: 'user-123',
      })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      // Save draft
      const savedDraftResult = await repository.save(draftResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      // Publish
      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      // Save published
      const savedPublishedResult = await repository.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isOk()) {
        expect(savedPublishedResult.value.tag).toBe('Published')
        if (savedPublishedResult.value.tag === 'Published') {
          expect(savedPublishedResult.value.slug).toBeTruthy()
        }
      }
    })
  })

  describe('findById', () => {
    it('should find church by id', async () => {
      // Create and save church
      const churchResult = createChurch({
        name: 'Test Church for Find',
        adminUserId: 'user-123',
      })
      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const saveResult = await repository.save(churchResult.value)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      // Find by ID
      const findResult = await repository.findById(churchResult.value.id)

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Draft')
      }
    })

    it('should return null for non-existent church', async () => {
      const idResult = ChurchId.create('non-existent-id')
      expect(idResult.isOk()).toBe(true)
      if (idResult.isErr()) return

      const findResult = await repository.findById(idResult.value)

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })
  })

  describe('findBySlug', () => {
    it('should find published church by slug', async () => {
      // Create, save, and publish church
      const draftResult = createChurch({
        name: 'Test Church for Slug',
        adminUserId: 'user-123',
      })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      const savedDraftResult = await repository.save(draftResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      const savedPublishedResult = await repository.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      const slug = publishedResult.value.slug

      // Find by slug
      const findResult = await repository.findBySlug(slug)

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Published')
      }
    })

    it('should return null for non-existent slug', async () => {
      const findResult = await repository.findBySlug('non-existent-slug')

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })
  })

  describe('delete', () => {
    it('should delete church by id', async () => {
      // Create and save church
      const churchResult = createChurch({
        name: 'Test Church for Delete',
        adminUserId: 'user-123',
      })
      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const saveResult = await repository.save(churchResult.value)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      // Delete
      const deleteResult = await repository.delete(churchResult.value.id)
      expect(deleteResult.isOk()).toBe(true)

      // Verify deleted
      const findResult = await repository.findById(churchResult.value.id)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })

    it('should return error for non-existent church', async () => {
      const idResult = ChurchId.create('non-existent-id')
      expect(idResult.isOk()).toBe(true)
      if (idResult.isErr()) return

      const deleteResult = await repository.delete(idResult.value)

      expect(deleteResult.isErr()).toBe(true)
      if (deleteResult.isErr()) {
        expect(deleteResult.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('slugExists', () => {
    it('should return true for existing slug', async () => {
      // Create and publish church
      const draftResult = createChurch({
        name: 'Test Church for Slug Check',
        adminUserId: 'user-123',
      })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      const savedDraftResult = await repository.save(draftResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      await repository.save(publishedResult.value)

      const slug = publishedResult.value.slug

      // Check slug exists
      const existsResult = await repository.slugExists(slug)

      expect(existsResult.isOk()).toBe(true)
      if (existsResult.isOk()) {
        expect(existsResult.value).toBe(true)
      }
    })

    it('should return false for non-existent slug', async () => {
      const existsResult = await repository.slugExists('definitely-does-not-exist')

      expect(existsResult.isOk()).toBe(true)
      if (existsResult.isOk()) {
        expect(existsResult.value).toBe(false)
      }
    })
  })
})
