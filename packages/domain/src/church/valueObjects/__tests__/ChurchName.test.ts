import { describe, it, expect } from '@jest/globals'
import { ChurchName } from '../ChurchName'

describe('ChurchName', () => {
  it('should create valid church name', () => {
    const result = ChurchName.create('Tokyo Baptist Church')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Tokyo Baptist Church')
    }
  })

  it('should fail for too short name', () => {
    const result = ChurchName.create('A')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('2 and 200')
    }
  })

  it('should fail for too long name', () => {
    const longName = 'A'.repeat(201)
    const result = ChurchName.create(longName)

    expect(result.isErr()).toBe(true)
  })

  it('should trim whitespace', () => {
    const result = ChurchName.create('  Tokyo Church  ')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Tokyo Church')
    }
  })
})
