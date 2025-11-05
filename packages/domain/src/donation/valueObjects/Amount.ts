import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Donation amount in smallest currency unit (e.g., cents for USD, yen for JPY)
 * Minimum: 100 (¥100 or $1.00)
 * Maximum: 10,000,000 (¥10,000,000 or $100,000.00)
 */
const amountSchema = z
  .number()
  .int('Amount must be an integer')
  .min(100, 'Minimum donation amount is ¥100')
  .max(10_000_000, 'Maximum donation amount is ¥10,000,000')
  .brand<'Amount'>()

export type Amount = z.infer<typeof amountSchema>

export const Amount = {
  create: (value: number): Result<Amount, ValidationError> => {
    const result = amountSchema.safeParse(value)
    if (result.success) return ok(result.data)
    // Get the first error message, which contains our custom validation messages
    const errorMessage = result.error?.errors?.[0]?.message ?? 'Invalid amount'
    return err(new ValidationError(errorMessage))
  },
}
