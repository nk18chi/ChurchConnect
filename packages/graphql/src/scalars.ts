import { builder } from './builder'

// DateTime scalar used across all types
export const DateTimeScalar = builder.scalarType('DateTime', {
  serialize: (date: Date) => date.toISOString(),
  parseValue: (value: unknown) => {
    if (typeof value === 'string') {
      return new Date(value)
    }
    if (value instanceof Date) {
      return value
    }
    throw new Error('Invalid date value')
  },
})
