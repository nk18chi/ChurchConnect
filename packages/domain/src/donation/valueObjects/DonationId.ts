import { z } from 'zod'
import { Result, ok, err } from '../../shared/types/Result'
import { ValidationError } from '../../shared/errors/DomainError'

const donationIdSchema = z.string().uuid().brand<'DonationId'>()

export type DonationId = z.infer<typeof donationIdSchema>

export const DonationId = {
  create: (value: string): Result<DonationId, ValidationError> => {
    const result = donationIdSchema.safeParse(value)
    if (result.success) return ok(result.data)
    return err(new ValidationError('Invalid donation ID'))
  },
  createNew: (): DonationId => crypto.randomUUID() as DonationId,
}
