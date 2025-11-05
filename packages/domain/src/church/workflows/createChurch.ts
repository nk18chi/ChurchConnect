import { Result, ok } from '../../shared/types/Result'
import { DraftChurch } from '../entities/ChurchState'
import { ChurchId, ChurchName } from '../valueObjects'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Input for creating a new church (invalidated)
 */
export type CreateChurchInput = {
  name: string
  adminUserId: string
}

/**
 * Validated church input
 */
interface ValidatedChurchInput {
  name: ChurchName
  adminUserId: string
}

/**
 * Step 1: Validate church input
 */
type ValidateChurchInput = (input: CreateChurchInput) => Result<ValidatedChurchInput, ValidationError>

const validateChurchInput: ValidateChurchInput = (input) =>
  ChurchName.create(input.name).map((name) => ({ name, adminUserId: input.adminUserId }))

/**
 * Step 2: Create draft church from validated input
 */
type CreateDraftChurch = (input: ValidatedChurchInput) => Result<DraftChurch, ValidationError>

const createDraftChurch: CreateDraftChurch = (input) =>
  ok({
    tag: 'Draft' as const,
    id: ChurchId.createNew(),
    name: input.name,
    createdAt: new Date(),
  })

/**
 * Create a new church in Draft state.
 * Pure function with no side effects.
 *
 * Pipeline: invalidated → validated → draft church
 *
 * @param input - Church creation data
 * @returns Draft church or validation error
 */
export const createChurch = (input: CreateChurchInput): Result<DraftChurch, ValidationError> =>
  ok(input).andThen(validateChurchInput).andThen(createDraftChurch)
