import { builder } from '../builder'

// ReviewStatus enum
const ReviewStatus = builder.enumType('ReviewStatus', {
  values: ['PENDING', 'APPROVED', 'REJECTED'] as const,
})

builder.prismaObject('Review', {
  fields: (t) => ({
    id: t.exposeID('id'),
    content: t.exposeString('content'),
    visitDate: t.expose('visitDate', { type: 'DateTime', nullable: true }),
    experienceType: t.exposeString('experienceType', { nullable: true }),
    status: t.expose('status', { type: ReviewStatus }),
    response: t.relation('response', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

builder.prismaObject('ReviewResponse', {
  fields: (t) => ({
    id: t.exposeID('id'),
    content: t.exposeString('content'),
    respondedBy: t.exposeString('respondedBy'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

builder.queryFields((t) => ({
  churchReviews: t.prismaField({
    type: ['Review'],
    args: {
      churchId: t.arg.string({ required: true }),
      status: t.arg({ type: ReviewStatus, required: false }),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.review.findMany({
        ...query,
        where: {
          churchId: args.churchId,
          ...(args.status && { status: args.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: args.limit ?? undefined,
      })
    },
  }),
}))
