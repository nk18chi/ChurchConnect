import { PrismaClient } from '@prisma/client'
import {
  AsyncResult,
  IChurchRepository,
  ChurchState,
  ChurchId,
  DomainError,
  NotFoundError,
  InfrastructureError
} from '@repo/domain'
import { ResultAsync } from 'neverthrow'
import { ChurchMapper } from './mappers/ChurchMapper'

/**
 * Prisma implementation of IChurchRepository
 *
 * Handles persistence of ChurchState to PostgreSQL database
 * using Prisma ORM and ChurchMapper for translation
 */
export class PrismaChurchRepository implements IChurchRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly defaultValues?: {
      denominationId?: string
      prefectureId?: string
      cityId?: string
      address?: string
    }
  ) {}

  /**
   * Find church by ID
   */
  findById(id: ChurchId): AsyncResult<ChurchState | null, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.findUnique({
        where: { id: id.toString() },
      }),
      (error) => new InfrastructureError(
        `Database error finding church: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((church) => {
      if (!church) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = ChurchMapper.toDomain(church)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Find church by slug
   */
  findBySlug(slug: string): AsyncResult<ChurchState | null, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.findUnique({
        where: { slug },
      }),
      (error) => new InfrastructureError(
        `Database error finding church by slug: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((church) => {
      if (!church) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = ChurchMapper.toDomain(church)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Save church (create or update)
   */
  save(church: ChurchState): AsyncResult<ChurchState, DomainError> {
    const prismaData = ChurchMapper.toPrisma(church)

    // WORKAROUND: Prisma schema has slug as non-nullable, but DDD design requires
    // draft churches to have no slug. Use temporary slug for drafts.
    // TODO: Make slug nullable in schema when migrating from current system
    const slug = prismaData.slug ?? `draft-${church.id.toString()}`

    return ResultAsync.fromPromise(
      this.prisma.church.upsert({
        where: { id: church.id.toString() },
        create: {
          ...prismaData,
          slug,
          // Required fields for create (these would come from full church data in real app)
          // For now, use default values provided in constructor
          denominationId: this.defaultValues?.denominationId ?? 'temp-denomination-id',
          prefectureId: this.defaultValues?.prefectureId ?? 'temp-prefecture-id',
          cityId: this.defaultValues?.cityId ?? 'temp-city-id',
          address: this.defaultValues?.address ?? 'Temporary address',
        },
        update: {
          ...prismaData,
          slug,
        },
      }),
      (error) => new InfrastructureError(
        `Database error saving church: ${(error as Error).message}`,
        error as Error
      )
    ).andThen((saved) => {
      const domainResult = ChurchMapper.toDomain(saved)
      return ResultAsync.fromSafePromise(
        domainResult.isOk()
          ? Promise.resolve(domainResult.value)
          : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Delete church
   */
  delete(id: ChurchId): AsyncResult<void, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.delete({
        where: { id: id.toString() },
      }),
      (error) => {
        // Check if it's a "record not found" error
        if ((error as any).code === 'P2025') {
          return new NotFoundError('Church', id.toString())
        }
        return new InfrastructureError(
          `Database error deleting church: ${(error as Error).message}`,
          error as Error
        )
      }
    ).map(() => undefined)
  }

  /**
   * Check if slug exists
   */
  slugExists(slug: string): AsyncResult<boolean, DomainError> {
    return ResultAsync.fromPromise(
      this.prisma.church.findUnique({
        where: { slug },
        select: { id: true },
      }),
      (error) => new InfrastructureError(
        `Database error checking slug: ${(error as Error).message}`,
        error as Error
      )
    ).map((church) => church !== null)
  }
}
