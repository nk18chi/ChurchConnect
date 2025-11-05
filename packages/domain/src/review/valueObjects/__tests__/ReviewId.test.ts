import { describe, it, expect } from '@jest/globals'
import { ReviewId } from '../ReviewId'

describe('ReviewId', () => {
  it('should create valid review ID from UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    const result = ReviewId.create(uuid)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(uuid)
    }
  })

  it('should fail for invalid UUID format', () => {
    const result = ReviewId.create('not-a-uuid')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('Invalid review ID')
    }
  })

  it('should create new UUID', () => {
    const id = ReviewId.createNew()

    expect(id).toBeTruthy()
    expect(id.length).toBe(36) // UUID length
    // Verify it's a valid UUID format
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })
})
