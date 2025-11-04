import { Result } from '../../shared/types/Result'
import { DraftChurch } from '../entities/ChurchState'
import { ChurchId } from '../valueObjects/ChurchId'
import { ChurchName } from '../valueObjects/ChurchName'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Input for creating a new church
 */
export type CreateChurchInput = {
  name: string
  adminUserId: string
}

/**
 * Create a new church in Draft state.
 * Pure function with no side effects.
 *
 * @param input - Church creation data
 * @returns Draft church or validation error
 */
export const createChurch = (input: CreateChurchInput): Result<DraftChurch, ValidationError> => {
  return ChurchName.create(input.name).map((name) => ({
    tag: 'Draft' as const,
    id: ChurchId.createNew(),
    name,
    createdAt: new Date(),
  }))
}
