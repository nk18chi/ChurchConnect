import { ReviewState, isPending, isApproved, isRejected, isResponded } from '@repo/domain'

/**
 * Maps domain ReviewState to GraphQL Review response
 *
 * Note: This returns a partial Review object with only state-related fields.
 * Full Review data (user, church relations) comes from Prisma queries.
 */
export function toGraphQLReview(review: ReviewState) {
  const base = {
    id: String(review.id),
    churchId: String(review.churchId),
    userId: review.userId,
    content: String(review.content),
    visitDate: review.visitDate ?? null,
    experienceType: review.experienceType ?? null,
    createdAt: review.createdAt,
  }

  if (isPending(review)) {
    return {
      ...base,
      status: 'PENDING' as const,
      moderatedAt: null,
      moderatedBy: null,
      moderationNote: null,
      response: null,
    }
  }

  if (isApproved(review)) {
    return {
      ...base,
      status: 'APPROVED' as const,
      moderatedAt: review.approvedAt,
      moderatedBy: review.approvedBy,
      moderationNote: review.moderationNote ?? null,
      response: null,
    }
  }

  if (isRejected(review)) {
    return {
      ...base,
      status: 'REJECTED' as const,
      moderatedAt: review.rejectedAt,
      moderatedBy: review.rejectedBy,
      moderationNote: review.moderationNote ?? null,
      response: null,
    }
  }

  if (isResponded(review)) {
    return {
      ...base,
      status: review.baseState === 'Approved' ? ('APPROVED' as const) : ('REJECTED' as const),
      moderatedAt: review.moderatedAt,
      moderatedBy: review.moderatedBy,
      moderationNote: review.moderationNote ?? null,
      response: {
        content: review.responseContent,
        respondedBy: review.respondedBy,
        createdAt: review.respondedAt,
      },
    }
  }

  // Exhaustive check - TypeScript will error if we miss a case
  const _exhaustiveCheck: never = review
  throw new Error(`Unhandled review state: ${(_exhaustiveCheck as ReviewState).tag}`)
}
