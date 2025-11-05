import { describe, it, expect } from '@jest/globals'
import { createDonation } from '../createDonation'

describe('createDonation', () => {
  it('should create pending donation with valid input', () => {
    const result = createDonation({
      userId: 'user-123',
      amount: 1000,
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const donation = result.value
      expect(donation.tag).toBe('Pending')
      expect(donation.userId).toBe('user-123')
      expect(Number(donation.amount)).toBe(1000)
      expect(donation.stripePaymentIntentId).toBeNull()
      expect(donation.metadata).toBeNull()
      expect(donation.createdAt).toBeInstanceOf(Date)
    }
  })

  it('should create donation with stripe payment intent ID', () => {
    const result = createDonation({
      userId: 'user-123',
      amount: 5000,
      stripePaymentIntentId: 'pi_test_123',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.stripePaymentIntentId).toBe('pi_test_123')
    }
  })

  it('should create donation with metadata', () => {
    const result = createDonation({
      userId: 'user-123',
      amount: 2000,
      metadata: {
        campaign: 'christmas-2024',
        dedication: 'In memory of John Doe',
      },
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.metadata).toEqual({
        campaign: 'christmas-2024',
        dedication: 'In memory of John Doe',
      })
    }
  })

  it('should fail for missing user ID', () => {
    const result = createDonation({
      userId: '',
      amount: 1000,
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toContain('User ID is required')
    }
  })

  it('should fail for whitespace-only user ID', () => {
    const result = createDonation({
      userId: '   ',
      amount: 1000,
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail for invalid amount (too low)', () => {
    const result = createDonation({
      userId: 'user-123',
      amount: 50,
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail for invalid amount (too high)', () => {
    const result = createDonation({
      userId: 'user-123',
      amount: 20_000_000,
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail for invalid amount (not integer)', () => {
    const result = createDonation({
      userId: 'user-123',
      amount: 100.5,
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should trim user ID', () => {
    const result = createDonation({
      userId: '  user-123  ',
      amount: 1000,
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.userId).toBe('user-123')
    }
  })

  it('should generate unique donation IDs', () => {
    const result1 = createDonation({ userId: 'user-1', amount: 1000 })
    const result2 = createDonation({ userId: 'user-2', amount: 1000 })

    expect(result1.isOk()).toBe(true)
    expect(result2.isOk()).toBe(true)

    if (result1.isOk() && result2.isOk()) {
      expect(result1.value.id).not.toBe(result2.value.id)
    }
  })
})
