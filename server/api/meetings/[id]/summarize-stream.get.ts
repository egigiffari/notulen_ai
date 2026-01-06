import { generateSummaryStream } from '../../../utils/ai'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const mode = (query.mode as string) || 'STANDARD'

    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Required' })

    // Get Meeting Transcript
    const meeting = await prisma.meeting.findUnique({ where: { id } })
    if (!meeting || !meeting.transcript) {
        throw createError({ statusCode: 400, statusMessage: 'Transcript not found. Please upload audio first.' })
    }

    if (meeting.status === 'COMPLETED') {
        throw createError({ statusCode: 400, statusMessage: 'Session is closed. Cannot re-generate summary.' })
    }

    // Set SSE headers
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')

    // Create readable stream for SSE
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            let fullContent = ''

            try {
                // Stream chunks from AI
                for await (const chunk of generateSummaryStream(meeting.transcript!, mode)) {
                    fullContent += chunk
                    // Send SSE formatted data
                    const data = `data: ${JSON.stringify({ chunk })}\n\n`
                    controller.enqueue(encoder.encode(data))
                }

                // Send done event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))

                // Save final content to database
                await prisma.summary.upsert({
                    where: { meetingId: id },
                    update: {
                        mode,
                        content: fullContent
                    },
                    create: {
                        meetingId: id!,
                        mode,
                        content: fullContent
                    }
                })

            } catch (error) {
                console.error('SSE Stream Error:', error)
                const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`
                controller.enqueue(encoder.encode(errorData))
            } finally {
                controller.close()
            }
        }
    })

    return stream
})
