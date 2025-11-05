import { describe, it, expect } from '@jest/globals'
import { Email } from '../Email'

describe('Email', () => {
  it('should create valid email', () => {
    const result = Email.create('admin@church.jp')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('admin@church.jp')
    }
  })

  it('should normalize to lowercase', () => {
    const result = Email.create('ADMIN@CHURCH.JP')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('admin@church.jp')
    }
  })

  it('should fail for invalid format', () => {
    const invalidEmails = [
      'not-an-email',
      '@church.jp',
      'admin@',
      'admin church.jp',
      '',
    ]

    invalidEmails.forEach((invalid) => {
      const result = Email.create(invalid)
      expect(result.isErr()).toBe(true)
    })
  })

  it('should accept valid email formats', () => {
    const validEmails = [
      'simple@example.com',
      'test+tag@example.co.jp',
      'user.name@subdomain.example.com',
    ]

    validEmails.forEach((valid) => {
      const result = Email.create(valid)
      expect(result.isOk()).toBe(true)
    })
  })
})
