

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const title = body?.title || 'Rapat Baru'

    const meeting = await prisma.meeting.create({
        data: {
            title,
        },
    })

    return meeting
})
