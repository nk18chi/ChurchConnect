import { describe, it, expect } from '@jest/globals'
import { PostalCode } from '../PostalCode'

describe('PostalCode', () => {
  it('should create valid Japanese postal code', () => {
    const result = PostalCode.create('100-0001')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(String(result.value)).toBe('100-0001')
    }
  })

  it('should normalize format with hyphen', () => {
    const result = PostalCode.create('1000001')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(String(result.value)).toBe('100-0001')
    }
  })

  it('should fail for invalid format', () => {
    const invalidCodes = ['12345', '1234567890', 'abc-defg', '']

    invalidCodes.forEach((invalid) => {
      const result = PostalCode.create(invalid)
      expect(result.isErr()).toBe(true)
    })
  })

  it('should accept valid formats', () => {
    const validCodes = ['100-0001', '1000001', '150-0043', '1500043']

    validCodes.forEach((valid) => {
      const result = PostalCode.create(valid)
      expect(result.isOk()).toBe(true)
    })
  })
})
