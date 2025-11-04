import { describe, it, expect } from '@jest/globals'
import { publishChurch } from '../publishChurch'
import { createChurch } from '../createChurch'
import { isPublished } from '../../entities/ChurchState'

describe('publishChurch workflow', () => {
  it('should publish draft church', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    })

    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const result = publishChurch(draftResult.value)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const published = result.value
      expect(isPublished(published)).toBe(true)
      expect(published.slug).toBe('tokyo-baptist-church')
      expect(published.name.equals(draftResult.value.name)).toBe(true)
      expect(published.id.equals(draftResult.value.id)).toBe(true)
      expect(published.publishedAt).toBeInstanceOf(Date)
    }
  })

  it('should generate valid slug from name', () => {
    const testCases = [
      { name: 'Tokyo Baptist Church', expectedSlug: 'tokyo-baptist-church' },
      { name: 'St. Mary Catholic Church', expectedSlug: 'st-mary-catholic-church' },
      { name: 'Christ  Church  Tokyo', expectedSlug: 'christ-church-tokyo' },
      { name: 'Church-With-Hyphens', expectedSlug: 'church-with-hyphens' },
    ]

    testCases.forEach(({ name, expectedSlug }) => {
      const draftResult = createChurch({ name, adminUserId: 'user-123' })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      const result = publishChurch(draftResult.value)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.slug).toBe(expectedSlug)
      }
    })
  })

  it('should fail for too short slug', () => {
    const draftResult = createChurch({ name: 'AB', adminUserId: 'user-123' })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const result = publishChurch(draftResult.value)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('slug')
    }
  })
})
