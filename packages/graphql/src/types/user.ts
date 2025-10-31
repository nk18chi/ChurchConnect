import { builder } from '../builder'

// User Role Enum
export const UserRoleEnum = builder.enumType('UserRole', {
  values: ['USER', 'CHURCH_ADMIN', 'ADMIN'] as const,
})

// User Type
builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    role: t.expose('role', { type: UserRoleEnum }),
    image: t.exposeString('image', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
})

// Current User Query
builder.queryField('currentUser', (t) =>
  t.prismaField({
    type: 'User',
    nullable: true,
    resolve: async (query, _root, _args, ctx) => {
      if (!ctx.userId) {
        return null
      }

      return ctx.prisma.user.findUnique({
        ...query,
        where: { id: ctx.userId },
      })
    },
  })
)

// Register Mutation Input
const RegisterInput = builder.inputType('RegisterInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
    name: t.string({ required: false }),
  }),
})

// Login Mutation Input
const LoginInput = builder.inputType('LoginInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
  }),
})

// Auth Response Type
const AuthResponse = builder.objectType('AuthResponse', {
  fields: (t) => ({
    success: t.boolean(),
    message: t.string({ nullable: true }),
    user: t.field({
      type: 'User',
      nullable: true,
    }),
  }),
})

// Register Mutation
builder.mutationField('register', (t) =>
  t.field({
    type: AuthResponse,
    args: {
      input: t.arg({ type: RegisterInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { email, password, name } = args.input

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
          user: null,
        }
      }

      // Import dynamically to avoid circular dependencies
      const { createUser } = await import('@repo/auth')

      // Create user
      const user = await createUser(email, password, name)

      return {
        success: true,
        message: 'User registered successfully',
        user,
      }
    },
  })
)

// Update User Role Mutation (Admin only)
builder.mutationField('updateUserRole', (t) =>
  t.prismaField({
    type: 'User',
    args: {
      userId: t.arg.string({ required: true }),
      role: t.arg({ type: UserRoleEnum, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      // Check if current user is an admin
      if (ctx.userRole !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
      }

      return ctx.prisma.user.update({
        ...query,
        where: { id: args.userId },
        data: { role: args.role },
      })
    },
  })
)
