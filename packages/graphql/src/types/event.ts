import { builder } from '../builder'

builder.prismaObject('Event', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    startDate: t.expose('startDate', { type: 'DateTime' }),
    endDate: t.expose('endDate', { type: 'DateTime', nullable: true }),
    location: t.exposeString('location', { nullable: true }),
    isOnline: t.exposeBoolean('isOnline'),
    registrationUrl: t.exposeString('registrationUrl', { nullable: true }),
    imageUrl: t.exposeString('imageUrl', { nullable: true }),
    isRecurring: t.exposeBoolean('isRecurring'),
    recurrenceRule: t.exposeString('recurrenceRule', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// Input Types
const CreateEventInput = builder.inputType('CreateEventInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string(),
    startDate: t.field({ type: 'DateTime', required: true }),
    endDate: t.field({ type: 'DateTime' }),
    location: t.string(),
    isOnline: t.boolean({ defaultValue: false }),
    registrationUrl: t.string(),
    imageUrl: t.string(),
    isRecurring: t.boolean({ defaultValue: false }),
    recurrenceRule: t.string(),
  }),
})

const UpdateEventInput = builder.inputType('UpdateEventInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    title: t.string(),
    description: t.string(),
    startDate: t.field({ type: 'DateTime' }),
    endDate: t.field({ type: 'DateTime' }),
    location: t.string(),
    isOnline: t.boolean(),
    registrationUrl: t.string(),
    imageUrl: t.string(),
    isRecurring: t.boolean(),
    recurrenceRule: t.string(),
  }),
})

// Queries
builder.queryFields((t) => ({
  churchEvents: t.prismaField({
    type: ['Event'],
    args: {
      churchId: t.arg.string({ required: true }),
      upcomingOnly: t.arg.boolean({ defaultValue: true }),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (query, _root, args, ctx) => {
      const now = new Date()
      return ctx.prisma.event.findMany({
        ...query,
        where: {
          churchId: args.churchId,
          ...(args.upcomingOnly && {
            startDate: { gte: now },
          }),
        },
        orderBy: { startDate: 'asc' },
        take: args.limit ?? undefined,
      })
    },
  }),

  event: t.prismaField({
    type: 'Event',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.event.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))

// Mutations
builder.mutationFields((t) => ({
  createEvent: t.prismaField({
    type: 'Event',
    args: {
      input: t.arg({ type: CreateEventInput, required: true }),
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
        startDate: args.input.startDate,
        isOnline: args.input.isOnline ?? false,
        isRecurring: args.input.isRecurring ?? false,
      }

      // Add optional fields
      Object.entries(args.input).forEach(([key, value]) => {
        if (!['title', 'startDate', 'isOnline', 'isRecurring'].includes(key) && value !== null && value !== undefined) {
          createData[key] = value
        }
      })

      return ctx.prisma.event.create({
        ...query,
        data: createData,
      })
    },
  }),

  updateEvent: t.prismaField({
    type: 'Event',
    args: {
      input: t.arg({ type: UpdateEventInput, required: true }),
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

      // Verify event belongs to this church
      const event = await ctx.prisma.event.findUnique({
        where: { id: args.input.id },
        select: { churchId: true },
      })

      if (!event || event.churchId !== church.id) {
        throw new Error('Event not found or does not belong to your church')
      }

      // Prepare update data
      const updateData: any = {}
      Object.entries(args.input).forEach(([key, value]) => {
        if (key !== 'id' && value !== null && value !== undefined) {
          updateData[key] = value
        }
      })

      return ctx.prisma.event.update({
        ...query,
        where: { id: args.input.id },
        data: updateData,
      })
    },
  }),

  deleteEvent: t.prismaField({
    type: 'Event',
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

      // Verify event belongs to this church
      const event = await ctx.prisma.event.findUnique({
        where: { id: args.id },
        select: { churchId: true },
      })

      if (!event || event.churchId !== church.id) {
        throw new Error('Event not found or does not belong to your church')
      }

      return ctx.prisma.event.delete({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
