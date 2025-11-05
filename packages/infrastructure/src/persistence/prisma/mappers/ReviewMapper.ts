import { Review as PrismaReview, ReviewResponse as PrismaReviewResponse, ReviewStatus } from '@prisma/client'
import { Result, ok, err } from '@repo/domain'
import {
  ReviewState,
  PendingReview,
  ApprovedReview,
  RejectedReview,
  RespondedReview,
  ReviewId,
  ReviewContent,
  ChurchId,
  ValidationError
} from '@repo/domain'

/**
 * Type for Prisma Review with optional ReviewResponse relation
 */
type PrismaReviewWithResponse = PrismaReview & {
  response?: PrismaReviewResponse | null
}

/**
 * Maps between Prisma Review model and Domain ReviewState
 */
export class ReviewMapper {
  /**
   * Convert Prisma Review to Domain ReviewState
   *
   * Determines state based on:
   * - Responded: response relation exists
   * - Approved: status is APPROVED and no response
   * - Rejected: status is REJECTED and no response
   * - Pending: status is PENDING
   */
  static toDomain(prisma: PrismaReviewWithResponse): Result<ReviewState, ValidationError> {
    // Validate value objects
    const idResult = ReviewId.create(prisma.id)
    const contentResult = ReviewContent.create(prisma.content)
    const churchIdResult = ChurchId.create(prisma.churchId)

    // Combine Results using railway-oriented programming
    if (idResult.isErr()) return err(idResult.error)
    if (contentResult.isErr()) return err(contentResult.error)
    if (churchIdResult.isErr()) return err(churchIdResult.error)

    const id = idResult.value
    const content = contentResult.value
    const churchId = churchIdResult.value

    // Base fields common to all states
    const baseFields = {
      id,
      churchId,
      userId: prisma.userId,
      content,
      visitDate: prisma.visitDate ?? undefined,
      experienceType: prisma.experienceType ?? undefined,
      createdAt: prisma.createdAt,
    }

    // Check if review has a response - this makes it RespondedReview
    if (prisma.response) {
      if (!prisma.moderatedAt || !prisma.moderatedBy) {
        return err(new ValidationError('Responded review must have moderation data'))
      }

      // Determine base state from Prisma status
      const baseState = prisma.status === 'APPROVED' ? 'Approved' : 'Rejected'

      return ok({
        tag: 'Responded' as const,
        baseState,
        ...baseFields,
        moderatedAt: prisma.moderatedAt,
        moderatedBy: prisma.moderatedBy,
        moderationNote: prisma.moderationNote ?? undefined,
        responseContent: prisma.response.content,
        respondedAt: prisma.response.createdAt,
        respondedBy: prisma.response.respondedBy,
      } as RespondedReview)
    }

    // Determine state based on status field
    switch (prisma.status) {
      case 'PENDING':
        return ok({
          tag: 'Pending' as const,
          ...baseFields,
        } as PendingReview)

      case 'APPROVED':
        if (!prisma.moderatedAt || !prisma.moderatedBy) {
          return err(new ValidationError('Approved review must have moderatedAt and moderatedBy'))
        }
        return ok({
          tag: 'Approved' as const,
          ...baseFields,
          approvedAt: prisma.moderatedAt,
          approvedBy: prisma.moderatedBy,
          moderationNote: prisma.moderationNote ?? undefined,
        } as ApprovedReview)

      case 'REJECTED':
        if (!prisma.moderatedAt || !prisma.moderatedBy) {
          return err(new ValidationError('Rejected review must have moderatedAt and moderatedBy'))
        }
        return ok({
          tag: 'Rejected' as const,
          ...baseFields,
          rejectedAt: prisma.moderatedAt,
          rejectedBy: prisma.moderatedBy,
          moderationNote: prisma.moderationNote ?? undefined,
        } as RejectedReview)

      default:
        return err(new ValidationError(`Unknown review status: ${prisma.status}`))
    }
  }

  /**
   * Convert Domain ReviewState to Prisma create/update data
   *
   * Returns partial object containing only state-related fields.
   * Caller should merge with other review data as needed.
   */
  static toPrisma(domain: ReviewState): {
    id: string
    churchId: string
    userId: string
    content: string
    visitDate: Date | null
    experienceType: string | null
    status: ReviewStatus
    moderatedAt: Date | null
    moderatedBy: string | null
    moderationNote: string | null
    createdAt: Date
  } {
    const base = {
      id: String(domain.id),
      churchId: String(domain.churchId),
      userId: domain.userId,
      content: String(domain.content),
      visitDate: domain.visitDate ?? null,
      experienceType: domain.experienceType ?? null,
      createdAt: domain.createdAt,
    }

    switch (domain.tag) {
      case 'Pending':
        return {
          ...base,
          status: 'PENDING' as ReviewStatus,
          moderatedAt: null,
          moderatedBy: null,
          moderationNote: null,
        }

      case 'Approved':
        return {
          ...base,
          status: 'APPROVED' as ReviewStatus,
          moderatedAt: domain.approvedAt,
          moderatedBy: domain.approvedBy,
          moderationNote: domain.moderationNote ?? null,
        }

      case 'Rejected':
        return {
          ...base,
          status: 'REJECTED' as ReviewStatus,
          moderatedAt: domain.rejectedAt,
          moderatedBy: domain.rejectedBy,
          moderationNote: domain.moderationNote ?? null,
        }

      case 'Responded':
        // Use base state to determine status
        return {
          ...base,
          status: domain.baseState === 'Approved' ? ('APPROVED' as ReviewStatus) : ('REJECTED' as ReviewStatus),
          moderatedAt: domain.moderatedAt,
          moderatedBy: domain.moderatedBy,
          moderationNote: domain.moderationNote ?? null,
        }
    }
  }
}
