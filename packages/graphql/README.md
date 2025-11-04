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
