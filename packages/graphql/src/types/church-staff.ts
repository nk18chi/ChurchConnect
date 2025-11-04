import { builder } from '../builder'

builder.prismaObject('ChurchStaff', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    title: t.exposeString('title', { nullable: true }),
    role: t.exposeString('role', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    photoUrl: t.exposeString('photoUrl', { nullable: true }),
    credentials: t.exposeString('credentials', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    order: t.exposeInt('order'),
    twitterUrl: t.exposeString('twitterUrl', { nullable: true }),
    instagramUrl: t.exposeString('instagramUrl', { nullable: true }),
    blogUrl: t.exposeString('blogUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// Input Types
const CreateStaffInput = builder.inputType('CreateStaffInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    title: t.string(),
    role: t.string(),
    bio: t.string(),
    photoUrl: t.string(),
    credentials: t.string(),
    email: t.string(),
    twitterUrl: t.string(),
    instagramUrl: t.string(),
    blogUrl: t.string(),
  }),
})

const UpdateStaffInput = builder.inputType('UpdateStaffInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string(),
    title: t.string(),
    role: t.string(),
    bio: t.string(),
    photoUrl: t.string(),
    credentials: t.string(),
    email: t.string(),
    twitterUrl: t.string(),
    instagramUrl: t.string(),
    blogUrl: t.string(),
  }),
})

const ReorderStaffInput = builder.inputType('ReorderStaffInput', {
  fields: (t) => ({
    staffId: t.string({ required: true }),
    newOrder: t.int({ required: true }),
  }),
})

// Queries
builder.queryFields((t) => ({
  churchStaff: t.prismaField({
    type: ['ChurchStaff'],
    args: {
      churchId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.churchStaff.findMany({
        ...query,
        where: { churchId: args.churchId },
        orderBy: { order: 'asc' },
      })
    },
  }),
}))

// Mutations
builder.mutationFields((t) => ({
  createStaff: t.prismaField({
    type: 'ChurchStaff',
    args: {
      input: t.arg({ type: CreateStaffInput, required: true }),
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

      // Get max order for this church's staff
      const maxOrderStaff = await ctx.prisma.churchStaff.findFirst({
        where: { churchId: church.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      const nextOrder = maxOrderStaff ? maxOrderStaff.order + 1 : 0

      // Prepare create data
      const createData: any = {
        churchId: church.id,
        name: args.input.name,
        order: nextOrder,
      }

      // Add optional fields
      Object.entries(args.input).forEach(([key, value]) => {
        if (key !== 'name' && value !== null && value !== undefined) {
          createData[key] = value
        }
      })

      return ctx.prisma.churchStaff.create({
        ...query,
        data: createData,
      })
    },
  }),

  updateStaff: t.prismaField({
    type: 'ChurchStaff',
    args: {
      input: t.arg({ type: UpdateStaffInput, required: true }),
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

      // Verify staff belongs to this church
      const staff = await ctx.prisma.churchStaff.findUnique({
        where: { id: args.input.id },
        select: { churchId: true },
      })

      if (!staff || staff.churchId !== church.id) {
        throw new Error('Staff member not found or does not belong to your church')
      }

      // Prepare update data
      const updateData: any = {}
      Object.entries(args.input).forEach(([key, value]) => {
        if (key !== 'id' && value !== null && value !== undefined) {
          updateData[key] = value
        }
      })

      return ctx.prisma.churchStaff.update({
        ...query,
        where: { id: args.input.id },
        data: updateData,
      })
    },
  }),

  deleteStaff: t.prismaField({
    type: 'ChurchStaff',
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

      // Verify staff belongs to this church
      const staff = await ctx.prisma.churchStaff.findUnique({
        where: { id: args.id },
        select: { churchId: true },
      })

      if (!staff || staff.churchId !== church.id) {
        throw new Error('Staff member not found or does not belong to your church')
      }

      return ctx.prisma.churchStaff.delete({
        ...query,
        where: { id: args.id },
      })
    },
  }),

  reorderStaff: t.prismaField({
    type: 'ChurchStaff',
    args: {
      input: t.arg({ type: ReorderStaffInput, required: true }),
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

      // Verify staff belongs to this church
      const staff = await ctx.prisma.churchStaff.findUnique({
        where: { id: args.input.staffId },
        select: { churchId: true, order: true },
      })

      if (!staff || staff.churchId !== church.id) {
        throw new Error('Staff member not found or does not belong to your church')
      }

      // Update the order
      return ctx.prisma.churchStaff.update({
        ...query,
        where: { id: args.input.staffId },
        data: { order: args.input.newOrder },
      })
    },
  }),
}))
