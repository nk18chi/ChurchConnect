# DDD Foundation - Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish Domain-Driven Design foundation with neverthrow for railway-oriented programming, create base value objects, and implement first Church aggregate workflow.

**Architecture:** Pure functional domain layer using tagged unions for states, Result types for error handling, and repository pattern for infrastructure isolation. Domain logic has zero dependencies on infrastructure.

**Tech Stack:** neverthrow (Result types), TypeScript discriminated unions, Prisma (infrastructure only), Pothos GraphQL (adapter layer)

**References:**
- DevWisdom DDD: https://github.com/nk18chi/DevWisdom/tree/main/apps/backend/src
- Ikyu FP+DDD: https://techplay.jp/column/1631
- Current refactoring plan: `docs/plans/2025-11-04-ddd-refactoring-plan.md`

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json` (root)
- Modify: `packages/domain/package.json` (will create)

**Step 1: Install neverthrow**

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
pnpm add neverthrow
```

Expected: neverthrow added to dependencies

**Step 2: Create domain package**

```bash
mkdir -p packages/domain/src
cd packages/domain
```

**Step 3: Initialize domain package**

Create `packages/domain/package.json`:
```json
{
  "name": "@repo/domain",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "neverthrow": "workspace:*"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.4.5"
  }
}
```

**Step 4: Create TypeScript config**

Create `packages/domain/tsconfig.json`:
```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 5: Verify setup**

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
pnpm install
```

Expected: All packages linked successfully

**Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml packages/domain/
git commit -m "feat(domain): initialize domain package with neverthrow"
```

---

## Task 2: Create Shared Result Types

**Files:**
- Create: `packages/domain/src/shared/types/Result.ts`
- Create: `packages/domain/src/shared/types/index.ts`

**Step 1: Write Result type re-exports**

Create `packages/domain/src/shared/types/Result.ts`:
```typescript
export { Result, ok, err, ResultAsync, fromPromise, fromThrowable } from 'neverthrow'

// Helper type for async operations
export type AsyncResult<T, E> = ResultAsync<T, E>

// Helper to convert promises to Results
export const asyncResult = <T, E = Error>(
  promise: Promise<T>,
  errorFn?: (error: unknown) => E
): AsyncResult<T, E> => {
  return ResultAsync.fromPromise(
    promise,
    errorFn || ((e) => (e instanceof Error ? e : new Error(String(e))) as E)
  )
}
```

**Step 2: Create barrel export**

Create `packages/domain/src/shared/types/index.ts`:
```typescript
export * from './Result'
```

**Step 3: Verify types compile**

```bash
cd packages/domain
pnpm type-check
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add packages/domain/src/shared/types/
git commit -m "feat(domain): add Result type utilities from neverthrow"
```

---

## Task 3: Create Domain Error Types

**Files:**
- Create: `packages/domain/src/shared/errors/DomainError.ts`
- Create: `packages/domain/src/shared/errors/index.ts`

**Step 1: Write base DomainError class**

Create `packages/domain/src/shared/errors/DomainError.ts`:
```typescript
export abstract class DomainError extends Error {
  readonly code: string
  readonly timestamp: Date

  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.timestamp = new Date()
    this.name = this.constructor.name

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    }
  }
}

export class ValidationError extends DomainError {
  readonly field?: string

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR')
    this.field = field
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    }
  }
}

export class AuthorizationError extends DomainError {
  readonly requiredRole?: string

  constructor(message: string, requiredRole?: string) {
    super(message, 'AUTHORIZATION_ERROR')
    this.requiredRole = requiredRole
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      requiredRole: this.requiredRole,
    }
  }
}

export class NotFoundError extends DomainError {
  readonly entityType: string
  readonly entityId: string

  constructor(entityType: string, entityId: string) {
    super(`${entityType} with id ${entityId} not found`, 'NOT_FOUND')
    this.entityType = entityType
    this.entityId = entityId
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      entityType: this.entityType,
      entityId: this.entityId,
    }
  }
}

export class ConflictError extends DomainError {
  readonly conflictingField?: string

  constructor(message: string, conflictingField?: string) {
    super(message, 'CONFLICT')
    this.conflictingField = conflictingField
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      conflictingField: this.conflictingField,
    }
  }
}

export class InfrastructureError extends DomainError {
  readonly originalError?: Error

  constructor(message: string, originalError?: Error) {
    super(message, 'INFRASTRUCTURE_ERROR')
    this.originalError = originalError
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      originalError: this.originalError?.message,
    }
  }
}
```

**Step 2: Create barrel export**

Create `packages/domain/src/shared/errors/index.ts`:
```typescript
export * from './DomainError'
```

**Step 3: Write error tests**

Create `packages/domain/src/shared/errors/__tests__/DomainError.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../DomainError'

describe('DomainError', () => {
  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid email format', 'email')

      expect(error.message).toBe('Invalid email format')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBe('email')
      expect(error.name).toBe('ValidationError')
    })

    it('should create validation error without field', () => {
      const error = new ValidationError('Invalid input')

      expect(error.field).toBeUndefined()
    })

    it('should serialize to JSON', () => {
      const error = new ValidationError('Invalid email', 'email')
      const json = error.toJSON()

      expect(json.code).toBe('VALIDATION_ERROR')
      expect(json.message).toBe('Invalid email')
      expect(json.field).toBe('email')
      expect(json.timestamp).toBeDefined()
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Church', 'church-123')

      expect(error.message).toBe('Church with id church-123 not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.entityType).toBe('Church')
      expect(error.entityId).toBe('church-123')
    })
  })

  describe('AuthorizationError', () => {
    it('should create authorization error with required role', () => {
      const error = new AuthorizationError('Admin access required', 'ADMIN')

      expect(error.code).toBe('AUTHORIZATION_ERROR')
      expect(error.requiredRole).toBe('ADMIN')
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Church with slug already exists', 'slug')

      expect(error.code).toBe('CONFLICT')
      expect(error.conflictingField).toBe('slug')
    })
  })
})
```

**Step 4: Setup Jest for domain package**

Create `packages/domain/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
  ],
}
```

Add to `packages/domain/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@jest/globals": "^29.7.0",
    "@repo/typescript-config": "workspace:*",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.4.5"
  }
}
```

**Step 5: Install test dependencies**

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
pnpm install
```

**Step 6: Run tests**

```bash
cd packages/domain
pnpm test
```

Expected: All tests pass

**Step 7: Commit**

```bash
git add packages/domain/
git commit -m "feat(domain): add domain error types with tests"
```

---

## Task 4: Create Base Value Object

**Files:**
- Create: `packages/domain/src/shared/valueObjects/ValueObject.ts`
- Create: `packages/domain/src/shared/valueObjects/index.ts`

**Step 1: Write failing test**

Create `packages/domain/src/shared/valueObjects/__tests__/ValueObject.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { ValueObject, StringValueObject } from '../ValueObject'
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
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/domain
pnpm test
```

Expected: FAIL - ValueObject module not found

**Step 3: Implement ValueObject**

Create `packages/domain/src/shared/valueObjects/ValueObject.ts`:
```typescript
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
```

**Step 4: Create barrel export**

Create `packages/domain/src/shared/valueObjects/index.ts`:
```typescript
export * from './ValueObject'
```

**Step 5: Run tests to verify they pass**

```bash
cd packages/domain
pnpm test
```

Expected: All tests PASS

**Step 6: Verify type checking**

```bash
pnpm type-check
```

Expected: No TypeScript errors

**Step 7: Commit**

```bash
git add packages/domain/src/shared/valueObjects/
git commit -m "feat(domain): add base value object classes with validation"
```

---

## Task 5: Create Church Value Objects

**Files:**
- Create: `packages/domain/src/church/valueObjects/ChurchId.ts`
- Create: `packages/domain/src/church/valueObjects/ChurchName.ts`
- Create: `packages/domain/src/church/valueObjects/Email.ts`
- Create: `packages/domain/src/church/valueObjects/PostalCode.ts`
- Create: `packages/domain/src/church/valueObjects/index.ts`

**Step 1: Write ChurchId tests**

Create `packages/domain/src/church/valueObjects/__tests__/ChurchId.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { ChurchId } from '../ChurchId'

describe('ChurchId', () => {
  it('should create valid church ID', () => {
    const result = ChurchId.create('church-123')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('church-123')
    }
  })

  it('should fail for empty ID', () => {
    const result = ChurchId.create('')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('cannot be empty')
    }
  })

  it('should create new ID', () => {
    const id = ChurchId.createNew()

    expect(id.toString()).toBeTruthy()
    expect(id.toString().length).toBeGreaterThan(0)
  })

  it('should support equality', () => {
    const id1Result = ChurchId.create('same-id')
    const id2Result = ChurchId.create('same-id')
    const id3Result = ChurchId.create('different-id')

    expect(id1Result.isOk() && id2Result.isOk() && id3Result.isOk()).toBe(true)

    if (id1Result.isOk() && id2Result.isOk() && id3Result.isOk()) {
      expect(id1Result.value.equals(id2Result.value)).toBe(true)
      expect(id1Result.value.equals(id3Result.value)).toBe(false)
    }
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/domain
pnpm test ChurchId
```

Expected: FAIL - ChurchId not found

**Step 3: Implement ChurchId**

Create `packages/domain/src/church/valueObjects/ChurchId.ts`:
```typescript
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
    const id = `church-${crypto.randomUUID()}`
    return new ChurchId(id)
  }

  override toString(): string {
    return this.value
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test ChurchId
```

Expected: PASS

**Step 5: Write ChurchName tests**

Create `packages/domain/src/church/valueObjects/__tests__/ChurchName.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { ChurchName } from '../ChurchName'

describe('ChurchName', () => {
  it('should create valid church name', () => {
    const result = ChurchName.create('Tokyo Baptist Church')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Tokyo Baptist Church')
    }
  })

  it('should fail for too short name', () => {
    const result = ChurchName.create('A')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('2 and 200')
    }
  })

  it('should fail for too long name', () => {
    const longName = 'A'.repeat(201)
    const result = ChurchName.create(longName)

    expect(result.isErr()).toBe(true)
  })

  it('should trim whitespace', () => {
    const result = ChurchName.create('  Tokyo Church  ')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Tokyo Church')
    }
  })
})
```

**Step 6: Implement ChurchName**

Create `packages/domain/src/church/valueObjects/ChurchName.ts`:
```typescript
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
```

**Step 7: Run tests**

```bash
pnpm test ChurchName
```

Expected: PASS

**Step 8: Write Email tests**

Create `packages/domain/src/church/valueObjects/__tests__/Email.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { Email } from '../Email'

describe('Email', () => {
  it('should create valid email', () => {
    const result = Email.create('admin@church.jp')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('admin@church.jp')
    }
  })

  it('should normalize to lowercase', () => {
    const result = Email.create('ADMIN@CHURCH.JP')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('admin@church.jp')
    }
  })

  it('should fail for invalid format', () => {
    const invalidEmails = [
      'not-an-email',
      '@church.jp',
      'admin@',
      'admin church.jp',
      '',
    ]

    invalidEmails.forEach((invalid) => {
      const result = Email.create(invalid)
      expect(result.isErr()).toBe(true)
    })
  })

  it('should accept valid email formats', () => {
    const validEmails = [
      'simple@example.com',
      'test+tag@example.co.jp',
      'user.name@subdomain.example.com',
    ]

    validEmails.forEach((valid) => {
      const result = Email.create(valid)
      expect(result.isOk()).toBe(true)
    })
  })
})
```

**Step 9: Implement Email**

Create `packages/domain/src/church/valueObjects/Email.ts`:
```typescript
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
```

**Step 10: Run tests**

```bash
pnpm test Email
```

Expected: PASS

**Step 11: Write PostalCode tests**

Create `packages/domain/src/church/valueObjects/__tests__/PostalCode.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { PostalCode } from '../PostalCode'

describe('PostalCode', () => {
  it('should create valid Japanese postal code', () => {
    const result = PostalCode.create('100-0001')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('100-0001')
    }
  })

  it('should normalize format with hyphen', () => {
    const result = PostalCode.create('1000001')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('100-0001')
    }
  })

  it('should fail for invalid format', () => {
    const invalidCodes = ['12345', '1234567890', 'abc-defg', '']

    invalidCodes.forEach((invalid) => {
      const result = PostalCode.create(invalid)
      expect(result.isErr()).toBe(true)
    })
  })

  it('should accept valid formats', () => {
    const validCodes = ['100-0001', '1000001', '150-0043', '1500043']

    validCodes.forEach((valid) => {
      const result = PostalCode.create(valid)
      expect(result.isOk()).toBe(true)
    })
  })
})
```

**Step 12: Implement PostalCode**

Create `packages/domain/src/church/valueObjects/PostalCode.ts`:
```typescript
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
```

**Step 13: Run all tests**

```bash
pnpm test
```

Expected: All tests PASS

**Step 14: Create barrel export**

Create `packages/domain/src/church/valueObjects/index.ts`:
```typescript
export * from './ChurchId'
export * from './ChurchName'
export * from './Email'
export * from './PostalCode'
```

**Step 15: Verify type checking**

```bash
pnpm type-check
```

Expected: No errors

**Step 16: Commit**

```bash
git add packages/domain/src/church/
git commit -m "feat(domain): add Church value objects with validation"
```

---

## Task 6: Create Church States (Tagged Unions)

**Files:**
- Create: `packages/domain/src/church/entities/ChurchState.ts`
- Create: `packages/domain/src/church/entities/index.ts`

**Step 1: Write ChurchState tests**

Create `packages/domain/src/church/entities/__tests__/ChurchState.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import {
  ChurchState,
  DraftChurch,
  PublishedChurch,
  VerifiedChurch,
  isDraft,
  isPublished,
  isVerified,
} from '../ChurchState'
import { ChurchId } from '../../valueObjects/ChurchId'
import { ChurchName } from '../../valueObjects/ChurchName'

describe('ChurchState', () => {
  describe('Type Guards', () => {
    it('should identify Draft state', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const draft: DraftChurch = {
        tag: 'Draft',
        id: ChurchId.createNew(),
        name: nameResult.value,
        createdAt: new Date(),
      }

      expect(isDraft(draft)).toBe(true)
      expect(isPublished(draft)).toBe(false)
      expect(isVerified(draft)).toBe(false)
    })

    it('should identify Published state', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const published: PublishedChurch = {
        tag: 'Published',
        id: ChurchId.createNew(),
        name: nameResult.value,
        slug: 'test-church',
        publishedAt: new Date(),
        createdAt: new Date(),
      }

      expect(isDraft(published)).toBe(false)
      expect(isPublished(published)).toBe(true)
      expect(isVerified(published)).toBe(false)
    })

    it('should identify Verified state', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const verified: VerifiedChurch = {
        tag: 'Verified',
        id: ChurchId.createNew(),
        name: nameResult.value,
        slug: 'test-church',
        publishedAt: new Date(),
        verifiedAt: new Date(),
        verifiedBy: 'admin-123',
        createdAt: new Date(),
      }

      expect(isDraft(verified)).toBe(false)
      expect(isPublished(verified)).toBe(false)
      expect(isVerified(verified)).toBe(true)
    })
  })

  describe('Type Safety', () => {
    it('should enforce state-specific properties at compile time', () => {
      const nameResult = ChurchName.create('Test Church')
      expect(nameResult.isOk()).toBe(true)
      if (nameResult.isErr()) return

      const church: ChurchState = {
        tag: 'Draft',
        id: ChurchId.createNew(),
        name: nameResult.value,
        createdAt: new Date(),
      }

      if (isDraft(church)) {
        // TypeScript knows church is DraftChurch here
        expect(church.tag).toBe('Draft')
        // @ts-expect-error - slug doesn't exist on Draft
        expect(church.slug).toBeUndefined()
      }

      if (isPublished(church)) {
        // This block won't execute, but TypeScript knows church is PublishedChurch
        expect(church.slug).toBeDefined()
      }
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/domain
pnpm test ChurchState
```

Expected: FAIL - ChurchState not found

**Step 3: Implement ChurchState**

Create `packages/domain/src/church/entities/ChurchState.ts`:
```typescript
import { ChurchId } from '../valueObjects/ChurchId'
import { ChurchName } from '../valueObjects/ChurchName'

/**
 * Church aggregate states as a tagged union.
 * This makes invalid state transitions impossible at compile time.
 *
 * State transitions:
 * Draft → Published → Verified
 */
export type ChurchState = DraftChurch | PublishedChurch | VerifiedChurch

/**
 * Draft state: Church created but not published
 * - Has basic info only
 * - Not searchable by public
 * - Only visible to church admin
 */
export type DraftChurch = {
  readonly tag: 'Draft'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly createdAt: Date
}

/**
 * Published state: Church visible to public
 * - Has slug for URL
 * - Searchable by public
 * - Can receive reviews
 */
export type PublishedChurch = {
  readonly tag: 'Published'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly slug: string
  readonly publishedAt: Date
  readonly createdAt: Date
}

/**
 * Verified state: Church verified by platform admin
 * - Has verified badge
 * - Higher ranking in search
 * - Increased trust
 */
export type VerifiedChurch = {
  readonly tag: 'Verified'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly slug: string
  readonly publishedAt: Date
  readonly verifiedAt: Date
  readonly verifiedBy: string // Admin user ID
  readonly createdAt: Date
}

/**
 * Type guard for Draft state
 */
export const isDraft = (church: ChurchState): church is DraftChurch => {
  return church.tag === 'Draft'
}

/**
 * Type guard for Published state
 */
export const isPublished = (church: ChurchState): church is PublishedChurch => {
  return church.tag === 'Published'
}

/**
 * Type guard for Verified state
 */
export const isVerified = (church: ChurchState): church is VerifiedChurch => {
  return church.tag === 'Verified'
}

/**
 * Check if church is publicly visible (Published or Verified)
 */
export const isPubliclyVisible = (church: ChurchState): boolean => {
  return isPublished(church) || isVerified(church)
}

/**
 * Get slug from church if it has one
 */
export const getSlug = (church: ChurchState): string | null => {
  if (isDraft(church)) {
    return null
  }
  return church.slug
}
```

**Step 4: Create barrel export**

Create `packages/domain/src/church/entities/index.ts`:
```typescript
export * from './ChurchState'
```

**Step 5: Run tests to verify they pass**

```bash
pnpm test ChurchState
```

Expected: All tests PASS

**Step 6: Commit**

```bash
git add packages/domain/src/church/entities/
git commit -m "feat(domain): add Church state tagged union"
```

---

## Task 7: Create Church Repository Interface

**Files:**
- Create: `packages/domain/src/church/repositories/IChurchRepository.ts`
- Create: `packages/domain/src/church/repositories/index.ts`

**Step 1: Implement repository interface**

Create `packages/domain/src/church/repositories/IChurchRepository.ts`:
```typescript
import { AsyncResult } from '../../shared/types/Result'
import { ChurchState } from '../entities/ChurchState'
import { ChurchId } from '../valueObjects/ChurchId'
import { DomainError } from '../../shared/errors/DomainError'

/**
 * Repository interface for Church aggregate.
 * Infrastructure layer will implement this.
 */
export interface IChurchRepository {
  /**
   * Find church by ID
   * @returns Church if found, null if not found, or error
   */
  findById(id: ChurchId): AsyncResult<ChurchState | null, DomainError>

  /**
   * Find church by slug
   * @returns Church if found, null if not found, or error
   */
  findBySlug(slug: string): AsyncResult<ChurchState | null, DomainError>

  /**
   * Save church (create or update)
   * @returns Saved church or error
   */
  save(church: ChurchState): AsyncResult<ChurchState, DomainError>

  /**
   * Delete church
   * @returns Success or error
   */
  delete(id: ChurchId): AsyncResult<void, DomainError>

  /**
   * Check if slug exists
   * @returns true if exists, false if not, or error
   */
  slugExists(slug: string): AsyncResult<boolean, DomainError>
}
```

**Step 2: Create barrel export**

Create `packages/domain/src/church/repositories/index.ts`:
```typescript
export * from './IChurchRepository'
```

**Step 3: Verify type checking**

```bash
pnpm type-check
```

Expected: No errors

**Step 4: Commit**

```bash
git add packages/domain/src/church/repositories/
git commit -m "feat(domain): add Church repository interface"
```

---

## Task 8: Create Church Workflows

**Files:**
- Create: `packages/domain/src/church/workflows/createChurch.ts`
- Create: `packages/domain/src/church/workflows/publishChurch.ts`
- Create: `packages/domain/src/church/workflows/verifyChurch.ts`
- Create: `packages/domain/src/church/workflows/index.ts`

**Step 1: Write createChurch tests**

Create `packages/domain/src/church/workflows/__tests__/createChurch.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { createChurch, CreateChurchInput } from '../createChurch'
import { isDraft } from '../../entities/ChurchState'

describe('createChurch workflow', () => {
  it('should create draft church with valid input', () => {
    const input: CreateChurchInput = {
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    }

    const result = createChurch(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const church = result.value
      expect(isDraft(church)).toBe(true)
      expect(church.name.toString()).toBe('Tokyo Baptist Church')
      expect(church.id).toBeDefined()
      expect(church.createdAt).toBeInstanceOf(Date)
    }
  })

  it('should fail with invalid name', () => {
    const input: CreateChurchInput = {
      name: 'A', // Too short
      adminUserId: 'user-123',
    }

    const result = createChurch(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('2 and 200')
    }
  })

  it('should fail with empty name', () => {
    const input: CreateChurchInput = {
      name: '',
      adminUserId: 'user-123',
    }

    const result = createChurch(input)

    expect(result.isErr()).toBe(true)
  })

  it('should create churches with different IDs', () => {
    const input: CreateChurchInput = {
      name: 'Test Church',
      adminUserId: 'user-123',
    }

    const result1 = createChurch(input)
    const result2 = createChurch(input)

    expect(result1.isOk() && result2.isOk()).toBe(true)
    if (result1.isOk() && result2.isOk()) {
      expect(result1.value.id.equals(result2.value.id)).toBe(false)
    }
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test createChurch
```

Expected: FAIL - createChurch not found

**Step 3: Implement createChurch workflow**

Create `packages/domain/src/church/workflows/createChurch.ts`:
```typescript
import { Result } from '../../shared/types/Result'
import { DraftChurch } from '../entities/ChurchState'
import { ChurchId } from '../valueObjects/ChurchId'
import { ChurchName } from '../valueObjects/ChurchName'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Input for creating a new church
 */
export type CreateChurchInput = {
  name: string
  adminUserId: string
}

/**
 * Create a new church in Draft state.
 * Pure function with no side effects.
 *
 * @param input - Church creation data
 * @returns Draft church or validation error
 */
export const createChurch = (input: CreateChurchInput): Result<DraftChurch, ValidationError> => {
  return ChurchName.create(input.name).map((name) => ({
    tag: 'Draft' as const,
    id: ChurchId.createNew(),
    name,
    createdAt: new Date(),
  }))
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test createChurch
```

Expected: All tests PASS

**Step 5: Write publishChurch tests**

Create `packages/domain/src/church/workflows/__tests__/publishChurch.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { publishChurch } from '../publishChurch'
import { createChurch } from '../createChurch'
import { isPublished } from '../../entities/ChurchState'

describe('publishChurch workflow', () => {
  it('should publish draft church', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    })

    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const result = publishChurch(draftResult.value)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const published = result.value
      expect(isPublished(published)).toBe(true)
      expect(published.slug).toBe('tokyo-baptist-church')
      expect(published.name.equals(draftResult.value.name)).toBe(true)
      expect(published.id.equals(draftResult.value.id)).toBe(true)
      expect(published.publishedAt).toBeInstanceOf(Date)
    }
  })

  it('should generate valid slug from name', () => {
    const testCases = [
      { name: 'Tokyo Baptist Church', expectedSlug: 'tokyo-baptist-church' },
      { name: 'St. Mary Catholic Church', expectedSlug: 'st-mary-catholic-church' },
      { name: 'Christ  Church  Tokyo', expectedSlug: 'christ-church-tokyo' },
      { name: 'Church-With-Hyphens', expectedSlug: 'church-with-hyphens' },
    ]

    testCases.forEach(({ name, expectedSlug }) => {
      const draftResult = createChurch({ name, adminUserId: 'user-123' })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      const result = publishChurch(draftResult.value)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.slug).toBe(expectedSlug)
      }
    })
  })

  it('should fail for too short slug', () => {
    const draftResult = createChurch({ name: 'A B', adminUserId: 'user-123' })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const result = publishChurch(draftResult.value)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('slug')
    }
  })
})
```

**Step 6: Implement publishChurch workflow**

Create `packages/domain/src/church/workflows/publishChurch.ts`:
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { DraftChurch, PublishedChurch } from '../entities/ChurchState'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Generate URL-safe slug from church name
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, '') // Trim hyphens from ends
}

/**
 * Publish a draft church, making it visible to the public.
 * Pure function with no side effects.
 *
 * Note: Caller must check for slug uniqueness in the repository.
 *
 * @param draft - Draft church to publish
 * @returns Published church or validation error
 */
export const publishChurch = (draft: DraftChurch): Result<PublishedChurch, ValidationError> => {
  const slug = generateSlug(draft.name.toString())

  // Validate slug length
  if (slug.length < 3) {
    return err(
      new ValidationError('Generated slug is too short. Church name must contain more valid characters.')
    )
  }

  if (slug.length > 200) {
    return err(new ValidationError('Generated slug is too long'))
  }

  return ok({
    tag: 'Published' as const,
    id: draft.id,
    name: draft.name,
    slug,
    publishedAt: new Date(),
    createdAt: draft.createdAt,
  })
}
```

**Step 7: Run tests**

```bash
pnpm test publishChurch
```

Expected: All tests PASS

**Step 8: Write verifyChurch tests**

Create `packages/domain/src/church/workflows/__tests__/verifyChurch.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { verifyChurch, VerifyChurchInput } from '../verifyChurch'
import { createChurch } from '../createChurch'
import { publishChurch } from '../publishChurch'
import { isVerified } from '../../entities/ChurchState'

describe('verifyChurch workflow', () => {
  it('should verify published church by admin', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'church-admin-123',
    })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const publishedResult = publishChurch(draftResult.value)
    expect(publishedResult.isOk()).toBe(true)
    if (publishedResult.isErr()) return

    const input: VerifyChurchInput = {
      church: publishedResult.value,
      verifiedBy: 'admin-123',
      verifierRole: 'ADMIN',
    }

    const result = verifyChurch(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const verified = result.value
      expect(isVerified(verified)).toBe(true)
      expect(verified.verifiedBy).toBe('admin-123')
      expect(verified.verifiedAt).toBeInstanceOf(Date)
      expect(verified.slug).toBe(publishedResult.value.slug)
    }
  })

  it('should fail if verifier is not admin', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const publishedResult = publishChurch(draftResult.value)
    expect(publishedResult.isOk()).toBe(true)
    if (publishedResult.isErr()) return

    const input: VerifyChurchInput = {
      church: publishedResult.value,
      verifiedBy: 'user-123',
      verifierRole: 'CHURCH_ADMIN',
    }

    const result = verifyChurch(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('admin')
      expect(result.error.code).toBe('AUTHORIZATION_ERROR')
    }
  })

  it('should fail if verifier is regular user', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const publishedResult = publishChurch(draftResult.value)
    expect(publishedResult.isOk()).toBe(true)
    if (publishedResult.isErr()) return

    const input: VerifyChurchInput = {
      church: publishedResult.value,
      verifiedBy: 'user-456',
      verifierRole: 'USER',
    }

    const result = verifyChurch(input)

    expect(result.isErr()).toBe(true)
  })
})
```

**Step 9: Implement verifyChurch workflow**

Create `packages/domain/src/church/workflows/verifyChurch.ts`:
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { PublishedChurch, VerifiedChurch } from '../entities/ChurchState'
import { AuthorizationError } from '../../shared/errors/DomainError'

/**
 * User role enum
 */
export type UserRole = 'ADMIN' | 'CHURCH_ADMIN' | 'USER'

/**
 * Input for verifying a church
 */
export type VerifyChurchInput = {
  church: PublishedChurch
  verifiedBy: string // Admin user ID
  verifierRole: UserRole
}

/**
 * Verify a published church.
 * Only platform admins can verify churches.
 * Pure function with no side effects.
 *
 * @param input - Verification data
 * @returns Verified church or authorization error
 */
export const verifyChurch = (input: VerifyChurchInput): Result<VerifiedChurch, AuthorizationError> => {
  // Only admins can verify churches
  if (input.verifierRole !== 'ADMIN') {
    return err(new AuthorizationError('Only platform admins can verify churches', 'ADMIN'))
  }

  return ok({
    tag: 'Verified' as const,
    id: input.church.id,
    name: input.church.name,
    slug: input.church.slug,
    publishedAt: input.church.publishedAt,
    verifiedAt: new Date(),
    verifiedBy: input.verifiedBy,
    createdAt: input.church.createdAt,
  })
}
```

**Step 10: Run all workflow tests**

```bash
pnpm test workflows
```

Expected: All tests PASS

**Step 11: Create barrel export**

Create `packages/domain/src/church/workflows/index.ts`:
```typescript
export * from './createChurch'
export * from './publishChurch'
export * from './verifyChurch'
```

**Step 12: Run all domain tests**

```bash
cd packages/domain
pnpm test
```

Expected: All tests PASS

**Step 13: Verify type checking**

```bash
pnpm type-check
```

Expected: No errors

**Step 14: Commit**

```bash
git add packages/domain/src/church/workflows/
git commit -m "feat(domain): add Church workflows (create, publish, verify)"
```

---

## Task 9: Create Domain Package Index

**Files:**
- Create: `packages/domain/src/church/index.ts`
- Create: `packages/domain/src/shared/index.ts`
- Create: `packages/domain/src/index.ts`

**Step 1: Create church barrel export**

Create `packages/domain/src/church/index.ts`:
```typescript
// Value Objects
export * from './valueObjects'

// Entities
export * from './entities'

// Repositories
export * from './repositories'

// Workflows
export * from './workflows'
```

**Step 2: Create shared barrel export**

Create `packages/domain/src/shared/index.ts`:
```typescript
// Types
export * from './types'

// Errors
export * from './errors'

// Value Objects
export * from './valueObjects'
```

**Step 3: Create main index**

Create `packages/domain/src/index.ts`:
```typescript
// Shared domain primitives
export * from './shared'

// Church domain
export * from './church'
```

**Step 4: Verify exports work**

```bash
cd packages/domain
pnpm type-check
```

Expected: No errors

**Step 5: Commit**

```bash
git add packages/domain/src/index.ts packages/domain/src/church/index.ts packages/domain/src/shared/index.ts
git commit -m "feat(domain): add barrel exports for domain package"
```

---

## Summary

**Phase 1 Complete! You've built:**

1. ✅ Domain package with neverthrow
2. ✅ Result types for railway-oriented programming
3. ✅ Domain error hierarchy
4. ✅ Base value object classes
5. ✅ Church value objects (ChurchId, ChurchName, Email, PostalCode)
6. ✅ Church state tagged union (Draft → Published → Verified)
7. ✅ Church repository interface
8. ✅ Church workflows (createChurch, publishChurch, verifyChurch)
9. ✅ Comprehensive test coverage

**Next Steps:**

- **Phase 2:** Infrastructure layer (Prisma repository implementation)
- **Phase 3:** GraphQL adapter layer (connect workflows to resolvers)
- **Phase 4:** Review & Donation domains

**Run all tests:**
```bash
cd packages/domain
pnpm test
```

**Expected:** All tests passing, 100% pure domain logic, zero infrastructure dependencies.

---

Plan complete and saved to `docs/plans/2025-11-04-ddd-foundation-phase1.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
