import { PrismaClient } from '@prisma/client'
import {
  AsyncResult,
  IReviewRepository,
  ReviewState,
  ReviewId,
  ChurchId,
  DomainError,
  NotFoundError,
  InfrastructureError
} from '@repo/domain'
import { ResultAsync } from 'neverthrow'
import { ReviewMapper } from './mappers/ReviewMapper'

/**
 * Prisma implementation of IReviewRepository
 *
 * Handles persistence of ReviewState to PostgreSQL database
 * using Prisma ORM and ReviewMapper for translation
 */
export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find review by ID
   * Includes response relation for RespondedReview state
   */
  findById(id: ReviewId): AsyncResult<ReviewState | null, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.review.findUnique({
        where: { id: id.toString() },
        include: { response: true },
      }),
      (error) => new InfrastructureError(
        `Database error finding review: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((review) => {
      if (!review) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = ReviewMapper.toDomain(review)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Find all reviews for a specific church
   * Includes response relation for RespondedReview states
   */
  findByChurchId(churchId: ChurchId): AsyncResult<ReviewState[], DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.review.findMany({
        where: { churchId: churchId.toString() },
        include: { response: true },
        orderBy: { createdAt: 'desc' },
      }),
      (error) => new InfrastructureError(
        `Database error finding reviews by church: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((reviews) => {
      const domainResults = reviews.map((review) => ReviewMapper.toDomain(review))

      // Check if any mapping failed
      const firstError = domainResults.find((result) => result.isErr())
      if (firstError && firstError.isErr()) {
        return ResultAsync.fromSafePromise(
          Promise.reject(firstError.error)
        ).mapErr((error) => error as DomainError)
      }

      // Extract all successful values
      const domainReviews = domainResults
        .filter((result) => result.isOk())
        .map((result) => result.isOk() ? result.value : null)
        .filter((review): review is ReviewState => review !== null)

      return ResultAsync.fromSafePromise(Promise.resolve(domainReviews))
    })
  }

  /**
   * Save review (create or update)
   *
   * For RespondedReview state, also handles the ReviewResponse relation
   */
  save(review: ReviewState): AsyncResult<ReviewState, DomainError> {
    const prismaData = ReviewMapper.toPrisma(review)

    // For RespondedReview, we need to handle the response separately
    if (review.tag === 'Responded') {
      return ResultAsync.fromPromise(
        this.prisma.$transaction(async (tx) => {
          // Upsert the review
          const savedReview = await tx.review.upsert({
            where: { id: review.id.toString() },
            create: {
              ...prismaData,
            },
            update: {
              ...prismaData,
            },
          })

          // Upsert the response
          await tx.reviewResponse.upsert({
            where: { reviewId: review.id.toString() },
            create: {
              reviewId: review.id.toString(),
              content: review.responseContent,
              respondedBy: review.respondedBy,
              createdAt: review.respondedAt,
            },
            update: {
              content: review.responseContent,
              respondedBy: review.respondedBy,
              createdAt: review.respondedAt,
            },
          })

          // Fetch with response for mapping back
          return await tx.review.findUnique({
            where: { id: review.id.toString() },
            include: { response: true },
          })
        }),
        (error) => new InfrastructureError(
          `Database error saving review with response: ${(error as Error).message}`,
          error as Error
        )
      ).andThen((saved) => {
        if (!saved) {
          return ResultAsync.fromSafePromise(
            Promise.reject(new InfrastructureError('Failed to save review', new Error('No review returned')))
          ).mapErr((error) => error as DomainError)
        }

        const domainResult = ReviewMapper.toDomain(saved)
        return ResultAsync.fromSafePromise(
          domainResult.isOk()
            ? Promise.resolve(domainResult.value)
            : Promise.reject(domainResult.error)
        ).mapErr((error) => error as DomainError)
      })
    }

    // For other states, simple upsert
    return ResultAsync.fromPromise(
      this.prisma.review.upsert({
        where: { id: review.id.toString() },
        create: {
          ...prismaData,
        },
        update: {
          ...prismaData,
        },
        include: { response: true },
      }),
      (error) => new InfrastructureError(
        `Database error saving review: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((saved) => {
      const domainResult = ReviewMapper.toDomain(saved)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Delete review
   * Cascade will automatically delete the response if it exists
   */
  delete(id: ReviewId): AsyncResult<void, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.review.delete({
        where: { id: id.toString() },
      }),
      (error) => {
        // Check if it's a "record not found" error
        if ((error as any).code === 'P2025') {
          return new NotFoundError('Review', id.toString())
        }
        return new InfrastructureError(
          `Database error deleting review: ${(error as Error).message}`,
          error as Error
        )
      }
    ).map(() => undefined)
  }
}
