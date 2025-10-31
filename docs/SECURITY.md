# Security Guide

This guide outlines security best practices, authentication and authorization patterns, data protection measures, API security, incident response procedures, and compliance considerations for ChurchConnect.

## Table of Contents

- [Security Best Practices](#security-best-practices)
- [Authentication and Authorization](#authentication-and-authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Security Incident Response](#security-incident-response)
- [Compliance Considerations](#compliance-considerations)
- [Security Checklist](#security-checklist)

---

## Security Best Practices

### General Security Principles

1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Grant minimum necessary permissions
3. **Separation of Concerns** - Isolate sensitive operations
4. **Fail Securely** - Errors should not expose sensitive information
5. **Keep Software Updated** - Regular dependency updates
6. **Audit Everything** - Log security-relevant events

### Secure Development Practices

**Code Review Requirements:**
- All code changes require review before merging
- Security-sensitive changes require security review
- Check for common vulnerabilities (OWASP Top 10)

**Dependency Management:**
```bash
# Regular security audits
pnpm audit

# Fix vulnerabilities automatically
pnpm audit fix

# Check for outdated dependencies
pnpm outdated
```

**Environment Variables:**
- Never commit secrets to version control
- Use `.env.local` for local development
- Store production secrets in Render environment variables
- Rotate secrets regularly (quarterly minimum)

**Secret Rotation Schedule:**
- `NEXTAUTH_SECRET`: Every 6 months
- `STRIPE_SECRET_KEY`: When compromised only
- `CLOUDINARY_API_SECRET`: Annually
- `RESEND_API_KEY`: Annually
- Database passwords: Quarterly

### Input Validation

**Always validate user input:**

```typescript
import { z } from 'zod'

// Define schema
const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
})

// Validate input
const result = contactFormSchema.safeParse(formData)
if (!result.success) {
  return { error: 'Invalid input' }
}
```

**Server-side Validation:**
- ALWAYS validate on server (never trust client)
- Use Zod schemas for type-safe validation
- Validate file types and sizes for uploads
- Sanitize HTML input to prevent XSS

**SQL Injection Prevention:**
- Use Prisma's parameterized queries (automatic)
- Never concatenate user input into SQL
- Use Prisma's query builder instead of raw SQL
- If raw SQL needed, use parameterized queries:

```typescript
// Good - Parameterized
await prisma.$queryRaw`
  SELECT * FROM "Church" WHERE name = ${searchTerm}
`

// Bad - String concatenation (DON'T DO THIS)
await prisma.$queryRawUnsafe(`
  SELECT * FROM "Church" WHERE name = '${searchTerm}'
`)
```

### Cross-Site Scripting (XSS) Prevention

**React Automatic Escaping:**
- React automatically escapes JSX content
- Safe by default for most cases

**Dangerous Scenarios:**
```typescript
// Dangerous - Avoid dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// Safe - Use DOMPurify if HTML needed
import DOMPurify from 'isomorphic-dompurify'
const cleanHTML = DOMPurify.sanitize(userContent)
<div dangerouslySetInnerHTML={{ __html: cleanHTML }} />

// Best - Avoid HTML entirely
<div>{userContent}</div>
```

**Content Security Policy (CSP):**

Configure in `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://cloudinary.com",
      "frame-src https://js.stripe.com https://www.google.com",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

### Cross-Site Request Forgery (CSRF) Protection

**NextAuth CSRF Protection:**
- NextAuth automatically includes CSRF tokens
- All POST requests verified

**API Route Protection:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Process request
}
```

---

## Authentication and Authorization

### Authentication Flow

**NextAuth.js v5 Configuration:**

File: `apps/web/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@repo/database'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Password Security

**Password Hashing:**
```typescript
import bcrypt from 'bcryptjs'

// Hash password on registration
const hashedPassword = await bcrypt.hash(password, 12)

// Verify password on login
const isValid = await bcrypt.compare(plainPassword, hashedPassword)
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Validation Schema:**
```typescript
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
```

**Password Reset Flow:**
1. User requests password reset
2. Generate secure random token (32 bytes)
3. Store hashed token in database with expiry (1 hour)
4. Send reset link via email
5. Verify token on reset page
6. Allow password change only if token valid
7. Invalidate token after use

### Role-Based Access Control (RBAC)

**User Roles:**
- `USER` - Regular users (can write reviews)
- `CHURCH_ADMIN` - Church administrators (manage church profiles)
- `ADMIN` - Platform administrators (full access)

**Authorization Patterns:**

```typescript
// Middleware for protected routes
export function requireAuth(allowedRoles: Role[]) {
  return async (request: Request) => {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (!allowedRoles.includes(session.user.role)) {
      return new Response('Forbidden', { status: 403 })
    }

    return null
  }
}

// Usage in API route
export async function POST(request: Request) {
  const authCheck = await requireAuth(['ADMIN'])
  if (authCheck) return authCheck

  // Process request
}
```

**Church Admin Authorization:**
```typescript
// Verify user owns the church
async function verifyChurchOwnership(userId: string, churchId: string) {
  const churchAdmin = await prisma.churchAdmin.findFirst({
    where: {
      userId,
      churchId,
    }
  })

  return !!churchAdmin
}

// Use in API route
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const hasAccess = session.user.role === 'ADMIN' ||
    await verifyChurchOwnership(session.user.id, params.id)

  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 })
  }

  // Process request
}
```

### Session Management

**Session Security:**
- Sessions stored in JWT tokens (stateless)
- 30-day expiration
- Secure cookie flags:
  - `httpOnly: true` - Prevents JavaScript access
  - `secure: true` - HTTPS only (production)
  - `sameSite: 'lax'` - CSRF protection

**Session Invalidation:**
```typescript
// Logout (client-side)
import { signOut } from 'next-auth/react'
await signOut({ callbackUrl: '/' })

// Force logout all sessions (change NEXTAUTH_SECRET)
```

---

## Data Protection

### Personally Identifiable Information (PII)

**PII Data in ChurchConnect:**
- User emails
- User names
- Church contact information
- Review author information

**PII Protection Measures:**
1. Store minimum necessary data
2. Encrypt sensitive data at rest (database encryption)
3. Use HTTPS for data in transit
4. Access logs for PII access
5. Data retention policies
6. User data export capability
7. User data deletion capability

### Data Encryption

**In Transit:**
- All connections use HTTPS/TLS 1.2+
- Stripe uses TLS for payment data
- Cloudinary uses HTTPS for images
- Database connections encrypted

**At Rest:**
- Render provides encrypted storage
- PostgreSQL database encrypted at rest
- Backups encrypted

### Data Access Controls

**Database Access:**
- Production database accessible only from Render services
- No direct public access
- Use connection pooling with authentication
- Rotate database passwords quarterly

**Application Access:**
- Role-based access control
- Audit logging for sensitive operations
- Session-based authentication

### Sensitive Data Handling

**Credit Card Information:**
- NEVER store credit card numbers
- Use Stripe for payment processing
- Stripe is PCI DSS compliant
- Only store Stripe customer IDs

**Email Addresses:**
- Hash for uniqueness checks
- Never expose in public APIs
- Require authentication to view
- Implement email verification

**Passwords:**
- Hash with bcrypt (cost factor 12)
- Never log passwords
- Never send passwords in emails
- Implement secure password reset

### Data Retention and Deletion

**User Data Deletion:**
```typescript
// Soft delete (default)
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() }
})

// Hard delete (GDPR right to be forgotten)
await prisma.user.delete({
  where: { id: userId }
})
```

**Data Retention Policy:**
- Active user data: Indefinite
- Deleted user data: 30 days (soft delete)
- Backups: 90 days
- Audit logs: 1 year
- Error logs: 90 days

### Privacy by Design

**Principles:**
1. **Minimize data collection** - Only collect necessary data
2. **Transparency** - Clear privacy policy
3. **User control** - Users can export/delete data
4. **Security by default** - Secure settings out of the box
5. **End-to-end privacy** - Privacy throughout lifecycle

**Privacy Policy Requirements:**
- What data is collected
- How data is used
- Who data is shared with
- How to request data deletion
- Cookie usage
- Contact information

---

## API Security

### GraphQL Security

**Query Complexity Limiting:**
```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity'

const server = new ApolloServer({
  schema,
  validationRules: [
    createComplexityLimitRule(1000, {
      onCost: (cost) => {
        console.log('Query cost:', cost)
      },
    }),
  ],
})
```

**Query Depth Limiting:**
```typescript
import depthLimit from 'graphql-depth-limit'

const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(10)],
})
```

**Authentication:**
```typescript
export const builder = new SchemaBuilder({
  plugins: ['prisma'],
  authScopes: async (context) => ({
    public: true,
    user: !!context.user,
    churchAdmin: context.user?.role === 'CHURCH_ADMIN',
    admin: context.user?.role === 'ADMIN',
  }),
})

// Protected field
builder.queryField('me', (t) =>
  t.field({
    type: User,
    authScopes: { user: true },
    resolve: (_, __, ctx) => ctx.user,
  })
)
```

### Rate Limiting

**Contact Form Rate Limiting:**
```typescript
// Rate limit: 5 requests per hour per IP
const rateLimiter = new Map<string, number[]>()

function checkRateLimit(ip: string, limit = 5, windowMs = 3600000): boolean {
  const now = Date.now()
  const requests = rateLimiter.get(ip) || []

  // Remove old requests outside window
  const recentRequests = requests.filter(time => now - time < windowMs)

  if (recentRequests.length >= limit) {
    return false // Rate limit exceeded
  }

  recentRequests.push(now)
  rateLimiter.set(ip, recentRequests)
  return true
}

// Usage in API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  // Process request
}
```

**API Rate Limiting (Future):**
Consider implementing with Upstash Redis:
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

const { success } = await ratelimit.limit(ip)
if (!success) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

### CORS Configuration

**Current Setup:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_WEB_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}
```

**Production CORS:**
- Restrict to known domains only
- Never use `*` in production
- Validate Origin header

### Webhook Security

**Stripe Webhook Verification:**
```typescript
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Process webhook
  } catch (err) {
    console.error('Webhook signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }
}
```

**Webhook Best Practices:**
1. Verify signature (always)
2. Use HTTPS endpoint
3. Return 200 quickly (process async)
4. Implement idempotency
5. Log all webhook events
6. Handle retries gracefully

---

## Security Incident Response

### Incident Classification

**Severity Levels:**

**Critical (P0):**
- Data breach (user data exposed)
- Complete system compromise
- Payment system breach
- Active attack in progress

**High (P1):**
- Potential data breach
- Authentication bypass
- Privilege escalation
- Sensitive data exposure

**Medium (P2):**
- XSS vulnerability
- CSRF vulnerability
- Information disclosure
- Denial of service

**Low (P3):**
- Security misconfiguration
- Missing security headers
- Outdated dependencies

### Incident Response Procedures

**1. Detection and Reporting**
- Monitor Sentry for security errors
- Review access logs for anomalies
- Check failed login attempts
- Monitor unusual traffic patterns

**2. Initial Response (Within 1 hour)**
- [ ] Confirm incident is real
- [ ] Assess severity (P0-P3)
- [ ] Create incident ticket
- [ ] Notify security team
- [ ] Begin containment

**3. Containment**

**For Data Breach:**
- [ ] Identify affected systems
- [ ] Revoke compromised credentials
- [ ] Block malicious IP addresses
- [ ] Disable compromised accounts
- [ ] Take affected systems offline if needed

**For Authentication Bypass:**
- [ ] Disable affected authentication method
- [ ] Force logout all sessions (rotate NEXTAUTH_SECRET)
- [ ] Deploy hotfix
- [ ] Verify fix deployed

**For DDoS Attack:**
- [ ] Enable rate limiting
- [ ] Block attacking IP ranges
- [ ] Scale infrastructure
- [ ] Contact hosting provider

**4. Eradication**
- [ ] Identify root cause
- [ ] Remove malware/backdoors
- [ ] Patch vulnerability
- [ ] Deploy security fix
- [ ] Verify fix effectiveness

**5. Recovery**
- [ ] Restore from clean backup if needed
- [ ] Reset all compromised credentials
- [ ] Regenerate API keys
- [ ] Monitor for recurrence
- [ ] Communicate with users if needed

**6. Post-Incident Activities**
- [ ] Document timeline
- [ ] Conduct post-mortem
- [ ] Update security controls
- [ ] Implement preventive measures
- [ ] Update runbooks
- [ ] Train team on lessons learned

### Breach Notification

**If user data compromised:**

**Within 72 hours:**
1. Assess scope of breach
2. Determine affected users
3. Prepare notification
4. Notify affected users via email
5. Post public notice if widespread
6. Report to authorities if required

**Notification Template:**
```
Subject: Important Security Notice

Dear [User],

We are writing to inform you of a security incident that may have affected your account.

What happened: [Brief description]
What information was involved: [Specific data types]
What we're doing: [Actions taken]
What you should do: [User actions]

We take security seriously and apologize for any concern this may cause.

For questions, contact: security@churchconnect.jp

Sincerely,
ChurchConnect Security Team
```

### Security Contacts

**Report Security Issues:**
- Email: security@churchconnect.jp
- PGP Key: [Public key URL]
- Response time: <24 hours

**Escalation:**
- Security Team Lead: [Email/Phone]
- CTO: [Email/Phone]
- Legal: [Email/Phone]

---

## Compliance Considerations

### GDPR Compliance

**Data Subject Rights:**

**Right to Access:**
```typescript
// Export user data
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reviews: true,
      churches: true,
      // Include all related data
    }
  })

  return JSON.stringify(user, null, 2)
}
```

**Right to Deletion:**
```typescript
// Delete user and all related data
export async function deleteUserData(userId: string) {
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { userId } }),
    prisma.churchAdmin.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
}
```

**Right to Portability:**
- Provide data in JSON format
- Include all user-generated content
- Machine-readable format

**Right to Rectification:**
- Users can update their own data
- Users can request corrections

**Consent:**
- Clear privacy policy
- Cookie consent banner
- Opt-in for marketing emails
- Explicit consent for data processing

### PCI DSS Compliance

**Payment Card Industry Data Security Standard:**

ChurchConnect uses Stripe for payment processing:
- ✅ Never store credit card numbers
- ✅ Never store CVV codes
- ✅ Use Stripe's secure forms
- ✅ Stripe is PCI DSS Level 1 certified
- ✅ All payment data handled by Stripe

**Requirements:**
- Use HTTPS for all pages (✅)
- Secure network transmission (✅)
- Regular security testing (Planned)
- Access control measures (✅)

### Cookie Policy

**Cookies Used:**

**Essential Cookies:**
- `next-auth.session-token` - Authentication session
- `next-auth.csrf-token` - CSRF protection

**Analytics Cookies (Optional):**
- Google Analytics cookies (with user consent)

**Cookie Banner:**
```typescript
// Show cookie consent banner
// Allow users to accept/reject non-essential cookies
// Remember user's choice
// Provide link to cookie policy
```

### Terms of Service

**Required Sections:**
1. Acceptable Use Policy
2. User Content Guidelines
3. Church Verification Process
4. Donation Terms
5. Limitation of Liability
6. Dispute Resolution
7. Governing Law

### Regular Security Audits

**Monthly:**
- [ ] Review access logs
- [ ] Check failed login attempts
- [ ] Review API usage patterns
- [ ] Update dependencies

**Quarterly:**
- [ ] Security audit (internal)
- [ ] Penetration testing (if budget allows)
- [ ] Review and update security policies
- [ ] Security training for team
- [ ] Rotate secrets

**Annually:**
- [ ] Third-party security audit
- [ ] Review compliance requirements
- [ ] Update privacy policy
- [ ] Review data retention policies
- [ ] Security infrastructure review

---

## Security Checklist

### Development Checklist

- [ ] All environment variables properly secured
- [ ] No secrets in code or version control
- [ ] Input validation on all user inputs
- [ ] SQL injection protection (Prisma parameterized queries)
- [ ] XSS protection (React escaping + CSP)
- [ ] CSRF protection (NextAuth tokens)
- [ ] Authentication on protected routes
- [ ] Authorization checks for data access
- [ ] Rate limiting on public endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] No known vulnerabilities (pnpm audit)

### Production Checklist

- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] All API keys rotated from development
- [ ] Database password is strong
- [ ] Stripe live mode keys configured
- [ ] Webhook signatures verified
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Monitoring and alerting configured
- [ ] Backup system operational
- [ ] Incident response plan documented
- [ ] Security contacts updated
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent implemented

### Ongoing Security Tasks

**Daily:**
- [ ] Review security alerts in Sentry
- [ ] Check for unusual login patterns
- [ ] Monitor failed authentication attempts

**Weekly:**
- [ ] Review access logs
- [ ] Check dependency vulnerabilities
- [ ] Review API usage patterns

**Monthly:**
- [ ] Update dependencies
- [ ] Review and rotate temporary credentials
- [ ] Security team meeting

**Quarterly:**
- [ ] Rotate long-lived secrets
- [ ] Security training
- [ ] Review security policies
- [ ] Internal security audit

**Annually:**
- [ ] Third-party security audit
- [ ] Penetration testing
- [ ] Update privacy policy
- [ ] Review compliance requirements

---

## Security Resources

**OWASP Resources:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/

**Security Tools:**
- npm audit / pnpm audit
- Snyk (dependency scanning)
- Sentry (error tracking)
- OWASP ZAP (penetration testing)

**Security Training:**
- OWASP Top 10 training
- Secure coding practices
- Incident response training
- GDPR compliance training

**Report Security Issues:**
- Email: security@churchconnect.jp
- Response time: <24 hours
- Responsible disclosure appreciated

---

**Last Updated:** 2025-10-31
**Document Owner:** Security Team
**Review Frequency:** Quarterly
