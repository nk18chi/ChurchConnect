import { builder } from '../builder'

builder.prismaObject('ServiceTime', {
  fields: (t) => ({
    id: t.exposeID('id'),
    dayOfWeek: t.exposeInt('dayOfWeek'),
    startTime: t.exposeString('startTime'),
    endTime: t.exposeString('endTime', { nullable: true }),
    language: t.relation('language'),
    serviceType: t.exposeString('serviceType', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// Input Types
const CreateServiceTimeInput = builder.inputType('CreateServiceTimeInput', {
  fields: (t) => ({
    dayOfWeek: t.int({ required: true }),
    startTime: t.string({ required: true }),
    endTime: t.string(),
    languageId: t.string({ required: true }),
    serviceType: t.string(),
  }),
})

const UpdateServiceTimeInput = builder.inputType('UpdateServiceTimeInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    dayOfWeek: t.int(),
    startTime: t.string(),
    endTime: t.string(),
    languageId: t.string(),
    serviceType: t.string(),
  }),
})

// Queries
builder.queryFields((t) => ({
  serviceTimes: t.prismaField({
    type: ['ServiceTime'],
    args: {
      churchId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.serviceTime.findMany({
        ...query,
        where: { churchId: args.churchId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      })
    },
  }),
}))

// Mutations
builder.mutationFields((t) => ({
  createServiceTime: t.prismaField({
    type: 'ServiceTime',
    args: {
      input: t.arg({ type: CreateServiceTimeInput, required: true }),
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

      // Validate dayOfWeek (0-6 for Sunday-Saturday)
      if (args.input.dayOfWeek < 0 || args.input.dayOfWeek > 6) {
        throw new Error('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)')
      }

      // Prepare create data
      const createData: any = {
        churchId: church.id,
        dayOfWeek: args.input.dayOfWeek,
        startTime: args.input.startTime,
        languageId: args.input.languageId,
      }

      // Add optional fields
      if (args.input.endTime !== null && args.input.endTime !== undefined) {
        createData.endTime = args.input.endTime
      }
      if (args.input.serviceType !== null && args.input.serviceType !== undefined) {
        createData.serviceType = args.input.serviceType
      }

      return ctx.prisma.serviceTime.create({
        ...query,
        data: createData,
      })
    },
  }),

  updateServiceTime: t.prismaField({
    type: 'ServiceTime',
    args: {
      input: t.arg({ type: UpdateServiceTimeInput, required: true }),
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

      // Verify service time belongs to this church
      const serviceTime = await ctx.prisma.serviceTime.findUnique({
        where: { id: args.input.id },
        select: { churchId: true },
      })

      if (!serviceTime || serviceTime.churchId !== church.id) {
        throw new Error('Service time not found or does not belong to your church')
      }

      // Validate dayOfWeek if provided
      if (args.input.dayOfWeek !== null && args.input.dayOfWeek !== undefined) {
        if (args.input.dayOfWeek < 0 || args.input.dayOfWeek > 6) {
          throw new Error('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)')
        }
      }

      // Prepare update data
      const updateData: any = {}
      Object.entries(args.input).forEach(([key, value]) => {
        if (key !== 'id' && value !== null && value !== undefined) {
          updateData[key] = value
        }
      })

      return ctx.prisma.serviceTime.update({
        ...query,
        where: { id: args.input.id },
        data: updateData,
      })
    },
  }),

  deleteServiceTime: t.prismaField({
    type: 'ServiceTime',
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

      // Verify service time belongs to this church
      const serviceTime = await ctx.prisma.serviceTime.findUnique({
        where: { id: args.id },
        select: { churchId: true },
      })

      if (!serviceTime || serviceTime.churchId !== church.id) {
        throw new Error('Service time not found or does not belong to your church')
      }

      return ctx.prisma.serviceTime.delete({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
