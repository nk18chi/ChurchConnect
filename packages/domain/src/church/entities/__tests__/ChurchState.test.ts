import { describe, it, expect } from '@jest/globals'
import {
  ChurchState,
  DraftChurch,
  PublishedChurch,
  VerifiedChurch,
  isDraft,
  isPublished,
  isVerified,
} from '../ChurchState'
import { ChurchId } from '../../valueObjects/ChurchId'
import { ChurchName } from '../../valueObjects/ChurchName'

describe('ChurchState', () => {
  describe('Type Guards', () => {
    it('should identify Draft state', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const draft: DraftChurch = {
        tag: 'Draft',
        id: ChurchId.createNew(),
        name: nameResult.value,
        createdAt: new Date(),
      }

      expect(isDraft(draft)).toBe(true)
      expect(isPublished(draft)).toBe(false)
      expect(isVerified(draft)).toBe(false)
    })

    it('should identify Published state', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const published: PublishedChurch = {
        tag: 'Published',
        id: ChurchId.createNew(),
        name: nameResult.value,
        slug: 'test-church',
        publishedAt: new Date(),
        createdAt: new Date(),
      }

      expect(isDraft(published)).toBe(false)
      expect(isPublished(published)).toBe(true)
      expect(isVerified(published)).toBe(false)
    })

    it('should identify Verified state', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const verified: VerifiedChurch = {
        tag: 'Verified',
        id: ChurchId.createNew(),
        name: nameResult.value,
        slug: 'test-church',
        publishedAt: new Date(),
        verifiedAt: new Date(),
        verifiedBy: 'admin-123',
        createdAt: new Date(),
      }

      expect(isDraft(verified)).toBe(false)
      expect(isPublished(verified)).toBe(false)
      expect(isVerified(verified)).toBe(true)
    })
  })

  describe('Type Safety', () => {
    it('should enforce state-specific properties at compile time', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const church: ChurchState = {
        tag: 'Draft',
        id: ChurchId.createNew(),
        name: nameResult.value,
        createdAt: new Date(),
      }

      if (isDraft(church)) {
        // TypeScript knows church is DraftChurch here
        expect(church.tag).toBe('Draft')
        // @ts-expect-error - slug doesn't exist on Draft
        expect(church.slug).toBeUndefined()
      }

      if (isPublished(church)) {
        // This block won't execute, but TypeScript knows church is PublishedChurch
        expect(church.slug).toBeDefined()
      }
    })
  })
})
