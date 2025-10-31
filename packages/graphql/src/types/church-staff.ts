import { builder } from '../builder'

builder.prismaObject('ChurchStaff', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    title: t.exposeString('title', { nullable: true }),
    role: t.exposeString('role', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    photoUrl: t.exposeString('photoUrl', { nullable: true }),
    credentials: t.exposeString('credentials', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    order: t.exposeInt('order'),
    twitterUrl: t.exposeString('twitterUrl', { nullable: true }),
    instagramUrl: t.exposeString('instagramUrl', { nullable: true }),
    blogUrl: t.exposeString('blogUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})
