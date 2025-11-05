import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { prisma } from '@repo/database'

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  Scalars: {
    DateTime: {
      Input: Date
      Output: Date
    }
    Json: {
      Input: unknown
      Output: unknown
    }
  }
  Context: {
    prisma: typeof prisma
    userId?: string
    userRole?: string
  }
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
})

// Define base Query and Mutation types
builder.queryType({})
builder.mutationType({
  fields: (t) => ({
    // Placeholder mutation - will be replaced with actual mutations in later phases
    _placeholder: t.boolean({
      resolve: () => true,
    }),
  }),
})
