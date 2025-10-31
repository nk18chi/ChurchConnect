import { builder } from '../builder'

builder.prismaObject('ServiceTime', {
  fields: (t) => ({
    id: t.exposeID('id'),
    dayOfWeek: t.exposeInt('dayOfWeek'),
    startTime: t.exposeString('startTime'),
    endTime: t.exposeString('endTime', { nullable: true }),
    language: t.relation('language'),
    serviceType: t.exposeString('serviceType', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})
