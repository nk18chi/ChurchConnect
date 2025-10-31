import { builder } from '../builder'

builder.prismaObject('Prefecture', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    cities: t.relation('cities'),
    churches: t.relation('churches'),
  }),
})

builder.queryFields((t) => ({
  prefectures: t.prismaField({
    type: ['Prefecture'],
    resolve: async (query, _root, _args, ctx) => {
      return ctx.prisma.prefecture.findMany({
        ...query,
        orderBy: { name: 'asc' },
      })
    },
  }),
  prefecture: t.prismaField({
    type: 'Prefecture',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.prefecture.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
