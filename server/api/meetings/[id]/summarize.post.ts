import { generateSummary } from '../../../utils/ai'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const mode = body?.mode || 'STANDARD' // STANDARD, IMPORTANT, DETAILED

    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Required' })

    // Get Meeting Transcript
    const meeting = await prisma.meeting.findUnique({ where: { id } })
    if (!meeting || !meeting.transcript) {
        throw createError({ statusCode: 400, statusMessage: 'Transcript not found. Please upload audio first.' })
    }

    if (meeting.status === 'COMPLETED') {
        throw createError({ statusCode: 400, statusMessage: 'Session is closed. Cannot re-generate summary.' })
    }

    // Call LLM Service (now returns markdown string)
    const content = await generateSummary(meeting.transcript, mode)

    const summary = await prisma.summary.upsert({
        where: { meetingId: id },
        update: {
            mode,
            content: content
        },
        create: {
            meetingId: id,
            mode,
            content: content
        }
    })

    return summary
})
