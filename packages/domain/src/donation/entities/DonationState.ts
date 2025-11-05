import { DonationId } from '../valueObjects/DonationId'
import { Amount } from '../valueObjects/Amount'

/**
 * Donation State Machine
 *
 * State transitions:
 * 1. Pending -> Completed (when payment succeeds via Stripe webhook)
 * 2. Pending -> Failed (when payment fails via Stripe webhook)
 * 3. Completed -> Refunded (when refund is processed)
 *
 * Business rules:
 * - Only Pending donations can transition to Completed or Failed
 * - Only Completed donations can be refunded
 * - Failed and Refunded are terminal states (no further transitions)
 */

/**
 * Base properties shared across all donation states
 */
interface DonationBase {
  id: DonationId
  userId: string
  amount: Amount
  stripePaymentIntentId: string | null
  metadata: Record<string, string> | null
  createdAt: Date
}

/**
 * Pending donation - payment intent created but not yet confirmed
 */
export interface PendingDonation extends DonationBase {
  tag: 'Pending'
}

/**
 * Completed donation - payment succeeded
 */
export interface CompletedDonation extends DonationBase {
  tag: 'Completed'
  completedAt: Date
}

/**
 * Failed donation - payment failed
 */
export interface FailedDonation extends DonationBase {
  tag: 'Failed'
  failedAt: Date
  failureReason: string
}

/**
 * Refunded donation - payment was completed then refunded
 */
export interface RefundedDonation extends DonationBase {
  tag: 'Refunded'
  completedAt: Date
  refundedAt: Date
  refundReason: string | null
  stripeRefundId: string
}

/**
 * Discriminated union of all donation states
 */
export type DonationState = PendingDonation | CompletedDonation | FailedDonation | RefundedDonation

/**
 * Type guards for donation states
 */
export const isPending = (donation: DonationState): donation is PendingDonation => donation.tag === 'Pending'

export const isCompleted = (donation: DonationState): donation is CompletedDonation => donation.tag === 'Completed'

export const isFailed = (donation: DonationState): donation is FailedDonation => donation.tag === 'Failed'

export const isRefunded = (donation: DonationState): donation is RefundedDonation => donation.tag === 'Refunded'
