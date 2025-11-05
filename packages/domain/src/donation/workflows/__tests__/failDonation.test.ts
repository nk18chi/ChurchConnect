import { describe, it, expect } from '@jest/globals'
import { failDonation } from '../failDonation'
import { DonationState } from '../../entities/DonationState'
import { DonationId } from '../../valueObjects/DonationId'
import { Amount } from '../../valueObjects/Amount'

describe('failDonation', () => {
  const donationId = DonationId.createNew()
  const amountResult = Amount.create(1000)
  if (amountResult.isErr()) throw new Error('Failed to create amount')
  const amount = amountResult.value

  it('should fail a pending donation', () => {
    const pendingDonation: DonationState = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
    }

    const result = failDonation(pendingDonation, {
      failureReason: 'Card declined',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const failed = result.value
      expect(failed.tag).toBe('Failed')
      expect(failed.id).toBe(donationId)
      expect(failed.failedAt).toBeInstanceOf(Date)
      expect(failed.failureReason).toBe('Card declined')
    }
  })

  it('should preserve all donation properties', () => {
    const pendingDonation: DonationState = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_test_123',
      metadata: { campaign: 'christmas-2024' },
      createdAt: new Date(),
    }

    const result = failDonation(pendingDonation, {
      failureReason: 'Insufficient funds',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const failed = result.value
      expect(failed.stripePaymentIntentId).toBe('pi_test_123')
      expect(failed.metadata).toEqual({ campaign: 'christmas-2024' })
      expect(failed.createdAt).toBe(pendingDonation.createdAt)
    }
  })

  it('should trim failure reason', () => {
    const pendingDonation: DonationState = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
    }

    const result = failDonation(pendingDonation, {
      failureReason: '  Card declined  ',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.failureReason).toBe('Card declined')
    }
  })

  it('should fail if failure reason is empty', () => {
    const pendingDonation: DonationState = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
    }

    const result = failDonation(pendingDonation, {
      failureReason: '',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toContain('Failure reason is required')
    }
  })

  it('should fail if failure reason is whitespace only', () => {
    const pendingDonation: DonationState = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
    }

    const result = failDonation(pendingDonation, {
      failureReason: '   ',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail if donation is already completed', () => {
    const completedDonation: DonationState = {
      tag: 'Completed',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
      completedAt: new Date(),
    }

    const result = failDonation(completedDonation, {
      failureReason: 'Card declined',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toContain('Only pending donations can be failed')
    }
  })

  it('should fail if donation is already failed', () => {
    const failedDonation: DonationState = {
      tag: 'Failed',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
      failedAt: new Date(),
      failureReason: 'Card declined',
    }

    const result = failDonation(failedDonation, {
      failureReason: 'Another reason',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail if donation is refunded', () => {
    const refundedDonation: DonationState = {
      tag: 'Refunded',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
      completedAt: new Date(),
      refundedAt: new Date(),
      refundReason: 'Customer request',
      stripeRefundId: 're_123',
    }

    const result = failDonation(refundedDonation, {
      failureReason: 'Card declined',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })
})
