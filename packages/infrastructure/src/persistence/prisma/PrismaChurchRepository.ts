import { PrismaClient } from '@prisma/client'
import {
  AsyncResult,
  IChurchRepository,
  ChurchState,
  ChurchId,
  DomainError,
  NotFoundError,
  InfrastructureError,
} from '@repo/domain'
import { ResultAsync } from 'neverthrow'
import { ChurchMapper } from './mappers/ChurchMapper'

/**
 * Configuration for Church repository
 */
export interface ChurchRepositoryConfig {
  denominationId?: string
  prefectureId?: string
  cityId?: string
  address?: string
}

/**
 * Creates a Prisma-based Church repository with functional composition
 *
 * @param prisma - Prisma client instance
 * @param config - Default values for required fields
 * @returns Repository functions for Church aggregate
 */
export const createChurchRepository = (
  prisma: PrismaClient,
  config?: ChurchRepositoryConfig
): IChurchRepository => {
  /**
   * Find church by ID
   */
  const findById = (id: ChurchId): AsyncResult<ChurchState | null, DomainError> =>
    ResultAsync.fromPromise(
      prisma.church.findUnique({
        where: { id: String(id) },
      }),
      (error) => new InfrastructureError(`Database error finding church: ${(error as Error).message}`, error as Error)
    ).andThen((church) => {
      if (!church) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = ChurchMapper.toDomain(church)
      return ResultAsync.fromSafePromise(
        domainResult.isOk() ? Promise.resolve(domainResult.value) : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })

  /**
   * Find church by slug
   */
  const findBySlug = (slug: string): AsyncResult<ChurchState | null, DomainError> =>
    ResultAsync.fromPromise(
      prisma.church.findUnique({
        where: { slug },
      }),
      (error) =>
        new InfrastructureError(`Database error finding church by slug: ${(error as Error).message}`, error as Error)
    ).andThen((church) => {
      if (!church) {
        return ResultAsync.fromSafePromise(Promise.resolve(null))
      }

      const domainResult = ChurchMapper.toDomain(church)
      return ResultAsync.fromSafePromise(
        domainResult.isOk() ? Promise.resolve(domainResult.value) : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })

  /**
   * Save church (create or update)
   */
  const save = (church: ChurchState): AsyncResult<ChurchState, DomainError> => {
    const prismaData = ChurchMapper.toPrisma(church)

    // WORKAROUND: Prisma schema has slug as non-nullable, but DDD design requires
    // draft churches to have no slug. Use temporary slug for drafts.
    // TODO: Make slug nullable in schema when migrating from current system
    const slug = prismaData.slug ?? `draft-${String(church.id)}`

    return ResultAsync.fromPromise(
      prisma.church.upsert({
        where: { id: String(church.id) },
        create: {
          ...prismaData,
          slug,
          // Required fields for create (these would come from full church data in real app)
          // For now, use default values provided in config
          denominationId: config?.denominationId ?? 'temp-denomination-id',
          prefectureId: config?.prefectureId ?? 'temp-prefecture-id',
          cityId: config?.cityId ?? 'temp-city-id',
          address: config?.address ?? 'Temporary address',
        },
        update: {
          ...prismaData,
          slug,
        },
      }),
      (error) => new InfrastructureError(`Database error saving church: ${(error as Error).message}`, error as Error)
    ).andThen((saved) => {
      const domainResult = ChurchMapper.toDomain(saved)
      return ResultAsync.fromSafePromise(
        domainResult.isOk() ? Promise.resolve(domainResult.value) : Promise.reject(domainResult.error)
      ).mapErr((error) => error as DomainError)
    })
  }

  /**
   * Delete church
   */
  const deleteChurch = (id: ChurchId): AsyncResult<void, DomainError> =>
    ResultAsync.fromPromise(
      prisma.church.delete({
        where: { id: String(id) },
      }),
      (error) => {
        // Check if it's a "record not found" error
        if ((error as any).code === 'P2025') {
          return new NotFoundError('Church', String(id))
        }
        return new InfrastructureError(`Database error deleting church: ${(error as Error).message}`, error as Error)
      }
    ).map(() => undefined)

  /**
   * Check if slug exists
   */
  const slugExists = (slug: string): AsyncResult<boolean, DomainError> =>
    ResultAsync.fromPromise(
      prisma.church.findUnique({
        where: { slug },
        select: { id: true },
      }),
      (error) => new InfrastructureError(`Database error checking slug: ${(error as Error).message}`, error as Error)
    ).map((church) => church !== null)

  return {
    findById,
    findBySlug,
    save,
    delete: deleteChurch,
    slugExists,
  }
}

/**
 * Legacy class-based export for backward compatibility
 * @deprecated Use createChurchRepository instead
 */
export class PrismaChurchRepository implements IChurchRepository {
  private readonly repo: IChurchRepository

  constructor(prisma: PrismaClient, config?: ChurchRepositoryConfig) {
    this.repo = createChurchRepository(prisma, config)
  }

  findById(id: ChurchId): AsyncResult<ChurchState | null, DomainError> {
    return this.repo.findById(id)
  }

  findBySlug(slug: string): AsyncResult<ChurchState | null, DomainError> {
    return this.repo.findBySlug(slug)
  }

  save(church: ChurchState): AsyncResult<ChurchState, DomainError> {
    return this.repo.save(church)
  }

  delete(id: ChurchId): AsyncResult<void, DomainError> {
    return this.repo.delete(id)
  }

  slugExists(slug: string): AsyncResult<boolean, DomainError> {
    return this.repo.slugExists(slug)
  }
}
