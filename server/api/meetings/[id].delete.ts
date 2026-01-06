import { unlink } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Required' })

    // 1. Get Meeting to find audio path
    const meeting = await prisma.meeting.findUnique({
        where: { id }
    })

    if (!meeting) {
        throw createError({ statusCode: 404, statusMessage: 'Meeting not found' })
    }

    // 2. Delete audio file if it exists
    if (meeting.audioPath) {
        try {
            const fullPath = join(process.cwd(), 'public', meeting.audioPath)
            await unlink(fullPath)
        } catch (e) {
            console.warn(`Could not delete audio file: ${meeting.audioPath}`, e)
        }
    }

    // 3. Delete meeting (Prisma will handle Summary deletion if configured with onCascade, 
    // but standard setup usually needs manual delete for Summary first or rely on schema)
    // Checking schema... Summary has @unique meetingId and Summary? in Meeting.
    // Let's delete Summary first just in case.
    try {
        await prisma.summary.deleteMany({
            where: { meetingId: id }
        })

        await prisma.meeting.delete({
            where: { id }
        })

        return { success: true, message: 'Meeting and audio deleted successfully' }
    } catch (error) {
        console.error('Delete Meeting Error:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete meeting' })
    }
})
