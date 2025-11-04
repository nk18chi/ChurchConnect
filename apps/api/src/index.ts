import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import cors from 'cors'
import express from 'express'
import http from 'http'
import { schema } from '@repo/graphql'
import { createContext } from './context'
import { initSentry, isSentryInitialized, Sentry } from './sentry'

// Initialize Sentry
const sentryEnabled = initSentry()

const PORT = process.env.PORT || 4000

async function startServer() {
  const app = express()
  const httpServer = http.createServer(app)

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  })

  await server.start()

  // Configure CORS for Next.js apps
  const corsOptions = {
    origin: [
      'http://localhost:3000', // web app
      'http://localhost:3001', // church-portal app
      'http://localhost:3002', // admin app
      process.env.WEB_URL || '',
      process.env.CHURCH_PORTAL_URL || '',
      process.env.ADMIN_URL || '',
    ].filter(Boolean),
    credentials: true,
  }

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(corsOptions),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  )

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Sentry error handler (only if Sentry is initialized)
  if (sentryEnabled) {
    app.use(Sentry.Handlers.errorHandler())
  }

  // Start the server
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve))

  console.log(`🚀 Apollo Server ready at http://localhost:${PORT}/graphql`)
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`)
}

startServer().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
