import { describe, it, expect } from '@jest/globals'
import { ReviewContent } from '../ReviewContent'

describe('ReviewContent', () => {
  it('should create valid review content', () => {
    const content = 'This is a great church with wonderful community!'
    const result = ReviewContent.create(content)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe(content)
    }
  })

  it('should fail for too short content', () => {
    const result = ReviewContent.create('Too short')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000')
    }
  })

  it('should fail for too long content', () => {
    const longContent = 'A'.repeat(2001)
    const result = ReviewContent.create(longContent)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('10 and 2000')
    }
  })

  it('should trim whitespace', () => {
    const result = ReviewContent.create('  Great church with amazing people!  ')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('Great church with amazing people!')
    }
  })
})
