import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

const churchNameSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(z.string().min(2, 'Church name must be between 2 and 200 characters').max(200, 'Church name must be between 2 and 200 characters'))
  .brand<'ChurchName'>()

export type ChurchName = z.infer<typeof churchNameSchema>

export const ChurchName = {
  create: (value: string): Result<ChurchName, ValidationError> => {
    const result = churchNameSchema.safeParse(value)
    if (result.success) return ok(result.data)
    const firstError = result.error.issues[0]
    return err(new ValidationError(firstError?.message ?? 'Invalid church name'))
  },
}
