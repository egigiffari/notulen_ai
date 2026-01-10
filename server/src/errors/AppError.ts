// Error codes as defined in 06_API_CONTRACT.md
export const ErrorCodes = {
    // Client / Request
    INVALID_REQUEST: { code: 'INVALID_REQUEST', status: 400 },
    PAYLOAD_TOO_LARGE: { code: 'PAYLOAD_TOO_LARGE', status: 413 },
    UNAUTHORIZED_ACTION: { code: 'UNAUTHORIZED_ACTION', status: 401 },

    // Meeting / State
    MEETING_NOT_FOUND: { code: 'MEETING_NOT_FOUND', status: 404 },
    INVALID_MEETING_STATE: { code: 'INVALID_MEETING_STATE', status: 409 },
    SESSION_ALREADY_CLOSED: { code: 'SESSION_ALREADY_CLOSED', status: 409 },

    // AI / System
    FAILED_THIRD_PARTY: { code: 'FAILED_THIRD_PARTY', status: 503 },
    AI_QUOTA_EXCEEDED: { code: 'AI_QUOTA_EXCEEDED', status: 429 },
    SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', status: 503 },
    INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 }
} as const

export type ErrorCode = keyof typeof ErrorCodes

export class AppError extends Error {
    code: string
    statusCode: number
    requestId?: string

    constructor(errorCode: ErrorCode, requestId?: string) {
        const errorDef = ErrorCodes[errorCode]
        super(errorCode)
        this.code = errorDef.code
        this.statusCode = errorDef.status
        this.requestId = requestId
        this.name = 'AppError'
    }
}
