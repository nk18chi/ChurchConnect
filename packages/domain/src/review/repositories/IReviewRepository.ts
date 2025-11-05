import { AsyncResult } from '../../shared/types/Result'
import { DomainError } from '../../shared/errors/DomainError'
import { ReviewState } from '../entities/ReviewState'
import { ReviewId } from '../valueObjects/ReviewId'
import { ChurchId } from '../../church/valueObjects/ChurchId'

/**
 * Repository interface for Review aggregate.
 * Defines the contract for persistence operations.
 */
export interface IReviewRepository {
  /**
   * Find a review by its ID
   * @param id - The review ID
   * @returns The review state if found, null otherwise
   */
  findById(id: ReviewId): AsyncResult<ReviewState | null, DomainError>

  /**
   * Find all reviews for a specific church
   * @param churchId - The church ID
   * @returns Array of review states
   */
  findByChurchId(churchId: ChurchId): AsyncResult<ReviewState[], DomainError>

  /**
   * Save a review (create or update)
   * @param review - The review state to save
   * @returns The saved review state
   */
  save(review: ReviewState): AsyncResult<ReviewState, DomainError>

  /**
   * Delete a review by its ID
   * @param id - The review ID
   * @returns Void on success
   */
  delete(id: ReviewId): AsyncResult<void, DomainError>
}
