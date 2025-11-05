import { ReviewContent } from '../ReviewContent'

describe('ReviewContent', () => {
  it('should create valid review content', () => {
    const result = ReviewContent.create('Great church with friendly community!')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Great church with friendly community!')
    }
  })

  it('should reject content that is too short', () => {
    const result = ReviewContent.create('Hi')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000 characters')
    }
  })

  it('should reject content that is too long', () => {
    const longContent = 'a'.repeat(2001)
    const result = ReviewContent.create(longContent)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000 characters')
    }
  })

  it('should trim whitespace', () => {
    const result = ReviewContent.create('  Good church  ')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.toString()).toBe('Good church')
    }
  })
})
