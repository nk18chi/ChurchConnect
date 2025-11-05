import { builder } from '../builder'
import {
  submitReview,
  moderateReview,
  respondToReview as respondToReviewWorkflow,
  isPending,
  isApproved,
  isRejected,
  ReviewId,
} from '@repo/domain'
import { getRepositoryFactory } from '../factories/repositoryFactory'
import { mapDomainError } from '../utils/errorMapper'
import {
  sendReviewNotification,
  sendReviewSubmittedEmail,
  sendReviewApprovedEmail,
} from '@repo/email'

// ReviewStatus enum
const ReviewStatus = builder.enumType('ReviewStatus', {
  values: ['PENDING', 'APPROVED', 'REJECTED'] as const,
})

builder.prismaObject('Review', {
  fields: (t) => ({
    id: t.exposeID('id'),
    content: t.exposeString('content'),
    visitDate: t.expose('visitDate', { type: 'DateTime', nullable: true }),
    experienceType: t.exposeString('experienceType', { nullable: true }),
    status: t.expose('status', { type: ReviewStatus }),

    // Relations
    church: t.relation('church'),
    user: t.relation('user'),
    response: t.relation('response', { nullable: true }),

    // Moderation fields
    moderatedAt: t.expose('moderatedAt', { type: 'DateTime', nullable: true }),
    moderatedBy: t.exposeString('moderatedBy', { nullable: true }),
    moderationNote: t.exposeString('moderationNote', { nullable: true }),

    // Meta
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

builder.prismaObject('ReviewResponse', {
  fields: (t) => ({
    id: t.exposeID('id'),
    content: t.exposeString('content'),
    respondedBy: t.exposeString('respondedBy'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// Input types
const SubmitReviewInput = builder.inputType('SubmitReviewInput', {
  fields: (t) => ({
    churchId: t.string({ required: true }),
    content: t.string({ required: true }),
    visitDate: t.field({ type: 'DateTime', required: false }),
    experienceType: t.string({ required: false }),
  }),
})

const ModerateReviewInput = builder.inputType('ModerateReviewInput', {
  fields: (t) => ({
    reviewId: t.string({ required: true }),
    decision: t.string({ required: true }), // 'APPROVED' | 'REJECTED'
    moderationNote: t.string({ required: false }),
  }),
})

const RespondToReviewInput = builder.inputType('RespondToReviewInput', {
  fields: (t) => ({
    reviewId: t.string({ required: true }),
    responseContent: t.string({ required: true }),
  }),
})

// Queries
builder.queryFields((t) => ({
  churchReviews: t.prismaField({
    type: ['Review'],
    args: {
      churchId: t.arg.string({ required: true }),
      status: t.arg({ type: ReviewStatus, required: false }),
      limit: t.arg.int({ defaultValue: 20 }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.review.findMany({
        ...query,
        where: {
          churchId: args.churchId,
          ...(args.status && { status: args.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: args.limit ?? undefined,
      })
    },
  }),

  review: t.prismaField({
    type: 'Review',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.review.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))

// Mutations
builder.mutationFields((t) => ({
  // Submit a new review (domain-driven)
  submitReview: t.prismaField({
    type: 'Review',
    args: {
      input: t.arg({ type: SubmitReviewInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Execute domain workflow
      const reviewResult = submitReview({
        churchId: args.input.churchId,
        userId: ctx.userId,
        content: args.input.content,
        visitDate: args.input.visitDate ?? undefined,
        experienceType: args.input.experienceType ?? undefined,
      })

      if (reviewResult.isErr()) {
        throw mapDomainError(reviewResult.error)
      }

      // Persist via repository
      const factory = getRepositoryFactory(ctx.prisma)
      const reviewRepo = factory.createReviewRepository()
      const savedResult = await reviewRepo.save(reviewResult.value)

      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // Get user and church information for email
      const [user, church] = await Promise.all([
        ctx.prisma.user.findUnique({
          where: { id: ctx.userId },
        }),
        ctx.prisma.church.findUnique({
          where: { id: args.input.churchId },
        }),
      ])

      // Send confirmation email to the reviewer (fire and forget)
      if (user?.email && user?.name && church) {
        sendReviewSubmittedEmail({
          to: user.email,
          reviewerName: user.name,
          churchName: church.name,
          reviewContent: args.input.content,
        }).catch((error) => {
          console.error('Failed to send review submitted email:', error)
        })
      }

      // Return full Prisma Review
      return ctx.prisma.review.findUniqueOrThrow({
        ...query,
        where: { id: String(savedResult.value.id) },
      })
    },
  }),

  // Moderate review (approve/reject) - domain-driven
  moderateReview: t.prismaField({
    type: 'Review',
    args: {
      input: t.arg({ type: ModerateReviewInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId || !ctx.userRole) {
        throw new Error('Not authenticated')
      }

      // Validate and create ReviewId
      const reviewIdResult = ReviewId.create(args.input.reviewId)
      if (reviewIdResult.isErr()) {
        throw mapDomainError(reviewIdResult.error)
      }

      // Fetch existing review
      const factory = getRepositoryFactory(ctx.prisma)
      const reviewRepo = factory.createReviewRepository()
      const existingResult = await reviewRepo.findById(reviewIdResult.value)

      if (existingResult.isErr()) {
        throw mapDomainError(existingResult.error)
      }

      const review = existingResult.value
      if (!review) {
        throw new Error('Review not found')
      }

      // Ensure review is pending
      if (!isPending(review)) {
        throw new Error('Review has already been moderated')
      }

      // Execute domain workflow
      const moderatedResult = moderateReview({
        review, // TypeScript now knows review is PendingReview
        decision: args.input.decision as 'APPROVED' | 'REJECTED',
        moderatedBy: ctx.userId,
        moderatorRole: ctx.userRole as 'ADMIN' | 'CHURCH_ADMIN' | 'USER',
        moderationNote: args.input.moderationNote ?? undefined,
      })

      if (moderatedResult.isErr()) {
        throw mapDomainError(moderatedResult.error)
      }

      // Persist
      const savedResult = await reviewRepo.save(moderatedResult.value)

      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // Get the review with all related data for emails
      const fullReview = await ctx.prisma.review.findUnique({
        where: { id: args.input.reviewId },
        include: {
          user: true,
          church: {
            include: {
              adminUser: true,
            },
          },
        },
      })

      // Send emails if review is approved
      if (args.input.decision === 'APPROVED' && fullReview) {
        const reviewUrl = `${process.env.NEXT_PUBLIC_WEB_URL || 'https://churchconnect.jp'}/churches/${fullReview.church.slug}`
        const portalReviewUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.churchconnect.jp'}/reviews/${fullReview.id}`

        // Send notification to church admin (fire and forget)
        if (fullReview.church.adminUser?.email && fullReview.church.adminUser?.name) {
          sendReviewNotification({
            to: fullReview.church.adminUser.email,
            churchName: fullReview.church.name,
            reviewerName: fullReview.user.name || 'Anonymous',
            reviewContent: fullReview.content,
            reviewDate: fullReview.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            reviewUrl: portalReviewUrl,
          }).catch((error) => {
            console.error('Failed to send review notification to church admin:', error)
          })
        }

        // Send approval notification to reviewer (fire and forget)
        if (fullReview.user.email && fullReview.user.name) {
          sendReviewApprovedEmail({
            to: fullReview.user.email,
            reviewerName: fullReview.user.name,
            churchName: fullReview.church.name,
            reviewContent: fullReview.content,
            reviewUrl,
          }).catch((error) => {
            console.error('Failed to send review approval email to reviewer:', error)
          })
        }
      }

      // Return full Prisma Review
      return ctx.prisma.review.findUniqueOrThrow({
        ...query,
        where: { id: String(savedResult.value.id) },
      })
    },
  }),

  // Church admin responds to a review - domain-driven
  respondToReview: t.prismaField({
    type: 'Review',
    args: {
      input: t.arg({ type: RespondToReviewInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId || !ctx.userRole) {
        throw new Error('Not authenticated')
      }

      // Validate and create ReviewId
      const reviewIdResult = ReviewId.create(args.input.reviewId)
      if (reviewIdResult.isErr()) {
        throw mapDomainError(reviewIdResult.error)
      }

      // Fetch existing review
      const factory = getRepositoryFactory(ctx.prisma)
      const reviewRepo = factory.createReviewRepository()
      const existingResult = await reviewRepo.findById(reviewIdResult.value)

      if (existingResult.isErr()) {
        throw mapDomainError(existingResult.error)
      }

      const review = existingResult.value
      if (!review) {
        throw new Error('Review not found')
      }

      // Ensure review is approved or rejected (can receive response)
      if (!isApproved(review) && !isRejected(review)) {
        throw new Error('Can only respond to approved or rejected reviews')
      }

      // Check authorization (only ADMIN and CHURCH_ADMIN can respond)
      if (ctx.userRole !== 'ADMIN' && ctx.userRole !== 'CHURCH_ADMIN') {
        throw new Error('Only administrators and church administrators can respond to reviews')
      }

      // Execute domain workflow
      const respondedResult = respondToReviewWorkflow({
        review, // TypeScript now knows review is ApprovedReview | RejectedReview
        responseContent: args.input.responseContent,
        respondedBy: ctx.userId,
      })

      if (respondedResult.isErr()) {
        throw mapDomainError(respondedResult.error)
      }

      // Persist
      const savedResult = await reviewRepo.save(respondedResult.value)

      if (savedResult.isErr()) {
        throw mapDomainError(savedResult.error)
      }

      // Return full Prisma Review (with response relation)
      return ctx.prisma.review.findUniqueOrThrow({
        ...query,
        where: { id: String(savedResult.value.id) },
        include: { response: true },
      })
    },
  }),
}))
