import { builder } from './builder'

// Import type definitions (will be created in Tasks 8-9)
import './types/prefecture'
import './types/city'
import './types/language'
import './types/denomination'
// import './types/church'

export const schema = builder.toSchema()
