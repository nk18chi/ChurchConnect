import { toGraphQLChurch } from '../churchMapper'
import { ChurchId, ChurchName, DraftChurch, PublishedChurch, VerifiedChurch } from '@repo/domain'

describe('toGraphQLChurch', () => {
  it('should map DraftChurch to partial GraphQL Church', () => {
    const churchId = ChurchId.create('church-123')
    const churchName = ChurchName.create('Tokyo Baptist Church')

    if (churchId.isErr() || churchName.isErr()) {
      throw new Error('Test setup failed')
    }

    const draft: DraftChurch = {
      tag: 'Draft',
      id: churchId.value,
      name: churchName.value,
      createdAt: new Date('2024-01-01'),
    }

    const graphql = toGraphQLChurch(draft)

    expect(graphql.id).toBe('church-123')
    expect(graphql.name).toBe('Tokyo Baptist Church')
    expect(graphql.isPublished).toBe(false)
    expect(graphql.slug).toBeNull()
    expect(graphql.createdAt).toEqual(new Date('2024-01-01'))
  })

  it('should map PublishedChurch to GraphQL Church', () => {
    const churchId = ChurchId.create('church-456')
    const churchName = ChurchName.create('Osaka Grace Church')

    if (churchId.isErr() || churchName.isErr()) {
      throw new Error('Test setup failed')
    }

    const published: PublishedChurch = {
      tag: 'Published',
      id: churchId.value,
      name: churchName.value,
      slug: 'osaka-grace-church',
      publishedAt: new Date('2024-02-01'),
      createdAt: new Date('2024-01-01'),
    }

    const graphql = toGraphQLChurch(published)

    expect(graphql.id).toBe('church-456')
    expect(graphql.name).toBe('Osaka Grace Church')
    expect(graphql.isPublished).toBe(true)
    expect(graphql.slug).toBe('osaka-grace-church')
    expect(graphql.isVerified).toBe(false)
  })

  it('should map VerifiedChurch to GraphQL Church', () => {
    const churchId = ChurchId.create('church-789')
    const churchName = ChurchName.create('Kyoto International Church')

    if (churchId.isErr() || churchName.isErr()) {
      throw new Error('Test setup failed')
    }

    const verified: VerifiedChurch = {
      tag: 'Verified',
      id: churchId.value,
      name: churchName.value,
      slug: 'kyoto-international-church',
      publishedAt: new Date('2024-02-01'),
      verifiedAt: new Date('2024-03-01'),
      verifiedBy: 'admin-123',
      createdAt: new Date('2024-01-01'),
    }

    const graphql = toGraphQLChurch(verified)

    expect(graphql.id).toBe('church-789')
    expect(graphql.name).toBe('Kyoto International Church')
    expect(graphql.isPublished).toBe(true)
    expect(graphql.isVerified).toBe(true)
    expect(graphql.slug).toBe('kyoto-international-church')
  })
})
