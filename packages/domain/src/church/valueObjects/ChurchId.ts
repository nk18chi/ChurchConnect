import { randomUUID } from 'crypto'
import { Result, ok, err } from '../../shared/types/Result'
import { ValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class ChurchId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(id: string): Result<ChurchId, ValidationError> {
    if (!id || id.trim().length === 0) {
      return err(new ValidationError('Church ID cannot be empty'))
    }
    return ok(new ChurchId(id))
  }

  static createNew(): ChurchId {
    // Using crypto.randomUUID() for unique IDs
    // In production, you might want to use cuid or nanoid
    const id = `church-${randomUUID()}`
    return new ChurchId(id)
  }

  override toString(): string {
    return this.value
  }
}
