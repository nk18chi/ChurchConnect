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
builder.mutationType({})
