import { Church as PrismaChurch } from '@prisma/client'
import { Result, ok, err } from '@repo/domain'
import {
  ChurchState,
  DraftChurch,
  PublishedChurch,
  VerifiedChurch,
  ChurchId,
  ChurchName,
  ValidationError
} from '@repo/domain'

/**
 * Maps between Prisma Church model and Domain ChurchState
 */
export class ChurchMapper {
  /**
   * Convert Prisma Church to Domain ChurchState
   *
   * Determines state based on:
   * - Verified: verifiedAt and verifiedBy are set
   * - Published: isPublished is true and slug exists
   * - Draft: otherwise
   */
  static toDomain(prisma: PrismaChurch): Result<ChurchState, ValidationError> {
    // Validate value objects
    const idResult = ChurchId.create(prisma.id)
    const nameResult = ChurchName.create(prisma.name)

    // Combine Results using railway-oriented programming
    if (idResult.isErr()) return err(idResult.error)
    if (nameResult.isErr()) return err(nameResult.error)

    const id = idResult.value
    const name = nameResult.value

    // Determine state based on database fields
    if (prisma.verifiedAt && prisma.verifiedBy) {
      // Verified state
      if (!prisma.publishedAt || !prisma.slug) {
        return err(new ValidationError('Verified church must have publishedAt and slug'))
      }

      return ok({
        tag: 'Verified' as const,
        id,
        name,
        slug: prisma.slug,
        publishedAt: prisma.publishedAt,
        verifiedAt: prisma.verifiedAt,
        verifiedBy: prisma.verifiedBy,
        createdAt: prisma.createdAt,
      } as VerifiedChurch)
    }

    if (prisma.isPublished && prisma.slug && prisma.publishedAt) {
      // Published state
      return ok({
        tag: 'Published' as const,
        id,
        name,
        slug: prisma.slug,
        publishedAt: prisma.publishedAt,
        createdAt: prisma.createdAt,
      } as PublishedChurch)
    }

    // Draft state (default)
    return ok({
      tag: 'Draft' as const,
      id,
      name,
      createdAt: prisma.createdAt,
    } as DraftChurch)
  }

  /**
   * Convert Domain ChurchState to Prisma create/update data
   *
   * Returns partial object containing only state-related fields.
   * Caller should merge with other church data as needed.
   */
  static toPrisma(domain: ChurchState): {
    id: string
    name: string
    isPublished: boolean
    slug: string | null
    publishedAt: Date | null
    verifiedAt: Date | null
    verifiedBy: string | null
    createdAt: Date
  } {
    const base = {
      id: String(domain.id),
      name: String(domain.name),
      createdAt: domain.createdAt,
    }

    switch (domain.tag) {
      case 'Draft':
        return {
          ...base,
          isPublished: false,
          slug: null,
          publishedAt: null,
          verifiedAt: null,
          verifiedBy: null,
        }

      case 'Published':
        return {
          ...base,
          isPublished: true,
          slug: domain.slug,
          publishedAt: domain.publishedAt,
          verifiedAt: null,
          verifiedBy: null,
        }

      case 'Verified':
        return {
          ...base,
          isPublished: true,
          slug: domain.slug,
          publishedAt: domain.publishedAt,
          verifiedAt: domain.verifiedAt,
          verifiedBy: domain.verifiedBy,
        }
    }
  }
}
