import { randomUUID } from 'crypto'
import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

const churchIdSchema = z.string().min(1, 'Church ID cannot be empty').brand<'ChurchId'>()
export type ChurchId = z.infer<typeof churchIdSchema>

export const ChurchId = {
  create: (value: string): Result<ChurchId, ValidationError> => {
    const result = churchIdSchema.safeParse(value)
    if (result.success) return ok(result.data)
    const firstError = result.error.issues[0]
    return err(new ValidationError(firstError?.message ?? 'Church ID cannot be empty'))
  },

  createNew: (): ChurchId => {
    // Using crypto.randomUUID() for unique IDs
    // In production, you might want to use cuid or nanoid
    const id = `church-${randomUUID()}`
    return id as ChurchId
  },
}
