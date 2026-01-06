export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Required' })

    const body = await readBody(event)
    const { title } = body

    try {
        const meeting = await prisma.meeting.update({
            where: { id },
            data: { title },
            include: { summary: true }
        })
        return meeting
    } catch (error) {
        console.error('Update Meeting Error:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to update meeting' })
    }
})
