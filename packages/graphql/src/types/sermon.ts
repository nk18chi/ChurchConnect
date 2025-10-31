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
}))
