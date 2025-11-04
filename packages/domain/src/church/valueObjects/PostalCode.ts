import { Result, ok, err } from '../../shared/types/Result'
import { StringValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class PostalCode extends StringValueObject {
  // Japanese postal code: 7 digits, optionally with hyphen after 3rd digit
  private static readonly POSTAL_CODE_REGEX = /^(\d{3})-?(\d{4})$/

  private constructor(value: string) {
    super(value)
  }

  static create(postalCode: string): Result<PostalCode, ValidationError> {
    const cleaned = postalCode?.trim().replace(/\s/g, '') || ''

    const match = cleaned.match(PostalCode.POSTAL_CODE_REGEX)
    if (!match) {
      return err(
        new ValidationError('Invalid postal code format. Expected format: 123-4567 or 1234567')
      )
    }

    // Normalize to format with hyphen
    const normalized = `${match[1]}-${match[2]}`
    return ok(new PostalCode(normalized))
  }
}
