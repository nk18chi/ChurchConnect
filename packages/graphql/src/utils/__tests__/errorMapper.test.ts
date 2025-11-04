import { mapDomainError } from '../errorMapper'
import { ValidationError, AuthorizationError, NotFoundError, InfrastructureError } from '@repo/domain'

describe('mapDomainError', () => {
  it('should map ValidationError to GraphQL error', () => {
    const error = new ValidationError('Church name must be between 2 and 100 characters')
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Church name must be between 2 and 100 characters')
    expect(graphqlError.extensions?.code).toBe('VALIDATION_ERROR')
  })

  it('should map AuthorizationError to GraphQL error', () => {
    const error = new AuthorizationError('Only admins can verify churches')
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Only admins can verify churches')
    expect(graphqlError.extensions?.code).toBe('AUTHORIZATION_ERROR')
  })

  it('should map NotFoundError to GraphQL error', () => {
    const error = new NotFoundError('Church', 'church-123')
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Church with id church-123 not found')
    expect(graphqlError.extensions?.code).toBe('NOT_FOUND')
  })

  it('should map InfrastructureError to GraphQL error', () => {
    const dbError = new Error('Connection timeout')
    const error = new InfrastructureError('Database error finding church', dbError)
    const graphqlError = mapDomainError(error)

    expect(graphqlError.message).toBe('Database error finding church')
    expect(graphqlError.extensions?.code).toBe('INFRASTRUCTURE_ERROR')
  })
})
