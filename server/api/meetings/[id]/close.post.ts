

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Required' })

    const meeting = await prisma.meeting.update({
        where: { id },
        data: {
            status: 'COMPLETED',
            endedAt: new Date()
        }
    })

    // Cleanup audio if not saved
    if (!meeting.audioSaved && meeting.audioPath) {
        try {
            // audioPath is like /audio/filename.webm
            const filename = meeting.audioPath.split('/').pop()
            if (filename) {
                const { join } = await import('path')
                const { unlink } = await import('fs/promises')
                const filePath = join(process.cwd(), 'public', 'audio', filename)
                await unlink(filePath)

                // Optional: clear path in DB to reflect deletion
                await prisma.meeting.update({
                    where: { id },
                    data: { audioPath: null }
                })
            }
        } catch (e) {
            console.error('Failed to cleanup audio', e)
        }
    }

    return { status: 'COMPLETED' }
})
