import { builder } from '../builder'

builder.prismaObject('Sermon', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    preacher: t.exposeString('preacher'),
    passage: t.exposeString('passage', { nullable: true }),
    date: t.expose('date', { type: 'DateTime' }),
    youtubeUrl: t.exposeString('youtubeUrl', { nullable: true }),
    podcastUrl: t.exposeString('podcastUrl', { nullable: true }),
    notesUrl: t.exposeString('notesUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// Input Types
const CreateSermonInput = builder.inputType('CreateSermonInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string(),
    preacher: t.string({ required: true }),
    passage: t.string(),
    date: t.field({ type: 'DateTime', required: true }),
    youtubeUrl: t.string(),
    podcastUrl: t.string(),
    notesUrl: t.string(),
  }),
})

const UpdateSermonInput = builder.inputType('UpdateSermonInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    title: t.string(),
    description: t.string(),
    preacher: t.string(),
    passage: t.string(),
    date: t.field({ type: 'DateTime' }),
    youtubeUrl: t.string(),
    podcastUrl: t.string(),
    notesUrl: t.string(),
  }),
})

// Queries
builder.queryFields((t) => ({
  churchSermons: t.prismaField({
    type: ['Sermon'],
    args: {
      churchId: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.sermon.findMany({
        ...query,
        where: { churchId: args.churchId },
        orderBy: { date: 'desc' },
        take: args.limit ?? undefined,
      })
    },
  }),

  sermon: t.prismaField({
    type: 'Sermon',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.sermon.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))

// Mutations
builder.mutationFields((t) => ({
  createSermon: t.prismaField({
    type: 'Sermon',
    args: {
      input: t.arg({ type: CreateSermonInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Check user is CHURCH_ADMIN
      if (ctx.userRole !== 'CHURCH_ADMIN') {
        throw new Error('Unauthorized: Church admin access required')
      }

      // Get church for this admin
      const church = await ctx.prisma.church.findUnique({
        where: { adminUserId: ctx.userId },
        select: { id: true },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      // Prepare create data
      const createData: any = {
        churchId: church.id,
        title: args.input.title,
        preacher: args.input.preacher,
        date: args.input.date,
      }

      // Add optional fields
      Object.entries(args.input).forEach(([key, value]) => {
        if (!['title', 'preacher', 'date'].includes(key) && value !== null && value !== undefined) {
          createData[key] = value
        }
      })

      return ctx.prisma.sermon.create({
        ...query,
        data: createData,
      })
    },
  }),

  updateSermon: t.prismaField({
    type: 'Sermon',
    args: {
      input: t.arg({ type: UpdateSermonInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Check user is CHURCH_ADMIN
      if (ctx.userRole !== 'CHURCH_ADMIN') {
        throw new Error('Unauthorized: Church admin access required')
      }

      // Get church for this admin
      const church = await ctx.prisma.church.findUnique({
        where: { adminUserId: ctx.userId },
        select: { id: true },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      // Verify sermon belongs to this church
      const sermon = await ctx.prisma.sermon.findUnique({
        where: { id: args.input.id },
        select: { churchId: true },
      })

      if (!sermon || sermon.churchId !== church.id) {
        throw new Error('Sermon not found or does not belong to your church')
      }

      // Prepare update data
      const updateData: any = {}
      Object.entries(args.input).forEach(([key, value]) => {
        if (key !== 'id' && value !== null && value !== undefined) {
          updateData[key] = value
        }
      })

      return ctx.prisma.sermon.update({
        ...query,
        where: { id: args.input.id },
        data: updateData,
      })
    },
  }),

  deleteSermon: t.prismaField({
    type: 'Sermon',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Check user is CHURCH_ADMIN
      if (ctx.userRole !== 'CHURCH_ADMIN') {
        throw new Error('Unauthorized: Church admin access required')
      }

      // Get church for this admin
      const church = await ctx.prisma.church.findUnique({
        where: { adminUserId: ctx.userId },
        select: { id: true },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      // Verify sermon belongs to this church
      const sermon = await ctx.prisma.sermon.findUnique({
        where: { id: args.id },
        select: { churchId: true },
      })

      if (!sermon || sermon.churchId !== church.id) {
        throw new Error('Sermon not found or does not belong to your church')
      }

      return ctx.prisma.sermon.delete({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
