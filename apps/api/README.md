# ChurchConnect GraphQL API

GraphQL API server for ChurchConnect Japan platform.

## Overview

The API provides a GraphQL interface for all client applications (web, church-portal, admin). It uses:

- **Apollo Server** for GraphQL runtime
- **Pothos** for code-first schema generation
- **Prisma** for database queries
- **Express** as the HTTP server

## Features

- Type-safe GraphQL schema (code-first with Pothos)
- Authentication context
- Role-based access control
- Optimized queries with Prisma
- GraphQL Playground for development
- CORS configuration

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts           # Express + Apollo Server setup
│   ├── context.ts         # GraphQL context (auth, prisma)
│   └── server.ts          # Server configuration
├── .env                   # Environment variables
├── package.json
└── tsconfig.json
```

The GraphQL schema is defined in `packages/graphql/`.

## Environment Variables

Create `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/churchconnect?schema=public"

# Server
PORT=3001
NODE_ENV=development

# CORS (comma-separated allowed origins)
CORS_ORIGINS="http://localhost:3000,http://localhost:3002,http://localhost:3003"
```

See [Environment Variables](../../docs/ENVIRONMENT_VARIABLES.md) for details.

## Development

### Install Dependencies

From the root directory:

```bash
pnpm install
```

### Run Development Server

```bash
# From root
pnpm --filter api dev

# Or from this directory
pnpm dev
```

Server runs on http://localhost:3001

GraphQL Playground: http://localhost:3001/graphql

### Build for Production

```bash
# From root
pnpm --filter api build

# Or from this directory
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Available Scripts

- `pnpm dev` - Start development server with nodemon
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm type-check` - Run TypeScript compiler check

## GraphQL Schema

The schema is code-first, defined in `packages/graphql/src/types/`.

### Query Types

**Location & Reference Data:**
```graphql
type Query {
  prefectures: [Prefecture!]!
  prefecture(id: String!): Prefecture
  cities(prefectureId: String): [City!]!
  city(id: String!): City
  languages: [Language!]!
  denominations: [Denomination!]!
}
```

**Churches:**
```graphql
type Query {
  churches(
    prefectureId: String
    cityId: String
    denominationId: String
    languageIds: [String!]
    limit: Int = 50
  ): [Church!]!

  church(slug: String!): Church
}
```

**Reviews:**
```graphql
type Query {
  reviews(churchId: String!, status: ReviewStatus): [Review!]!
  myReviews: [Review!]!
}
```

**Donations:**
```graphql
type Query {
  myDonations: [PlatformDonation!]!
  mySubscriptions: [PlatformDonationSubscription!]!
  donation(id: String!): PlatformDonation
}
```

### Mutation Types

**Reviews:**
```graphql
type Mutation {
  createReview(input: CreateReviewInput!): Review!
  updateReviewStatus(id: String!, status: ReviewStatus!): Review!
  respondToReview(reviewId: String!, content: String!): ReviewResponse!
}
```

**Donations:**
```graphql
type Mutation {
  createDonation(input: CreateDonationInput!): PlatformDonation!
  cancelSubscription(id: String!): PlatformDonationSubscription!
}
```

**Church Management (Church Admin only):**
```graphql
type Mutation {
  updateChurchProfile(input: UpdateChurchProfileInput!): Church!
  addChurchStaff(input: AddStaffInput!): ChurchStaff!
  updateChurchStaff(id: String!, input: UpdateStaffInput!): ChurchStaff!
  deleteChurchStaff(id: String!): Boolean!
}
```

## Authentication Context

The API receives authentication information from NextAuth.js via headers.

### Context Type

```typescript
export interface Context {
  prisma: PrismaClient
  userId?: string
  userRole?: UserRole
}
```

### Getting User from Request

```typescript
async function getContext({ req }: { req: Request }): Promise<Context> {
  // Extract session from NextAuth cookie or header
  const session = await getSession(req)

  return {
    prisma,
    userId: session?.user?.id,
    userRole: session?.user?.role,
  }
}
```

### Protected Resolvers

```typescript
builder.queryFields((t) => ({
  myReviews: t.prismaField({
    type: ['Review'],
    resolve: async (query, _root, _args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized')
      }

      return ctx.prisma.review.findMany({
        ...query,
        where: { userId: ctx.userId },
      })
    },
  }),
}))
```

### Role-Based Access

```typescript
builder.queryFields((t) => ({
  allUsers: t.prismaField({
    type: ['User'],
    resolve: async (query, _root, _args, ctx) => {
      if (ctx.userRole !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      return ctx.prisma.user.findMany(query)
    },
  }),
}))
```

## CORS Configuration

Configured in `src/index.ts`:

```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
  ],
  credentials: true,
}

app.use(cors(corsOptions))
```

### Production CORS

```env
CORS_ORIGINS="https://churchconnect.jp,https://portal.churchconnect.jp,https://admin.churchconnect.jp"
```

## GraphQL Playground

Access GraphQL Playground in development:

http://localhost:3001/graphql

### Example Queries

**Get all prefectures:**
```graphql
query {
  prefectures {
    id
    name
    nameJa
  }
}
```

**Get churches in Tokyo:**
```graphql
query {
  churches(prefectureId: "tokyo-id") {
    id
    name
    slug
    address
    city {
      name
    }
    denomination {
      name
    }
  }
}
```

**Get church by slug:**
```graphql
query {
  church(slug: "sample-church-tokyo") {
    id
    name
    profile {
      whoWeAre
      vision
    }
    serviceTimes {
      dayOfWeek
      startTime
      language {
        name
      }
    }
    staff {
      name
      title
      bio
    }
  }
}
```

**Create review (requires auth):**
```graphql
mutation {
  createReview(
    input: {
      churchId: "church-id"
      content: "Great church community!"
      experienceType: "VISITOR"
    }
  ) {
    id
    content
    createdAt
  }
}
```

## Error Handling

### GraphQL Errors

```typescript
import { GraphQLError } from 'graphql'

throw new GraphQLError('Custom error message', {
  extensions: {
    code: 'UNAUTHORIZED',
    http: { status: 401 },
  },
})
```

### Common Error Codes

- `UNAUTHENTICATED` - User not logged in
- `FORBIDDEN` - User lacks required role
- `BAD_USER_INPUT` - Invalid input data
- `INTERNAL_SERVER_ERROR` - Server error

## Database Queries

Uses Prisma ORM for all database operations.

### Best Practices

**Use Prisma's `include` and `select`:**
```typescript
return ctx.prisma.church.findMany({
  where: { isPublished: true },
  include: {
    city: true,
    prefecture: true,
    denomination: true,
  },
  orderBy: { name: 'asc' },
})
```

**Implement pagination:**
```typescript
return ctx.prisma.church.findMany({
  take: args.limit,
  skip: args.offset,
  where: filters,
})
```

**Use transactions for multiple operations:**
```typescript
await ctx.prisma.$transaction([
  ctx.prisma.review.create({ data: reviewData }),
  ctx.prisma.church.update({
    where: { id: churchId },
    data: { reviewCount: { increment: 1 } },
  }),
])
```

## Performance Optimization

### DataLoader (Planned)

Prevent N+1 queries by batching database requests:

```typescript
import DataLoader from 'dataloader'

const cityLoader = new DataLoader(async (cityIds: string[]) => {
  const cities = await prisma.city.findMany({
    where: { id: { in: cityIds } },
  })
  return cityIds.map(id => cities.find(city => city.id === id))
})
```

### Query Complexity Limiting (Planned)

Prevent expensive queries:

```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity'

const complexityLimit = createComplexityLimitRule(1000)
```

## Testing

### Manual Testing with Playground

1. Start server: `pnpm dev`
2. Open http://localhost:3001/graphql
3. Run queries in playground

### Testing with curl

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ prefectures { name } }"}'
```

### Testing Authentication

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"query":"{ myReviews { id content } }"}'
```

## Deployment

See [Deployment Guide](../../docs/DEPLOYMENT.md) for production deployment.

### Render Deployment

```yaml
# render.yaml
services:
  - type: web
    name: churchconnect-api
    env: node
    buildCommand: cd ../.. && pnpm install && pnpm --filter api build
    startCommand: cd apps/api && pnpm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGINS
        value: https://churchconnect.jp,https://portal.churchconnect.jp,https://admin.churchconnect.jp
```

### Environment Variables

Set in hosting platform:
- `DATABASE_URL`
- `PORT` (usually auto-set)
- `NODE_ENV=production`
- `CORS_ORIGINS` (production domains)

## Monitoring

### Health Check Endpoint

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})
```

### Logging

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
})
```

## Troubleshooting

### Server won't start

- Check port 3001 is not in use: `lsof -i :3001`
- Verify `DATABASE_URL` is correct
- Check Prisma client is generated: `cd ../../packages/database && pnpm db:generate`

### GraphQL errors

- Check schema is valid: Type errors will show on startup
- Verify resolvers return correct types
- Check context is properly set up

### Database connection fails

- Verify PostgreSQL is running
- Test connection: `psql "$DATABASE_URL"`
- Check connection string format

### CORS errors

- Verify origin is in `CORS_ORIGINS`
- Check credentials are set correctly
- Use browser dev tools to see CORS headers

## Contributing

1. Create feature branch
2. Add/modify types in `packages/graphql/src/types/`
3. Test with GraphQL Playground
4. Submit pull request

## Resources

- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [Pothos GraphQL](https://pothos-graphql.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [GraphQL Spec](https://spec.graphql.org/)

## License

MIT
