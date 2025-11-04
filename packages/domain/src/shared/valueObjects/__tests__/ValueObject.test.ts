import { describe, it, expect } from '@jest/globals'
import { ValueObject, StringValueObject, NumberValueObject } from '../ValueObject'
import { ValidationError } from '../../errors/DomainError'

// Test implementation
class TestString extends StringValueObject {
  private constructor(value: string) {
    super(value)
  }

  static create(value: string) {
    return StringValueObject.validate(value, {
      minLength: 2,
      maxLength: 10,
      errorMessage: 'Must be 2-10 chars',
    }).map((v) => new TestString(v))
  }
}

// Test implementation for NumberValueObject
class TestNumber extends NumberValueObject {
  private constructor(value: number) {
    super(value)
  }

  static create(value: number) {
    return NumberValueObject.validate(value, {
      min: 0,
      max: 100,
      errorMessage: 'Must be 0-100',
    }).map((v) => new TestNumber(v))
  }
}

describe('ValueObject', () => {
  describe('StringValueObject', () => {
    it('should create valid string value object', () => {
      const result = TestString.create('hello')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.toString()).toBe('hello')
      }
    })

    it('should fail for too short string', () => {
      const result = TestString.create('a')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toContain('2-10 chars')
      }
    })

    it('should fail for too long string', () => {
      const result = TestString.create('verylongstring')

      expect(result.isErr()).toBe(true)
    })

    it('should validate pattern', () => {
      class Email extends StringValueObject {
        private constructor(value: string) {
          super(value)
        }

        static create(value: string) {
          return StringValueObject.validate(value, {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            errorMessage: 'Invalid email',
          }).map((v) => new Email(v))
        }
      }

      const validResult = Email.create('test@example.com')
      expect(validResult.isOk()).toBe(true)

      const invalidResult = Email.create('not-an-email')
      expect(invalidResult.isErr()).toBe(true)
    })

    it('should support equality comparison', () => {
      const str1Result = TestString.create('hello')
      const str2Result = TestString.create('hello')
      const str3Result = TestString.create('world')

      expect(str1Result.isOk()).toBe(true)
      expect(str2Result.isOk()).toBe(true)
      expect(str3Result.isOk()).toBe(true)

      if (str1Result.isOk() && str2Result.isOk() && str3Result.isOk()) {
        expect(str1Result.value.equals(str2Result.value)).toBe(true)
        expect(str1Result.value.equals(str3Result.value)).toBe(false)
      }
    })
  })

  describe('NumberValueObject', () => {
    it('should create valid number value object', () => {
      const result = TestNumber.create(50)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.getValue()).toBe(50)
        expect(result.value.toString()).toBe('50')
      }
    })

    it('should reject NaN', () => {
      const result = TestNumber.create(NaN)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toContain('0-100')
      }
    })

    it('should fail when value is less than min', () => {
      const result = TestNumber.create(-1)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toContain('0-100')
      }
    })

    it('should fail when value is greater than max', () => {
      const result = TestNumber.create(101)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError)
        expect(result.error.message).toContain('0-100')
      }
    })

    it('should accept boundary values', () => {
      const minResult = TestNumber.create(0)
      const maxResult = TestNumber.create(100)

      expect(minResult.isOk()).toBe(true)
      expect(maxResult.isOk()).toBe(true)
    })

    it('should validate integer requirement', () => {
      class IntegerNumber extends NumberValueObject {
        private constructor(value: number) {
          super(value)
        }

        static create(value: number) {
          return NumberValueObject.validate(value, {
            integer: true,
            errorMessage: 'Must be an integer',
          }).map((v) => new IntegerNumber(v))
        }
      }

      const validResult = IntegerNumber.create(42)
      expect(validResult.isOk()).toBe(true)

      const invalidResult = IntegerNumber.create(42.5)
      expect(invalidResult.isErr()).toBe(true)
      if (invalidResult.isErr()) {
        expect(invalidResult.error.message).toContain('integer')
      }
    })

    it('should validate positive requirement', () => {
      class PositiveNumber extends NumberValueObject {
        private constructor(value: number) {
          super(value)
        }

        static create(value: number) {
          return NumberValueObject.validate(value, {
            positive: true,
            errorMessage: 'Must be positive',
          }).map((v) => new PositiveNumber(v))
        }
      }

      const validResult = PositiveNumber.create(1)
      expect(validResult.isOk()).toBe(true)

      const zeroResult = PositiveNumber.create(0)
      expect(zeroResult.isErr()).toBe(true)
      if (zeroResult.isErr()) {
        expect(zeroResult.error.message).toContain('positive')
      }

      const negativeResult = PositiveNumber.create(-1)
      expect(negativeResult.isErr()).toBe(true)
      if (negativeResult.isErr()) {
        expect(negativeResult.error.message).toContain('positive')
      }
    })

    it('should support equality comparison', () => {
      const num1Result = TestNumber.create(42)
      const num2Result = TestNumber.create(42)
      const num3Result = TestNumber.create(99)

      expect(num1Result.isOk()).toBe(true)
      expect(num2Result.isOk()).toBe(true)
      expect(num3Result.isOk()).toBe(true)

      if (num1Result.isOk() && num2Result.isOk() && num3Result.isOk()) {
        expect(num1Result.value.equals(num2Result.value)).toBe(true)
        expect(num1Result.value.equals(num3Result.value)).toBe(false)
      }
    })
  })
})
