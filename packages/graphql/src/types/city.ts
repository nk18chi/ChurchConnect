import { builder } from '../builder'

builder.prismaObject('City', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    prefecture: t.relation('prefecture'),
    churches: t.relation('churches'),
  }),
})

builder.queryFields((t) => ({
  cities: t.prismaField({
    type: ['City'],
    args: {
      prefectureId: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.city.findMany({
        ...query,
        where: args.prefectureId ? { prefectureId: args.prefectureId } : undefined,
        orderBy: { name: 'asc' },
      })
    },
  }),
  city: t.prismaField({
    type: 'City',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.city.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
