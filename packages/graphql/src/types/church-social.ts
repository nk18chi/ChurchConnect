import { builder } from '../builder'

builder.prismaObject('ChurchSocial', {
  fields: (t) => ({
    id: t.exposeID('id'),
    youtubeUrl: t.exposeString('youtubeUrl', { nullable: true }),
    podcastUrl: t.exposeString('podcastUrl', { nullable: true }),
    instagramUrl: t.exposeString('instagramUrl', { nullable: true }),
    twitterUrl: t.exposeString('twitterUrl', { nullable: true }),
    facebookUrl: t.exposeString('facebookUrl', { nullable: true }),
    spotifyUrl: t.exposeString('spotifyUrl', { nullable: true }),
    lineUrl: t.exposeString('lineUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})
