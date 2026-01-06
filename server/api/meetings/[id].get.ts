

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID is required',
        })
    }

    const meeting = await prisma.meeting.findUnique({
        where: { id },
        include: {
            summary: true,
        },
    })

    if (!meeting) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Meeting not found',
        })
    }

    return meeting
})
