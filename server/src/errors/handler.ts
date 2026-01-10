import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from './AppError.js'
import { v4 as uuid } from 'uuid'

export function errorHandler(
    error: FastifyError | AppError,
    request: FastifyRequest,
    reply: FastifyReply
) {
    const requestId = uuid()

    // Log error
    request.log.error({ err: error, requestId }, 'Request error')

    // Handle AppError
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            success: false,
            error: {
                code: error.code,
                requestId
            }
        })
    }

    // Handle Fastify validation errors
    if (error.validation) {
        return reply.status(400).send({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                requestId
            }
        })
    }

    // Handle unknown errors
    return reply.status(500).send({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            requestId
        }
    })
}
