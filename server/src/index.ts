import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { meetingRoutes } from './routes/meetings.js'
import { errorHandler } from './errors/handler.js'

const fastify = Fastify({
    logger: true
})

// Plugins
await fastify.register(cors, {
    origin: true, // Allow all origins in dev
    credentials: true,
    exposedHeaders: ['Content-Type', 'X-Accel-Buffering']
})

await fastify.register(multipart, {
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
})

// Error handler
fastify.setErrorHandler(errorHandler)

// Routes
await fastify.register(meetingRoutes, { prefix: '/api' })

// Health check
fastify.get('/health', async () => ({ status: 'ok' }))

// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001')
        await fastify.listen({ port, host: '0.0.0.0' })
        console.log(`🚀 Server running at http://localhost:${port}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
