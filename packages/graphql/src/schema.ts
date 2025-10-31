import { builder } from './builder'

// Import scalars first
import './scalars'

// Import type definitions (will be created in Tasks 8-9)
import './types/prefecture'
import './types/city'
import './types/language'
import './types/denomination'

// Church and related types
import './types/church'
import './types/church-profile'
import './types/church-social'
import './types/church-staff'
import './types/service-time'
import './types/church-photo'
import './types/sermon'
import './types/event'
import './types/review'

// User and auth types
import './types/user'

// Donation types
import './types/donation'

export const schema = builder.toSchema()
