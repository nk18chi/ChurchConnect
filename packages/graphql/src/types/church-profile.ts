import { builder } from '../builder'

builder.prismaObject('ChurchProfile', {
  fields: (t) => ({
    id: t.exposeID('id'),
    whoWeAre: t.exposeString('whoWeAre', { nullable: true }),
    vision: t.exposeString('vision', { nullable: true }),
    statementOfFaith: t.exposeString('statementOfFaith', { nullable: true }),
    storyOfChurch: t.exposeString('storyOfChurch', { nullable: true }),
    kidChurchInfo: t.exposeString('kidChurchInfo', { nullable: true }),
    whatToExpect: t.exposeString('whatToExpect', { nullable: true }),
    dressCode: t.exposeString('dressCode', { nullable: true }),
    worshipStyle: t.exposeString('worshipStyle', { nullable: true }),
    accessibility: t.exposeStringList('accessibility'),
    howToGive: t.exposeString('howToGive', { nullable: true }),
    bankName: t.exposeString('bankName', { nullable: true }),
    bankAccountNumber: t.exposeString('bankAccountNumber', { nullable: true }),
    bankAccountName: t.exposeString('bankAccountName', { nullable: true }),
    externalDonationUrl: t.exposeString('externalDonationUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// Input Types
const UpdateChurchProfileInput = builder.inputType('UpdateChurchProfileInput', {
  fields: (t) => ({
    whoWeAre: t.string(),
    vision: t.string(),
    statementOfFaith: t.string(),
    storyOfChurch: t.string(),
    kidChurchInfo: t.string(),
    whatToExpect: t.string(),
    dressCode: t.string(),
    worshipStyle: t.string(),
    accessibility: t.stringList(),
    howToGive: t.string(),
    bankName: t.string(),
    bankAccountNumber: t.string(),
    bankAccountName: t.string(),
    externalDonationUrl: t.string(),
  }),
})

const UpdateChurchBasicInfoInput = builder.inputType('UpdateChurchBasicInfoInput', {
  fields: (t) => ({
    name: t.string(),
    description: t.string(),
    address: t.string(),
    postalCode: t.string(),
    phone: t.string(),
    email: t.string(),
    website: t.string(),
    contactEmail: t.string(),
  }),
})

// Mutations
builder.mutationFields((t) => ({
  updateChurchProfile: t.prismaField({
    type: 'ChurchProfile',
    args: {
      input: t.arg({ type: UpdateChurchProfileInput, required: true }),
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
        select: { id: true, profile: { select: { id: true } } },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      // Prepare update data (only include non-null values)
      const updateData: any = {}
      Object.entries(args.input).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          updateData[key] = value
        }
      })

      // Create or update profile
      if (church.profile) {
        return ctx.prisma.churchProfile.update({
          ...query,
          where: { id: church.profile.id },
          data: updateData,
        })
      } else {
        return ctx.prisma.churchProfile.create({
          ...query,
          data: {
            churchId: church.id,
            ...updateData,
          },
        })
      }
    },
  }),

  updateChurchBasicInfo: t.prismaField({
    type: 'Church',
    args: {
      input: t.arg({ type: UpdateChurchBasicInfoInput, required: true }),
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

      // Prepare update data (only include non-null values)
      const updateData: any = {}
      Object.entries(args.input).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          updateData[key] = value
        }
      })

      return ctx.prisma.church.update({
        ...query,
        where: { id: church.id },
        data: updateData,
      })
    },
  }),

  updateChurchHeroImage: t.prismaField({
    type: 'Church',
    args: {
      heroImageUrl: t.arg.string({ required: true }),
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

      return ctx.prisma.church.update({
        ...query,
        where: { id: church.id },
        data: { heroImageUrl: args.heroImageUrl },
      })
    },
  }),
}))
