import OpenAI from 'openai'
import { SummaryMode } from '../../generated/prisma/index.js'

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioBuffer: Buffer, filename: string = 'audio.webm'): Promise<string> {
    console.log(`Transcribing audio: ${audioBuffer.length} bytes`)

    // Create a File-like object from buffer
    const file = new File([audioBuffer], filename, { type: 'audio/webm' })

    const response = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'id', // Indonesian
        response_format: 'text'
    })

    console.log(`Transcription complete: ${response.substring(0, 100)}...`)
    return response
}

/**
 * Generate summary using GPT-4o-mini
 */
export async function generateSummary(
    transcript: string,
    mode: SummaryMode = 'STANDARD',
    title?: string
): Promise<{
    ringkasan_umum: string
    agenda: string[]
    keputusan: string[]
    tindak_lanjut: string[]
}> {
    console.log(`Generating summary with mode: ${mode}`)

    const systemPrompt = getSystemPrompt(mode)
    const userPrompt = getUserPrompt(transcript, title, mode)

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
        throw new Error('No response from GPT')
    }

    const parsed = JSON.parse(content)
    console.log('Summary generated successfully')

    return {
        ringkasan_umum: parsed.ringkasan_umum || '',
        agenda: parsed.agenda || [],
        keputusan: parsed.keputusan || [],
        tindak_lanjut: parsed.tindak_lanjut || []
    }
}

/**
 * Get system prompt based on mode
 */
function getSystemPrompt(mode: SummaryMode): string {
    const basePrompt = `Kamu adalah asisten yang sangat ahli dalam membuat notulen rapat. 
Tugasmu adalah menganalisis transkrip rapat dan menghasilkan ringkasan dalam format JSON.

Output HARUS dalam format JSON dengan struktur:
{
  "ringkasan_umum": "string - ringkasan keseluruhan rapat",
  "agenda": ["string - poin agenda yang dibahas"],
  "keputusan": ["string - keputusan yang diambil"],
  "tindak_lanjut": ["string - action items dengan PIC dan deadline jika ada"]
}`

    switch (mode) {
        case 'IMPORTANT':
            return `${basePrompt}

MODE: POIN PENTING
- Fokus hanya pada poin-poin KRITIS dan keputusan paling penting
- Ringkasan singkat dan padat, maksimal 2-3 kalimat
- Hanya tampilkan keputusan dan tindak lanjut yang paling urgent
- Abaikan detail minor dan diskusi yang tidak berakhir dengan keputusan`

        case 'DETAILED':
            return `${basePrompt}

MODE: DETAIL LENGKAP
- Sertakan semua detail diskusi yang relevan
- Ringkasan komprehensif mencakup konteks dan latar belakang
- Dokumentasikan semua poin yang dibahas meskipun tidak ada keputusan final
- Sertakan nuansa diskusi, pro-kontra, dan pertimbangan yang muncul
- Untuk tindak lanjut, sertakan detail lengkap termasuk dependensi`

        default: // STANDARD
            return `${basePrompt}

MODE: STANDAR
- Berikan ringkasan seimbang antara ringkas dan informatif
- Sertakan poin-poin utama tanpa detail berlebihan
- Fokus pada hasil dan keputusan yang jelas
- Tindak lanjut dengan PIC dan deadline yang realistis`
    }
}

/**
 * Get user prompt with transcript
 */
function getUserPrompt(transcript: string, title?: string, mode?: SummaryMode): string {
    const meetingTitle = title ? `Judul Rapat: ${title}\n\n` : ''

    return `${meetingTitle}Transkrip Rapat:
"""
${transcript}
"""

Buatlah notulen rapat dalam format JSON sesuai instruksi.`
}
