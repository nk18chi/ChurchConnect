import { builder } from '../builder'

builder.prismaObject('ChurchProfile', {
  fields: (t) => ({
    id: t.exposeID('id'),
    whoWeAre: t.exposeString('whoWeAre', { nullable: true }),
    vision: t.exposeString('vision', { nullable: true }),
    statementOfFaith: t.exposeString('statementOfFaith', { nullable: true }),
    storyOfChurch: t.exposeString('storyOfChurch', { nullable: true }),
    kidChurchInfo: t.exposeString('kidChurchInfo', { nullable: true }),
    whatToExpect: t.exposeString('whatToExpect', { nullable: true }),
    dressCode: t.exposeString('dressCode', { nullable: true }),
    worshipStyle: t.exposeString('worshipStyle', { nullable: true }),
    accessibility: t.exposeStringList('accessibility'),
    howToGive: t.exposeString('howToGive', { nullable: true }),
    bankName: t.exposeString('bankName', { nullable: true }),
    bankAccountNumber: t.exposeString('bankAccountNumber', { nullable: true }),
    bankAccountName: t.exposeString('bankAccountName', { nullable: true }),
    externalDonationUrl: t.exposeString('externalDonationUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})
