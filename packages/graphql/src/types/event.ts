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
}))
