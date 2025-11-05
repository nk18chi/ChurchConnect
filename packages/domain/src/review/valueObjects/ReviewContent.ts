import { Result } from '../../shared/types/Result'
import { StringValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class ReviewContent extends StringValueObject {
  private static readonly MIN_LENGTH = 10
  private static readonly MAX_LENGTH = 2000

  private constructor(value: string) {
    super(value)
  }

  static create(content: string): Result<ReviewContent, ValidationError> {
    const trimmed = content.trim()

    return StringValueObject.validate(trimmed, {
      minLength: ReviewContent.MIN_LENGTH,
      maxLength: ReviewContent.MAX_LENGTH,
      errorMessage: `Review content must be between ${ReviewContent.MIN_LENGTH} and ${ReviewContent.MAX_LENGTH} characters`
    }).map(validContent => new ReviewContent(validContent))
  }

  toString(): string {
    return this.value
  }
}
