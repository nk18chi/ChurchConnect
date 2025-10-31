import { builder } from '../builder'

builder.prismaObject('Denomination', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    category: t.exposeString('category'),
  }),
})

builder.queryFields((t) => ({
  denominations: t.prismaField({
    type: ['Denomination'],
    resolve: async (query, _root, _args, ctx) => {
      return ctx.prisma.denomination.findMany({
        ...query,
        orderBy: { name: 'asc' },
      })
    },
  }),
  denomination: t.prismaField({
    type: 'Denomination',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.denomination.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
