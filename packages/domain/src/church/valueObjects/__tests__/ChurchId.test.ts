import { describe, it, expect } from '@jest/globals'
import { ChurchId } from '../ChurchId'

describe('ChurchId', () => {
  it('should create valid church ID', () => {
    const result = ChurchId.create('church-123')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('church-123')
    }
  })

  it('should fail for empty ID', () => {
    const result = ChurchId.create('')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('cannot be empty')
    }
  })

  it('should create new ID', () => {
    const id = ChurchId.createNew()

    expect(id.toString()).toBeTruthy()
    expect(id.toString().length).toBeGreaterThan(0)
  })

  it('should support equality', () => {
    const id1Result = ChurchId.create('same-id')
    const id2Result = ChurchId.create('same-id')
    const id3Result = ChurchId.create('different-id')

    expect(id1Result.isOk() && id2Result.isOk() && id3Result.isOk()).toBe(true)

    if (id1Result.isOk() && id2Result.isOk() && id3Result.isOk()) {
      expect(id1Result.value.equals(id2Result.value)).toBe(true)
      expect(id1Result.value.equals(id3Result.value)).toBe(false)
    }
  })
})
