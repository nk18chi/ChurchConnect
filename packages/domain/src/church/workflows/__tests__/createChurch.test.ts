import { describe, it, expect } from '@jest/globals'
import { createChurch, CreateChurchInput } from '../createChurch'
import { isDraft } from '../../entities/ChurchState'

describe('createChurch workflow', () => {
  it('should create draft church with valid input', () => {
    const input: CreateChurchInput = {
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    }

    const result = createChurch(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const church = result.value
      expect(isDraft(church)).toBe(true)
      expect(church.name).toBe('Tokyo Baptist Church')
      expect(church.id).toBeDefined()
      expect(church.createdAt).toBeInstanceOf(Date)
    }
  })

  it('should fail with invalid name', () => {
    const input: CreateChurchInput = {
      name: 'A', // Too short
      adminUserId: 'user-123',
    }

    const result = createChurch(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('2 and 200')
    }
  })

  it('should fail with empty name', () => {
    const input: CreateChurchInput = {
      name: '',
      adminUserId: 'user-123',
    }

    const result = createChurch(input)

    expect(result.isErr()).toBe(true)
  })

  it('should create churches with different IDs', () => {
    const input: CreateChurchInput = {
      name: 'Test Church',
      adminUserId: 'user-123',
    }

    const result1 = createChurch(input)
    const result2 = createChurch(input)

    expect(result1.isOk() && result2.isOk()).toBe(true)
    if (result1.isOk() && result2.isOk()) {
      expect(result1.value.id).not.toBe(result2.value.id)
    }
  })
})
