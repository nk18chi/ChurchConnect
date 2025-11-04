import { builder } from '../builder'
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
    response: t.relation('response', { nullable: true }),
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
const CreateReviewInput = builder.inputType('CreateReviewInput', {
  fields: (t) => ({
    churchId: t.string({ required: true }),
    content: t.string({ required: true }),
    visitDate: t.field({ type: 'DateTime', required: false }),
    experienceType: t.string({ required: false }),
  }),
})

const UpdateReviewStatusInput = builder.inputType('UpdateReviewStatusInput', {
  fields: (t) => ({
    reviewId: t.string({ required: true }),
    status: t.field({ type: ReviewStatus, required: true }),
    moderationNote: t.string({ required: false }),
  }),
})

const RespondToReviewInput = builder.inputType('RespondToReviewInput', {
  fields: (t) => ({
    reviewId: t.string({ required: true }),
    content: t.string({ required: true }),
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
  // Create a new review
  createReview: t.prismaField({
    type: 'Review',
    args: {
      input: t.arg({ type: CreateReviewInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Get user and church information
      const [user, church] = await Promise.all([
        ctx.prisma.user.findUnique({
          where: { id: ctx.userId },
        }),
        ctx.prisma.church.findUnique({
          where: { id: args.input.churchId },
        }),
      ])

      if (!user) {
        throw new Error('User not found')
      }

      if (!church) {
        throw new Error('Church not found')
      }

      // Create the review
      const review = await ctx.prisma.review.create({
        ...query,
        data: {
          userId: ctx.userId,
          churchId: args.input.churchId,
          content: args.input.content,
          visitDate: args.input.visitDate || null,
          experienceType: args.input.experienceType || null,
          status: 'PENDING',
        },
      })

      // Send confirmation email to the reviewer (fire and forget)
      if (user.email && user.name) {
        sendReviewSubmittedEmail({
          to: user.email,
          reviewerName: user.name,
          churchName: church.name,
          reviewContent: review.content,
        }).catch((error) => {
          console.error('Failed to send review submitted email:', error)
        })
      }

      return review
    },
  }),

  // Update review status (approve/reject)
  updateReviewStatus: t.prismaField({
    type: 'Review',
    args: {
      input: t.arg({ type: UpdateReviewStatusInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Check if user is admin
      if (ctx.userRole !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
      }

      // Get the review with all related data
      const review = await ctx.prisma.review.findUnique({
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

      if (!review) {
        throw new Error('Review not found')
      }

      // Update the review status
      const updatedReview = await ctx.prisma.review.update({
        ...query,
        where: { id: args.input.reviewId },
        data: {
          status: args.input.status,
          moderatedAt: new Date(),
          moderatedBy: ctx.userId,
          moderationNote: args.input.moderationNote || null,
        },
      })

      // Send emails if review is approved
      if (args.input.status === 'APPROVED') {
        const reviewUrl = `${process.env.NEXT_PUBLIC_WEB_URL || 'https://churchconnect.jp'}/churches/${review.church.slug}`
        const portalReviewUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.churchconnect.jp'}/reviews/${review.id}`

        // Send notification to church admin (fire and forget)
        if (review.church.adminUser?.email && review.church.adminUser?.name) {
          sendReviewNotification({
            to: review.church.adminUser.email,
            churchName: review.church.name,
            reviewerName: review.user.name || 'Anonymous',
            reviewContent: review.content,
            reviewDate: review.createdAt.toLocaleDateString('en-US', {
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
        if (review.user.email && review.user.name) {
          sendReviewApprovedEmail({
            to: review.user.email,
            reviewerName: review.user.name,
            churchName: review.church.name,
            reviewContent: review.content,
            reviewUrl,
          }).catch((error) => {
            console.error('Failed to send review approval email to reviewer:', error)
          })
        }
      }

      return updatedReview
    },
  }),

  // Church admin responds to a review
  respondToReview: t.prismaField({
    type: 'ReviewResponse',
    args: {
      input: t.arg({ type: RespondToReviewInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Check user is CHURCH_ADMIN
      if (ctx.userRole !== 'CHURCH_ADMIN') {
        throw new Error('Unauthorized: Church admin access required')
      }

      // Get church for this admin
      const church = await ctx.prisma.church.findUnique({
        where: { adminUserId: ctx.userId },
        select: { id: true },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      // Verify review belongs to this church and is approved
      const review = await ctx.prisma.review.findUnique({
        where: { id: args.input.reviewId },
        select: { churchId: true, status: true, response: true },
      })

      if (!review) {
        throw new Error('Review not found')
      }

      if (review.churchId !== church.id) {
        throw new Error('Review does not belong to your church')
      }

      if (review.status !== 'APPROVED') {
        throw new Error('Can only respond to approved reviews')
      }

      if (review.response) {
        throw new Error('Review already has a response. Use update instead.')
      }

      // Get user info for respondedBy field
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true, email: true },
      })

      // Create the response
      const response = await ctx.prisma.reviewResponse.create({
        ...query,
        data: {
          reviewId: args.input.reviewId,
          content: args.input.content,
          respondedBy: user?.name || user?.email || 'Church Admin',
        },
      })

      return response
    },
  }),

  // Church admin deletes their response to a review
  deleteReviewResponse: t.prismaField({
    type: 'ReviewResponse',
    args: {
      reviewId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check authentication
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      // Check user is CHURCH_ADMIN
      if (ctx.userRole !== 'CHURCH_ADMIN') {
        throw new Error('Unauthorized: Church admin access required')
      }

      // Get church for this admin
      const church = await ctx.prisma.church.findUnique({
        where: { adminUserId: ctx.userId },
        select: { id: true },
      })

      if (!church) {
        throw new Error('No church found for this user')
      }

      // Verify review belongs to this church
      const review = await ctx.prisma.review.findUnique({
        where: { id: args.reviewId },
        select: { churchId: true, response: { select: { id: true } } },
      })

      if (!review) {
        throw new Error('Review not found')
      }

      if (review.churchId !== church.id) {
        throw new Error('Review does not belong to your church')
      }

      if (!review.response) {
        throw new Error('Review does not have a response')
      }

      // Delete the response
      return ctx.prisma.reviewResponse.delete({
        ...query,
        where: { id: review.response.id },
      })
    },
  }),
}))
