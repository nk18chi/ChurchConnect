import { builder } from '../builder'
import { createChurch, publishChurch, verifyChurch, ChurchId } from '@repo/domain'
import { getRepositoryFactory } from '../factories/repositoryFactory'
import { mapDomainError } from '../utils/errorMapper'

builder.prismaObject('Church', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    slug: t.exposeString('slug'),
    description: t.exposeString('description', { nullable: true }),

    // Location
    prefecture: t.relation('prefecture'),
    city: t.relation('city'),
    address: t.exposeString('address'),
    postalCode: t.exposeString('postalCode', { nullable: true }),
    latitude: t.exposeFloat('latitude', { nullable: true }),
    longitude: t.exposeFloat('longitude', { nullable: true }),

    // Contact
    phone: t.exposeString('phone', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    website: t.exposeString('website', { nullable: true }),
    contactEmail: t.exposeString('contactEmail', { nullable: true }),

    // Denomination
    denomination: t.relation('denomination'),

    // Hero image
    heroImageUrl: t.exposeString('heroImageUrl', { nullable: true }),

    // Status flags (for ranking)
    isVerified: t.exposeBoolean('isVerified'),
    isComplete: t.exposeBoolean('isComplete'),
    isPublished: t.exposeBoolean('isPublished'),

    // Relations - One-to-one
    profile: t.relation('profile', { nullable: true }),
    social: t.relation('social', { nullable: true }),

    // Languages (via ChurchLanguage join table)
    languages: t.prismaField({
      type: ['Language'],
      resolve: async (query, church, _args, ctx) => {
        const churchLanguages = await ctx.prisma.churchLanguage.findMany({
          where: { churchId: church.id },
          include: {
            language: query,
          },
        })
        return churchLanguages.map((cl) => cl.language)
      },
    }),

    // Relations - One-to-many (ordered)
    serviceTimes: t.relation('serviceTimes', {
      query: () => ({ orderBy: { dayOfWeek: 'asc' } }),
    }),
    photos: t.relation('photos', {
      query: () => ({ orderBy: { order: 'asc' } }),
    }),
    staff: t.relation('staff', {
      query: () => ({ orderBy: { order: 'asc' } }),
    }),
    sermons: t.relation('sermons', {
      query: () => ({ orderBy: { date: 'desc' } }),
    }),
    events: t.relation('events', {
      query: () => ({ orderBy: { startDate: 'asc' } }),
    }),
    reviews: t.relation('reviews', {
      query: () => ({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      }),
    }),

    // Meta
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

builder.queryFields((t) => ({
  // List churches with comprehensive filtering and ranking
  churches: t.prismaField({
    type: ['Church'],
    args: {
      prefectureId: t.arg.string(),
      cityId: t.arg.string(),
      denominationId: t.arg.string(),
      languageIds: t.arg.stringList(),
      worshipStyle: t.arg.string(),
      limit: t.arg.int({ defaultValue: 50 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.church.findMany({
        ...query,
        where: {
          isPublished: true,
          isDeleted: false,
          ...(args.prefectureId && { prefectureId: args.prefectureId }),
          ...(args.cityId && { cityId: args.cityId }),
          ...(args.denominationId && { denominationId: args.denominationId }),
          ...(args.languageIds && args.languageIds.length > 0 && {
            languages: {
              some: {
                languageId: { in: args.languageIds },
              },
            },
          }),
          ...(args.worshipStyle && {
            profile: {
              worshipStyle: { contains: args.worshipStyle },
            },
          }),
        },
        // Simplified ranking algorithm: isVerified DESC, isComplete DESC, name ASC
        orderBy: [
          { isVerified: 'desc' },
          { isComplete: 'desc' },
          { name: 'asc' },
        ],
        skip: args.offset ?? undefined,
        take: args.limit ?? undefined,
      })
    },
  }),

  // Get single church by slug
  church: t.prismaField({
    type: 'Church',
    nullable: true,
    args: {
      slug: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.church.findUnique({
        ...query,
        where: { slug: args.slug },
      })
    },
  }),

  // Alternative: Get single church by ID
  churchById: t.prismaField({
    type: 'Church',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.church.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))

// ============================================
// MUTATIONS
// ============================================

builder.mutationFields((t) => ({
  createChurch: t.prismaField({
    type: 'Church',
    args: {
      input: t.arg({
        type: builder.inputType('CreateChurchInput', {
          fields: (t) => ({
            name: t.string({ required: true }),
          }),
        }),
        required: true,
      }),
    },
    resolve: async (query, _root, args, ctx) => {
      // 1. Authentication check
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // 2. Execute domain workflow (pure business logic)
      const churchResult = createChurch({
        name: args.input.name,
        adminUserId: ctx.userId,
      })

      // 3. Handle domain errors
      if (churchResult.isErr()) {
        throw mapDomainError(churchResult.error)
      }

      // 4. Persist via repository
      const factory = getRepositoryFactory(ctx.prisma)
      const churchRepo = factory.createChurchRepository()

      const savedResult = await churchRepo.save(churchResult.value)

      // 5. Handle infrastructure errors
      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // 6. Return Prisma Church (Pothos will handle GraphQL mapping)
      // We need to fetch the full church from Prisma because ChurchState
      // only contains state fields, not full Church data
      return ctx.prisma.church.findUniqueOrThrow({
        ...query,
        where: { id: savedResult.value.id.toString() },
      })
    },
  }),

  publishChurch: t.prismaField({
    type: 'Church',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { publishChurch, ChurchId, isDraft } = await import('@repo/domain')
      const { getRepositoryFactory } = await import('../factories/repositoryFactory')
      const { mapDomainError } = await import('../utils/errorMapper')

      // 1. Authentication & authorization check
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // For MVP, any authenticated user can publish their church
      // In production, check if user is church admin
      // if (ctx.session.user.role !== 'CHURCH_ADMIN') {
      //   throw new Error('Only church admins can publish churches')
      // }

      // 2. Validate and create ChurchId value object
      const churchIdResult = ChurchId.create(args.id)
      if (churchIdResult.isErr()) {
        throw mapDomainError(churchIdResult.error)
      }

      // 3. Load church from repository
      const factory = getRepositoryFactory(ctx.prisma)
      const churchRepo = factory.createChurchRepository()

      const churchResult = await churchRepo.findById(churchIdResult.value)
      if (churchResult.isErr()) {
        throw mapDomainError(churchResult.error)
      }

      if (!churchResult.value) {
        throw new Error('Church not found')
      }

      // 4. Check church is in Draft state
      if (!isDraft(churchResult.value)) {
        throw new Error('Church is already published')
      }

      // 5. Execute domain workflow
      const publishedResult = publishChurch(churchResult.value)
      if (publishedResult.isErr()) {
        throw mapDomainError(publishedResult.error)
      }

      // 6. Persist changes
      const savedResult = await churchRepo.save(publishedResult.value)
      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // 7. Return full Prisma Church
      return ctx.prisma.church.findUniqueOrThrow({
        ...query,
        where: { id: savedResult.value.id.toString() },
      })
    },
  }),
}))
