import { prisma } from '../lib/prisma.js'
import { SummaryMode } from '../../generated/prisma/index.js'
import { transcribeAudio, generateSummary } from '../services/AIAdapter.js'

interface SSEClient {
    write: (data: string) => void
    meetingId: string
}

// In-memory store for SSE clients
const sseClients: Map<string, Set<SSEClient>> = new Map()

// In-memory job tracking (single job per meeting)
const runningJobs: Set<string> = new Set()

// In-memory audio storage (temporary, cleared after transcription)
const meetingAudioBuffers: Map<string, Buffer> = new Map()

/**
 * Store audio buffer for a meeting (temporary, in-memory only)
 */
export function storeAudioBuffer(meetingId: string, audioBuffer: Buffer) {
    meetingAudioBuffers.set(meetingId, audioBuffer)
    console.log(`Stored audio for meeting ${meetingId}: ${audioBuffer.length} bytes`)
}

/**
 * Get and clear audio buffer for a meeting
 */
function getAndClearAudioBuffer(meetingId: string): Buffer | undefined {
    const buffer = meetingAudioBuffers.get(meetingId)
    meetingAudioBuffers.delete(meetingId)
    return buffer
}

/**
 * Register an SSE client for a meeting
 */
export function registerSSEClient(meetingId: string, client: SSEClient) {
    if (!sseClients.has(meetingId)) {
        sseClients.set(meetingId, new Set())
    }
    sseClients.get(meetingId)!.add(client)
}

/**
 * Unregister an SSE client
 */
export function unregisterSSEClient(meetingId: string, client: SSEClient) {
    const clients = sseClients.get(meetingId)
    if (clients) {
        clients.delete(client)
        if (clients.size === 0) {
            sseClients.delete(meetingId)
        }
    }
}

/**
 * Emit SSE event to all clients for a meeting
 */
function emitToClients(meetingId: string, event: string, data: object) {
    const clients = sseClients.get(meetingId)
    if (clients) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        clients.forEach(client => {
            try {
                client.write(message)
            } catch (e) {
                // Client disconnected, will be cleaned up
            }
        })
    }
}

/**
 * Check if a job is already running for a meeting
 */
export function isJobRunning(meetingId: string): boolean {
    return runningJobs.has(meetingId)
}

/**
 * Start summary job for a meeting
 * This runs asynchronously and is independent of client connections
 */
export async function startSummaryJob(meetingId: string, mode: SummaryMode = 'STANDARD') {
    // Single-flight: prevent duplicate jobs
    if (runningJobs.has(meetingId)) {
        console.log(`Job already running for meeting ${meetingId}`)
        return
    }

    runningJobs.add(meetingId)
    console.log(`Starting summary job for meeting ${meetingId} with mode ${mode}`)

    try {
        // Get meeting info
        const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } })
        if (!meeting || meeting.state !== 'PROCESSING') {
            console.log(`Meeting ${meetingId} not in PROCESSING state, aborting job`)
            return
        }

        // Step 1: Get audio buffer and transcribe
        emitToClients(meetingId, 'info', { message: 'Memproses audio...' })

        const audioBuffer = getAndClearAudioBuffer(meetingId)
        let transcript: string

        if (audioBuffer && audioBuffer.length > 0) {
            // Real transcription with Whisper
            emitToClients(meetingId, 'info', { message: 'Mentranskripsi audio dengan Whisper...' })

            try {
                transcript = await transcribeAudio(audioBuffer)
            } catch (error) {
                console.error('Whisper transcription failed:', error)
                throw new Error('Gagal mentranskripsi audio')
            }
        } else {
            // No audio - use existing transcript or placeholder
            transcript = meeting.transcript || 'Tidak ada audio yang tersedia untuk ditranskripsi.'
        }

        // Save transcript to meeting
        await prisma.meeting.update({
            where: { id: meetingId },
            data: {
                transcript,
                processedChunks: 1,
                totalChunks: 1
            }
        })

        emitToClients(meetingId, 'progress', { processedChunks: 1, totalChunks: 1 })

        // Step 2: Generate summary with AI
        emitToClients(meetingId, 'info', { message: 'Menghasilkan ringkasan dengan AI...' })

        let summaryContent: {
            ringkasan_umum: string
            agenda: string[]
            keputusan: string[]
            tindak_lanjut: string[]
        }

        try {
            summaryContent = await generateSummary(transcript, mode, meeting.title || undefined)
        } catch (error) {
            console.error('Summary generation failed:', error)
            throw new Error('Gagal menghasilkan ringkasan')
        }

        // Emit section previews
        emitToClients(meetingId, 'section', {
            type: 'ringkasan_umum',
            content: summaryContent.ringkasan_umum
        })
        await sleep(300)

        emitToClients(meetingId, 'section', {
            type: 'agenda',
            content: summaryContent.agenda
        })
        await sleep(300)

        emitToClients(meetingId, 'section', {
            type: 'keputusan',
            content: summaryContent.keputusan
        })
        await sleep(300)

        emitToClients(meetingId, 'section', {
            type: 'tindak_lanjut',
            content: summaryContent.tindak_lanjut
        })
        await sleep(300)

        // Check if summary exists for this meeting (for regeneration)
        const existingSummary = await prisma.summary.findUnique({
            where: { meetingId }
        })

        if (existingSummary) {
            // Update existing summary
            await prisma.summary.update({
                where: { meetingId },
                data: {
                    mode,
                    content: JSON.stringify(summaryContent)
                }
            })
        } else {
            // Create new summary
            await prisma.summary.create({
                data: {
                    meetingId,
                    mode,
                    content: JSON.stringify(summaryContent)
                }
            })
        }

        // Transition state to SUMMARY_READY
        await prisma.meeting.update({
            where: { id: meetingId },
            data: { state: 'SUMMARY_READY' }
        })

        console.log(`Summary job completed for meeting ${meetingId}`)

        // Emit done event
        emitToClients(meetingId, 'done', {})

    } catch (error: any) {
        console.error(`Summary job failed for meeting ${meetingId}:`, error)

        // Emit error event
        emitToClients(meetingId, 'error', {
            code: 'FAILED_THIRD_PARTY',
            message: error.message || 'Terjadi kesalahan saat memproses',
            requestId: `job_${meetingId}`
        })
    } finally {
        runningJobs.delete(meetingId)
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
