export abstract class DomainError extends Error {
  readonly code: string
  readonly timestamp: Date

  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.timestamp = new Date()
    this.name = this.constructor.name

    // Maintains proper stack trace for where error was thrown (V8 only)
    if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    }
  }
}

export class ValidationError extends DomainError {
  readonly field?: string

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR')
    this.field = field
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    }
  }
}

export class AuthorizationError extends DomainError {
  readonly requiredRole?: string

  constructor(message: string, requiredRole?: string) {
    super(message, 'AUTHORIZATION_ERROR')
    this.requiredRole = requiredRole
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      requiredRole: this.requiredRole,
    }
  }
}

export class NotFoundError extends DomainError {
  readonly entityType: string
  readonly entityId: string

  constructor(entityType: string, entityId: string) {
    super(`${entityType} with id ${entityId} not found`, 'NOT_FOUND')
    this.entityType = entityType
    this.entityId = entityId
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      entityType: this.entityType,
      entityId: this.entityId,
    }
  }
}

export class ConflictError extends DomainError {
  readonly conflictingField?: string

  constructor(message: string, conflictingField?: string) {
    super(message, 'CONFLICT')
    this.conflictingField = conflictingField
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      conflictingField: this.conflictingField,
    }
  }
}

export class InfrastructureError extends DomainError {
  readonly originalError?: Error

  constructor(message: string, originalError?: Error) {
    super(message, 'INFRASTRUCTURE_ERROR')
    this.originalError = originalError
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      originalError: this.originalError?.message,
    }
  }
}
