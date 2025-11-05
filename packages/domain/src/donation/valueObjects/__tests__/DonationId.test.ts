import { describe, it, expect } from '@jest/globals'
import { DonationId } from '../DonationId'

describe('DonationId', () => {
  it('should create valid donation ID from UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    const result = DonationId.create(uuid)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(String(result.value)).toBe(uuid)
    }
  })

  it('should generate new donation ID', () => {
    const id1 = DonationId.createNew()
    const id2 = DonationId.createNew()

    expect(id1).not.toBe(id2)
    expect(String(id1)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it('should fail for invalid UUID format', () => {
    const result = DonationId.create('not-a-uuid')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail for empty string', () => {
    const result = DonationId.create('')

    expect(result.isErr()).toBe(true)
  })
})
