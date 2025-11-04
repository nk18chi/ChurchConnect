import { GraphQLError } from 'graphql'
import { DomainError } from '@repo/domain'

/**
 * Maps domain errors to GraphQL errors with proper error codes
 */
export function mapDomainError(error: DomainError): GraphQLError {
  return new GraphQLError(error.message, {
    extensions: {
      code: error.code,
    },
  })
}
