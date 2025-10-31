import { builder } from '../builder'

builder.prismaObject('Language', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    code: t.exposeString('code'),
  }),
})

builder.queryFields((t) => ({
  languages: t.prismaField({
    type: ['Language'],
    resolve: async (query, _root, _args, ctx) => {
      return ctx.prisma.language.findMany({
        ...query,
        orderBy: { name: 'asc' },
      })
    },
  }),
  language: t.prismaField({
    type: 'Language',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.language.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
