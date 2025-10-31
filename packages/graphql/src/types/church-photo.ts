import { builder } from '../builder'

builder.prismaObject('ChurchPhoto', {
  fields: (t) => ({
    id: t.exposeID('id'),
    url: t.exposeString('url'),
    caption: t.exposeString('caption', { nullable: true }),
    category: t.exposeString('category'),
    order: t.exposeInt('order'),
    uploadedBy: t.exposeString('uploadedBy'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})
