import { builder } from '../builder'

// Full-text search queries using PostgreSQL's built-in full-text search

builder.queryFields((t) => ({
  // Search churches by text query
  searchChurches: t.prismaField({
    type: ['Church'],
    args: {
      query: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { query: searchQuery, limit } = args

      // Use Prisma raw query for full-text search
      // plainto_tsquery safely handles user input
      // ts_rank orders results by relevance
      const churches = await ctx.prisma.$queryRaw<any[]>`
        SELECT *
        FROM "Church"
        WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
          AND "isDeleted" = false
          AND "isPublished" = true
        ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${searchQuery})) DESC
        LIMIT ${limit}
      `

      return churches
    },
  }),

  // Search sermons by text query
  searchSermons: t.prismaField({
    type: ['Sermon'],
    args: {
      query: t.arg.string({ required: true }),
      churchId: t.arg.string(),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { query: searchQuery, churchId, limit } = args

      // Build the query with optional church filter
      if (churchId) {
        const sermons = await ctx.prisma.$queryRaw<any[]>`
          SELECT *
          FROM "Sermon"
          WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
            AND "churchId" = ${churchId}
          ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${searchQuery})) DESC
          LIMIT ${limit}
        `
        return sermons
      } else {
        const sermons = await ctx.prisma.$queryRaw<any[]>`
          SELECT *
          FROM "Sermon"
          WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
          ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${searchQuery})) DESC
          LIMIT ${limit}
        `
        return sermons
      }
    },
  }),

  // Search events by text query
  searchEvents: t.prismaField({
    type: ['Event'],
    args: {
      query: t.arg.string({ required: true }),
      churchId: t.arg.string(),
      upcomingOnly: t.arg.boolean({ defaultValue: true }),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { query: searchQuery, churchId, upcomingOnly, limit } = args
      const now = new Date()

      // Build query with optional filters
      if (churchId && upcomingOnly) {
        const events = await ctx.prisma.$queryRaw<any[]>`
          SELECT *
          FROM "Event"
          WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
            AND "churchId" = ${churchId}
            AND "startDate" >= ${now}
          ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${searchQuery})) DESC,
                   "startDate" ASC
          LIMIT ${limit}
        `
        return events
      } else if (churchId) {
        const events = await ctx.prisma.$queryRaw<any[]>`
          SELECT *
          FROM "Event"
          WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
            AND "churchId" = ${churchId}
          ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${searchQuery})) DESC,
                   "startDate" ASC
          LIMIT ${limit}
        `
        return events
      } else if (upcomingOnly) {
        const events = await ctx.prisma.$queryRaw<any[]>`
          SELECT *
          FROM "Event"
          WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
            AND "startDate" >= ${now}
          ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${searchQuery})) DESC,
                   "startDate" ASC
          LIMIT ${limit}
        `
        return events
      } else {
        const events = await ctx.prisma.$queryRaw<any[]>`
          SELECT *
          FROM "Event"
          WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
          ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${searchQuery})) DESC,
                   "startDate" ASC
          LIMIT ${limit}
        `
        return events
      }
    },
  }),
}))
