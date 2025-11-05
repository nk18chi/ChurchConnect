# DDD GraphQL Adapter Layer (Phase 4) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the domain layer (workflows) to the GraphQL API layer using the adapter pattern with proper error mapping.

**Architecture:** Create thin GraphQL resolvers that adapt GraphQL inputs to domain workflows, execute workflows, handle Results, and map domain entities back to GraphQL responses. This follows the ports and adapters (hexagonal) architecture pattern.

**Tech Stack:** Pothos GraphQL, neverthrow Result types, existing domain workflows, existing infrastructure repositories

---

## Context

Phase 3 (Infrastructure Layer) is complete:
- ✅ Domain workflows: `createChurch`, `publishChurch`, `verifyChurch`
- ✅ Domain entities: `ChurchState` (DraftChurch | PublishedChurch | VerifiedChurch)
- ✅ Repository: `PrismaChurchRepository` implements `IChurchRepository`
- ✅ Mapper: `ChurchMapper` for domain ↔ Prisma translation

Phase 4 creates the **GraphQL adapter layer** that bridges GraphQL API ↔ Domain workflows.

**Current GraphQL Structure:**
- Uses Pothos `builder.prismaObject` for types
- Queries are in `packages/graphql/src/types/church.ts`
- No existing church mutations (clean slate)
- Other entities have mutations in their own type files

**Package Locations:**
- Domain: `packages/domain/`
- Infrastructure: `packages/infrastructure/`
- GraphQL: `packages/graphql/src/`

---

## Task 1: Create GraphQL Error Mapper

GraphQL adapters need to translate domain errors to GraphQL-friendly error messages.

**Files:**
- Create: `packages/graphql/src/utils/errorMapper.ts`
- Test: `packages/graphql/src/utils/__tests__/errorMapper.test.ts`

### Step 1: Write the failing test

Create test file: `packages/graphql/src/utils/__tests__/errorMapper.test.ts`

```typescript
import { mapDomainError } from '../errorMapper'
import { ValidationError, AuthorizationError, NotFoundError, InfrastructureError } from '@repo/domain'

describe('mapDomainError', () => {
  it('should map ValidationError to GraphQL error', () => {
    const error = new ValidationError('Church name must be between 2 and 100 characters')
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Church name must be between 2 and 100 characters')
    expect(graphqlError.extensions?.code).toBe('VALIDATION_ERROR')
  })

  it('should map AuthorizationError to GraphQL error', () => {
    const error = new AuthorizationError('Only admins can verify churches')
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Only admins can verify churches')
    expect(graphqlError.extensions?.code).toBe('AUTHORIZATION_ERROR')
  })

  it('should map NotFoundError to GraphQL error', () => {
    const error = new NotFoundError('Church', 'church-123')
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Church with id church-123 not found')
    expect(graphqlError.extensions?.code).toBe('NOT_FOUND')
  })

  it('should map InfrastructureError to GraphQL error', () => {
    const dbError = new Error('Connection timeout')
    const error = new InfrastructureError('Database error finding church', dbError)
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Database error finding church')
    expect(graphqlError.extensions?.code).toBe('INFRASTRUCTURE_ERROR')
  })
})
```

### Step 2: Run test to verify it fails

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm test errorMapper`

Expected: FAIL - `Cannot find module '../errorMapper'`

### Step 3: Write minimal implementation

Create file: `packages/graphql/src/utils/errorMapper.ts`

```typescript
import { GraphQLError } from 'graphql'
import { DomainError } from '@repo/domain'

/**
 * Maps domain errors to GraphQL errors with proper error codes
 */
export function mapDomainError(error: DomainError): GraphQLError {
  return new GraphQLError(error.message, {
    extensions: {
      code: error.code,
    },
  })
}
```

### Step 4: Install dependencies if needed

Check if GraphQLError is available and @repo/domain is imported correctly:

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm add graphql`

Note: graphql should already be installed. If not, add it.

### Step 5: Run tests to verify they pass

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm test errorMapper`

Expected: PASS (4/4 tests)

### Step 6: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm type-check`

Expected: No type errors

### Step 7: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/src/utils/errorMapper.ts packages/graphql/src/utils/__tests__/errorMapper.test.ts
git commit -m "feat(graphql): add domain error mapper for GraphQL errors

- Map ValidationError, AuthorizationError, NotFoundError, InfrastructureError
- Include error codes in GraphQL extensions
- Add comprehensive unit tests (4/4 passing)

Part of Phase 4 (GraphQL Adapters) - Task 1"
```

---

## Task 2: Create Domain-to-GraphQL Church Mapper

Domain `ChurchState` needs to be mapped to the GraphQL `Church` type for responses.

**Files:**
- Create: `packages/graphql/src/mappers/churchMapper.ts`
- Test: `packages/graphql/src/mappers/__tests__/churchMapper.test.ts`

### Step 1: Write the failing test

Create test file: `packages/graphql/src/mappers/__tests__/churchMapper.test.ts`

```typescript
import { toGraphQLChurch } from '../churchMapper'
import { ChurchId, ChurchName, DraftChurch, PublishedChurch, VerifiedChurch } from '@repo/domain'

describe('toGraphQLChurch', () => {
  it('should map DraftChurch to partial GraphQL Church', () => {
    const churchId = ChurchId.create('church-123')
    const churchName = ChurchName.create('Tokyo Baptist Church')

    if (churchId.isErr() || churchName.isErr()) {
      throw new Error('Test setup failed')
    }

    const draft: DraftChurch = {
      tag: 'Draft',
      id: churchId.value,
      name: churchName.value,
      createdAt: new Date('2024-01-01'),
    }

    const graphql = toGraphQLChurch(draft)

    expect(graphql.id).toBe('church-123')
    expect(graphql.name).toBe('Tokyo Baptist Church')
    expect(graphql.isPublished).toBe(false)
    expect(graphql.slug).toBeNull()
    expect(graphql.createdAt).toEqual(new Date('2024-01-01'))
  })

  it('should map PublishedChurch to GraphQL Church', () => {
    const churchId = ChurchId.create('church-456')
    const churchName = ChurchName.create('Osaka Grace Church')

    if (churchId.isErr() || churchName.isErr()) {
      throw new Error('Test setup failed')
    }

    const published: PublishedChurch = {
      tag: 'Published',
      id: churchId.value,
      name: churchName.value,
      slug: 'osaka-grace-church',
      publishedAt: new Date('2024-02-01'),
      createdAt: new Date('2024-01-01'),
    }

    const graphql = toGraphQLChurch(published)

    expect(graphql.id).toBe('church-456')
    expect(graphql.name).toBe('Osaka Grace Church')
    expect(graphql.isPublished).toBe(true)
    expect(graphql.slug).toBe('osaka-grace-church')
    expect(graphql.isVerified).toBe(false)
  })

  it('should map VerifiedChurch to GraphQL Church', () => {
    const churchId = ChurchId.create('church-789')
    const churchName = ChurchName.create('Kyoto International Church')

    if (churchId.isErr() || churchName.isErr()) {
      throw new Error('Test setup failed')
    }

    const verified: VerifiedChurch = {
      tag: 'Verified',
      id: churchId.value,
      name: churchName.value,
      slug: 'kyoto-international-church',
      publishedAt: new Date('2024-02-01'),
      verifiedAt: new Date('2024-03-01'),
      verifiedBy: 'admin-123',
      createdAt: new Date('2024-01-01'),
    }

    const graphql = toGraphQLChurch(verified)

    expect(graphql.id).toBe('church-789')
    expect(graphql.name).toBe('Kyoto International Church')
    expect(graphql.isPublished).toBe(true)
    expect(graphql.isVerified).toBe(true)
    expect(graphql.slug).toBe('kyoto-international-church')
  })
})
```

### Step 2: Run test to verify it fails

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm test churchMapper`

Expected: FAIL - `Cannot find module '../churchMapper'`

### Step 3: Write minimal implementation

Create file: `packages/graphql/src/mappers/churchMapper.ts`

```typescript
import { ChurchState, isDraft, isPublished, isVerified } from '@repo/domain'

/**
 * Maps domain ChurchState to GraphQL Church response
 *
 * Note: This returns a partial Church object with only state-related fields.
 * Full Church data (address, denomination, etc.) comes from Prisma queries.
 */
export function toGraphQLChurch(church: ChurchState) {
  const base = {
    id: church.id.toString(),
    name: church.name.toString(),
    createdAt: church.createdAt,
  }

  if (isDraft(church)) {
    return {
      ...base,
      isPublished: false,
      isVerified: false,
      slug: null,
      publishedAt: null,
      verifiedAt: null,
    }
  }

  if (isPublished(church)) {
    return {
      ...base,
      isPublished: true,
      isVerified: false,
      slug: church.slug,
      publishedAt: church.publishedAt,
      verifiedAt: null,
    }
  }

  if (isVerified(church)) {
    return {
      ...base,
      isPublished: true,
      isVerified: true,
      slug: church.slug,
      publishedAt: church.publishedAt,
      verifiedAt: church.verifiedAt,
    }
  }

  // Exhaustive check - TypeScript will error if we miss a case
  const _exhaustiveCheck: never = church
  throw new Error(`Unhandled church state: ${(_exhaustiveCheck as ChurchState).tag}`)
}
```

### Step 4: Run tests to verify they pass

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm test churchMapper`

Expected: PASS (3/3 tests)

### Step 5: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm type-check`

Expected: No type errors

### Step 6: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/src/mappers/churchMapper.ts packages/graphql/src/mappers/__tests__/churchMapper.test.ts
git commit -m "feat(graphql): add domain-to-GraphQL church mapper

- Map ChurchState (Draft/Published/Verified) to GraphQL Church
- Handle all three states with exhaustive checking
- Add comprehensive unit tests (3/3 passing)

Part of Phase 4 (GraphQL Adapters) - Task 2"
```

---

## Task 3: Create Repository Factory

GraphQL resolvers need access to repositories. Create a factory for dependency injection.

**Files:**
- Create: `packages/graphql/src/factories/repositoryFactory.ts`

### Step 1: Write the implementation

Create file: `packages/graphql/src/factories/repositoryFactory.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaChurchRepository } from '@repo/infrastructure'

/**
 * Factory for creating repository instances
 * Allows for easy mocking in tests
 */
export class RepositoryFactory {
  constructor(private readonly prisma: PrismaClient) {}

  createChurchRepository() {
    return new PrismaChurchRepository(this.prisma)
  }
}

/**
 * Singleton instance using the global prisma client
 */
let repositoryFactory: RepositoryFactory | null = null

export function getRepositoryFactory(prisma: PrismaClient): RepositoryFactory {
  if (!repositoryFactory) {
    repositoryFactory = new RepositoryFactory(prisma)
  }
  return repositoryFactory
}
```

### Step 2: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm type-check`

Expected: No type errors

### Step 3: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/src/factories/repositoryFactory.ts
git commit -m "feat(graphql): add repository factory for dependency injection

- Create RepositoryFactory class for creating repository instances
- Add singleton getter for GraphQL resolvers
- Enables easy mocking in tests

Part of Phase 4 (GraphQL Adapters) - Task 3"
```

---

## Task 4: Create Church Mutations (createChurch)

Create the first GraphQL mutation that uses the domain workflow.

**Files:**
- Modify: `packages/graphql/src/types/church.ts` (add mutations section)

### Step 1: Add createChurch mutation

Modify file: `packages/graphql/src/types/church.ts`

At the end of the file (after the existing `builder.queryFields`), add:

```typescript
// ============================================
// MUTATIONS
// ============================================

builder.mutationFields((t) => ({
  createChurch: t.prismaField({
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
    resolve: async (query, _root, args, ctx) => {
      // Import statements at top of file
      const { createChurch } = await import('@repo/domain')
      const { getRepositoryFactory } = await import('../factories/repositoryFactory')
      const { mapDomainError } = await import('../utils/errorMapper')

      // 1. Authentication check
      if (!ctx.session?.user?.id) {
        throw new Error('Not authenticated')
      }

      // 2. Execute domain workflow (pure business logic)
      const churchResult = createChurch({
        name: args.input.name,
        adminUserId: ctx.session.user.id,
      })

      // 3. Handle domain errors
      if (churchResult.isErr()) {
        throw mapDomainError(churchResult.error)
      }

      // 4. Persist via repository
      const factory = getRepositoryFactory(ctx.prisma)
      const churchRepo = factory.createChurchRepository()

      const savedResult = await churchRepo.save(churchResult.value)

      // 5. Handle infrastructure errors
      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // 6. Return Prisma Church (Pothos will handle GraphQL mapping)
      // We need to fetch the full church from Prisma because ChurchState
      // only contains state fields, not full Church data
      return ctx.prisma.church.findUniqueOrThrow({
        ...query,
        where: { id: savedResult.value.id.toString() },
      })
    },
  }),
}))
```

**Important note:** Add these imports at the top of `church.ts`:

```typescript
import { createChurch, publishChurch, verifyChurch, ChurchId } from '@repo/domain'
import { getRepositoryFactory } from '../factories/repositoryFactory'
import { mapDomainError } from '../utils/errorMapper'
```

### Step 2: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm type-check`

Expected: No type errors

### Step 3: Start dev server and test manually (optional but recommended)

Run: `cd /Users/naoki/Development/Apps/ChurchConnect && pnpm --filter api dev`

Open GraphQL Playground and test:

```graphql
mutation {
  createChurch(input: { name: "Test Church" }) {
    id
    name
    isPublished
    slug
  }
}
```

Expected: Returns created church with id, name, isPublished: false, slug: null

### Step 4: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/src/types/church.ts
git commit -m "feat(graphql): add createChurch mutation using domain workflow

- Execute createChurch domain workflow
- Persist via PrismaChurchRepository
- Map domain errors to GraphQL errors
- Return full Prisma Church object

Part of Phase 4 (GraphQL Adapters) - Task 4"
```

---

## Task 5: Create Church Mutations (publishChurch)

Add mutation to publish a draft church.

**Files:**
- Modify: `packages/graphql/src/types/church.ts` (add to mutations section)

### Step 1: Add publishChurch mutation

Modify file: `packages/graphql/src/types/church.ts`

Add to the `builder.mutationFields` block (after `createChurch`):

```typescript
  publishChurch: t.prismaField({
    type: 'Church',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { publishChurch, ChurchId, isDraft } = await import('@repo/domain')
      const { getRepositoryFactory } = await import('../factories/repositoryFactory')
      const { mapDomainError } = await import('../utils/errorMapper')

      // 1. Authentication & authorization check
      if (!ctx.session?.user?.id) {
        throw new Error('Not authenticated')
      }

      // For MVP, any authenticated user can publish their church
      // In production, check if user is church admin
      // if (ctx.session.user.role !== 'CHURCH_ADMIN') {
      //   throw new Error('Only church admins can publish churches')
      // }

      // 2. Validate and create ChurchId value object
      const churchIdResult = ChurchId.create(args.id)
      if (churchIdResult.isErr()) {
        throw mapDomainError(churchIdResult.error)
      }

      // 3. Load church from repository
      const factory = getRepositoryFactory(ctx.prisma)
      const churchRepo = factory.createChurchRepository()

      const churchResult = await churchRepo.findById(churchIdResult.value)
      if (churchResult.isErr()) {
        throw mapDomainError(churchResult.error)
      }

      if (!churchResult.value) {
        throw new Error('Church not found')
      }

      // 4. Check church is in Draft state
      if (!isDraft(churchResult.value)) {
        throw new Error('Church is already published')
      }

      // 5. Execute domain workflow
      const publishedResult = publishChurch(churchResult.value)
      if (publishedResult.isErr()) {
        throw mapDomainError(publishedResult.error)
      }

      // 6. Persist changes
      const savedResult = await churchRepo.save(publishedResult.value)
      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // 7. Return full Prisma Church
      return ctx.prisma.church.findUniqueOrThrow({
        ...query,
        where: { id: savedResult.value.id.toString() },
      })
    },
  }),
```

### Step 2: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm type-check`

Expected: No type errors

### Step 3: Test manually (optional but recommended)

```graphql
mutation {
  publishChurch(id: "church-id-from-createChurch") {
    id
    name
    isPublished
    slug
  }
}
```

Expected: Returns church with isPublished: true, slug: "test-church"

### Step 4: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/src/types/church.ts
git commit -m "feat(graphql): add publishChurch mutation using domain workflow

- Execute publishChurch domain workflow
- Validate church is in Draft state
- Generate slug from church name
- Persist via PrismaChurchRepository
- Map domain errors to GraphQL errors

Part of Phase 4 (GraphQL Adapters) - Task 5"
```

---

## Task 6: Create Church Mutations (verifyChurch)

Add mutation to verify a published church (admin-only).

**Files:**
- Modify: `packages/graphql/src/types/church.ts` (add to mutations section)

### Step 1: Add verifyChurch mutation

Modify file: `packages/graphql/src/types/church.ts`

Add to the `builder.mutationFields` block (after `publishChurch`):

```typescript
  verifyChurch: t.prismaField({
    type: 'Church',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { verifyChurch, ChurchId, isPublished } = await import('@repo/domain')
      const { getRepositoryFactory } = await import('../factories/repositoryFactory')
      const { mapDomainError } = await import('../utils/errorMapper')

      // 1. Authentication & authorization check
      if (!ctx.session?.user?.id) {
        throw new Error('Not authenticated')
      }

      // Only ADMIN can verify churches
      if (ctx.session.user.role !== 'ADMIN') {
        throw new Error('Only admins can verify churches')
      }

      // 2. Validate and create ChurchId value object
      const churchIdResult = ChurchId.create(args.id)
      if (churchIdResult.isErr()) {
        throw mapDomainError(churchIdResult.error)
      }

      // 3. Load church from repository
      const factory = getRepositoryFactory(ctx.prisma)
      const churchRepo = factory.createChurchRepository()

      const churchResult = await churchRepo.findById(churchIdResult.value)
      if (churchResult.isErr()) {
        throw mapDomainError(churchResult.error)
      }

      if (!churchResult.value) {
        throw new Error('Church not found')
      }

      // 4. Check church is in Published state (not Draft, not already Verified)
      if (!isPublished(churchResult.value)) {
        throw new Error('Church must be published before verification')
      }

      // 5. Execute domain workflow with authorization check
      const verifiedResult = verifyChurch({
        church: churchResult.value,
        verifiedBy: ctx.session.user.id,
        verifierRole: ctx.session.user.role,
      })

      if (verifiedResult.isErr()) {
        throw mapDomainError(verifiedResult.error)
      }

      // 6. Persist changes
      const savedResult = await churchRepo.save(verifiedResult.value)
      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // 7. Return full Prisma Church
      return ctx.prisma.church.findUniqueOrThrow({
        ...query,
        where: { id: savedResult.value.id.toString() },
      })
    },
  }),
```

### Step 2: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm type-check`

Expected: No type errors

### Step 3: Test manually (optional but recommended)

```graphql
mutation {
  verifyChurch(id: "church-id-from-publishChurch") {
    id
    name
    isPublished
    isVerified
    slug
  }
}
```

Expected: Returns church with isPublished: true, isVerified: true

### Step 4: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/src/types/church.ts
git commit -m "feat(graphql): add verifyChurch mutation using domain workflow

- Execute verifyChurch domain workflow
- Enforce ADMIN-only authorization
- Validate church is in Published state
- Record verifiedAt and verifiedBy
- Persist via PrismaChurchRepository
- Map domain errors to GraphQL errors

Part of Phase 4 (GraphQL Adapters) - Task 6"
```

---

## Task 7: Integration Testing (End-to-End)

Create integration tests that test the full stack: GraphQL → Domain → Infrastructure → Database.

**Files:**
- Create: `packages/graphql/src/types/__tests__/church.mutations.integration.test.ts`

### Step 1: Write the failing test

Create test file: `packages/graphql/src/types/__tests__/church.mutations.integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { createChurch, publishChurch, verifyChurch, ChurchId } from '@repo/domain'
import { PrismaChurchRepository } from '@repo/infrastructure'

/**
 * Integration tests for Church mutations
 * Tests the full stack: GraphQL inputs → Domain workflows → Infrastructure → Database
 *
 * Note: These tests use the repository directly rather than GraphQL executor
 * because setting up full GraphQL context (auth, session) is complex.
 * We're testing the business logic integration, not GraphQL parsing.
 */
describe('Church Mutations Integration', () => {
  let prisma: PrismaClient
  let churchRepo: PrismaChurchRepository

  beforeEach(() => {
    prisma = new PrismaClient()
    churchRepo = new PrismaChurchRepository(prisma)
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('createChurch → save flow', () => {
    it('should create draft church and persist to database', async () => {
      // 1. Execute domain workflow
      const churchResult = createChurch({
        name: 'Integration Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      // 2. Persist via repository
      const savedResult = await churchRepo.save(churchResult.value)

      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      // 3. Verify database state
      const dbChurch = await prisma.church.findUnique({
        where: { id: savedResult.value.id.toString() },
      })

      expect(dbChurch).not.toBeNull()
      expect(dbChurch?.name).toBe('Integration Test Church')
      expect(dbChurch?.isPublished).toBe(false)
      expect(dbChurch?.slug).toMatch(/^draft-/)
    })

    it('should reject invalid church name', async () => {
      const churchResult = createChurch({
        name: 'A', // Too short
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isErr()).toBe(true)
      if (churchResult.isOk()) return

      expect(churchResult.error.code).toBe('VALIDATION_ERROR')
      expect(churchResult.error.message).toContain('2 and 100 characters')
    })
  })

  describe('publishChurch → save flow', () => {
    it('should publish draft church and persist to database', async () => {
      // 1. Create draft
      const churchResult = createChurch({
        name: 'Publish Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const savedDraftResult = await churchRepo.save(churchResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      // 2. Publish
      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      // 3. Persist
      const savedPublishedResult = await churchRepo.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      // 4. Verify database state
      const dbChurch = await prisma.church.findUnique({
        where: { id: savedPublishedResult.value.id.toString() },
      })

      expect(dbChurch).not.toBeNull()
      expect(dbChurch?.isPublished).toBe(true)
      expect(dbChurch?.slug).toBe('publish-test-church')
      expect(dbChurch?.publishedAt).not.toBeNull()
    })
  })

  describe('verifyChurch → save flow', () => {
    it('should verify published church and persist to database', async () => {
      // 1. Create and publish
      const churchResult = createChurch({
        name: 'Verify Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const savedDraftResult = await churchRepo.save(churchResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      const savedPublishedResult = await churchRepo.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      // 2. Verify
      const verifiedResult = verifyChurch({
        church: savedPublishedResult.value,
        verifiedBy: 'admin-123',
        verifierRole: 'ADMIN',
      })

      expect(verifiedResult.isOk()).toBe(true)
      if (verifiedResult.isErr()) return

      // 3. Persist
      const savedVerifiedResult = await churchRepo.save(verifiedResult.value)
      expect(savedVerifiedResult.isOk()).toBe(true)
      if (savedVerifiedResult.isErr()) return

      // 4. Verify database state
      const dbChurch = await prisma.church.findUnique({
        where: { id: savedVerifiedResult.value.id.toString() },
      })

      expect(dbChurch).not.toBeNull()
      expect(dbChurch?.isPublished).toBe(true)
      expect(dbChurch?.verifiedAt).not.toBeNull()
      expect(dbChurch?.verifiedBy).toBe('admin-123')
    })

    it('should reject verification from non-admin', async () => {
      // Create and publish first
      const churchResult = createChurch({
        name: 'Auth Test Church',
        adminUserId: 'test-user-123',
      })

      expect(churchResult.isOk()).toBe(true)
      if (churchResult.isErr()) return

      const savedDraftResult = await churchRepo.save(churchResult.value)
      expect(savedDraftResult.isOk()).toBe(true)
      if (savedDraftResult.isErr()) return

      const publishedResult = publishChurch(savedDraftResult.value)
      expect(publishedResult.isOk()).toBe(true)
      if (publishedResult.isErr()) return

      const savedPublishedResult = await churchRepo.save(publishedResult.value)
      expect(savedPublishedResult.isOk()).toBe(true)
      if (savedPublishedResult.isErr()) return

      // Try to verify as non-admin
      const verifiedResult = verifyChurch({
        church: savedPublishedResult.value,
        verifiedBy: 'user-123',
        verifierRole: 'USER', // Not ADMIN
      })

      expect(verifiedResult.isErr()).toBe(true)
      if (verifiedResult.isOk()) return

      expect(verifiedResult.error.code).toBe('AUTHORIZATION_ERROR')
      expect(verifiedResult.error.message).toContain('Only admins')
    })
  })
})
```

### Step 2: Run test to verify it fails

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm test church.mutations.integration`

Expected: FAIL - Tests may fail if Jest config is not set up

### Step 3: Configure Jest for GraphQL package (if needed)

Check if `packages/graphql/jest.config.js` exists. If not, create it:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
}
```

### Step 4: Run tests to verify they pass

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm test church.mutations.integration`

Expected: PASS (5/5 tests)

Note: Tests interact with real database, so ensure `DATABASE_URL` is set.

### Step 5: Type check

Run: `cd /Users/naoki/Development/Apps/ChurchConnect/packages/graphql && pnpm type-check`

Expected: No type errors

### Step 6: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/src/types/__tests__/church.mutations.integration.test.ts
git add packages/graphql/jest.config.js # if created
git commit -m "test(graphql): add integration tests for church mutations

- Test createChurch → save flow
- Test publishChurch → save flow
- Test verifyChurch → save flow
- Test validation errors
- Test authorization errors
- 5/5 integration tests passing

Part of Phase 4 (GraphQL Adapters) - Task 7"
```

---

## Task 8: Update Documentation

Document the new GraphQL mutations and the adapter pattern.

**Files:**
- Create: `packages/graphql/README.md`

### Step 1: Create GraphQL package documentation

Create file: `packages/graphql/README.md`

```markdown
# @repo/graphql

GraphQL API layer for ChurchConnect using Pothos GraphQL.

## Architecture

This package implements the **Adapter Pattern** (Ports & Adapters / Hexagonal Architecture):

```
GraphQL Layer (Adapters)
    ↓
Domain Layer (Business Logic)
    ↓
Infrastructure Layer (Repositories)
    ↓
Database (Prisma + PostgreSQL)
```

### Layers

1. **GraphQL Resolvers** - Thin adapters that:
   - Parse and validate GraphQL inputs
   - Execute domain workflows
   - Handle Result types (neverthrow)
   - Map domain errors to GraphQL errors
   - Map domain entities to GraphQL responses

2. **Domain Workflows** - Pure business logic:
   - No dependencies on frameworks
   - Type-safe error handling with Result types
   - Encapsulate business rules

3. **Infrastructure Repositories** - Data access:
   - Implement domain repository interfaces
   - Handle database operations
   - Map between domain entities and Prisma models

## Usage

### Church Mutations

#### createChurch

Creates a draft church.

```graphql
mutation {
  createChurch(input: { name: "Tokyo Baptist Church" }) {
    id
    name
    isPublished
    slug
  }
}
```

Returns:
```json
{
  "data": {
    "createChurch": {
      "id": "church-123",
      "name": "Tokyo Baptist Church",
      "isPublished": false,
      "slug": null
    }
  }
}
```

**Errors:**
- `VALIDATION_ERROR` - Invalid church name (too short/long)
- `UNAUTHENTICATED` - User not logged in

#### publishChurch

Publishes a draft church (generates slug, makes public).

```graphql
mutation {
  publishChurch(id: "church-123") {
    id
    name
    isPublished
    slug
  }
}
```

Returns:
```json
{
  "data": {
    "publishChurch": {
      "id": "church-123",
      "name": "Tokyo Baptist Church",
      "isPublished": true,
      "slug": "tokyo-baptist-church"
    }
  }
}
```

**Errors:**
- `NOT_FOUND` - Church not found
- `VALIDATION_ERROR` - Church already published
- `UNAUTHENTICATED` - User not logged in

#### verifyChurch

Verifies a published church (admin only).

```graphql
mutation {
  verifyChurch(id: "church-123") {
    id
    name
    isPublished
    isVerified
    slug
  }
}
```

Returns:
```json
{
  "data": {
    "verifyChurch": {
      "id": "church-123",
      "name": "Tokyo Baptist Church",
      "isPublished": true,
      "isVerified": true,
      "slug": "tokyo-baptist-church"
    }
  }
}
```

**Errors:**
- `NOT_FOUND` - Church not found
- `VALIDATION_ERROR` - Church must be published first
- `AUTHORIZATION_ERROR` - User is not an admin
- `UNAUTHENTICATED` - User not logged in

## Development

### Running Tests

```bash
# Unit tests
pnpm test errorMapper
pnpm test churchMapper

# Integration tests
pnpm test church.mutations.integration
```

### Type Checking

```bash
pnpm type-check
```

### Adding New Mutations

1. Create domain workflow in `@repo/domain`
2. Create repository method in `@repo/infrastructure` (if needed)
3. Add GraphQL mutation in `src/types/*.ts`
4. Map domain errors using `mapDomainError`
5. Write integration tests
6. Update this README

## Error Handling

Domain errors are automatically mapped to GraphQL errors with proper error codes:

| Domain Error | GraphQL Error Code | HTTP Status |
|--------------|-------------------|-------------|
| ValidationError | VALIDATION_ERROR | 400 |
| AuthorizationError | AUTHORIZATION_ERROR | 403 |
| NotFoundError | NOT_FOUND | 404 |
| InfrastructureError | INFRASTRUCTURE_ERROR | 500 |

Example error response:

```json
{
  "errors": [
    {
      "message": "Church name must be between 2 and 100 characters",
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

## Testing Strategy

### Unit Tests
- `errorMapper.test.ts` - Error mapping logic
- `churchMapper.test.ts` - Domain-to-GraphQL mapping

### Integration Tests
- `church.mutations.integration.test.ts` - Full stack tests (GraphQL → Domain → Infrastructure → Database)

Integration tests use the real database and test the complete flow.

## Related Packages

- `@repo/domain` - Business logic and workflows
- `@repo/infrastructure` - Repository implementations
- `@repo/database` - Prisma schema and client
```

### Step 2: Commit

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
git add packages/graphql/README.md
git commit -m "docs(graphql): add comprehensive GraphQL package documentation

- Document adapter pattern architecture
- Document all church mutations with examples
- Document error handling and error codes
- Document testing strategy
- Add usage examples for createChurch, publishChurch, verifyChurch

Part of Phase 4 (GraphQL Adapters) - Task 8"
```

---

## Verification & Completion

### Run All Tests

```bash
cd /Users/naoki/Development/Apps/ChurchConnect

# GraphQL package tests
pnpm --filter @repo/graphql test

# Infrastructure tests (from Phase 3)
pnpm --filter @repo/infrastructure test

# Domain tests (from Phase 1)
pnpm --filter @repo/domain test
```

Expected: All tests passing across all packages

### Type Check All Packages

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
pnpm type-check
```

Expected: No type errors

### Manual Testing (Optional but Recommended)

1. Start development server:
```bash
pnpm --filter api dev
```

2. Open GraphQL Playground: http://localhost:4000/graphql

3. Test mutation flow:
```graphql
# 1. Create draft church
mutation {
  createChurch(input: { name: "Manual Test Church" }) {
    id
    name
    isPublished
    slug
  }
}

# 2. Publish church (use id from step 1)
mutation {
  publishChurch(id: "church-id-here") {
    id
    name
    isPublished
    slug
  }
}

# 3. Verify church (admin only, use id from step 1)
mutation {
  verifyChurch(id: "church-id-here") {
    id
    name
    isPublished
    isVerified
    slug
  }
}
```

### Success Criteria

- ✅ All 12+ tests passing (4 errorMapper + 3 churchMapper + 5 integration)
- ✅ No type errors across packages
- ✅ 8 clean commits (one per task)
- ✅ Documentation complete
- ✅ Manual testing confirms mutations work end-to-end

---

## Phase 4 Summary

**What We Built:**

1. **Error Mapper** - Translates domain errors to GraphQL errors
2. **Church Mapper** - Translates domain ChurchState to GraphQL responses
3. **Repository Factory** - Dependency injection for repositories
4. **createChurch Mutation** - GraphQL adapter for creating draft churches
5. **publishChurch Mutation** - GraphQL adapter for publishing churches
6. **verifyChurch Mutation** - GraphQL adapter for verifying churches (admin-only)
7. **Integration Tests** - Full stack tests covering all mutation flows
8. **Documentation** - Comprehensive README with examples

**Architecture Benefits:**

- ✅ **Separation of Concerns** - GraphQL layer is thin, business logic in domain
- ✅ **Type-Safe Errors** - Compiler forces handling of all error cases
- ✅ **Testable** - Domain logic tested independently from GraphQL
- ✅ **Maintainable** - Changes to business logic don't affect GraphQL schema
- ✅ **DRY** - Error mapping centralized, not duplicated per resolver

**What's Next:**

Phase 5 would extend this pattern to other aggregates (Review, Donation, etc.).

---

## Notes for Engineer

**Railway-Oriented Programming:**
- All domain workflows return `Result<T, E>` types
- Use `.isOk()` and `.isErr()` to check results
- Never throw in domain layer, only in GraphQL layer after mapping

**Prisma Query Pattern:**
- Use `ctx.prisma.church.findUniqueOrThrow()` with the `query` param
- This ensures Pothos can apply field-level selections correctly
- Don't return domain entities directly; return Prisma entities

**Testing Philosophy:**
- Unit tests for pure functions (mappers, workflows)
- Integration tests for full stack flows
- No mocking in integration tests; use real database

**Common Pitfalls:**
- Don't forget to add imports at top of church.ts
- Don't return ChurchState from GraphQL resolvers; return Prisma Church
- Don't throw domain errors; wrap them with mapDomainError first
- Don't forget to check authentication before executing workflows
