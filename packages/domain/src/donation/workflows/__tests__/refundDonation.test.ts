import { describe, it, expect } from '@jest/globals'
import { refundDonation } from '../refundDonation'
import { DonationState } from '../../entities/DonationState'
import { DonationId } from '../../valueObjects/DonationId'
import { Amount } from '../../valueObjects/Amount'

describe('refundDonation', () => {
  const donationId = DonationId.createNew()
  const amountResult = Amount.create(1000)
  if (amountResult.isErr()) throw new Error('Failed to create amount')
  const amount = amountResult.value

  it('should refund a completed donation', () => {
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

    const result = refundDonation(completedDonation, {
      stripeRefundId: 're_123',
      refundReason: 'Customer request',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const refunded = result.value
      expect(refunded.tag).toBe('Refunded')
      expect(refunded.id).toBe(donationId)
      expect(refunded.completedAt).toBe(completedDonation.completedAt)
      expect(refunded.refundedAt).toBeInstanceOf(Date)
      expect(refunded.stripeRefundId).toBe('re_123')
      expect(refunded.refundReason).toBe('Customer request')
    }
  })

  it('should refund without reason', () => {
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

    const result = refundDonation(completedDonation, {
      stripeRefundId: 're_123',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.refundReason).toBeNull()
    }
  })

  it('should preserve all donation properties', () => {
    const completedDonation: DonationState = {
      tag: 'Completed',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_test_123',
      metadata: { campaign: 'christmas-2024' },
      createdAt: new Date(),
      completedAt: new Date(),
    }

    const result = refundDonation(completedDonation, {
      stripeRefundId: 're_123',
      refundReason: 'Duplicate charge',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const refunded = result.value
      expect(refunded.stripePaymentIntentId).toBe('pi_test_123')
      expect(refunded.metadata).toEqual({ campaign: 'christmas-2024' })
      expect(refunded.createdAt).toBe(completedDonation.createdAt)
    }
  })

  it('should trim stripe refund ID and reason', () => {
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

    const result = refundDonation(completedDonation, {
      stripeRefundId: '  re_123  ',
      refundReason: '  Customer request  ',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.stripeRefundId).toBe('re_123')
      expect(result.value.refundReason).toBe('Customer request')
    }
  })

  it('should fail if stripe refund ID is empty', () => {
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

    const result = refundDonation(completedDonation, {
      stripeRefundId: '',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toContain('Stripe refund ID is required')
    }
  })

  it('should fail if stripe refund ID is whitespace only', () => {
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

    const result = refundDonation(completedDonation, {
      stripeRefundId: '   ',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail if donation is pending', () => {
    const pendingDonation: DonationState = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
    }

    const result = refundDonation(pendingDonation, {
      stripeRefundId: 're_123',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toContain('Only completed donations can be refunded')
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

    const result = refundDonation(failedDonation, {
      stripeRefundId: 're_123',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should fail if donation is already refunded', () => {
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

    const result = refundDonation(refundedDonation, {
      stripeRefundId: 're_456',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })
})
