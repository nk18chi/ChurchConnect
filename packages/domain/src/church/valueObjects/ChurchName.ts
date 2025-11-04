import { Result } from '../../shared/types/Result'
import { StringValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class ChurchName extends StringValueObject {
  private static readonly MIN_LENGTH = 2
  private static readonly MAX_LENGTH = 200

  private constructor(value: string) {
    super(value)
  }

  static create(name: string): Result<ChurchName, ValidationError> {
    const trimmed = name?.trim() || ''

    return StringValueObject.validate(trimmed, {
      minLength: ChurchName.MIN_LENGTH,
      maxLength: ChurchName.MAX_LENGTH,
      errorMessage: `Church name must be between ${ChurchName.MIN_LENGTH} and ${ChurchName.MAX_LENGTH} characters`,
    }).map((validName) => new ChurchName(validName))
  }
}
