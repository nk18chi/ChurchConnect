# DDD Review Domain (Phase 5) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Review aggregate using DDD + Functional Programming patterns following the proven Church domain architecture.

**Architecture:** Apply the same 4-layer architecture (Domain → Infrastructure → GraphQL) to the Review aggregate. Model review states as tagged unions (Pending/Approved/Rejected/Responded), implement pure domain workflows, create repository with mapper, and add GraphQL mutations.

**Tech Stack:** TypeScript, neverthrow (Result types), Prisma ORM, Pothos GraphQL, Jest

---

## Context

**Completed Phases:**
- ✅ Phase 1: Foundation (neverthrow, shared errors, Church value objects)
- ✅ Phase 3: Church Infrastructure (PrismaChurchRepository, ChurchMapper)
- ✅ Phase 4: Church GraphQL Adapters (createChurch, publishChurch, verifyChurch mutations)

**Phase 5 Goal:** Apply the same patterns to Review domain

**Review State Machine:**
```
Pending → Approved → [Responded]
       ↘ Rejected → [Responded]
```

**Database Schema (existing):**
```prisma
model Review {
  id             String         @id @default(cuid())
  churchId       String
  userId         String
  content        String         @db.Text
  visitDate      DateTime?
  experienceType String?
  status         ReviewStatus   @default(PENDING)
  moderatedAt    DateTime?
  moderatedBy    String?
  moderationNote String?
  response       ReviewResponse?
  isFlagged      Boolean        @default(false)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## Task 1: Review Domain Layer - Value Objects

Create foundational value objects for the Review domain.

**Files:**
- Create: `packages/domain/src/review/valueObjects/ReviewId.ts`
- Create: `packages/domain/src/review/valueObjects/ReviewContent.ts`
- Test: `packages/domain/src/review/valueObjects/__tests__/ReviewId.test.ts`
- Test: `packages/domain/src/review/valueObjects/__tests__/ReviewContent.test.ts`

### Step 1: Write ReviewId tests

Create file: `packages/domain/src/review/valueObjects/__tests__/ReviewId.test.ts`

```typescript
import { ReviewId } from '../ReviewId'

describe('ReviewId', () => {
  it('should create valid review ID', () => {
    const result = ReviewId.create('review-123')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('review-123')
    }
  })

  it('should reject empty review ID', () => {
    const result = ReviewId.create('')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('cannot be empty')
    }
  })

  it('should create new review ID', () => {
    const id1 = ReviewId.createNew()
    const id2 = ReviewId.createNew()

    expect(id1.toString()).not.toBe(id2.toString())
    expect(id1.toString()).toHaveLength(25) // cuid length
  })
})
```

### Step 2: Write ReviewContent tests

Create file: `packages/domain/src/review/valueObjects/__tests__/ReviewContent.test.ts`

```typescript
import { ReviewContent } from '../ReviewContent'

describe('ReviewContent', () => {
  it('should create valid review content', () => {
    const result = ReviewContent.create('Great church with friendly community!')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Great church with friendly community!')
    }
  })

  it('should reject content that is too short', () => {
    const result = ReviewContent.create('Hi')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000 characters')
    }
  })

  it('should reject content that is too long', () => {
    const longContent = 'a'.repeat(2001)
    const result = ReviewContent.create(longContent)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000 characters')
    }
  })

  it('should trim whitespace', () => {
    const result = ReviewContent.create('  Good church  ')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Good church')
    }
  })
})
```

### Step 3: Run tests to verify they fail

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm test ReviewId`

Expected: FAIL - Cannot find module '../ReviewId'

Run: `pnpm test ReviewContent`

Expected: FAIL - Cannot find module '../ReviewContent'

### Step 4: Implement ReviewId

Create file: `packages/domain/src/review/valueObjects/ReviewId.ts`

```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { ValueObject } from '../../shared/valueObjects/ValueObject'
import { ValidationError } from '../../shared/errors/DomainError'
import { createId } from '@paralleldrive/cuid2'

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
    return new ReviewId(createId())
  }

  toString(): string {
    return this.value
  }
}
```

### Step 5: Implement ReviewContent

Create file: `packages/domain/src/review/valueObjects/ReviewContent.ts`

```typescript
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
```

### Step 6: Run tests to verify they pass

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm test ReviewId`

Expected: PASS (3/3 tests)

Run: `pnpm test ReviewContent`

Expected: PASS (4/4 tests)

### Step 7: Update domain package exports

Modify file: `packages/domain/src/index.ts`

Add these exports:

```typescript
// Review domain
export { ReviewId } from './review/valueObjects/ReviewId'
export { ReviewContent } from './review/valueObjects/ReviewContent'
```

### Step 8: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm type-check`

Expected: No type errors in new files

### Step 9: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/domain/src/review/valueObjects packages/domain/src/index.ts
git commit -m "feat(domain): add Review value objects (ReviewId, ReviewContent)

- Create ReviewId with validation and createNew()
- Create ReviewContent with length validation (10-2000 chars)
- Add comprehensive unit tests (7/7 passing)
- Export from domain package

Part of Phase 5 (Review Domain) - Task 1"
```

---

## Task 2: Review Domain Layer - State Machine

Model review states as tagged union with type guards.

**Files:**
- Create: `packages/domain/src/review/entities/ReviewState.ts`
- Test: `packages/domain/src/review/entities/__tests__/ReviewState.test.ts`

### Step 1: Write failing tests

Create file: `packages/domain/src/review/entities/__tests__/ReviewState.test.ts`

```typescript
import {
  isPending,
  isApproved,
  isRejected,
  isResponded,
  PendingReview,
  ApprovedReview,
  RejectedReview,
  RespondedReview
} from '../ReviewState'
import { ReviewId } from '../../valueObjects/ReviewId'
import { ReviewContent } from '../../valueObjects/ReviewContent'
import { ChurchId } from '../../../church/valueObjects/ChurchId'

describe('ReviewState type guards', () => {
  const reviewId = ReviewId.createNew()
  const churchId = ChurchId.createNew()
  const userId = 'user-123'
  const contentResult = ReviewContent.create('Great church!')

  if (contentResult.isErr()) throw new Error('Test setup failed')
  const content = contentResult.value

  it('should identify pending review', () => {
    const review: PendingReview = {
      tag: 'Pending',
      id: reviewId,
      churchId,
      userId,
      content,
      createdAt: new Date(),
    }

    expect(isPending(review)).toBe(true)
    expect(isApproved(review)).toBe(false)
  })

  it('should identify approved review', () => {
    const review: ApprovedReview = {
      tag: 'Approved',
      id: reviewId,
      churchId,
      userId,
      content,
      moderatedAt: new Date(),
      moderatedBy: 'admin-123',
      createdAt: new Date(),
    }

    expect(isApproved(review)).toBe(true)
    expect(isPending(review)).toBe(false)
  })

  it('should identify rejected review', () => {
    const review: RejectedReview = {
      tag: 'Rejected',
      id: reviewId,
      churchId,
      userId,
      content,
      moderatedAt: new Date(),
      moderatedBy: 'admin-123',
      moderationNote: 'Spam',
      createdAt: new Date(),
    }

    expect(isRejected(review)).toBe(true)
    expect(isPending(review)).toBe(false)
  })

  it('should identify responded review', () => {
    const review: RespondedReview = {
      tag: 'Responded',
      baseState: 'Approved' as const,
      id: reviewId,
      churchId,
      userId,
      content,
      moderatedAt: new Date(),
      moderatedBy: 'admin-123',
      responseContent: 'Thank you for your feedback!',
      respondedBy: 'church-admin-456',
      respondedAt: new Date(),
      createdAt: new Date(),
    }

    expect(isResponded(review)).toBe(true)
    expect(isApproved(review)).toBe(false)
  })
})
```

### Step 2: Run tests to verify they fail

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm test ReviewState`

Expected: FAIL - Cannot find module '../ReviewState'

### Step 3: Implement ReviewState

Create file: `packages/domain/src/review/entities/ReviewState.ts`

```typescript
import { ReviewId } from '../valueObjects/ReviewId'
import { ReviewContent } from '../valueObjects/ReviewContent'
import { ChurchId } from '../../church/valueObjects/ChurchId'

/**
 * Review state machine using tagged unions
 *
 * State transitions:
 * Pending → Approved → Responded
 *        ↘ Rejected → Responded
 */
export type ReviewState =
  | PendingReview
  | ApprovedReview
  | RejectedReview
  | RespondedReview

export type PendingReview = {
  readonly tag: 'Pending'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly createdAt: Date
}

export type ApprovedReview = {
  readonly tag: 'Approved'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly moderatedAt: Date
  readonly moderatedBy: string
  readonly createdAt: Date
}

export type RejectedReview = {
  readonly tag: 'Rejected'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly moderatedAt: Date
  readonly moderatedBy: string
  readonly moderationNote?: string
  readonly createdAt: Date
}

export type RespondedReview = {
  readonly tag: 'Responded'
  readonly baseState: 'Approved' | 'Rejected'
  readonly id: ReviewId
  readonly churchId: ChurchId
  readonly userId: string
  readonly content: ReviewContent
  readonly visitDate?: Date
  readonly experienceType?: string
  readonly moderatedAt: Date
  readonly moderatedBy: string
  readonly moderationNote?: string
  readonly responseContent: string
  readonly respondedBy: string
  readonly respondedAt: Date
  readonly createdAt: Date
}

// Type guards
export const isPending = (review: ReviewState): review is PendingReview =>
  review.tag === 'Pending'

export const isApproved = (review: ReviewState): review is ApprovedReview =>
  review.tag === 'Approved'

export const isRejected = (review: ReviewState): review is RejectedReview =>
  review.tag === 'Rejected'

export const isResponded = (review: ReviewState): review is RespondedReview =>
  review.tag === 'Responded'
```

### Step 4: Run tests to verify they pass

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm test ReviewState`

Expected: PASS (4/4 tests)

### Step 5: Update domain exports

Modify: `packages/domain/src/index.ts`

Add exports:

```typescript
export {
  ReviewState,
  PendingReview,
  ApprovedReview,
  RejectedReview,
  RespondedReview,
  isPending,
  isApproved,
  isRejected,
  isResponded,
} from './review/entities/ReviewState'
```

### Step 6: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm type-check`

Expected: No type errors

### Step 7: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/domain/src/review/entities packages/domain/src/index.ts
git commit -m "feat(domain): add Review state machine with tagged unions

- Model review states: Pending, Approved, Rejected, Responded
- Add type guards for exhaustive checking
- Add comprehensive unit tests (4/4 passing)
- Export from domain package

Part of Phase 5 (Review Domain) - Task 2"
```

---

## Task 3: Review Domain Layer - Workflows

Create pure domain workflows for review operations.

**Files:**
- Create: `packages/domain/src/review/workflows/submitReview.ts`
- Create: `packages/domain/src/review/workflows/moderateReview.ts`
- Create: `packages/domain/src/review/workflows/respondToReview.ts`
- Create: `packages/domain/src/review/repositories/IReviewRepository.ts`
- Test: `packages/domain/src/review/workflows/__tests__/submitReview.test.ts`
- Test: `packages/domain/src/review/workflows/__tests__/moderateReview.test.ts`
- Test: `packages/domain/src/review/workflows/__tests__/respondToReview.test.ts`

### Step 1: Write submitReview tests

Create file: `packages/domain/src/review/workflows/__tests__/submitReview.test.ts`

```typescript
import { submitReview } from '../submitReview'

describe('submitReview workflow', () => {
  it('should create pending review with valid input', () => {
    const result = submitReview({
      churchId: 'church-123',
      userId: 'user-456',
      content: 'Great church with welcoming community!',
      visitDate: new Date('2024-01-15'),
      experienceType: 'Sunday Service',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.tag).toBe('Pending')
      expect(result.value.content.toString()).toBe('Great church with welcoming community!')
      expect(result.value.userId).toBe('user-456')
    }
  })

  it('should reject invalid content', () => {
    const result = submitReview({
      churchId: 'church-123',
      userId: 'user-456',
      content: 'Too short',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000 characters')
    }
  })

  it('should handle optional fields', () => {
    const result = submitReview({
      churchId: 'church-123',
      userId: 'user-456',
      content: 'Good church experience!',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.visitDate).toBeUndefined()
      expect(result.value.experienceType).toBeUndefined()
    }
  })
})
```

### Step 2: Write moderateReview tests

Create file: `packages/domain/src/review/workflows/__tests__/moderateReview.test.ts`

```typescript
import { submitReview } from '../submitReview'
import { moderateReview } from '../moderateReview'

describe('moderateReview workflow', () => {
  const setupPendingReview = () => {
    const result = submitReview({
      churchId: 'church-123',
      userId: 'user-456',
      content: 'Great church!',
    })

    if (result.isErr()) throw new Error('Test setup failed')
    return result.value
  }

  it('should approve pending review', () => {
    const pending = setupPendingReview()

    const result = moderateReview({
      review: pending,
      decision: 'APPROVED',
      moderatedBy: 'admin-789',
      moderatorRole: 'ADMIN',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.tag).toBe('Approved')
      expect(result.value.moderatedBy).toBe('admin-789')
      expect(result.value.moderatedAt).toBeInstanceOf(Date)
    }
  })

  it('should reject pending review with note', () => {
    const pending = setupPendingReview()

    const result = moderateReview({
      review: pending,
      decision: 'REJECTED',
      moderatedBy: 'admin-789',
      moderatorRole: 'ADMIN',
      moderationNote: 'Spam content',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.tag).toBe('Rejected')
      expect(result.value.moderationNote).toBe('Spam content')
    }
  })

  it('should reject moderation from non-admin', () => {
    const pending = setupPendingReview()

    const result = moderateReview({
      review: pending,
      decision: 'APPROVED',
      moderatedBy: 'user-123',
      moderatorRole: 'USER',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('Only admins')
    }
  })
})
```

### Step 3: Write respondToReview tests

Create file: `packages/domain/src/review/workflows/__tests__/respondToReview.test.ts`

```typescript
import { submitReview } from '../submitReview'
import { moderateReview } from '../moderateReview'
import { respondToReview } from '../respondToReview'

describe('respondToReview workflow', () => {
  const setupApprovedReview = () => {
    const submitResult = submitReview({
      churchId: 'church-123',
      userId: 'user-456',
      content: 'Great church!',
    })

    if (submitResult.isErr()) throw new Error('Setup failed')

    const moderateResult = moderateReview({
      review: submitResult.value,
      decision: 'APPROVED',
      moderatedBy: 'admin-789',
      moderatorRole: 'ADMIN',
    })

    if (moderateResult.isErr()) throw new Error('Setup failed')
    return moderateResult.value
  }

  it('should add response to approved review', () => {
    const approved = setupApprovedReview()

    const result = respondToReview({
      review: approved,
      responseContent: 'Thank you for your kind words!',
      respondedBy: 'church-admin-123',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.tag).toBe('Responded')
      expect(result.value.baseState).toBe('Approved')
      expect(result.value.responseContent).toBe('Thank you for your kind words!')
    }
  })

  it('should reject response content that is too short', () => {
    const approved = setupApprovedReview()

    const result = respondToReview({
      review: approved,
      responseContent: 'Hi',
      respondedBy: 'church-admin-123',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 1000 characters')
    }
  })

  it('should reject responding to pending review', () => {
    const pendingResult = submitReview({
      churchId: 'church-123',
      userId: 'user-456',
      content: 'Great church!',
    })

    if (pendingResult.isErr()) throw new Error('Setup failed')

    const result = respondToReview({
      review: pendingResult.value as any,
      responseContent: 'Thank you!',
      respondedBy: 'church-admin-123',
    })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('Only approved or rejected')
    }
  })
})
```

### Step 4: Run tests to verify they fail

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm test submitReview`

Expected: FAIL - Cannot find module

Run: `pnpm test moderateReview`

Expected: FAIL - Cannot find module

Run: `pnpm test respondToReview`

Expected: FAIL - Cannot find module

### Step 5: Implement workflows

Create file: `packages/domain/src/review/workflows/submitReview.ts`

```typescript
import { Result, ok } from '../../shared/types/Result'
import { PendingReview } from '../entities/ReviewState'
import { ReviewId } from '../valueObjects/ReviewId'
import { ReviewContent } from '../valueObjects/ReviewContent'
import { ChurchId } from '../../church/valueObjects/ChurchId'
import { ValidationError } from '../../shared/errors/DomainError'

export type SubmitReviewInput = {
  churchId: string
  userId: string
  content: string
  visitDate?: Date
  experienceType?: string
}

export const submitReview = (
  input: SubmitReviewInput
): Result<PendingReview, ValidationError> => {
  const churchIdResult = ChurchId.create(input.churchId)
  if (churchIdResult.isErr()) return churchIdResult

  const contentResult = ReviewContent.create(input.content)
  if (contentResult.isErr()) return contentResult

  return ok({
    tag: 'Pending' as const,
    id: ReviewId.createNew(),
    churchId: churchIdResult.value,
    userId: input.userId,
    content: contentResult.value,
    visitDate: input.visitDate,
    experienceType: input.experienceType,
    createdAt: new Date(),
  })
}
```

Create file: `packages/domain/src/review/workflows/moderateReview.ts`

```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { PendingReview, ApprovedReview, RejectedReview } from '../entities/ReviewState'
import { AuthorizationError } from '../../shared/errors/DomainError'

export type ModerateReviewInput = {
  review: PendingReview
  decision: 'APPROVED' | 'REJECTED'
  moderatedBy: string
  moderatorRole: 'ADMIN' | 'CHURCH_ADMIN' | 'USER'
  moderationNote?: string
}

export const moderateReview = (
  input: ModerateReviewInput
): Result<ApprovedReview | RejectedReview, AuthorizationError> => {
  // Only ADMIN can moderate reviews
  if (input.moderatorRole !== 'ADMIN') {
    return err(new AuthorizationError('Only admins can moderate reviews'))
  }

  const moderatedAt = new Date()

  if (input.decision === 'APPROVED') {
    return ok({
      tag: 'Approved' as const,
      id: input.review.id,
      churchId: input.review.churchId,
      userId: input.review.userId,
      content: input.review.content,
      visitDate: input.review.visitDate,
      experienceType: input.review.experienceType,
      moderatedAt,
      moderatedBy: input.moderatedBy,
      createdAt: input.review.createdAt,
    } as ApprovedReview)
  }

  return ok({
    tag: 'Rejected' as const,
    id: input.review.id,
    churchId: input.review.churchId,
    userId: input.review.userId,
    content: input.review.content,
    visitDate: input.review.visitDate,
    experienceType: input.review.experienceType,
    moderatedAt,
    moderatedBy: input.moderatedBy,
    moderationNote: input.moderationNote,
    createdAt: input.review.createdAt,
  } as RejectedReview)
}
```

Create file: `packages/domain/src/review/workflows/respondToReview.ts`

```typescript
import { Result, ok, err } from '../../shared/types/Result'
import { ApprovedReview, RejectedReview, RespondedReview } from '../entities/ReviewState'
import { ValidationError } from '../../shared/errors/DomainError'

export type RespondToReviewInput = {
  review: ApprovedReview | RejectedReview
  responseContent: string
  respondedBy: string
}

export const respondToReview = (
  input: RespondToReviewInput
): Result<RespondedReview, ValidationError> => {
  // Validate response content length
  const trimmed = input.responseContent.trim()

  if (trimmed.length < 10) {
    return err(new ValidationError('Response must be between 10 and 1000 characters'))
  }

  if (trimmed.length > 1000) {
    return err(new ValidationError('Response must be between 10 and 1000 characters'))
  }

  // Check if review is approved or rejected (not pending)
  if (input.review.tag !== 'Approved' && input.review.tag !== 'Rejected') {
    return err(new ValidationError('Only approved or rejected reviews can have responses'))
  }

  return ok({
    tag: 'Responded' as const,
    baseState: input.review.tag === 'Approved' ? 'Approved' as const : 'Rejected' as const,
    id: input.review.id,
    churchId: input.review.churchId,
    userId: input.review.userId,
    content: input.review.content,
    visitDate: input.review.visitDate,
    experienceType: input.review.experienceType,
    moderatedAt: input.review.moderatedAt,
    moderatedBy: input.review.moderatedBy,
    moderationNote: 'moderationNote' in input.review ? input.review.moderationNote : undefined,
    responseContent: trimmed,
    respondedBy: input.respondedBy,
    respondedAt: new Date(),
    createdAt: input.review.createdAt,
  })
}
```

### Step 6: Create repository interface

Create file: `packages/domain/src/review/repositories/IReviewRepository.ts`

```typescript
import { AsyncResult } from '../../shared/types/Result'
import { ReviewState } from '../entities/ReviewState'
import { ReviewId } from '../valueObjects/ReviewId'
import { DomainError } from '../../shared/errors/DomainError'

export interface IReviewRepository {
  findById(id: ReviewId): AsyncResult<ReviewState | null, DomainError>
  findByChurchId(churchId: string): AsyncResult<ReviewState[], DomainError>
  save(review: ReviewState): AsyncResult<ReviewState, DomainError>
  delete(id: ReviewId): AsyncResult<void, DomainError>
}
```

### Step 7: Run tests to verify they pass

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm test submitReview`

Expected: PASS (3/3 tests)

Run: `pnpm test moderateReview`

Expected: PASS (3/3 tests)

Run: `pnpm test respondToReview`

Expected: PASS (3/3 tests)

### Step 8: Update domain exports

Modify: `packages/domain/src/index.ts`

Add exports:

```typescript
// Review workflows
export { submitReview, SubmitReviewInput } from './review/workflows/submitReview'
export { moderateReview, ModerateReviewInput } from './review/workflows/moderateReview'
export { respondToReview, RespondToReviewInput } from './review/workflows/respondToReview'
export { IReviewRepository } from './review/repositories/IReviewRepository'
```

### Step 9: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/domain && pnpm type-check`

Expected: No type errors

### Step 10: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/domain/src/review/workflows packages/domain/src/review/repositories packages/domain/src/index.ts
git commit -m "feat(domain): add Review domain workflows

- submitReview: Create pending review
- moderateReview: Approve/reject review (admin only)
- respondToReview: Add church response
- Add IReviewRepository interface
- Add comprehensive unit tests (9/9 passing)

Part of Phase 5 (Review Domain) - Task 3"
```

---

## Verification

After completing all tasks, run:

```bash
cd /Users/naoki/Development/Apps/ChurchConnect

# Run all domain tests
pnpm --filter @repo/domain test

# Type check
pnpm --filter @repo/domain type-check
```

Expected:
- All tests passing (16+ tests: 7 value objects + 4 state machine + 9 workflows)
- No type errors
- 3 clean commits

---

## Summary

**What We Built:**

1. **Value Objects** - ReviewId, ReviewContent with validation
2. **State Machine** - ReviewState tagged union (Pending/Approved/Rejected/Responded)
3. **Domain Workflows** - submitReview, moderateReview, respondToReview
4. **Repository Interface** - IReviewRepository for data access abstraction

**Architecture Benefits:**

- ✅ Type-safe state transitions
- ✅ Impossible states made impossible (can't respond to pending review)
- ✅ Pure domain logic (no dependencies on infrastructure)
- ✅ Railway-oriented programming with Result types
- ✅ Comprehensive test coverage

**Next Steps:**

Phase 5 continues with:
- Task 4-6: Infrastructure Layer (ReviewMapper, PrismaReviewRepository)
- Task 7-9: GraphQL Adapter Layer (submitReview, moderateReview, respondToReview mutations)
- Task 10: Integration tests
- Task 11: Documentation

This plan covers only the domain layer (Tasks 1-3). Would you like me to continue with the infrastructure and GraphQL layers?
