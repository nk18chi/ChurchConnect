import { AsyncResult } from '../../shared/types/Result'
import { DomainError } from '../../shared/errors/DomainError'
import { DonationState } from '../entities/DonationState'
import { DonationId } from '../valueObjects/DonationId'

/**
 * Repository interface for Donation aggregate
 *
 * Provides persistence operations for donations across different states.
 */
export interface IDonationRepository {
  /**
   * Find donation by ID
   * Returns null if donation not found
   */
  findById(id: DonationId): AsyncResult<DonationState | null, DomainError>

  /**
   * Find donations by user ID
   * Returns empty array if no donations found
   */
  findByUserId(userId: string): AsyncResult<DonationState[], DomainError>

  /**
   * Find donation by Stripe payment intent ID
   * Useful for webhook processing
   * Returns null if donation not found
   */
  findByStripePaymentIntentId(paymentIntentId: string): AsyncResult<DonationState | null, DomainError>

  /**
   * Save donation (create or update)
   * Handles all donation states
   */
  save(donation: DonationState): AsyncResult<DonationState, DomainError>

  /**
   * Delete donation
   * Used for cleanup or administrative purposes
   */
  delete(id: DonationId): AsyncResult<void, DomainError>
}
