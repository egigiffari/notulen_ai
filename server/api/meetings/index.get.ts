import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const meetings = await prisma.meeting.findMany({
        orderBy: {
            startedAt: 'desc',
        },
    })

    return meetings
})
