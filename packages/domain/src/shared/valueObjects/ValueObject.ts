import { Result, ok, err } from '../types/Result'
import { ValidationError } from '../errors/DomainError'

/**
 * Base class for all value objects
 * Value objects are immutable and compared by value, not identity
 */
export abstract class ValueObject<T> {
  protected readonly value: T

  protected constructor(value: T) {
    this.value = value
  }

  /**
   * Compare two value objects for equality
   */
  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false
    }
    return JSON.stringify(this.value) === JSON.stringify(other.value)
  }

  /**
   * Get the underlying value
   */
  getValue(): T {
    return this.value
  }

  /**
   * String representation
   */
  toString(): string {
    return String(this.value)
  }
}

/**
 * Validation rules for string value objects
 */
export interface StringValidationRules {
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  errorMessage?: string
}

/**
 * Base class for string-based value objects
 */
export abstract class StringValueObject extends ValueObject<string> {
  /**
   * Validate a string against rules
   */
  protected static validate(
    value: string,
    rules: StringValidationRules
  ): Result<string, ValidationError> {
    const { minLength, maxLength, pattern, errorMessage } = rules

    // Null/undefined check
    if (value === null || value === undefined) {
      return err(new ValidationError(errorMessage || 'Value cannot be null or undefined'))
    }

    // Empty string check for minLength
    if (minLength !== undefined && value.length < minLength) {
      return err(
        new ValidationError(errorMessage || `Must be at least ${minLength} characters`)
      )
    }

    // Max length check
    if (maxLength !== undefined && value.length > maxLength) {
      return err(
        new ValidationError(errorMessage || `Must be at most ${maxLength} characters`)
      )
    }

    // Pattern check
    if (pattern !== undefined && !pattern.test(value)) {
      return err(new ValidationError(errorMessage || 'Invalid format'))
    }

    return ok(value)
  }

  override toString(): string {
    return this.value
  }
}

/**
 * Validation rules for number value objects
 */
export interface NumberValidationRules {
  min?: number
  max?: number
  integer?: boolean
  positive?: boolean
  errorMessage?: string
}

/**
 * Base class for number-based value objects
 */
export abstract class NumberValueObject extends ValueObject<number> {
  /**
   * Validate a number against rules
   */
  protected static validate(
    value: number,
    rules: NumberValidationRules
  ): Result<number, ValidationError> {
    const { min, max, integer, positive, errorMessage } = rules

    // NaN check
    if (Number.isNaN(value)) {
      return err(new ValidationError(errorMessage || 'Value must be a valid number'))
    }

    // Min check
    if (min !== undefined && value < min) {
      return err(new ValidationError(errorMessage || `Must be at least ${min}`))
    }

    // Max check
    if (max !== undefined && value > max) {
      return err(new ValidationError(errorMessage || `Must be at most ${max}`))
    }

    // Integer check
    if (integer && !Number.isInteger(value)) {
      return err(new ValidationError(errorMessage || 'Must be an integer'))
    }

    // Positive check
    if (positive && value <= 0) {
      return err(new ValidationError(errorMessage || 'Must be positive'))
    }

    return ok(value)
  }

  override toString(): string {
    return String(this.value)
  }
}
