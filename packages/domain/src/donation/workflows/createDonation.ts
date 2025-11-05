import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'
import { PendingDonation } from '../entities/DonationState'
import { DonationId } from '../valueObjects/DonationId'
import { Amount } from '../valueObjects/Amount'

/**
 * Input for creating a new donation
 */
export interface CreateDonationInput {
  userId: string
  amount: number
  stripePaymentIntentId?: string
  metadata?: Record<string, string>
}

/**
 * Create a new donation in Pending state
 *
 * Business rules:
 * - Amount must be valid (enforced by Amount value object)
 * - User ID is required
 * - Stripe payment intent ID is optional (can be added later)
 * - Metadata is optional (used for tracking campaigns, dedications, etc.)
 *
 * @param input - Donation creation data
 * @returns PendingDonation or ValidationError
 */
export function createDonation(input: CreateDonationInput): Result<PendingDonation, ValidationError> {
  // Validate user ID
  if (!input.userId || input.userId.trim() === '') {
    return err(new ValidationError('User ID is required'))
  }

  // Validate and create amount
  const amountResult = Amount.create(input.amount)
  if (amountResult.isErr()) {
    return err(amountResult.error)
  }

  // Create new donation in Pending state
  const donation: PendingDonation = {
    tag: 'Pending',
    id: DonationId.createNew(),
    userId: input.userId.trim(),
    amount: amountResult.value,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  }

  return ok(donation)
}
