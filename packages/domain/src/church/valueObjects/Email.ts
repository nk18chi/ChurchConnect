import { Result } from '../../shared/types/Result'
import { StringValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class Email extends StringValueObject {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(value: string) {
    super(value)
  }

  static create(email: string): Result<Email, ValidationError> {
    const normalized = email?.trim().toLowerCase() || ''

    return StringValueObject.validate(normalized, {
      pattern: Email.EMAIL_REGEX,
      errorMessage: 'Invalid email format',
    }).map((validEmail) => new Email(validEmail))
  }
}
