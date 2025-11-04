import { describe, it, expect } from '@jest/globals'
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InfrastructureError,
} from '../DomainError'

describe('DomainError', () => {
  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid email format', 'email')

      expect(error.message).toBe('Invalid email format')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBe('email')
      expect(error.name).toBe('ValidationError')
    })

    it('should create validation error without field', () => {
      const error = new ValidationError('Invalid input')

      expect(error.field).toBeUndefined()
    })

    it('should serialize to JSON', () => {
      const error = new ValidationError('Invalid email', 'email')
      const json = error.toJSON()

      expect(json.code).toBe('VALIDATION_ERROR')
      expect(json.message).toBe('Invalid email')
      expect(json.field).toBe('email')
      expect(json.timestamp).toBeDefined()
    })

    it('should have timestamp', () => {
      const error = new ValidationError('Test error')
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Church', 'church-123')

      expect(error.message).toBe('Church with id church-123 not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.entityType).toBe('Church')
      expect(error.entityId).toBe('church-123')
    })

    it('should serialize to JSON', () => {
      const error = new NotFoundError('Church', 'church-123')
      const json = error.toJSON()

      expect(json.entityType).toBe('Church')
      expect(json.entityId).toBe('church-123')
      expect(json.name).toBe('NotFoundError')
    })
  })

  describe('AuthorizationError', () => {
    it('should create authorization error with required role', () => {
      const error = new AuthorizationError('Admin access required', 'ADMIN')

      expect(error.code).toBe('AUTHORIZATION_ERROR')
      expect(error.requiredRole).toBe('ADMIN')
    })

    it('should create authorization error without required role', () => {
      const error = new AuthorizationError('Access denied')

      expect(error.requiredRole).toBeUndefined()
    })

    it('should serialize to JSON', () => {
      const error = new AuthorizationError('Admin access required', 'ADMIN')
      const json = error.toJSON()

      expect(json.code).toBe('AUTHORIZATION_ERROR')
      expect(json.requiredRole).toBe('ADMIN')
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Church with slug already exists', 'slug')

      expect(error.code).toBe('CONFLICT')
      expect(error.conflictingField).toBe('slug')
    })

    it('should create conflict error without field', () => {
      const error = new ConflictError('Conflict detected')

      expect(error.conflictingField).toBeUndefined()
    })

    it('should serialize to JSON', () => {
      const error = new ConflictError('Duplicate slug', 'slug')
      const json = error.toJSON()

      expect(json.conflictingField).toBe('slug')
    })
  })

  describe('InfrastructureError', () => {
    it('should create infrastructure error with original error', () => {
      const originalError = new Error('Database connection failed')
      const error = new InfrastructureError('Failed to save church', originalError)

      expect(error.code).toBe('INFRASTRUCTURE_ERROR')
      expect(error.originalError).toBe(originalError)
    })

    it('should create infrastructure error without original error', () => {
      const error = new InfrastructureError('Unknown infrastructure error')

      expect(error.originalError).toBeUndefined()
    })

    it('should serialize to JSON', () => {
      const originalError = new Error('DB error')
      const error = new InfrastructureError('Failed to save', originalError)
      const json = error.toJSON()

      expect(json.originalError).toBe('DB error')
    })

    it('should handle missing original error in JSON', () => {
      const error = new InfrastructureError('Error without cause')
      const json = error.toJSON()

      expect(json.originalError).toBeUndefined()
    })
  })

  describe('DomainError base class', () => {
    it('should maintain proper stack trace', () => {
      const error = new ValidationError('Test error')
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('ValidationError')
    })

    it('should be instance of Error', () => {
      const error = new ValidationError('Test error')
      expect(error).toBeInstanceOf(Error)
    })
  })
})
