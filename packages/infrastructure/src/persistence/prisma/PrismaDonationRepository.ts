import { PrismaClient } from '@prisma/client'
import {
  AsyncResult,
  IDonationRepository,
  DonationState,
  DonationId,
  DomainError,
  NotFoundError,
  InfrastructureError,
} from '@repo/domain'
import { ResultAsync } from 'neverthrow'
import { DonationMapper } from './mappers/DonationMapper'

/**
 * Creates a Prisma-based Donation repository with functional composition
 *
 * @param prisma - Prisma client instance
 * @returns Repository functions for Donation aggregate
 */
export const createDonationRepository = (prisma: PrismaClient): IDonationRepository => {
  /**
   * Find donation by ID
   */
  const findById = (id: DonationId): AsyncResult<DonationState | null, DomainError> =>
    ResultAsync.fromPromise(
      prisma.platformDonation.findUnique({
        where: { id: String(id) },
      }),
      (error) => new InfrastructureError(`Database error finding donation: ${(error as Error).message}`, error as Error)
    ).andThen((donation) => {
      if (!donation) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = DonationMapper.toDomain(donation)
      return ResultAsync.fromSafePromise(
        domainResult.isOk() ? Promise.resolve(domainResult.value) : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })

  /**
   * Find donations by user ID
   */
  const findByUserId = (userId: string): AsyncResult<DonationState[], DomainError> =>
    ResultAsync.fromPromise(
      prisma.platformDonation.findMany({
        where: { donorId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      (error) =>
        new InfrastructureError(
          `Database error finding donations by user: ${(error as Error).message}`,
          error as Error
        )
    ).andThen((donations) => {
      const domainResults = donations.map((donation) => DonationMapper.toDomain(donation))

      // Check if any mapping failed
      const firstError = domainResults.find((result) => result.isErr())
      if (firstError && firstError.isErr()) {
        return ResultAsync.fromSafePromise(Promise.reject(firstError.error)).mapErr((error) => error as DomainError)
      }

      // Extract all successful values
      const domainDonations = domainResults
        .filter((result) => result.isOk())
        .map((result) => (result.isOk() ? result.value : null))
        .filter((donation): donation is DonationState => donation !== null)

      return ResultAsync.fromSafePromise(Promise.resolve(domainDonations))
    })

  /**
   * Find donation by Stripe payment intent ID
   */
  const findByStripePaymentIntentId = (paymentIntentId: string): AsyncResult<DonationState | null, DomainError> =>
    ResultAsync.fromPromise(
      prisma.platformDonation.findUnique({
        where: { stripePaymentId: paymentIntentId },
      }),
      (error) =>
        new InfrastructureError(
          `Database error finding donation by payment intent: ${(error as Error).message}`,
          error as Error
        )
    ).andThen((donation) => {
      if (!donation) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = DonationMapper.toDomain(donation)
      return ResultAsync.fromSafePromise(
        domainResult.isOk() ? Promise.resolve(domainResult.value) : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })

  /**
   * Save donation (create or update)
   */
  const save = (donation: DonationState): AsyncResult<DonationState, DomainError> => {
    const prismaData = DonationMapper.toPrisma(donation)

    return ResultAsync.fromPromise(
      prisma.platformDonation.upsert({
        where: { id: String(donation.id) },
        create: {
          ...prismaData,
        },
        update: {
          ...prismaData,
        },
      }),
      (error) => new InfrastructureError(`Database error saving donation: ${(error as Error).message}`, error as Error)
    ).andThen((saved) => {
      const domainResult = DonationMapper.toDomain(saved)
      return ResultAsync.fromSafePromise(
        domainResult.isOk() ? Promise.resolve(domainResult.value) : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Delete donation
   */
  const deleteDonation = (id: DonationId): AsyncResult<void, DomainError> =>
    ResultAsync.fromPromise(
      prisma.platformDonation.delete({
        where: { id: String(id) },
      }),
      (error) => {
        // Check if it's a "record not found" error
        if ((error as any).code === 'P2025') {
          return new NotFoundError('Donation', String(id))
        }
        return new InfrastructureError(`Database error deleting donation: ${(error as Error).message}`, error as Error)
      }
    ).map(() => undefined)

  return {
    findById,
    findByUserId,
    findByStripePaymentIntentId,
    save,
    delete: deleteDonation,
  }
}

/**
 * Legacy class-based export for backward compatibility
 * @deprecated Use createDonationRepository instead
 */
export class PrismaDonationRepository implements IDonationRepository {
  private readonly repo: IDonationRepository

  constructor(prisma: PrismaClient) {
    this.repo = createDonationRepository(prisma)
  }

  findById(id: DonationId): AsyncResult<DonationState | null, DomainError> {
    return this.repo.findById(id)
  }

  findByUserId(userId: string): AsyncResult<DonationState[], DomainError> {
    return this.repo.findByUserId(userId)
  }

  findByStripePaymentIntentId(paymentIntentId: string): AsyncResult<DonationState | null, DomainError> {
    return this.repo.findByStripePaymentIntentId(paymentIntentId)
  }

  save(donation: DonationState): AsyncResult<DonationState, DomainError> {
    return this.repo.save(donation)
  }

  delete(id: DonationId): AsyncResult<void, DomainError> {
    return this.repo.delete(id)
  }
}
