import { ChurchId } from '../valueObjects/ChurchId'
import { ChurchName } from '../valueObjects/ChurchName'

/**
 * Church aggregate states as a tagged union.
 * This makes invalid state transitions impossible at compile time.
 *
 * State transitions:
 * Draft → Published → Verified
 */
export type ChurchState = DraftChurch | PublishedChurch | VerifiedChurch

/**
 * Draft state: Church created but not published
 * - Has basic info only
 * - Not searchable by public
 * - Only visible to church admin
 */
export type DraftChurch = {
  readonly tag: 'Draft'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly createdAt: Date
}

/**
 * Published state: Church visible to public
 * - Has slug for URL
 * - Searchable by public
 * - Can receive reviews
 */
export type PublishedChurch = {
  readonly tag: 'Published'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly slug: string
  readonly publishedAt: Date
  readonly createdAt: Date
}

/**
 * Verified state: Church verified by platform admin
 * - Has verified badge
 * - Higher ranking in search
 * - Increased trust
 */
export type VerifiedChurch = {
  readonly tag: 'Verified'
  readonly id: ChurchId
  readonly name: ChurchName
  readonly slug: string
  readonly publishedAt: Date
  readonly verifiedAt: Date
  readonly verifiedBy: string // Admin user ID
  readonly createdAt: Date
}

/**
 * Type guard for Draft state
 */
export const isDraft = (church: ChurchState): church is DraftChurch => {
  return church.tag === 'Draft'
}

/**
 * Type guard for Published state
 */
export const isPublished = (church: ChurchState): church is PublishedChurch => {
  return church.tag === 'Published'
}

/**
 * Type guard for Verified state
 */
export const isVerified = (church: ChurchState): church is VerifiedChurch => {
  return church.tag === 'Verified'
}

/**
 * Check if church is publicly visible (Published or Verified)
 */
export const isPubliclyVisible = (church: ChurchState): boolean => {
  return isPublished(church) || isVerified(church)
}

/**
 * Get slug from church if it has one
 */
export const getSlug = (church: ChurchState): string | null => {
  if (isDraft(church)) {
    return null
  }
  return church.slug
}
