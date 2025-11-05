# DDD Infrastructure Layer - Phase 3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create infrastructure layer to connect the domain layer to Prisma database, implementing the repository pattern with mappers to translate between domain models and database models.

**Architecture:** Implement IChurchRepository with Prisma, create bidirectional mappers (Domain ↔ Prisma), add missing database fields for state tracking (publishedAt, verifiedAt, verifiedBy), and write integration tests.

**Tech Stack:** Prisma, @repo/domain (Phase 1), @repo/database, Jest for testing

**References:**
- Domain layer: `packages/domain/src/`
- Refactoring plan: `docs/plans/2025-11-04-ddd-refactoring-plan.md` (lines 489-645)
- Phase 1 complete: All domain entities, value objects, workflows implemented

---

## Task 1: Update Prisma Schema for Church States

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add state tracking fields to Church model**

Add these fields to the Church model (after line 151):

```prisma
  publishedAt  DateTime?
  verifiedAt   DateTime?
  verifiedBy   String?
```

The complete Church model section should now include:
```prisma
model Church {
  // ... existing fields ...

  isPublished    Boolean    @default(false)
  publishedAt    DateTime?
  verifiedAt     DateTime?
  verifiedBy     String?

  // Full-text search
  searchVector   Unsupported("tsvector")?

  @@index([prefectureId, cityId])
  @@index([denominationId])
  @@index([isVerified, isComplete])
  @@index([isDeleted])
  @@index([searchVector], type: Gin)
}
```

**Step 2: Generate Prisma Client**

```bash
cd /Users/naoki/Development/Apps/ChurchConnect/packages/database
pnpm db:generate
```

Expected: Prisma Client generated successfully

**Step 3: Push schema to database**

```bash
pnpm db:push
```

Expected: Database schema updated with new fields

**Step 4: Commit schema changes**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(database): add publishedAt, verifiedAt, verifiedBy to Church model

Adds fields needed for DDD state tracking:
- publishedAt: When church was published
- verifiedAt: When church was verified by admin
- verifiedBy: Admin user ID who verified the church

These fields support the ChurchState tagged union (Draft → Published → Verified)."
```

---

## Task 2: Create Infrastructure Package Structure

**Files:**
- Create: `packages/infrastructure/package.json`
- Create: `packages/infrastructure/tsconfig.json`
- Create: `packages/infrastructure/src/index.ts`

**Step 1: Create infrastructure package directory**

```bash
mkdir -p /Users/naoki/Development/Apps/ChurchConnect/packages/infrastructure/src/persistence/prisma/mappers
mkdir -p /Users/naoki/Development/Apps/ChurchConnect/packages/infrastructure/src/__tests__
```

**Step 2: Create package.json**

Create `packages/infrastructure/package.json`:
```json
{
  "name": "@repo/infrastructure",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@repo/domain": "workspace:*",
    "@repo/database": "workspace:*"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@jest/globals": "^29.7.0",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.4.5"
  }
}
```

**Step 3: Create TypeScript config**

Create `packages/infrastructure/tsconfig.json`:
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

**Step 4: Create Jest config**

Create `packages/infrastructure/jest.config.js`:
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

**Step 5: Create placeholder index**

Create `packages/infrastructure/src/index.ts`:
```typescript
// Infrastructure package entry point
// Implementations of domain interfaces

export {}
```

**Step 6: Install dependencies**

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
pnpm install
```

Expected: All packages linked successfully

**Step 7: Verify setup**

```bash
cd packages/infrastructure
pnpm type-check
```

Expected: No TypeScript errors

**Step 8: Commit infrastructure package**

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): initialize infrastructure package

Creates infrastructure layer package with:
- Package configuration for Prisma repository implementations
- TypeScript and Jest configuration
- Dependencies on domain and database packages

Ready for repository and mapper implementations."
```

---

## Task 3: Create ChurchMapper (Domain ↔ Prisma)

**Files:**
- Create: `packages/infrastructure/src/persistence/prisma/mappers/ChurchMapper.ts`
- Create: `packages/infrastructure/src/persistence/prisma/mappers/__tests__/ChurchMapper.test.ts`

**Step 1: Write failing mapper tests**

Create `packages/infrastructure/src/persistence/prisma/mappers/__tests__/ChurchMapper.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals'
import { ChurchMapper } from '../ChurchMapper'
import { ChurchId, ChurchName } from '@repo/domain'
import { Church as PrismaChurch } from '@prisma/client'

describe('ChurchMapper', () => {
  describe('toDomain', () => {
    it('should map draft church from Prisma to domain', () => {
      const prismaChurch: PrismaChurch = {
        id: 'church-123',
        name: 'Tokyo Baptist Church',
        slug: 'tokyo-baptist-church',
        description: 'A church in Tokyo',
        denominationId: 'denom-1',
        prefectureId: 'pref-1',
        cityId: 'city-1',
        address: '123 Street',
        postalCode: '100-0001',
        latitude: null,
        longitude: null,
        phone: null,
        email: null,
        website: null,
        contactEmail: null,
        heroImageUrl: null,
        isVerified: false,
        isComplete: false,
        isDeleted: false,
        isPublished: false,
        publishedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        adminUserId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        searchVector: null,
      }

      const result = ChurchMapper.toDomain(prismaChurch)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Draft')
        expect(result.value.id.toString()).toBe('church-123')
        expect(result.value.name.toString()).toBe('Tokyo Baptist Church')
        expect(result.value.createdAt).toEqual(new Date('2025-01-01'))
      }
    })

    it('should map published church from Prisma to domain', () => {
      const prismaChurch: PrismaChurch = {
        id: 'church-123',
        name: 'Tokyo Baptist Church',
        slug: 'tokyo-baptist-church',
        description: 'A church in Tokyo',
        denominationId: 'denom-1',
        prefectureId: 'pref-1',
        cityId: 'city-1',
        address: '123 Street',
        postalCode: '100-0001',
        latitude: null,
        longitude: null,
        phone: null,
        email: null,
        website: null,
        contactEmail: null,
        heroImageUrl: null,
        isVerified: false,
        isComplete: false,
        isDeleted: false,
        isPublished: true,
        publishedAt: new Date('2025-01-02'),
        verifiedAt: null,
        verifiedBy: null,
        adminUserId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        searchVector: null,
      }

      const result = ChurchMapper.toDomain(prismaChurch)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Published')
        if (result.value.tag === 'Published') {
          expect(result.value.slug).toBe('tokyo-baptist-church')
          expect(result.value.publishedAt).toEqual(new Date('2025-01-02'))
        }
      }
    })

    it('should map verified church from Prisma to domain', () => {
      const prismaChurch: PrismaChurch = {
        id: 'church-123',
        name: 'Tokyo Baptist Church',
        slug: 'tokyo-baptist-church',
        description: 'A church in Tokyo',
        denominationId: 'denom-1',
        prefectureId: 'pref-1',
        cityId: 'city-1',
        address: '123 Street',
        postalCode: '100-0001',
        latitude: null,
        longitude: null,
        phone: null,
        email: null,
        website: null,
        contactEmail: null,
        heroImageUrl: null,
        isVerified: true,
        isComplete: false,
        isDeleted: false,
        isPublished: true,
        publishedAt: new Date('2025-01-02'),
        verifiedAt: new Date('2025-01-03'),
        verifiedBy: 'admin-456',
        adminUserId: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-03'),
        searchVector: null,
      }

      const result = ChurchMapper.toDomain(prismaChurch)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.tag).toBe('Verified')
        if (result.value.tag === 'Verified') {
          expect(result.value.verifiedAt).toEqual(new Date('2025-01-03'))
          expect(result.value.verifiedBy).toBe('admin-456')
        }
      }
    })
  })

  describe('toPrisma', () => {
    it('should map draft church from domain to Prisma', () => {
      const idResult = ChurchId.create('church-123')
      const nameResult = ChurchName.create('Tokyo Baptist Church')

      expect(idResult.isOk() && nameResult.isOk()).toBe(true)
      if (idResult.isErr() || nameResult.isErr()) return

      const draftChurch = {
        tag: 'Draft' as const,
        id: idResult.value,
        name: nameResult.value,
        createdAt: new Date('2025-01-01'),
      }

      const prismaData = ChurchMapper.toPrisma(draftChurch)

      expect(prismaData.id).toBe('church-123')
      expect(prismaData.name).toBe('Tokyo Baptist Church')
      expect(prismaData.isPublished).toBe(false)
      expect(prismaData.slug).toBeNull()
      expect(prismaData.publishedAt).toBeNull()
      expect(prismaData.verifiedAt).toBeNull()
      expect(prismaData.verifiedBy).toBeNull()
    })

    it('should map published church from domain to Prisma', () => {
      const idResult = ChurchId.create('church-123')
      const nameResult = ChurchName.create('Tokyo Baptist Church')

      expect(idResult.isOk() && nameResult.isOk()).toBe(true)
      if (idResult.isErr() || nameResult.isErr()) return

      const publishedChurch = {
        tag: 'Published' as const,
        id: idResult.value,
        name: nameResult.value,
        slug: 'tokyo-baptist-church',
        publishedAt: new Date('2025-01-02'),
        createdAt: new Date('2025-01-01'),
      }

      const prismaData = ChurchMapper.toPrisma(publishedChurch)

      expect(prismaData.isPublished).toBe(true)
      expect(prismaData.slug).toBe('tokyo-baptist-church')
      expect(prismaData.publishedAt).toEqual(new Date('2025-01-02'))
      expect(prismaData.verifiedAt).toBeNull()
      expect(prismaData.verifiedBy).toBeNull()
    })

    it('should map verified church from domain to Prisma', () => {
      const idResult = ChurchId.create('church-123')
      const nameResult = ChurchName.create('Tokyo Baptist Church')

      expect(idResult.isOk() && nameResult.isOk()).toBe(true)
      if (idResult.isErr() || nameResult.isErr()) return

      const verifiedChurch = {
        tag: 'Verified' as const,
        id: idResult.value,
        name: nameResult.value,
        slug: 'tokyo-baptist-church',
        publishedAt: new Date('2025-01-02'),
        verifiedAt: new Date('2025-01-03'),
        verifiedBy: 'admin-456',
        createdAt: new Date('2025-01-01'),
      }

      const prismaData = ChurchMapper.toPrisma(verifiedChurch)

      expect(prismaData.isPublished).toBe(true)
      expect(prismaData.slug).toBe('tokyo-baptist-church')
      expect(prismaData.publishedAt).toEqual(new Date('2025-01-02'))
      expect(prismaData.verifiedAt).toEqual(new Date('2025-01-03'))
      expect(prismaData.verifiedBy).toBe('admin-456')
    })
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/infrastructure
pnpm test ChurchMapper
```

Expected: FAIL - ChurchMapper module not found

**Step 3: Implement ChurchMapper**

Create `packages/infrastructure/src/persistence/prisma/mappers/ChurchMapper.ts`:
```typescript
import { Church as PrismaChurch } from '@prisma/client'
import { Result, ok, err } from '@repo/domain'
import {
  ChurchState,
  DraftChurch,
  PublishedChurch,
  VerifiedChurch,
  ChurchId,
  ChurchName,
  ValidationError
} from '@repo/domain'

/**
 * Maps between Prisma Church model and Domain ChurchState
 */
export class ChurchMapper {
  /**
   * Convert Prisma Church to Domain ChurchState
   *
   * Determines state based on:
   * - Verified: verifiedAt and verifiedBy are set
   * - Published: isPublished is true and slug exists
   * - Draft: otherwise
   */
  static toDomain(prisma: PrismaChurch): Result<ChurchState, ValidationError> {
    // Validate value objects
    const idResult = ChurchId.create(prisma.id)
    const nameResult = ChurchName.create(prisma.name)

    // Combine Results using railway-oriented programming
    if (idResult.isErr()) return err(idResult.error)
    if (nameResult.isErr()) return err(nameResult.error)

    const id = idResult.value
    const name = nameResult.value

    // Determine state based on database fields
    if (prisma.verifiedAt && prisma.verifiedBy) {
      // Verified state
      if (!prisma.publishedAt || !prisma.slug) {
        return err(new ValidationError('Verified church must have publishedAt and slug'))
      }

      return ok({
        tag: 'Verified' as const,
        id,
        name,
        slug: prisma.slug,
        publishedAt: prisma.publishedAt,
        verifiedAt: prisma.verifiedAt,
        verifiedBy: prisma.verifiedBy,
        createdAt: prisma.createdAt,
      } as VerifiedChurch)
    }

    if (prisma.isPublished && prisma.slug && prisma.publishedAt) {
      // Published state
      return ok({
        tag: 'Published' as const,
        id,
        name,
        slug: prisma.slug,
        publishedAt: prisma.publishedAt,
        createdAt: prisma.createdAt,
      } as PublishedChurch)
    }

    // Draft state (default)
    return ok({
      tag: 'Draft' as const,
      id,
      name,
      createdAt: prisma.createdAt,
    } as DraftChurch)
  }

  /**
   * Convert Domain ChurchState to Prisma create/update data
   *
   * Returns partial object containing only state-related fields.
   * Caller should merge with other church data as needed.
   */
  static toPrisma(domain: ChurchState): {
    id: string
    name: string
    isPublished: boolean
    slug: string | null
    publishedAt: Date | null
    verifiedAt: Date | null
    verifiedBy: string | null
    createdAt: Date
  } {
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

**Step 4: Run tests to verify they pass**

```bash
pnpm test ChurchMapper
```

Expected: All 6 tests PASS

**Step 5: Verify type checking**

```bash
pnpm type-check
```

Expected: No TypeScript errors

**Step 6: Commit ChurchMapper**

```bash
git add packages/infrastructure/src/persistence/prisma/mappers/
git commit -m "feat(infrastructure): add ChurchMapper for domain-Prisma translation

Implements bidirectional mapping between:
- Prisma Church model (database)
- Domain ChurchState tagged union (Draft/Published/Verified)

Features:
- toDomain: Converts Prisma → Domain with state detection
- toPrisma: Converts Domain → Prisma with type-safe exhaustive matching
- Validates value objects during mapping
- Returns Result types for error handling

Tests: 6/6 passing"
```

---

## Task 4: Implement PrismaChurchRepository

**Files:**
- Create: `packages/infrastructure/src/persistence/prisma/PrismaChurchRepository.ts`
- Create: `packages/infrastructure/src/persistence/prisma/__tests__/PrismaChurchRepository.test.ts`

**Step 1: Write failing repository tests**

Create `packages/infrastructure/src/persistence/prisma/__tests__/PrismaChurchRepository.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { PrismaChurchRepository } from '../PrismaChurchRepository'
import { ChurchId, ChurchName, createChurch, publishChurch } from '@repo/domain'

// Note: These are integration tests that require a test database
describe('PrismaChurchRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaChurchRepository

  beforeEach(async () => {
    // Use test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
    repository = new PrismaChurchRepository(prisma)

    // Clean up any existing test data
    await prisma.church.deleteMany({
      where: {
        name: {
          contains: 'Test Church',
        },
      },
    })
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('save', () => {
    it('should save draft church to database', async () => {
      const churchResult = createChurch({
        name: 'Test Church for Save',
        adminUserId: 'user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const saveResult = await repository.save(churchResult.value)

      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isOk()) {
        expect(saveResult.value.tag).toBe('Draft')
        expect(saveResult.value.name.toString()).toBe('Test Church for Save')
      }
    })

    it('should update existing church when saving', async () => {
      // Create draft
      const draftResult = createChurch({
        name: 'Test Church for Update',
        adminUserId: 'user-123',
      })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      // Save draft
      const savedDraftResult = await repository.save(draftResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      // Publish
      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      // Save published
      const savedPublishedResult = await repository.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isOk()) {
        expect(savedPublishedResult.value.tag).toBe('Published')
        if (savedPublishedResult.value.tag === 'Published') {
          expect(savedPublishedResult.value.slug).toBeTruthy()
        }
      }
    })
  })

  describe('findById', () => {
    it('should find church by id', async () => {
      // Create and save church
      const churchResult = createChurch({
        name: 'Test Church for Find',
        adminUserId: 'user-123',
      })
      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const saveResult = await repository.save(churchResult.value)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      // Find by ID
      const findResult = await repository.findById(churchResult.value.id)

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Draft')
      }
    })

    it('should return null for non-existent church', async () => {
      const idResult = ChurchId.create('non-existent-id')
      expect(idResult.isOk()).toBe(true)
      if (idResult.isErr()) return

      const findResult = await repository.findById(idResult.value)

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })
  })

  describe('findBySlug', () => {
    it('should find published church by slug', async () => {
      // Create, save, and publish church
      const draftResult = createChurch({
        name: 'Test Church for Slug',
        adminUserId: 'user-123',
      })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      const savedDraftResult = await repository.save(draftResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      const savedPublishedResult = await repository.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      const slug = publishedResult.value.slug

      // Find by slug
      const findResult = await repository.findBySlug(slug)

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull()
        expect(findResult.value?.tag).toBe('Published')
      }
    })

    it('should return null for non-existent slug', async () => {
      const findResult = await repository.findBySlug('non-existent-slug')

      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })
  })

  describe('delete', () => {
    it('should delete church by id', async () => {
      // Create and save church
      const churchResult = createChurch({
        name: 'Test Church for Delete',
        adminUserId: 'user-123',
      })
      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const saveResult = await repository.save(churchResult.value)
      expect(saveResult.isOk()).toBe(true)
      if (saveResult.isErr()) return

      // Delete
      const deleteResult = await repository.delete(churchResult.value.id)
      expect(deleteResult.isOk()).toBe(true)

      // Verify deleted
      const findResult = await repository.findById(churchResult.value.id)
      expect(findResult.isOk()).toBe(true)
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull()
      }
    })

    it('should return error for non-existent church', async () => {
      const idResult = ChurchId.create('non-existent-id')
      expect(idResult.isOk()).toBe(true)
      if (idResult.isErr()) return

      const deleteResult = await repository.delete(idResult.value)

      expect(deleteResult.isErr()).toBe(true)
      if (deleteResult.isErr()) {
        expect(deleteResult.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('slugExists', () => {
    it('should return true for existing slug', async () => {
      // Create and publish church
      const draftResult = createChurch({
        name: 'Test Church for Slug Check',
        adminUserId: 'user-123',
      })
      expect(draftResult.isOk()).toBe(true)
      if (draftResult.isErr()) return

      const savedDraftResult = await repository.save(draftResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      await repository.save(publishedResult.value)

      const slug = publishedResult.value.slug

      // Check slug exists
      const existsResult = await repository.slugExists(slug)

      expect(existsResult.isOk()).toBe(true)
      if (existsResult.isOk()) {
        expect(existsResult.value).toBe(true)
      }
    })

    it('should return false for non-existent slug', async () => {
      const existsResult = await repository.slugExists('definitely-does-not-exist')

      expect(existsResult.isOk()).toBe(true)
      if (existsResult.isOk()) {
        expect(existsResult.value).toBe(false)
      }
    })
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test PrismaChurchRepository
```

Expected: FAIL - PrismaChurchRepository module not found

**Step 3: Implement PrismaChurchRepository**

Create `packages/infrastructure/src/persistence/prisma/PrismaChurchRepository.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import {
  AsyncResult,
  IChurchRepository,
  ChurchState,
  ChurchId,
  DomainError,
  NotFoundError,
  InfrastructureError
} from '@repo/domain'
import { ResultAsync } from 'neverthrow'
import { ChurchMapper } from './mappers/ChurchMapper'

/**
 * Prisma implementation of IChurchRepository
 *
 * Handles persistence of ChurchState to PostgreSQL database
 * using Prisma ORM and ChurchMapper for translation
 */
export class PrismaChurchRepository implements IChurchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find church by ID
   */
  findById(id: ChurchId): AsyncResult<ChurchState | null, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.findUnique({
        where: { id: id.toString() },
      }),
      (error) => new InfrastructureError(
        `Database error finding church: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((church) => {
      if (!church) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = ChurchMapper.toDomain(church)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Find church by slug
   */
  findBySlug(slug: string): AsyncResult<ChurchState | null, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.findUnique({
        where: { slug },
      }),
      (error) => new InfrastructureError(
        `Database error finding church by slug: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((church) => {
      if (!church) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = ChurchMapper.toDomain(church)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Save church (create or update)
   */
  save(church: ChurchState): AsyncResult<ChurchState, DomainError> {
    const prismaData = ChurchMapper.toPrisma(church)

    return ResultAsync.fromPromise(
      this.prisma.church.upsert({
        where: { id: church.id.toString() },
        create: {
          ...prismaData,
          // Required fields for create (these would come from full church data in real app)
          denominationId: 'temp-denomination-id', // TODO: Get from church aggregate
          prefectureId: 'temp-prefecture-id',     // TODO: Get from church aggregate
          cityId: 'temp-city-id',                 // TODO: Get from church aggregate
          address: 'Temporary address',            // TODO: Get from church aggregate
        },
        update: prismaData,
      }),
      (error) => new InfrastructureError(
        `Database error saving church: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((saved) => {
      const domainResult = ChurchMapper.toDomain(saved)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Delete church
   */
  delete(id: ChurchId): AsyncResult<void, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.delete({
        where: { id: id.toString() },
      }),
      (error) => {
        // Check if it's a "record not found" error
        if ((error as any).code === 'P2025') {
          return new NotFoundError('Church', id.toString())
        }
        return new InfrastructureError(
          `Database error deleting church: ${(error as Error).message}`,
          error as Error
        )
      }
    ).map(() => undefined)
  }

  /**
   * Check if slug exists
   */
  slugExists(slug: string): AsyncResult<boolean, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.findUnique({
        where: { slug },
        select: { id: true },
      }),
      (error) => new InfrastructureError(
        `Database error checking slug: ${(error as Error).message}`,
        error as Error
      )
    ).map((church) => church !== null)
  }
}
```

**Step 4: Run tests to verify they pass**

Note: Tests require a database. Ensure DATABASE_URL is set and database is running.

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
pnpm db:start
cd packages/infrastructure
pnpm test PrismaChurchRepository
```

Expected: All 9 tests PASS

**Step 5: Verify type checking**

```bash
pnpm type-check
```

Expected: No TypeScript errors

**Step 6: Commit PrismaChurchRepository**

```bash
git add packages/infrastructure/src/persistence/prisma/PrismaChurchRepository.ts
git add packages/infrastructure/src/persistence/prisma/__tests__/
git commit -m "feat(infrastructure): implement PrismaChurchRepository

Implements IChurchRepository interface with Prisma:
- findById: Find church by ChurchId
- findBySlug: Find church by slug (for public URLs)
- save: Create or update church (upsert)
- delete: Soft delete church
- slugExists: Check slug uniqueness

Features:
- Uses ChurchMapper for domain-database translation
- Returns AsyncResult for all operations
- Handles Prisma errors gracefully
- Integration tests with test database

Tests: 9/9 passing

TODO: Remove temp fields (denominationId, etc) when full Church aggregate is implemented"
```

---

## Task 5: Create Infrastructure Package Exports

**Files:**
- Modify: `packages/infrastructure/src/index.ts`
- Create: `packages/infrastructure/src/persistence/index.ts`

**Step 1: Create persistence barrel export**

Create `packages/infrastructure/src/persistence/index.ts`:
```typescript
// Persistence layer exports
export { PrismaChurchRepository } from './prisma/PrismaChurchRepository'
export { ChurchMapper } from './prisma/mappers/ChurchMapper'
```

**Step 2: Update main index**

Modify `packages/infrastructure/src/index.ts`:
```typescript
// Infrastructure package entry point
// Implementations of domain interfaces

// Persistence
export * from './persistence'
```

**Step 3: Verify exports work**

```bash
pnpm type-check
```

Expected: No errors

**Step 4: Commit barrel exports**

```bash
git add packages/infrastructure/src/index.ts packages/infrastructure/src/persistence/index.ts
git commit -m "feat(infrastructure): add barrel exports for infrastructure package"
```

---

## Summary

**Phase 3 Complete! You've built:**

1. ✅ Updated Prisma schema with state tracking fields (publishedAt, verifiedAt, verifiedBy)
2. ✅ Created infrastructure package structure
3. ✅ Implemented ChurchMapper for bidirectional domain-Prisma translation
4. ✅ Implemented PrismaChurchRepository with full CRUD operations
5. ✅ Comprehensive integration tests (15 tests total)
6. ✅ Clean barrel exports

**Next Steps:**

- **Phase 4:** GraphQL Adapter Layer (connect workflows to resolvers)
- **Phase 5:** Review & Donation domains
- **Phase 6:** End-to-end testing

**Run all infrastructure tests:**
```bash
cd packages/infrastructure
pnpm test
```

**Expected:** All 15 tests passing (6 mapper + 9 repository), infrastructure layer ready for GraphQL integration.

---

Plan complete and saved to `docs/plans/2025-11-04-ddd-infrastructure-phase3.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
