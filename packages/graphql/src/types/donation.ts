import { builder } from '../builder'

// Enums
const DonationType = builder.enumType('DonationType', {
  values: ['ONE_TIME', 'MONTHLY'] as const,
})

const DonationStatus = builder.enumType('DonationStatus', {
  values: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const,
})

const SubscriptionStatus = builder.enumType('SubscriptionStatus', {
  values: ['ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID'] as const,
})

// PlatformDonation Type
builder.prismaObject('PlatformDonation', {
  fields: (t) => ({
    id: t.exposeID('id'),
    donor: t.relation('donor', { nullable: true }),
    church: t.relation('church', { nullable: true }),
    stripePaymentId: t.exposeString('stripePaymentId'),
    amount: t.exposeInt('amount'),
    currency: t.exposeString('currency'),
    type: t.expose('type', { type: DonationType }),
    status: t.expose('status', { type: DonationStatus }),
    subscription: t.relation('subscription', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// PlatformDonationSubscription Type
builder.prismaObject('PlatformDonationSubscription', {
  fields: (t) => ({
    id: t.exposeID('id'),
    donor: t.relation('donor', { nullable: true }),
    stripeSubscriptionId: t.exposeString('stripeSubscriptionId'),
    amount: t.exposeInt('amount'),
    status: t.expose('status', { type: SubscriptionStatus }),
    currentPeriodStart: t.expose('currentPeriodStart', { type: 'DateTime' }),
    currentPeriodEnd: t.expose('currentPeriodEnd', { type: 'DateTime' }),
    cancelAtPeriodEnd: t.exposeBoolean('cancelAtPeriodEnd'),
    donations: t.relation('donations'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// Input types for creating donations
const CreateDonationInput = builder.inputType('CreateDonationInput', {
  fields: (t) => ({
    amount: t.int({ required: true }),
    type: t.field({ type: DonationType, required: true }),
    churchId: t.string(),
  }),
})

const CancelSubscriptionInput = builder.inputType('CancelSubscriptionInput', {
  fields: (t) => ({
    subscriptionId: t.string({ required: true }),
  }),
})

// Queries
builder.queryFields((t) => ({
  // Get donations for the current user
  myDonations: t.prismaField({
    type: ['PlatformDonation'],
    authScopes: {
      user: true,
    },
    resolve: async (query, _root, _args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      return ctx.prisma.platformDonation.findMany({
        ...query,
        where: {
          donorId: ctx.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    },
  }),

  // Get subscriptions for the current user
  mySubscriptions: t.prismaField({
    type: ['PlatformDonationSubscription'],
    authScopes: {
      user: true,
    },
    resolve: async (query, _root, _args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      return ctx.prisma.platformDonationSubscription.findMany({
        ...query,
        where: {
          donorId: ctx.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    },
  }),

  // Get a specific donation
  donation: t.prismaField({
    type: 'PlatformDonation',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    authScopes: {
      user: true,
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      return ctx.prisma.platformDonation.findFirst({
        ...query,
        where: {
          id: args.id,
          donorId: ctx.userId,
        },
      })
    },
  }),
}))

// Mutations
builder.mutationFields((t) => ({
  // Create a Stripe Checkout session for donation
  // Note: The actual Stripe Checkout session creation happens in the API route
  // This mutation is for recording the donation intent in the database
  createDonation: t.prismaField({
    type: 'PlatformDonation',
    args: {
      input: t.arg({ type: CreateDonationInput, required: true }),
    },
    authScopes: {
      user: true,
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Validate amount (minimum ¥100)
      if (args.input.amount < 100) {
        throw new Error('Minimum donation amount is ¥100')
      }

      // Create the donation record
      // Note: This will be in PENDING status until the webhook confirms payment
      return ctx.prisma.platformDonation.create({
        ...query,
        data: {
          donorId: ctx.userId,
          churchId: args.input.churchId || null,
          amount: args.input.amount,
          currency: 'jpy',
          type: args.input.type,
          status: 'PENDING',
          stripePaymentId: 'pending', // Will be updated by webhook
        },
      })
    },
  }),

  // Cancel a subscription
  cancelSubscription: t.prismaField({
    type: 'PlatformDonationSubscription',
    args: {
      input: t.arg({ type: CancelSubscriptionInput, required: true }),
    },
    authScopes: {
      user: true,
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Verify the subscription belongs to the user
      const subscription = await ctx.prisma.platformDonationSubscription.findFirst({
        where: {
          id: args.input.subscriptionId,
          donorId: ctx.userId,
        },
      })

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      // Update the subscription to cancel at period end
      return ctx.prisma.platformDonationSubscription.update({
        ...query,
        where: {
          id: args.input.subscriptionId,
        },
        data: {
          cancelAtPeriodEnd: true,
          status: 'CANCELED',
        },
      })
    },
  }),
}))
