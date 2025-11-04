import { describe, it, expect } from '@jest/globals'
import { ChurchMapper } from '../ChurchMapper'
import { ChurchId, ChurchName } from '@repo/domain'
import { Church as PrismaChurch } from '@prisma/client'

describe('ChurchMapper', () => {
  describe('toDomain', () => {
    it('should map draft church from Prisma to domain', () => {
      const prismaChurch: PrismaChurch = {
        id: 'church-123',
        name: 'Tokyo Baptist Church',
        slug: 'tokyo-baptist-church',
        description: 'A church in Tokyo',
        denominationId: 'denom-1',
        prefectureId: 'pref-1',
        cityId: 'city-1',
        address: '123 Street',
        postalCode: '100-0001',
        latitude: null,
        longitude: null,
        phone: null,
        email: null,
        website: null,
        contactEmail: null,
        heroImageUrl: null,
        isVerified: false,
        isComplete: false,
        isDeleted: false,
        isPublished: false,
        publishedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        adminUserId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        searchVector: null,
      }

      const result = ChurchMapper.toDomain(prismaChurch)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Draft')
        expect(result.value.id.toString()).toBe('church-123')
        expect(result.value.name.toString()).toBe('Tokyo Baptist Church')
        expect(result.value.createdAt).toEqual(new Date('2025-01-01'))
      }
    })

    it('should map published church from Prisma to domain', () => {
      const prismaChurch: PrismaChurch = {
        id: 'church-123',
        name: 'Tokyo Baptist Church',
        slug: 'tokyo-baptist-church',
        description: 'A church in Tokyo',
        denominationId: 'denom-1',
        prefectureId: 'pref-1',
        cityId: 'city-1',
        address: '123 Street',
        postalCode: '100-0001',
        latitude: null,
        longitude: null,
        phone: null,
        email: null,
        website: null,
        contactEmail: null,
        heroImageUrl: null,
        isVerified: false,
        isComplete: false,
        isDeleted: false,
        isPublished: true,
        publishedAt: new Date('2025-01-02'),
        verifiedAt: null,
        verifiedBy: null,
        adminUserId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        searchVector: null,
      }

      const result = ChurchMapper.toDomain(prismaChurch)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Published')
        if (result.value.tag === 'Published') {
          expect(result.value.slug).toBe('tokyo-baptist-church')
          expect(result.value.publishedAt).toEqual(new Date('2025-01-02'))
        }
      }
    })

    it('should map verified church from Prisma to domain', () => {
      const prismaChurch: PrismaChurch = {
        id: 'church-123',
        name: 'Tokyo Baptist Church',
        slug: 'tokyo-baptist-church',
        description: 'A church in Tokyo',
        denominationId: 'denom-1',
        prefectureId: 'pref-1',
        cityId: 'city-1',
        address: '123 Street',
        postalCode: '100-0001',
        latitude: null,
        longitude: null,
        phone: null,
        email: null,
        website: null,
        contactEmail: null,
        heroImageUrl: null,
        isVerified: true,
        isComplete: false,
        isDeleted: false,
        isPublished: true,
        publishedAt: new Date('2025-01-02'),
        verifiedAt: new Date('2025-01-03'),
        verifiedBy: 'admin-456',
        adminUserId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-03'),
        searchVector: null,
      }

      const result = ChurchMapper.toDomain(prismaChurch)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Verified')
        if (result.value.tag === 'Verified') {
          expect(result.value.verifiedAt).toEqual(new Date('2025-01-03'))
          expect(result.value.verifiedBy).toBe('admin-456')
        }
      }
    })
  })

  describe('toPrisma', () => {
    it('should map draft church from domain to Prisma', () => {
      const idResult = ChurchId.create('church-123')
      const nameResult = ChurchName.create('Tokyo Baptist Church')

      expect(idResult.isOk() && nameResult.isOk()).toBe(true)
      if (idResult.isErr() || nameResult.isErr()) return

      const draftChurch = {
        tag: 'Draft' as const,
        id: idResult.value,
        name: nameResult.value,
        createdAt: new Date('2025-01-01'),
      }

      const prismaData = ChurchMapper.toPrisma(draftChurch)

      expect(prismaData.id).toBe('church-123')
      expect(prismaData.name).toBe('Tokyo Baptist Church')
      expect(prismaData.isPublished).toBe(false)
      expect(prismaData.slug).toBeNull()
      expect(prismaData.publishedAt).toBeNull()
      expect(prismaData.verifiedAt).toBeNull()
      expect(prismaData.verifiedBy).toBeNull()
    })

    it('should map published church from domain to Prisma', () => {
      const idResult = ChurchId.create('church-123')
      const nameResult = ChurchName.create('Tokyo Baptist Church')

      expect(idResult.isOk() && nameResult.isOk()).toBe(true)
      if (idResult.isErr() || nameResult.isErr()) return

      const publishedChurch = {
        tag: 'Published' as const,
        id: idResult.value,
        name: nameResult.value,
        slug: 'tokyo-baptist-church',
        publishedAt: new Date('2025-01-02'),
        createdAt: new Date('2025-01-01'),
      }

      const prismaData = ChurchMapper.toPrisma(publishedChurch)

      expect(prismaData.isPublished).toBe(true)
      expect(prismaData.slug).toBe('tokyo-baptist-church')
      expect(prismaData.publishedAt).toEqual(new Date('2025-01-02'))
      expect(prismaData.verifiedAt).toBeNull()
      expect(prismaData.verifiedBy).toBeNull()
    })

    it('should map verified church from domain to Prisma', () => {
      const idResult = ChurchId.create('church-123')
      const nameResult = ChurchName.create('Tokyo Baptist Church')

      expect(idResult.isOk() && nameResult.isOk()).toBe(true)
      if (idResult.isErr() || nameResult.isErr()) return

      const verifiedChurch = {
        tag: 'Verified' as const,
        id: idResult.value,
        name: nameResult.value,
        slug: 'tokyo-baptist-church',
        publishedAt: new Date('2025-01-02'),
        verifiedAt: new Date('2025-01-03'),
        verifiedBy: 'admin-456',
        createdAt: new Date('2025-01-01'),
      }

      const prismaData = ChurchMapper.toPrisma(verifiedChurch)

      expect(prismaData.isPublished).toBe(true)
      expect(prismaData.slug).toBe('tokyo-baptist-church')
      expect(prismaData.publishedAt).toEqual(new Date('2025-01-02'))
      expect(prismaData.verifiedAt).toEqual(new Date('2025-01-03'))
      expect(prismaData.verifiedBy).toBe('admin-456')
    })
  })
})
