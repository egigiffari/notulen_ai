import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { transcribeAudio } from '../../../utils/ai'

// Note: In real app, move business logic to services (Phase 3)
export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Required' })

    const body = await readMultipartFormData(event)
    if (!body) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

    const audioFile = body.find(item => item.name === 'audio')
    const saveAudioField = body.find(item => item.name === 'saveAudio')
    const saveAudio = saveAudioField?.data.toString() === 'true'

    const durationField = body.find(item => item.name === 'duration')
    let durationSeconds = durationField ? parseInt(durationField.data.toString()) : 0

    if (!audioFile || !audioFile.filename) {
        throw createError({ statusCode: 400, statusMessage: 'Audio file missing' })
    }

    // Ensure public/audio exists
    const uploadDir = join(process.cwd(), 'public', 'audio')
    await mkdir(uploadDir, { recursive: true })

    // Save file temporarily (or permanently if saveAudio is true)
    // For MVP, we save it to process it, and later cleanup if saveAudio is false.
    // Actually, STT needs existing file or buffer. We have buffer.

    const filename = `${id}-${Date.now()}-${audioFile.filename}`
    const filePath = join(uploadDir, filename)

    await writeFile(filePath, audioFile.data)

    // Call STT Service
    let transcript = ''
    if (durationSeconds === 0) durationSeconds = 60 // Fallback only if 0
    try {
        const result = await transcribeAudio(filePath)
        transcript = result.text
        // durationSeconds = result.duration || durationSeconds // Use duration from file if available
    } catch (e) {
        console.error(e)
        // Fallback or error? For MVP, maybe allow continue?
    }

    // Update Meeting
    await prisma.meeting.update({
        where: { id },
        data: {
            audioPath: `/audio/${filename}`,
            audioSaved: saveAudio,
            durationSeconds,
            transcript,
        }
    })

    return {
        message: 'Audio berhasil diproses',
        durationSeconds
    }
})
