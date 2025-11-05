import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'
import { DonationState, isPending, CompletedDonation } from '../entities/DonationState'

/**
 * Complete a pending donation
 *
 * Business rules:
 * - Only Pending donations can be completed
 * - Called when Stripe payment succeeds (via webhook)
 *
 * State transition: Pending -> Completed
 *
 * @param donation - The donation to complete
 * @returns CompletedDonation or ValidationError
 */
export function completeDonation(donation: DonationState): Result<CompletedDonation, ValidationError> {
  // Validate current state
  if (!isPending(donation)) {
    return err(new ValidationError('Only pending donations can be completed'))
  }

  // Transition to Completed state
  const completedDonation: CompletedDonation = {
    ...donation,
    tag: 'Completed',
    completedAt: new Date(),
  }

  return ok(completedDonation)
}
