import { builder } from '../builder'
import {
  createDonation,
  completeDonation,
  failDonation,
  refundDonation,
  DonationId,
} from '@repo/domain'
import { getRepositoryFactory } from '../factories/repositoryFactory'
import { mapDomainError } from '../utils/errorMapper'

// DonationStatus enum
const DonationStatus = builder.enumType('DonationStatus', {
  values: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const,
})

// Donation type (uses Prisma model)
builder.prismaObject('PlatformDonation', {
  fields: (t) => ({
    id: t.exposeID('id'),
    amount: t.exposeInt('amount'),
    currency: t.exposeString('currency'),
    status: t.expose('status', { type: DonationStatus }),
    stripePaymentId: t.exposeString('stripePaymentId'),

    // Relations
    donor: t.relation('donor', { nullable: true }),
    church: t.relation('church', { nullable: true }),

    // Metadata - expose as JSON
    metadata: t.expose('metadata', { type: 'Json', nullable: true }),

    // Meta
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// Input types
const CreateDonationInput = builder.inputType('CreateDonationInput', {
  fields: (t) => ({
    amount: t.int({ required: true }),
    stripePaymentIntentId: t.string({ required: false }),
    metadata: t.field({ type: 'Json', required: false }),
  }),
})

const CompleteDonationInput = builder.inputType('CompleteDonationInput', {
  fields: (t) => ({
    donationId: t.string({ required: true }),
  }),
})

const FailDonationInput = builder.inputType('FailDonationInput', {
  fields: (t) => ({
    donationId: t.string({ required: true }),
    failureReason: t.string({ required: true }),
  }),
})

const RefundDonationInput = builder.inputType('RefundDonationInput', {
  fields: (t) => ({
    donationId: t.string({ required: true }),
    stripeRefundId: t.string({ required: true }),
    refundReason: t.string({ required: false }),
  }),
})

// Queries
builder.queryFields((t) => ({
  donation: t.prismaField({
    type: 'PlatformDonation',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.platformDonation.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),

  myDonations: t.prismaField({
    type: ['PlatformDonation'],
    resolve: async (query, _root, _args, ctx) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      return ctx.prisma.platformDonation.findMany({
        ...query,
        where: { donorId: ctx.userId },
        orderBy: { createdAt: 'desc' },
      })
    },
  }),
}))

// Mutations
builder.mutationFields((t) => ({
  /**
   * Create a new donation
   * Creates a pending donation that will be completed via Stripe webhook
   */
  createDonation: t.prismaField({
    type: 'PlatformDonation',
    args: {
      input: t.arg({ type: CreateDonationInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) throw new Error('Not authenticated')

      // Create donation in domain
      const donationResult = createDonation({
        userId: ctx.userId,
        amount: args.input.amount,
        stripePaymentIntentId: args.input.stripePaymentIntentId ?? undefined,
        metadata: args.input.metadata as Record<string, string> | undefined,
      })

      if (donationResult.isErr()) throw mapDomainError(donationResult.error)

      // Save to repository
      const factory = getRepositoryFactory(ctx.prisma)
      const donationRepo = factory.createDonationRepository()
      const savedResult = await donationRepo.save(donationResult.value)

      if (savedResult.isErr()) throw mapDomainError(savedResult.error)

      // Return saved donation from Prisma
      return ctx.prisma.platformDonation.findUniqueOrThrow({
        ...query,
        where: { id: String(savedResult.value.id) },
      })
    },
  }),

  /**
   * Complete a pending donation
   * Called by Stripe webhook when payment succeeds
   */
  completeDonation: t.prismaField({
    type: 'PlatformDonation',
    args: {
      input: t.arg({ type: CompleteDonationInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Validate donation ID
      const donationIdResult = DonationId.create(args.input.donationId)
      if (donationIdResult.isErr()) throw mapDomainError(donationIdResult.error)

      // Fetch existing donation
      const factory = getRepositoryFactory(ctx.prisma)
      const donationRepo = factory.createDonationRepository()
      const existingResult = await donationRepo.findById(donationIdResult.value)

      if (existingResult.isErr()) throw mapDomainError(existingResult.error)

      const donation = existingResult.value
      if (!donation) throw new Error('Donation not found')

      // Complete the donation
      const completedResult = completeDonation(donation)
      if (completedResult.isErr()) throw mapDomainError(completedResult.error)

      // Save updated donation
      const savedResult = await donationRepo.save(completedResult.value)
      if (savedResult.isErr()) throw mapDomainError(savedResult.error)

      // Return saved donation from Prisma
      return ctx.prisma.platformDonation.findUniqueOrThrow({
        ...query,
        where: { id: args.input.donationId },
      })
    },
  }),

  /**
   * Mark a pending donation as failed
   * Called by Stripe webhook when payment fails
   */
  failDonation: t.prismaField({
    type: 'PlatformDonation',
    args: {
      input: t.arg({ type: FailDonationInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Validate donation ID
      const donationIdResult = DonationId.create(args.input.donationId)
      if (donationIdResult.isErr()) throw mapDomainError(donationIdResult.error)

      // Fetch existing donation
      const factory = getRepositoryFactory(ctx.prisma)
      const donationRepo = factory.createDonationRepository()
      const existingResult = await donationRepo.findById(donationIdResult.value)

      if (existingResult.isErr()) throw mapDomainError(existingResult.error)

      const donation = existingResult.value
      if (!donation) throw new Error('Donation not found')

      // Fail the donation
      const failedResult = failDonation(donation, {
        failureReason: args.input.failureReason,
      })
      if (failedResult.isErr()) throw mapDomainError(failedResult.error)

      // Save updated donation
      const savedResult = await donationRepo.save(failedResult.value)
      if (savedResult.isErr()) throw mapDomainError(savedResult.error)

      // Return saved donation from Prisma
      return ctx.prisma.platformDonation.findUniqueOrThrow({
        ...query,
        where: { id: args.input.donationId },
      })
    },
  }),

  /**
   * Refund a completed donation
   * Called after Stripe refund is processed
   */
  refundDonation: t.prismaField({
    type: 'PlatformDonation',
    args: {
      input: t.arg({ type: RefundDonationInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Validate donation ID
      const donationIdResult = DonationId.create(args.input.donationId)
      if (donationIdResult.isErr()) throw mapDomainError(donationIdResult.error)

      // Fetch existing donation
      const factory = getRepositoryFactory(ctx.prisma)
      const donationRepo = factory.createDonationRepository()
      const existingResult = await donationRepo.findById(donationIdResult.value)

      if (existingResult.isErr()) throw mapDomainError(existingResult.error)

      const donation = existingResult.value
      if (!donation) throw new Error('Donation not found')

      // Refund the donation
      const refundedResult = refundDonation(donation, {
        stripeRefundId: args.input.stripeRefundId,
        refundReason: args.input.refundReason ?? undefined,
      })
      if (refundedResult.isErr()) throw mapDomainError(refundedResult.error)

      // Save updated donation
      const savedResult = await donationRepo.save(refundedResult.value)
      if (savedResult.isErr()) throw mapDomainError(savedResult.error)

      // Return saved donation from Prisma
      return ctx.prisma.platformDonation.findUniqueOrThrow({
        ...query,
        where: { id: args.input.donationId },
      })
    },
  }),
}))
