import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

const emailSchema = z
  .string()
  .transform((val) => val.trim().toLowerCase())
  .pipe(z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'))
  .brand<'Email'>()

export type Email = z.infer<typeof emailSchema>

export const Email = {
  create: (value: string): Result<Email, ValidationError> => {
    const result = emailSchema.safeParse(value)
    if (result.success) return ok(result.data)
    const firstError = result.error.issues[0]
    return err(new ValidationError(firstError?.message ?? 'Invalid email format'))
  },
}
