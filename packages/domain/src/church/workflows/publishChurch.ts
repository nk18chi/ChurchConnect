import { Result, ok, err } from '../../shared/types/Result'
import { DraftChurch, PublishedChurch } from '../entities/ChurchState'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Generate URL-safe slug from church name
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, '') // Trim hyphens from ends
}

/**
 * Publish a draft church, making it visible to the public.
 * Pure function with no side effects.
 *
 * Note: Caller must check for slug uniqueness in the repository.
 *
 * @param draft - Draft church to publish
 * @returns Published church or validation error
 */
export const publishChurch = (draft: DraftChurch): Result<PublishedChurch, ValidationError> => {
  const slug = generateSlug(draft.name.toString())

  // Validate slug length
  if (slug.length < 3) {
    return err(
      new ValidationError('Generated slug is too short. Church name must contain more valid characters.')
    )
  }

  if (slug.length > 200) {
    return err(new ValidationError('Generated slug is too long'))
  }

  return ok({
    tag: 'Published' as const,
    id: draft.id,
    name: draft.name,
    slug,
    publishedAt: new Date(),
    createdAt: draft.createdAt,
  })
}
