import { describe, it, expect } from '@jest/globals'
import { Amount } from '../Amount'

describe('Amount', () => {
  it('should create valid amount', () => {
    const result = Amount.create(1000)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(Number(result.value)).toBe(1000)
    }
  })

  it('should accept minimum amount (100)', () => {
    const result = Amount.create(100)

    expect(result.isOk()).toBe(true)
  })

  it('should accept maximum amount (10,000,000)', () => {
    const result = Amount.create(10_000_000)

    expect(result.isOk()).toBe(true)
  })

  it('should fail for amount below minimum', () => {
    const result = Amount.create(99)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail for amount above maximum', () => {
    const result = Amount.create(10_000_001)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail for non-integer amount', () => {
    const result = Amount.create(100.5)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail for negative amount', () => {
    const result = Amount.create(-100)

    expect(result.isErr()).toBe(true)
  })

  it('should fail for zero amount', () => {
    const result = Amount.create(0)

    expect(result.isErr()).toBe(true)
  })
})
