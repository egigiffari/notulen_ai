import OpenAI from 'openai'
import fs from 'fs'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
})

export const transcribeAudio = async (filePath: string) => {
    if (process.env.OPENAI_API_KEY === 'CHANGE_ME' || !process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not set, returning mock transcription')
        return { text: "Ini adalah transkripsi dummy karena API Key belum diset.", duration: 60 }
    }

    try {
        const fileStream = fs.createReadStream(filePath)
        const response = await openai.audio.transcriptions.create({
            file: fileStream,
            model: 'whisper-1',
        })
        return { text: response.text, duration: 0 } // Whisper API doesn't return duration directly usually, but we can estimate or client sends it.
    } catch (error) {
        console.error('STT Error:', error)
        throw createError({ statusCode: 500, statusMessage: 'STT Failed' })
    }
}

export const generateSummary = async (text: string, mode: string) => {
    if (process.env.OPENAI_API_KEY === 'CHANGE_ME' || !process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not set, returning mock summary')
        return {
            ringkasan: "Ini adalah ringkasan dummy karena API Key belum diset. Rapat membahas berbagai topik penting yang perlu ditindaklanjuti.",
            agenda: [
                "Pembukaan dan perkenalan",
                "Review progress minggu lalu",
                "Diskusi rencana ke depan"
            ],
            keputusan: [
                "Setuju untuk melanjutkan proyek fase 2",
                "Budget disetujui untuk Q1"
            ],
            action_items: [
                { task: "Finalisasi dokumen proposal", owner: "Tim A" },
                { task: "Setup meeting lanjutan", owner: "Tim B" }
            ]
        }
    }

    let prompt = ''
    if (mode === 'IMPORTANT') {
        prompt = 'Buat ringkasan yang fokus pada poin penting.'
    } else if (mode === 'DETAILED') {
        prompt = 'Buat ringkasan yang sangat detail.'
    } else {
        prompt = 'Buat ringkasan standar.'
    }

    prompt += `\n\nTranskripsi:\n${text}\n\nOutput dalam JSON format: { ringkasan, agenda, keputusan, action_items }`

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant that summarizes meetings into JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        })

        return JSON.parse(completion.choices[0].message.content || '{}')
    } catch (error) {
        console.error('Summary Error:', error)
        throw createError({ statusCode: 500, statusMessage: 'Summary Failed' })
    }
}
