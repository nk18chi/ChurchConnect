import { builder } from '../builder'

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
