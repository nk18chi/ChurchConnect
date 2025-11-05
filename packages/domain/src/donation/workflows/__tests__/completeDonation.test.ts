import { describe, it, expect } from '@jest/globals'
import { completeDonation } from '../completeDonation'
import { DonationState } from '../../entities/DonationState'
import { DonationId } from '../../valueObjects/DonationId'
import { Amount } from '../../valueObjects/Amount'

describe('completeDonation', () => {
  const donationId = DonationId.createNew()
  const amountResult = Amount.create(1000)
  if (amountResult.isErr()) throw new Error('Failed to create amount')
  const amount = amountResult.value

  it('should complete a pending donation', () => {
    const pendingDonation: DonationState = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
    }

    const result = completeDonation(pendingDonation)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const completed = result.value
      expect(completed.tag).toBe('Completed')
      expect(completed.id).toBe(donationId)
      expect(completed.userId).toBe('user-123')
      expect(completed.amount).toBe(amount)
      expect(completed.completedAt).toBeInstanceOf(Date)
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

    const result = completeDonation(pendingDonation)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const completed = result.value
      expect(completed.stripePaymentIntentId).toBe('pi_test_123')
      expect(completed.metadata).toEqual({ campaign: 'christmas-2024' })
      expect(completed.createdAt).toBe(pendingDonation.createdAt)
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

    const result = completeDonation(completedDonation)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toContain('Only pending donations can be completed')
    }
  })

  it('should fail if donation is failed', () => {
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

    const result = completeDonation(failedDonation)

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

    const result = completeDonation(refundedDonation)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })
})
