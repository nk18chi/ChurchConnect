import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'
import { DonationState, isPending, FailedDonation } from '../entities/DonationState'

/**
 * Input for failing a donation
 */
export interface FailDonationInput {
  failureReason: string
}

/**
 * Mark a pending donation as failed
 *
 * Business rules:
 * - Only Pending donations can be failed
 * - Called when Stripe payment fails (via webhook)
 * - Failure reason is required for audit/debugging
 *
 * State transition: Pending -> Failed
 *
 * @param donation - The donation to fail
 * @param input - Failure information
 * @returns FailedDonation or ValidationError
 */
export function failDonation(donation: DonationState, input: FailDonationInput): Result<FailedDonation, ValidationError> {
  // Validate current state
  if (!isPending(donation)) {
    return err(new ValidationError('Only pending donations can be failed'))
  }

  // Validate failure reason
  if (!input.failureReason || input.failureReason.trim() === '') {
    return err(new ValidationError('Failure reason is required'))
  }

  // Transition to Failed state
  const failedDonation: FailedDonation = {
    ...donation,
    tag: 'Failed',
    failedAt: new Date(),
    failureReason: input.failureReason.trim(),
  }

  return ok(failedDonation)
}
