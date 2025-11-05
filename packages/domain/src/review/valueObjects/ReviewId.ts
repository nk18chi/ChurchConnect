import { randomUUID } from 'crypto'
import { Result, ok, err } from '../../shared/types/Result'
import { ValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class ReviewId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(id: string): Result<ReviewId, ValidationError> {
    if (!id || id.length === 0) {
      return err(new ValidationError('Review ID cannot be empty'))
    }
    return ok(new ReviewId(id))
  }

  static createNew(): ReviewId {
    // Using UUID for now - matches Church domain pattern
    // Prisma will generate cuid at database level
    return new ReviewId(randomUUID())
  }

  toString(): string {
    return this.value
  }
}
