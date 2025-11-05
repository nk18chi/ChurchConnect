import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

const reviewContentSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(
    z
      .string()
      .min(10, 'Review content must be between 10 and 2000 characters')
      .max(2000, 'Review content must be between 10 and 2000 characters')
  )
  .brand<'ReviewContent'>()

export type ReviewContent = z.infer<typeof reviewContentSchema>

export const ReviewContent = {
  create: (value: string): Result<ReviewContent, ValidationError> => {
    const result = reviewContentSchema.safeParse(value)
    if (result.success) return ok(result.data)
    const firstError = result.error.issues[0]
    return err(new ValidationError(firstError?.message ?? 'Invalid review content'))
  },
}
