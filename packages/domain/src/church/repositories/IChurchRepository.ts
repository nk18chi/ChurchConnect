import { AsyncResult } from '../../shared/types/Result'
import { ChurchState } from '../entities/ChurchState'
import { ChurchId } from '../valueObjects/ChurchId'
import { DomainError } from '../../shared/errors/DomainError'

/**
 * Repository interface for Church aggregate.
 * Infrastructure layer will implement this.
 */
export interface IChurchRepository {
  /**
   * Find church by ID
   * @returns Church if found, null if not found, or error
   */
  findById(id: ChurchId): AsyncResult<ChurchState | null, DomainError>

  /**
   * Find church by slug
   * @returns Church if found, null if not found, or error
   */
  findBySlug(slug: string): AsyncResult<ChurchState | null, DomainError>

  /**
   * Save church (create or update)
   * @returns Saved church or error
   */
  save(church: ChurchState): AsyncResult<ChurchState, DomainError>

  /**
   * Delete church
   * @returns Success or error
   */
  delete(id: ChurchId): AsyncResult<void, DomainError>

  /**
   * Check if slug exists
   * @returns true if exists, false if not, or error
   */
  slugExists(slug: string): AsyncResult<boolean, DomainError>
}
