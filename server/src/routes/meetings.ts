import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../errors/AppError.js'
import { assertState, assertTransition } from '../guards/StateGuard.js'
import { MeetingState, SummaryMode } from '../../generated/prisma/index.js'
import { startSummaryJob, registerSSEClient, unregisterSSEClient, isJobRunning, storeAudioBuffer } from '../jobs/JobManager.js'

interface CreateMeetingBody {
    title?: string
    participantEstimate?: number
}

interface CloseRecordingBody {
    totalChunks: number
    durationSeconds: number
}

interface ResumeSummaryBody {
    mode?: 'STANDARD' | 'IMPORTANT' | 'DETAILED'
}

interface RenameMeetingBody {
    title: string
}

export async function meetingRoutes(fastify: FastifyInstance) {

    // POST /api/meetings - Create meeting & start recording
    fastify.post('/meetings', async (request: FastifyRequest<{ Body: CreateMeetingBody }>, reply: FastifyReply) => {
        const { title, participantEstimate } = request.body || {}

        const meeting = await prisma.meeting.create({
            data: {
                title,
                participantEstimate,
                state: 'RECORDING',
                startedAt: new Date()
            }
        })

        return reply.status(201).send({
            success: true,
            data: {
                meetingId: meeting.id,
                state: meeting.state
            }
        })
    })

    // GET /api/meetings - List meetings (history)
    fastify.get('/meetings', async (request, reply) => {
        const meetings = await prisma.meeting.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                state: true,
                startedAt: true,
                endedAt: true,
                durationSeconds: true,
                createdAt: true
            }
        })

        return reply.send({
            success: true,
            data: meetings
        })
    })

    // PATCH /api/meetings/:id - Rename meeting
    fastify.patch('/meetings/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: RenameMeetingBody }>, reply) => {
        const { id } = request.params
        const { title } = request.body || {}

        if (!title || typeof title !== 'string') {
            throw new AppError('INVALID_REQUEST')
        }

        const meeting = await prisma.meeting.findUnique({ where: { id } })
        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // Rename allowed: CREATED, SUMMARY_READY, COMPLETED
        // Rename blocked: RECORDING, PROCESSING
        if (['RECORDING', 'PROCESSING'].includes(meeting.state)) {
            throw new AppError('INVALID_MEETING_STATE')
        }

        const updated = await prisma.meeting.update({
            where: { id },
            data: { title: title.trim() }
        })

        return reply.send({
            success: true,
            data: {
                meetingId: updated.id,
                title: updated.title
            }
        })
    })

    // DELETE /api/meetings/:id - Hard delete meeting
    fastify.delete('/meetings/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const { id } = request.params

        const meeting = await prisma.meeting.findUnique({ where: { id } })
        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // Delete allowed: CREATED, SUMMARY_READY, COMPLETED
        // Delete blocked: RECORDING, PROCESSING
        if (['RECORDING', 'PROCESSING'].includes(meeting.state)) {
            throw new AppError('INVALID_MEETING_STATE')
        }

        // Cascade delete is handled by Prisma schema
        await prisma.meeting.delete({ where: { id } })

        return reply.send({
            success: true,
            data: { deleted: true }
        })
    })

    // GET /api/meetings/:id/status - Get meeting status
    fastify.get('/meetings/:id/status', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const { id } = request.params

        const meeting = await prisma.meeting.findUnique({
            where: { id },
            select: {
                id: true,
                state: true,
                processedChunks: true,
                totalChunks: true,
                title: true,
                startedAt: true,
                endedAt: true,
                durationSeconds: true
            }
        })

        if (!meeting) {
            throw new AppError('MEETING_NOT_FOUND')
        }

        return reply.send({
            success: true,
            data: meeting
        })
    })

    // POST /api/meetings/:id/chunks - Upload audio chunk
    fastify.post('/meetings/:id/chunks', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const { id } = request.params

        const meeting = await prisma.meeting.findUnique({ where: { id } })
        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // Only allow in RECORDING state
        assertState(meeting.state, 'RECORDING')

        // Handle multipart upload
        const data = await request.file()
        if (!data) {
            throw new AppError('INVALID_REQUEST')
        }

        // In production, save chunk to storage and process with Whisper
        // For now, just acknowledge receipt
        const buffer = await data.toBuffer()

        return reply.send({
            success: true,
            data: {
                received: true,
                size: buffer.length
            }
        })
    })

    // POST /api/meetings/:id/close - Close recording, start processing
    fastify.post('/meetings/:id/close', async (request: FastifyRequest<{ Params: { id: string }, Body: CloseRecordingBody }>, reply) => {
        const { id } = request.params
        const { totalChunks, durationSeconds } = request.body || { totalChunks: 1, durationSeconds: 0 }

        const meeting = await prisma.meeting.findUnique({ where: { id } })
        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // Validate transition: RECORDING → PROCESSING
        assertTransition(meeting.state, 'PROCESSING')

        // Update meeting state
        const updated = await prisma.meeting.update({
            where: { id },
            data: {
                state: 'PROCESSING',
                endedAt: new Date(),
                totalChunks,
                durationSeconds
            }
        })

        // Note: Job is NOT started here - it starts when audio is uploaded
        // or when client connects to SSE stream

        return reply.send({
            success: true,
            data: {
                meetingId: updated.id,
                state: updated.state
            }
        })
    })

    // POST /api/meetings/:id/upload-audio - Upload audio blob for transcription
    fastify.post('/meetings/:id/upload-audio', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const { id } = request.params

        const meeting = await prisma.meeting.findUnique({ where: { id } })
        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // Only allow in PROCESSING state
        assertState(meeting.state, 'PROCESSING')

        // Handle multipart upload
        const data = await request.file()
        if (!data) {
            throw new AppError('INVALID_REQUEST')
        }

        const buffer = await data.toBuffer()
        console.log(`Received audio for meeting ${id}: ${buffer.length} bytes`)

        // Store audio buffer in memory for Job Manager
        storeAudioBuffer(id, buffer)

        // Start job immediately after audio upload
        startSummaryJob(id, 'STANDARD')

        return reply.send({
            success: true,
            data: {
                received: true,
                size: buffer.length,
                meetingId: id
            }
        })
    })

    // GET /api/meetings/:id/summary - Get final summary (REST only)
    fastify.get('/meetings/:id/summary', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const { id } = request.params

        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: { summary: true }
        })

        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // Only allow in SUMMARY_READY
        assertState(meeting.state, ['SUMMARY_READY'])

        if (!meeting.summary) {
            throw new AppError('INVALID_MEETING_STATE')
        }

        return reply.send({
            success: true,
            data: {
                mode: meeting.summary.mode,
                content: JSON.parse(meeting.summary.content)
            }
        })
    })

    // POST /api/meetings/:id/resume-summary - Resume job or regenerate with new mode
    fastify.post('/meetings/:id/resume-summary', async (request: FastifyRequest<{ Params: { id: string }, Body: ResumeSummaryBody }>, reply) => {
        const { id } = request.params
        const { mode = 'STANDARD' } = request.body || {}

        const meeting = await prisma.meeting.findUnique({ where: { id } })
        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // Allow regeneration from PROCESSING or SUMMARY_READY state
        assertState(meeting.state, ['PROCESSING', 'SUMMARY_READY'])

        // If in SUMMARY_READY, transition back to PROCESSING for regeneration
        if (meeting.state === 'SUMMARY_READY') {
            await prisma.meeting.update({
                where: { id },
                data: { state: 'PROCESSING' }
            })
        }

        // Start job with specified mode
        startSummaryJob(id, mode as SummaryMode)

        return reply.send({
            success: true,
            data: {
                meetingId: id,
                queued: true,
                mode
            }
        })
    })

    // GET /api/meetings/:id/summary/stream - SSE endpoint
    fastify.get('/meetings/:id/summary/stream', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        const { id } = request.params

        const meeting = await prisma.meeting.findUnique({ where: { id } })
        if (!meeting) throw new AppError('MEETING_NOT_FOUND')

        // SSE only allowed in PROCESSING state
        assertState(meeting.state, 'PROCESSING')

        // Set SSE headers with CORS
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
        })

        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
            reply.raw.write('event: ping\ndata: {}\n\n')
        }, 15000)

        // Create SSE client wrapper
        const sseClient = {
            write: (data: string) => reply.raw.write(data),
            meetingId: id
        }

        // Register client for events
        registerSSEClient(id, sseClient)

        // Cleanup on close
        request.raw.on('close', () => {
            clearInterval(pingInterval)
            unregisterSSEClient(id, sseClient)
        })

        // Send initial connected message
        reply.raw.write('event: info\ndata: {"message":"Connected to summary stream"}\n\n')

        // If no job running, start one
        if (!isJobRunning(id)) {
            startSummaryJob(id, 'STANDARD')
        }
    })
}
