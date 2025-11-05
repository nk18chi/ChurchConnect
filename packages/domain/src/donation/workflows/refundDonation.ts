import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'
import { DonationState, isCompleted, RefundedDonation } from '../entities/DonationState'

/**
 * Input for refunding a donation
 */
export interface RefundDonationInput {
  stripeRefundId: string
  refundReason?: string
}

/**
 * Refund a completed donation
 *
 * Business rules:
 * - Only Completed donations can be refunded
 * - Called after Stripe refund is processed
 * - Stripe refund ID is required for audit trail
 * - Refund reason is optional but recommended
 *
 * State transition: Completed -> Refunded
 *
 * @param donation - The donation to refund
 * @param input - Refund information
 * @returns RefundedDonation or ValidationError
 */
export function refundDonation(
  donation: DonationState,
  input: RefundDonationInput
): Result<RefundedDonation, ValidationError> {
  // Validate current state
  if (!isCompleted(donation)) {
    return err(new ValidationError('Only completed donations can be refunded'))
  }

  // Validate Stripe refund ID
  if (!input.stripeRefundId || input.stripeRefundId.trim() === '') {
    return err(new ValidationError('Stripe refund ID is required'))
  }

  // Transition to Refunded state
  const refundedDonation: RefundedDonation = {
    ...donation,
    tag: 'Refunded',
    refundedAt: new Date(),
    refundReason: input.refundReason?.trim() ?? null,
    stripeRefundId: input.stripeRefundId.trim(),
  }

  return ok(refundedDonation)
}
