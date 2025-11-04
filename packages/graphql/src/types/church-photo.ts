import { builder } from '../builder'

builder.prismaObject('ChurchPhoto', {
  fields: (t) => ({
    id: t.exposeID('id'),
    url: t.exposeString('url'),
    publicId: t.exposeString('publicId'),
    caption: t.exposeString('caption', { nullable: true }),
    category: t.exposeString('category'),
    order: t.exposeInt('order'),
    uploadedBy: t.exposeString('uploadedBy'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// Input type for adding a church photo
const AddChurchPhotoInput = builder.inputType('AddChurchPhotoInput', {
  fields: (t) => ({
    url: t.string({ required: true }),
    publicId: t.string({ required: true }),
    caption: t.string({ required: false }),
    category: t.string({ required: true }),
  }),
})

// Input type for updating a church photo
const UpdateChurchPhotoInput = builder.inputType('UpdateChurchPhotoInput', {
  fields: (t) => ({
    caption: t.string({ required: false }),
    category: t.string({ required: false }),
    order: t.int({ required: false }),
  }),
})

// Queries
builder.queryFields((t) => ({
  // Public query for church photos
  churchPhotos: t.prismaField({
    type: ['ChurchPhoto'],
    args: {
      churchId: t.arg.string({ required: true }),
      category: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.churchPhoto.findMany({
        ...query,
        where: {
          churchId: args.churchId,
          ...(args.category && { category: args.category }),
        },
        orderBy: { order: 'asc' },
      })
    },
  }),

  // Authenticated query for church admin to manage their photos
  myChurchPhotos: t.prismaField({
    type: ['ChurchPhoto'],
    args: {
      category: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Get church for this admin
      const church = await ctx.prisma.church.findUnique({
        where: { adminUserId: ctx.userId },
        select: { id: true },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      return ctx.prisma.churchPhoto.findMany({
        ...query,
        where: {
          churchId: church.id,
          ...(args.category && { category: args.category }),
        },
        orderBy: { order: 'asc' },
      })
    },
  }),
}))

// Mutations for managing church photos
builder.mutationFields((t) => ({
  addChurchPhoto: t.prismaField({
    type: 'ChurchPhoto',
    args: {
      input: t.arg({ type: AddChurchPhotoInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Get church for this admin
      const church = await ctx.prisma.church.findUnique({
        where: { adminUserId: ctx.userId },
        select: { id: true },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      // Get the max order for this category
      const maxOrderPhoto = await ctx.prisma.churchPhoto.findFirst({
        where: {
          churchId: church.id,
          category: args.input.category,
        },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      const nextOrder = maxOrderPhoto ? maxOrderPhoto.order + 1 : 0

      // Create the photo
      return ctx.prisma.churchPhoto.create({
        ...query,
        data: {
          churchId: church.id,
          url: args.input.url,
          publicId: args.input.publicId,
          caption: args.input.caption,
          category: args.input.category,
          order: nextOrder,
          uploadedBy: ctx.userId,
        },
      })
    },
  }),

  updateChurchPhoto: t.prismaField({
    type: 'ChurchPhoto',
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateChurchPhotoInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Verify photo belongs to this admin's church
      const photo = await ctx.prisma.churchPhoto.findUnique({
        where: { id: args.id },
        include: { church: true },
      })

      if (!photo || photo.church.adminUserId !== ctx.userId) {
        throw new Error('Photo not found or unauthorized')
      }

      // Prepare update data
      const updateData: any = {}
      if (args.input.caption !== undefined) {
        updateData.caption = args.input.caption
      }
      if (args.input.category !== undefined) {
        updateData.category = args.input.category
      }
      if (args.input.order !== undefined) {
        updateData.order = args.input.order
      }

      // Update the photo
      return ctx.prisma.churchPhoto.update({
        ...query,
        where: { id: args.id },
        data: updateData,
      })
    },
  }),

  deleteChurchPhoto: t.field({
    type: 'Boolean',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Verify photo belongs to this admin's church
      const photo = await ctx.prisma.churchPhoto.findUnique({
        where: { id: args.id },
        include: { church: true },
      })

      if (!photo || photo.church.adminUserId !== ctx.userId) {
        throw new Error('Photo not found or unauthorized')
      }

      // Delete the photo
      await ctx.prisma.churchPhoto.delete({
        where: { id: args.id },
      })

      return true
    },
  }),
}))
