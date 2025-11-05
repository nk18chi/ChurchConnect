# ChurchConnect DDD + Functional Programming Refactoring Plan

## Overview

Refactor ChurchConnect backend from imperative Pothos GraphQL resolvers to Domain-Driven Design with Functional Programming patterns, using neverthrow for railway-oriented programming.

**References:**
- Your DevWisdom backend: https://github.com/nk18chi/DevWisdom/tree/main/apps/backend/src
- Ikyu DDD+FP article: https://techplay.jp/column/1631

**Status:** Planning Phase
**Estimated Time:** 3-4 weeks
**Priority:** High (Technical Debt Reduction)

---

## Current Architecture Problems

### 1. **Anemic Domain Model**
- Business logic scattered across GraphQL resolvers
- Prisma models are just data containers (no behavior)
- Validation mixed with data access
- Authorization checks duplicated in every resolver

### 2. **Imperative Error Handling**
- Throwing exceptions in resolvers (unpredictable control flow)
- No type-safe error handling
- Errors swallowed by GraphQL's default error handling
- Hard to compose operations that might fail

### 3. **Tight Coupling**
- GraphQL resolvers directly call Prisma
- No separation between domain logic and infrastructure
- Hard to test business logic in isolation
- Can't swap database implementation

### 4. **Missing Domain Concepts**
- Church states not modeled (Draft → Published → Verified)
- Review moderation flow implicit in status enum
- Donation processing scattered across mutations
- No explicit domain events

---

## Target Architecture

```
packages/
├── domain/              # Pure domain logic (no dependencies)
│   ├── church/
│   │   ├── entities/
│   │   │   ├── Church.ts          # Church aggregate root
│   │   │   ├── ChurchProfile.ts   # Value object
│   │   │   └── ChurchStaff.ts     # Entity
│   │   ├── valueObjects/
│   │   │   ├── ChurchId.ts
│   │   │   ├── ChurchName.ts
│   │   │   ├── Email.ts
│   │   │   └── PostalCode.ts
│   │   ├── repositories/
│   │   │   └── IChurchRepository.ts  # Interface
│   │   └── workflows/
│   │       ├── createChurch.ts       # Pure function
│   │       ├── publishChurch.ts
│   │       └── verifyChurch.ts
│   │
│   ├── review/
│   │   ├── entities/
│   │   │   ├── Review.ts
│   │   │   └── ReviewResponse.ts
│   │   ├── valueObjects/
│   │   │   ├── ReviewContent.ts
│   │   │   └── ReviewStatus.ts     # Tagged union
│   │   └── workflows/
│   │       ├── submitReview.ts
│   │       ├── moderateReview.ts
│   │       └── respondToReview.ts
│   │
│   ├── donation/
│   │   ├── entities/
│   │   │   ├── Donation.ts
│   │   │   └── Subscription.ts
│   │   ├── valueObjects/
│   │   │   ├── Amount.ts
│   │   │   └── DonationStatus.ts   # Tagged union
│   │   └── workflows/
│   │       ├── processDonation.ts
│   │       └── handleWebhook.ts
│   │
│   └── shared/
│       ├── errors/
│       │   ├── DomainError.ts
│       │   ├── ValidationError.ts
│       │   └── AuthorizationError.ts
│       └── types/
│           ├── Result.ts           # Re-export neverthrow
│           └── UserId.ts
│
├── infrastructure/      # External dependencies
│   ├── persistence/
│   │   ├── prisma/
│   │   │   ├── ChurchRepository.ts    # Implements IChurchRepository
│   │   │   ├── ReviewRepository.ts
│   │   │   └── mappers/
│   │   │       ├── ChurchMapper.ts    # Prisma ↔ Domain
│   │   │       └── ReviewMapper.ts
│   │   └── redis/
│   │       └── CacheRepository.ts
│   │
│   ├── email/
│   │   └── ResendEmailService.ts
│   │
│   ├── payment/
│   │   └── StripePaymentService.ts
│   │
│   └── storage/
│       └── CloudinaryStorageService.ts
│
└── graphql/            # API layer (thin adapters)
    ├── resolvers/
    │   ├── church/
    │   │   ├── queries.ts       # Adapter: GraphQL → Workflow
    │   │   └── mutations.ts
    │   ├── review/
    │   │   └── mutations.ts
    │   └── donation/
    │       └── mutations.ts
    │
    └── schema/
        └── types/
            ├── church.ts
            └── review.ts
```

---

## Phase 1: Foundation (Week 1)

### Task 1.1: Setup neverthrow
```bash
pnpm add neverthrow
pnpm add -D @types/neverthrow
```

### Task 1.2: Create Shared Domain Types

**File:** `packages/domain/shared/types/Result.ts`
```typescript
export { Result, ok, err, ResultAsync } from 'neverthrow'

export type AsyncResult<T, E> = ResultAsync<T, E>
```

**File:** `packages/domain/shared/errors/DomainError.ts`
```typescript
export abstract class DomainError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = this.constructor.name
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string) {
    super(message, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND')
  }
}
```

### Task 1.3: Create Base Value Objects

**File:** `packages/domain/shared/valueObjects/ValueObject.ts`
```typescript
import { Result, ok, err } from '../types/Result'
import { ValidationError } from '../errors/DomainError'

export abstract class ValueObject<T> {
  protected readonly value: T

  protected constructor(value: T) {
    this.value = value
  }

  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.value) === JSON.stringify(other.value)
  }

  getValue(): T {
    return this.value
  }
}

export abstract class StringValueObject extends ValueObject<string> {
  protected static validate(
    value: string,
    rules: {
      minLength?: number
      maxLength?: number
      pattern?: RegExp
      errorMessage?: string
    }
  ): Result<string, ValidationError> {
    const { minLength, maxLength, pattern, errorMessage } = rules

    if (minLength && value.length < minLength) {
      return err(new ValidationError(errorMessage || `Must be at least ${minLength} characters`))
    }

    if (maxLength && value.length > maxLength) {
      return err(new ValidationError(errorMessage || `Must be at most ${maxLength} characters`))
    }

    if (pattern && !pattern.test(value)) {
      return err(new ValidationError(errorMessage || 'Invalid format'))
    }

    return ok(value)
  }
}
```

### Task 1.4: Create Church Value Objects

**File:** `packages/domain/church/valueObjects/ChurchName.ts`
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { StringValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class ChurchName extends StringValueObject {
  private constructor(value: string) {
    super(value)
  }

  static create(name: string): Result<ChurchName, ValidationError> {
    return StringValueObject.validate(name, {
      minLength: 2,
      maxLength: 100,
      errorMessage: 'Church name must be between 2 and 100 characters'
    }).map(validName => new ChurchName(validName))
  }

  toString(): string {
    return this.value
  }
}
```

**File:** `packages/domain/church/valueObjects/Email.ts`
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { StringValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class Email extends StringValueObject {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(value: string) {
    super(value)
  }

  static create(email: string): Result<Email, ValidationError> {
    return StringValueObject.validate(email, {
      pattern: Email.EMAIL_REGEX,
      errorMessage: 'Invalid email format'
    }).map(validEmail => new Email(validEmail.toLowerCase()))
  }

  toString(): string {
    return this.value
  }
}
```

**File:** `packages/domain/church/valueObjects/ChurchId.ts`
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { ValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'

export class ChurchId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(id: string): Result<ChurchId, ValidationError> {
    if (!id || id.length === 0) {
      return err(new ValidationError('Church ID cannot be empty'))
    }
    return ok(new ChurchId(id))
  }

  static createNew(): ChurchId {
    // Use cuid or nanoid here
    return new ChurchId(crypto.randomUUID())
  }

  toString(): string {
    return this.value
  }
}
```

---

## Phase 2: Church Aggregate (Week 2)

### Task 2.1: Model Church States with Tagged Unions

**File:** `packages/domain/church/entities/ChurchState.ts`
```typescript
import { ChurchId } from '../valueObjects/ChurchId'
import { ChurchName } from '../valueObjects/ChurchName'

// Tagged union for church states
export type ChurchState =
  | DraftChurch
  | PublishedChurch
  | VerifiedChurch

export type DraftChurch = {
  readonly tag: 'Draft'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly createdAt: Date
}

export type PublishedChurch = {
  readonly tag: 'Published'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly slug: string
  readonly publishedAt: Date
  readonly createdAt: Date
}

export type VerifiedChurch = {
  readonly tag: 'Verified'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly slug: string
  readonly publishedAt: Date
  readonly verifiedAt: Date
  readonly verifiedBy: string
  readonly createdAt: Date
}

// Type guards
export const isDraft = (church: ChurchState): church is DraftChurch =>
  church.tag === 'Draft'

export const isPublished = (church: ChurchState): church is PublishedChurch =>
  church.tag === 'Published'

export const isVerified = (church: ChurchState): church is VerifiedChurch =>
  church.tag === 'Verified'
```

### Task 2.2: Create Church Repository Interface

**File:** `packages/domain/church/repositories/IChurchRepository.ts`
```typescript
import { Result } from '../../shared/types/Result'
import { ChurchState } from '../entities/ChurchState'
import { ChurchId } from '../valueObjects/ChurchId'
import { DomainError } from '../../shared/errors/DomainError'

export interface IChurchRepository {
  findById(id: ChurchId): Promise<Result<ChurchState | null, DomainError>>
  save(church: ChurchState): Promise<Result<ChurchState, DomainError>>
  delete(id: ChurchId): Promise<Result<void, DomainError>>
}
```

### Task 2.3: Create Church Workflows

**File:** `packages/domain/church/workflows/createChurch.ts`
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { DraftChurch } from '../entities/ChurchState'
import { ChurchId } from '../valueObjects/ChurchId'
import { ChurchName } from '../valueObjects/ChurchName'
import { ValidationError } from '../../shared/errors/DomainError'

export type CreateChurchInput = {
  name: string
  adminUserId: string
}

export type CreateChurchDeps = {
  // No deps needed for pure domain logic
}

export const createChurch = (
  input: CreateChurchInput
): Result<DraftChurch, ValidationError> => {
  return ChurchName.create(input.name).map(name => ({
    tag: 'Draft' as const,
    id: ChurchId.createNew(),
    name,
    createdAt: new Date(),
  }))
}
```

**File:** `packages/domain/church/workflows/publishChurch.ts`
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { DraftChurch, PublishedChurch } from '../entities/ChurchState'
import { ValidationError } from '../../shared/errors/DomainError'

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const publishChurch = (
  draft: DraftChurch
): Result<PublishedChurch, ValidationError> => {
  const slug = generateSlug(draft.name.toString())

  if (slug.length < 3) {
    return err(new ValidationError('Generated slug is too short'))
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

**File:** `packages/domain/church/workflows/verifyChurch.ts`
```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { PublishedChurch, VerifiedChurch } from '../entities/ChurchState'
import { AuthorizationError } from '../../shared/errors/DomainError'

export type VerifyChurchInput = {
  church: PublishedChurch
  verifiedBy: string
  verifierRole: 'ADMIN' | 'CHURCH_ADMIN' | 'USER'
}

export const verifyChurch = (
  input: VerifyChurchInput
): Result<VerifiedChurch, AuthorizationError> => {
  // Only ADMIN can verify churches
  if (input.verifierRole !== 'ADMIN') {
    return err(new AuthorizationError('Only admins can verify churches'))
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

---

## Phase 3: Infrastructure Layer (Week 2)

### Task 3.1: Create Prisma Repository Implementation

**File:** `packages/infrastructure/persistence/prisma/ChurchRepository.ts`
```typescript
import { PrismaClient } from '@prisma/client'
import { Result, ok, err, ResultAsync } from '../../../domain/shared/types/Result'
import { IChurchRepository } from '../../../domain/church/repositories/IChurchRepository'
import { ChurchState } from '../../../domain/church/entities/ChurchState'
import { ChurchId } from '../../../domain/church/valueObjects/ChurchId'
import { DomainError, NotFoundError } from '../../../domain/shared/errors/DomainError'
import { ChurchMapper } from './mappers/ChurchMapper'

export class PrismaChurchRepository implements IChurchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: ChurchId): Promise<Result<ChurchState | null, DomainError>> {
    try {
      const church = await this.prisma.church.findUnique({
        where: { id: id.toString() },
      })

      if (!church) {
        return ok(null)
      }

      return ChurchMapper.toDomain(church)
    } catch (error) {
      return err(new DomainError((error as Error).message, 'DATABASE_ERROR'))
    }
  }

  async save(church: ChurchState): Promise<Result<ChurchState, DomainError>> {
    try {
      const prismaData = ChurchMapper.toPrisma(church)

      const saved = await this.prisma.church.upsert({
        where: { id: church.id.toString() },
        create: prismaData,
        update: prismaData,
      })

      return ChurchMapper.toDomain(saved)
    } catch (error) {
      return err(new DomainError((error as Error).message, 'DATABASE_ERROR'))
    }
  }

  async delete(id: ChurchId): Promise<Result<void, DomainError>> {
    try {
      await this.prisma.church.delete({
        where: { id: id.toString() },
      })
      return ok(undefined)
    } catch (error) {
      return err(new NotFoundError('Church', id.toString()))
    }
  }
}
```

**File:** `packages/infrastructure/persistence/prisma/mappers/ChurchMapper.ts`
```typescript
import { Church as PrismaChurch } from '@prisma/client'
import { Result, ok, err } from '../../../../domain/shared/types/Result'
import { ChurchState, DraftChurch, PublishedChurch, VerifiedChurch } from '../../../../domain/church/entities/ChurchState'
import { ChurchId } from '../../../../domain/church/valueObjects/ChurchId'
import { ChurchName } from '../../../../domain/church/valueObjects/ChurchName'
import { ValidationError } from '../../../../domain/shared/errors/DomainError'

export class ChurchMapper {
  static toDomain(prisma: PrismaChurch): Result<ChurchState, ValidationError> {
    const idResult = ChurchId.create(prisma.id)
    const nameResult = ChurchName.create(prisma.name)

    // Combine Results
    if (idResult.isErr()) return err(idResult.error)
    if (nameResult.isErr()) return err(nameResult.error)

    const id = idResult.value
    const name = nameResult.value

    // Determine state based on data
    if (prisma.verifiedAt && prisma.verifiedBy) {
      return ok({
        tag: 'Verified' as const,
        id,
        name,
        slug: prisma.slug,
        publishedAt: prisma.publishedAt!,
        verifiedAt: prisma.verifiedAt,
        verifiedBy: prisma.verifiedBy,
        createdAt: prisma.createdAt,
      } as VerifiedChurch)
    }

    if (prisma.isPublished && prisma.slug) {
      return ok({
        tag: 'Published' as const,
        id,
        name,
        slug: prisma.slug,
        publishedAt: prisma.publishedAt!,
        createdAt: prisma.createdAt,
      } as PublishedChurch)
    }

    return ok({
      tag: 'Draft' as const,
      id,
      name,
      createdAt: prisma.createdAt,
    } as DraftChurch)
  }

  static toPrisma(domain: ChurchState): any {
    const base = {
      id: domain.id.toString(),
      name: domain.name.toString(),
      createdAt: domain.createdAt,
    }

    switch (domain.tag) {
      case 'Draft':
        return {
          ...base,
          isPublished: false,
          slug: null,
          publishedAt: null,
          verifiedAt: null,
          verifiedBy: null,
        }

      case 'Published':
        return {
          ...base,
          isPublished: true,
          slug: domain.slug,
          publishedAt: domain.publishedAt,
          verifiedAt: null,
          verifiedBy: null,
        }

      case 'Verified':
        return {
          ...base,
          isPublished: true,
          slug: domain.slug,
          publishedAt: domain.publishedAt,
          verifiedAt: domain.verifiedAt,
          verifiedBy: domain.verifiedBy,
        }
    }
  }
}
```

---

## Phase 4: GraphQL Adapter Layer (Week 3)

### Task 4.1: Refactor GraphQL Mutations to Use Workflows

**File:** `packages/graphql/resolvers/church/mutations.ts`
```typescript
import { builder } from '../../builder'
import { createChurch, CreateChurchInput } from '../../../domain/church/workflows/createChurch'
import { publishChurch } from '../../../domain/church/workflows/publishChurch'
import { PrismaChurchRepository } from '../../../infrastructure/persistence/prisma/ChurchRepository'
import { prisma } from '@repo/database'

const churchRepo = new PrismaChurchRepository(prisma)

builder.mutationFields((t) => ({
  createChurch: t.field({
    type: 'Church',
    args: {
      input: t.arg({
        type: builder.inputType('CreateChurchInput', {
          fields: (t) => ({
            name: t.string({ required: true }),
          }),
        }),
        required: true,
      }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const input: CreateChurchInput = {
        name: args.input.name,
        adminUserId: ctx.userId,
      }

      // Domain workflow (pure)
      const churchResult = createChurch(input)

      if (churchResult.isErr()) {
        throw new Error(churchResult.error.message)
      }

      // Infrastructure (save)
      const savedResult = await churchRepo.save(churchResult.value)

      if (savedResult.isErr()) {
        throw new Error(savedResult.error.message)
      }

      // Map domain to GraphQL (this would use another mapper)
      return {
        id: savedResult.value.id.toString(),
        name: savedResult.value.name.toString(),
        // ... other fields
      }
    },
  }),

  publishChurch: t.field({
    type: 'Church',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.userId || ctx.userRole !== 'CHURCH_ADMIN') {
        throw new Error('Unauthorized')
      }

      // Load church from repository
      const churchIdResult = ChurchId.create(args.id)
      if (churchIdResult.isErr()) {
        throw new Error(churchIdResult.error.message)
      }

      const churchResult = await churchRepo.findById(churchIdResult.value)
      if (churchResult.isErr()) {
        throw new Error(churchResult.error.message)
      }

      if (!churchResult.value) {
        throw new Error('Church not found')
      }

      // Check it's in Draft state
      if (churchResult.value.tag !== 'Draft') {
        throw new Error('Church is already published')
      }

      // Domain workflow
      const publishedResult = publishChurch(churchResult.value)
      if (publishedResult.isErr()) {
        throw new Error(publishedResult.error.message)
      }

      // Save
      const savedResult = await churchRepo.save(publishedResult.value)
      if (savedResult.isErr()) {
        throw new Error(savedResult.error.message)
      }

      return {
        id: savedResult.value.id.toString(),
        name: savedResult.value.name.toString(),
        slug: savedResult.value.tag !== 'Draft' ? savedResult.value.slug : null,
        // ... other fields
      }
    },
  }),
}))
```

---

## Phase 5: Review & Donation Domains (Week 3-4)

Apply same patterns to Review and Donation aggregates:

### Review States (Tagged Union)
```typescript
type ReviewState =
  | PendingReview      // Submitted, awaiting moderation
  | ApprovedReview     // Approved by admin
  | RejectedReview     // Rejected by admin
  | RespondedReview    // Church has responded
```

### Donation States (Tagged Union)
```typescript
type DonationState =
  | PendingDonation       // Created, awaiting payment
  | ProcessingDonation    // Payment processing
  | CompletedDonation     // Payment successful
  | FailedDonation        // Payment failed
  | RefundedDonation      // Refunded
```

---

## Phase 6: Testing Strategy

### Unit Tests (Pure Domain Logic)
```typescript
// packages/domain/church/workflows/__tests__/createChurch.test.ts
import { createChurch } from '../createChurch'

describe('createChurch workflow', () => {
  it('should create draft church with valid name', () => {
    const result = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.tag).toBe('Draft')
      expect(result.value.name.toString()).toBe('Tokyo Baptist Church')
    }
  })

  it('should fail with invalid name', () => {
    const result = createChurch({
      name: 'A', // Too short
      adminUserId: 'user-123',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('2 and 100 characters')
    }
  })
})
```

### Integration Tests (Repository)
```typescript
// packages/infrastructure/__tests__/ChurchRepository.test.ts
import { PrismaChurchRepository } from '../persistence/prisma/ChurchRepository'
import { createChurch } from '../../domain/church/workflows/createChurch'

describe('PrismaChurchRepository', () => {
  let repo: PrismaChurchRepository

  beforeEach(() => {
    // Setup test database
  })

  it('should save and retrieve draft church', async () => {
    const churchResult = createChurch({
      name: 'Test Church',
      adminUserId: 'user-123',
    })

    expect(churchResult.isOk()).toBe(true)
    if (churchResult.isErr()) return

    const saveResult = await repo.save(churchResult.value)
    expect(saveResult.isOk()).toBe(true)
    if (saveResult.isErr()) return

    const findResult = await repo.findById(churchResult.value.id)
    expect(findResult.isOk()).toBe(true)
    if (findResult.isErr()) return

    expect(findResult.value).not.toBeNull()
    expect(findResult.value!.tag).toBe('Draft')
  })
})
```

---

## Migration Strategy

### Option A: Big Bang (Not Recommended)
Refactor everything at once - risky, blocks other work.

### Option B: Strangler Fig Pattern (Recommended)
Gradually replace old code while keeping system working:

**Week 1-2: Foundation + Church Aggregate**
- ✅ Keep existing GraphQL resolvers working
- ✅ Build new domain layer alongside
- ✅ Start with Church create/publish/verify workflows
- ✅ Test thoroughly before switching

**Week 3: Switch Church Mutations**
- ✅ Redirect GraphQL resolvers to use new workflows
- ✅ Keep old code for rollback safety
- ✅ Monitor production for issues

**Week 4: Review & Donation**
- ✅ Apply same patterns to other aggregates
- ✅ Delete old code once stable

---

## Benefits of This Approach

### 1. **Type-Safe Error Handling**
```typescript
// Before (imperative, can throw anywhere)
async function createChurch(name: string) {
  if (!name) throw new Error('Name required')
  const church = await prisma.church.create({ data: { name } })
  return church
}

// After (functional, errors are values)
function createChurch(input: CreateChurchInput): Result<DraftChurch, ValidationError> {
  return ChurchName.create(input.name).map(name => ({
    tag: 'Draft',
    id: ChurchId.createNew(),
    name,
    createdAt: new Date(),
  }))
}
// Compiler forces you to handle both Ok and Err cases
```

### 2. **Impossible States Made Impossible**
```typescript
// Before (can have invalid combinations)
type Church = {
  id: string
  name: string
  isPublished: boolean
  slug?: string           // Can be null even if published!
  verifiedAt?: Date       // Can be set without isPublished!
}

// After (type system prevents invalid states)
type ChurchState = DraftChurch | PublishedChurch | VerifiedChurch
// Draft has no slug
// Published has slug
// Verified has slug + verifiedAt
// Compiler prevents creating invalid states
```

### 3. **Testable Business Logic**
```typescript
// Before: Hard to test (needs database)
async function publishChurch(id: string) {
  const church = await prisma.church.findUnique({ where: { id } })
  if (!church) throw new Error('Not found')
  if (church.isPublished) throw new Error('Already published')
  return prisma.church.update({
    where: { id },
    data: { isPublished: true, slug: generateSlug(church.name) }
  })
}

// After: Pure function, easy to test
function publishChurch(draft: DraftChurch): Result<PublishedChurch, ValidationError> {
  const slug = generateSlug(draft.name.toString())
  return ok({
    tag: 'Published',
    id: draft.id,
    name: draft.name,
    slug,
    publishedAt: new Date(),
    createdAt: draft.createdAt,
  })
}
// No database needed for unit tests!
```

### 4. **Composable Workflows**
```typescript
// Chain operations with railway-oriented programming
const result = await createChurch(input)
  .asyncAndThen(church => churchRepo.save(church))
  .asyncAndThen(saved => emailService.sendWelcome(saved))
  .asyncMap(sent => ({ success: true, churchId: sent.id }))

// Errors automatically propagate, no try/catch needed
if (result.isErr()) {
  return handleError(result.error)
}
return result.value
```

---

## Package Structure After Refactoring

```
packages/
├── domain/                    # NEW: Pure business logic
│   ├── church/
│   ├── review/
│   ├── donation/
│   └── shared/
│
├── infrastructure/            # NEW: Implementations
│   ├── persistence/
│   ├── email/
│   ├── payment/
│   └── storage/
│
├── graphql/                   # REFACTORED: Thin adapter
│   ├── resolvers/
│   └── schema/
│
├── database/                  # KEEP: Prisma schema
│   └── prisma/
│
├── auth/                      # KEEP: NextAuth config
├── ui/                        # KEEP: UI components
└── email/                     # KEEP: Email templates
```

---

## Next Steps

1. **Review this plan** - Does it align with your vision?
2. **Choose migration strategy** - Big bang or strangler fig?
3. **Start with Phase 1** - Foundation (neverthrow + value objects)
4. **One aggregate at a time** - Church first, then Review, then Donation

Would you like me to start implementing Phase 1 (Foundation)?
