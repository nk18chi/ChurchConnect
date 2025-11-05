import { randomUUID } from 'crypto'
import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

const reviewIdSchema = z.string().uuid('Invalid review ID format').brand<'ReviewId'>()
export type ReviewId = z.infer<typeof reviewIdSchema>

export const ReviewId = {
  create: (value: string): Result<ReviewId, ValidationError> => {
    const result = reviewIdSchema.safeParse(value)
    if (result.success) return ok(result.data)
    const firstError = result.error.issues[0]
    return err(new ValidationError(firstError?.message ?? 'Invalid review ID'))
  },

  createNew: (): ReviewId => {
    return randomUUID() as ReviewId
  },
}
