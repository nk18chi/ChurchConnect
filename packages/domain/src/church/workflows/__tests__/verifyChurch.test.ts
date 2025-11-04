import { describe, it, expect } from '@jest/globals'
import { verifyChurch, VerifyChurchInput } from '../verifyChurch'
import { createChurch } from '../createChurch'
import { publishChurch } from '../publishChurch'
import { isVerified } from '../../entities/ChurchState'

describe('verifyChurch workflow', () => {
  it('should verify published church by admin', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'church-admin-123',
    })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const publishedResult = publishChurch(draftResult.value)
    expect(publishedResult.isOk()).toBe(true)
    if (publishedResult.isErr()) return

    const input: VerifyChurchInput = {
      church: publishedResult.value,
      verifiedBy: 'admin-123',
      verifierRole: 'ADMIN',
    }

    const result = verifyChurch(input)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      const verified = result.value
      expect(isVerified(verified)).toBe(true)
      expect(verified.verifiedBy).toBe('admin-123')
      expect(verified.verifiedAt).toBeInstanceOf(Date)
      expect(verified.slug).toBe(publishedResult.value.slug)
    }
  })

  it('should fail if verifier is not admin', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const publishedResult = publishChurch(draftResult.value)
    expect(publishedResult.isOk()).toBe(true)
    if (publishedResult.isErr()) return

    const input: VerifyChurchInput = {
      church: publishedResult.value,
      verifiedBy: 'user-123',
      verifierRole: 'CHURCH_ADMIN',
    }

    const result = verifyChurch(input)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toContain('admin')
      expect(result.error.code).toBe('AUTHORIZATION_ERROR')
    }
  })

  it('should fail if verifier is regular user', () => {
    const draftResult = createChurch({
      name: 'Tokyo Baptist Church',
      adminUserId: 'user-123',
    })
    expect(draftResult.isOk()).toBe(true)
    if (draftResult.isErr()) return

    const publishedResult = publishChurch(draftResult.value)
    expect(publishedResult.isOk()).toBe(true)
    if (publishedResult.isErr()) return

    const input: VerifyChurchInput = {
      church: publishedResult.value,
      verifiedBy: 'user-456',
      verifierRole: 'USER',
    }

    const result = verifyChurch(input)

    expect(result.isErr()).toBe(true)
  })
})
