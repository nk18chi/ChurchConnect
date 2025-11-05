import { Result, ok, err } from '../../shared/types/Result'
import { DraftChurch, PublishedChurch } from '../entities/ChurchState'
import { ValidationError } from '../../shared/errors/DomainError'

/**
 * Slug with validation metadata
 */
interface ValidatedSlug {
  value: string
  draft: DraftChurch
}

/**
 * Step 1: Generate URL-safe slug from church name
 */
type GenerateSlug = (draft: DraftChurch) => Result<ValidatedSlug, ValidationError>

const generateSlug: GenerateSlug = (draft) => {
  const slug = String(draft.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, '') // Trim hyphens from ends

  return ok({ value: slug, draft })
}

/**
 * Step 2: Validate slug length
 */
type ValidateSlugLength = (input: ValidatedSlug) => Result<ValidatedSlug, ValidationError>

const validateSlugLength: ValidateSlugLength = (input) => {
  if (input.value.length < 3) {
    return err(
      new ValidationError('Generated slug is too short. Church name must contain more valid characters.')
    )
  }

  if (input.value.length > 200) {
    return err(new ValidationError('Generated slug is too long'))
  }

  return ok(input)
}

/**
 * Step 3: Create published church from validated slug
 */
type CreatePublishedChurch = (input: ValidatedSlug) => Result<PublishedChurch, ValidationError>

const createPublishedChurch: CreatePublishedChurch = (input) =>
  ok({
    tag: 'Published' as const,
    id: input.draft.id,
    name: input.draft.name,
    slug: input.value,
    publishedAt: new Date(),
    createdAt: input.draft.createdAt,
  })

/**
 * Publish a draft church, making it visible to the public.
 * Pure function with no side effects.
 *
 * Pipeline: draft → slug generation → slug validation → published church
 *
 * Note: Caller must check for slug uniqueness in the repository.
 *
 * @param draft - Draft church to publish
 * @returns Published church or validation error
 */
export const publishChurch = (draft: DraftChurch): Result<PublishedChurch, ValidationError> =>
  ok(draft).andThen(generateSlug).andThen(validateSlugLength).andThen(createPublishedChurch)
