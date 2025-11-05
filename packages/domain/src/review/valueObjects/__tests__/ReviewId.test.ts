import { ReviewId } from '../ReviewId'

describe('ReviewId', () => {
  it('should create valid review ID', () => {
    const result = ReviewId.create('review-123')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('review-123')
    }
  })

  it('should reject empty review ID', () => {
    const result = ReviewId.create('')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('cannot be empty')
    }
  })

  it('should create new review ID', () => {
    const id1 = ReviewId.createNew()
    const id2 = ReviewId.createNew()

    expect(id1.toString()).not.toBe(id2.toString())
    expect(id1.toString()).toHaveLength(36) // UUID length
  })
})
