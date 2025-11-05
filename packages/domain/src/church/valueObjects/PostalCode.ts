import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Japanese postal code: 7 digits, optionally with hyphen after 3rd digit
 * Examples: 123-4567, 1234567
 * Always normalized to format with hyphen: 123-4567
 */
const postalCodeSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s/g, ''))
  .pipe(
    z.string().regex(/^(\d{3})-?(\d{4})$/, 'Invalid postal code format. Expected format: 123-4567 or 1234567')
  )
  .transform((val) => {
    // Normalize to format with hyphen
    const match = val.match(/^(\d{3})-?(\d{4})$/)
    return match ? `${match[1]}-${match[2]}` : val
  })
  .brand<'PostalCode'>()

export type PostalCode = z.infer<typeof postalCodeSchema>

export const PostalCode = {
  create: (value: string): Result<PostalCode, ValidationError> => {
    const result = postalCodeSchema.safeParse(value)
    if (result.success) return ok(result.data)
    const errorMessage = result.error?.errors?.[0]?.message ?? 'Invalid postal code'
    return err(new ValidationError(errorMessage))
  },
}
