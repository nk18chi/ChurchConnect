import { ChurchState, isDraft, isPublished, isVerified } from '@repo/domain'

/**
 * Maps domain ChurchState to GraphQL Church response
 *
 * Note: This returns a partial Church object with only state-related fields.
 * Full Church data (address, denomination, etc.) comes from Prisma queries.
 */
export function toGraphQLChurch(church: ChurchState) {
  const base = {
    id: church.id.toString(),
    name: church.name.toString(),
    createdAt: church.createdAt,
  }

  if (isDraft(church)) {
    return {
      ...base,
      isPublished: false,
      isVerified: false,
      slug: null,
      publishedAt: null,
      verifiedAt: null,
    }
  }

  if (isPublished(church)) {
    return {
      ...base,
      isPublished: true,
      isVerified: false,
      slug: church.slug,
      publishedAt: church.publishedAt,
      verifiedAt: null,
    }
  }

  if (isVerified(church)) {
    return {
      ...base,
      isPublished: true,
      isVerified: true,
      slug: church.slug,
      publishedAt: church.publishedAt,
      verifiedAt: church.verifiedAt,
    }
  }

  // Exhaustive check - TypeScript will error if we miss a case
  const _exhaustiveCheck: never = church
  throw new Error(`Unhandled church state: ${(_exhaustiveCheck as ChurchState).tag}`)
}
