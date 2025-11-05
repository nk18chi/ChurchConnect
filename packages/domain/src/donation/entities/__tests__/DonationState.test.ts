import { describe, it, expect } from '@jest/globals'
import {
  DonationState,
  isPending,
  isCompleted,
  isFailed,
  isRefunded,
  PendingDonation,
  CompletedDonation,
  FailedDonation,
  RefundedDonation,
} from '../DonationState'
import { DonationId } from '../../valueObjects/DonationId'
import { Amount } from '../../valueObjects/Amount'

describe('DonationState', () => {
  const donationId = DonationId.createNew()
  const amountResult = Amount.create(1000)
  if (amountResult.isErr()) throw new Error('Failed to create amount')
  const amount = amountResult.value

  describe('PendingDonation', () => {
    const pending: PendingDonation = {
      tag: 'Pending',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
    }

    it('should identify as pending', () => {
      expect(isPending(pending)).toBe(true)
      expect(isCompleted(pending)).toBe(false)
      expect(isFailed(pending)).toBe(false)
      expect(isRefunded(pending)).toBe(false)
    })

    it('should have required properties', () => {
      expect(pending.id).toBe(donationId)
      expect(pending.userId).toBe('user-123')
      expect(pending.amount).toBe(amount)
      expect(pending.stripePaymentIntentId).toBe('pi_123')
    })
  })

  describe('CompletedDonation', () => {
    const completed: CompletedDonation = {
      tag: 'Completed',
      id: donationId,
      userId: 'user-123',
      amount,
      stripePaymentIntentId: 'pi_123',
      metadata: null,
      createdAt: new Date(),
      completedAt: new Date(),
    }

    it('should identify as completed', () => {
      expect(isPending(completed)).toBe(false)
      expect(isCompleted(completed)).toBe(true)
      expect(isFailed(completed)).toBe(false)
      expect(isRefunded(completed)).toBe(false)
    })

    it('should have completedAt timestamp', () => {
      expect(completed.completedAt).toBeInstanceOf(Date)
    })
  })

  describe('FailedDonation', () => {
    const failed: FailedDonation = {
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

    it('should identify as failed', () => {
      expect(isPending(failed)).toBe(false)
      expect(isCompleted(failed)).toBe(false)
      expect(isFailed(failed)).toBe(true)
      expect(isRefunded(failed)).toBe(false)
    })

    it('should have failure information', () => {
      expect(failed.failedAt).toBeInstanceOf(Date)
      expect(failed.failureReason).toBe('Card declined')
    })
  })

  describe('RefundedDonation', () => {
    const refunded: RefundedDonation = {
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

    it('should identify as refunded', () => {
      expect(isPending(refunded)).toBe(false)
      expect(isCompleted(refunded)).toBe(false)
      expect(isFailed(refunded)).toBe(false)
      expect(isRefunded(refunded)).toBe(true)
    })

    it('should have refund information', () => {
      expect(refunded.completedAt).toBeInstanceOf(Date)
      expect(refunded.refundedAt).toBeInstanceOf(Date)
      expect(refunded.refundReason).toBe('Customer request')
      expect(refunded.stripeRefundId).toBe('re_123')
    })
  })

  describe('Type guards with discriminated union', () => {
    it('should narrow types correctly with isPending', () => {
      const donation: DonationState = {
        tag: 'Pending',
        id: donationId,
        userId: 'user-123',
        amount,
        stripePaymentIntentId: 'pi_123',
        metadata: null,
        createdAt: new Date(),
      }

      if (isPending(donation)) {
        // TypeScript should know this is PendingDonation
        expect(donation.tag).toBe('Pending')
        // Should NOT have completedAt
        expect('completedAt' in donation).toBe(false)
      }
    })

    it('should narrow types correctly with isCompleted', () => {
      const donation: DonationState = {
        tag: 'Completed',
        id: donationId,
        userId: 'user-123',
        amount,
        stripePaymentIntentId: 'pi_123',
        metadata: null,
        createdAt: new Date(),
        completedAt: new Date(),
      }

      if (isCompleted(donation)) {
        // TypeScript should know this is CompletedDonation
        expect(donation.completedAt).toBeInstanceOf(Date)
        // Should NOT have failedAt
        expect('failedAt' in donation).toBe(false)
      }
    })
  })
})
