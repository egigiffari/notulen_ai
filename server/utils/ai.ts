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
        return { text: response.text, duration: 0 }
    } catch (error) {
        console.error('STT Error:', error)
        throw createError({ statusCode: 500, statusMessage: 'STT Failed' })
    }
}

// System prompt for professional meeting notes
const getSystemPrompt = () => `Anda adalah notulis rapat profesional yang berpengalaman.

Tugas Anda adalah membuat notulen rapat berdasarkan transkrip yang diberikan.

**Aturan Penting:**
- Gunakan bahasa yang sama dengan transkrip (Indonesia atau Inggris)
- Tulis dalam format Markdown yang rapi dan mudah dibaca
- Fokus hanya pada informasi yang ada dalam transkrip
- Jangan mengarang atau menambahkan informasi yang tidak disebutkan
- Gunakan gaya penulisan yang formal namun natural
- Struktur harus jelas dengan heading, subheading, dan bullet points

**Format Output:** Markdown murni tanpa code block pembungkus.`

// Mode-specific instructions
const getModeInstructions = (mode: string): string => {
    switch (mode) {
        case 'IMPORTANT':
            return `**Mode: Poin Penting**

Buat ringkasan yang sangat ringkas dan langsung ke inti.
- Fokus hanya pada keputusan krusial dan action items utama
- Maksimal 5 poin per bagian
- Cocok untuk dibaca cepat oleh pimpinan dalam 1 menit
- Hilangkan detail konteks, fokus pada kesimpulan`

        case 'DETAILED':
            return `**Mode: Detail Lengkap**

Buat notulen yang komprehensif dan mendalam.
- Sertakan konteks pembahasan untuk setiap poin
- Jelaskan alasan di balik keputusan jika disebutkan
- Catat semua action items dengan detail PIC dan deadline jika ada
- Sertakan poin-poin diskusi penting
- Tetap terstruktur dan tidak bertele-tele`

        default: // STANDARD
            return `**Mode: Standar**

Buat ringkasan yang seimbang dan profesional.
- Ringkasan umum pembahasan rapat
- Daftar agenda yang dibahas
- Keputusan-keputusan yang diambil
- Action items dengan PIC jika disebutkan
- Tidak terlalu singkat, tidak terlalu detail`
    }
}

// Build complete user prompt
const buildUserPrompt = (transcript: string, mode: string): string => {
    const modeInstructions = getModeInstructions(mode)

    return `${modeInstructions}

---

**Transkrip Rapat:**

${transcript}

---

Buatkan notulen rapat berdasarkan transkrip di atas dalam format Markdown.`
}

// Mock markdown response for development
const getMockMarkdownResponse = (mode: string): string => {
    if (mode === 'IMPORTANT') {
        return `## 🎯 Poin Penting Rapat

### Keputusan Utama
- **Proyek fase 2 disetujui** untuk dilanjutkan
- Budget Q1 sudah dikonfirmasi

### Action Items Prioritas
1. Tim A — Finalisasi proposal minggu ini
2. Tim B — Setup meeting lanjutan dengan stakeholder`
    }

    if (mode === 'DETAILED') {
        return `## 📋 Notulen Rapat Lengkap

### Ringkasan Pembahasan
Rapat ini membahas beberapa topik penting terkait progres proyek dan perencanaan ke depan. Diskusi berjalan dengan baik dan menghasilkan beberapa keputusan strategis.

### Agenda yang Dibahas
1. **Pembukaan dan Perkenalan**
   - Semua peserta hadir tepat waktu
   - Agenda rapat dijelaskan di awal

2. **Review Progress Minggu Lalu**
   - Tim development melaporkan progress 80%
   - Beberapa blocker minor sudah diselesaikan

3. **Diskusi Rencana Ke Depan**
   - Pembahasan timeline untuk fase berikutnya
   - Alokasi resource dibahas secara detail

### Keputusan yang Diambil
- ✅ Proyek fase 2 **disetujui** untuk dilanjutkan
- ✅ Budget untuk Q1 telah **dikonfirmasi** oleh finance
- ✅ Timeline delivery ditetapkan akhir bulan ini

### Action Items
| No | Task | PIC | Deadline |
|----|------|-----|----------|
| 1 | Finalisasi dokumen proposal | Tim A | Minggu ini |
| 2 | Setup meeting lanjutan | Tim B | Besok |
| 3 | Review budget detail | Finance | Jumat |

### Catatan Tambahan
Rapat berikutnya dijadwalkan minggu depan untuk follow-up progress.`
    }

    // STANDARD
    return `## 📝 Ringkasan Rapat

### Gambaran Umum
Rapat membahas berbagai topik penting yang perlu ditindaklanjuti oleh tim.

### Agenda
- Pembukaan dan perkenalan
- Review progress minggu lalu
- Diskusi rencana ke depan

### Keputusan
- Setuju untuk melanjutkan proyek fase 2
- Budget Q1 telah disetujui

### Action Items
- **Tim A** — Finalisasi dokumen proposal
- **Tim B** — Setup meeting lanjutan`
}

// Generate summary (non-streaming, for backward compatibility)
export const generateSummary = async (text: string, mode: string) => {
    if (process.env.OPENAI_API_KEY === 'CHANGE_ME' || !process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not set, returning mock markdown')
        return getMockMarkdownResponse(mode)
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: getSystemPrompt() },
                { role: "user", content: buildUserPrompt(text, mode) }
            ],
            temperature: 0.3,
            max_tokens: 2000
        })

        return completion.choices[0].message.content || ''
    } catch (error) {
        console.error('Summary Error:', error)
        throw createError({ statusCode: 500, statusMessage: 'Summary Failed' })
    }
}

// Generate summary with streaming (returns async iterator)
export const generateSummaryStream = async function* (text: string, mode: string) {
    if (process.env.OPENAI_API_KEY === 'CHANGE_ME' || !process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not set, simulating stream with mock data')
        const mockResponse = getMockMarkdownResponse(mode)
        // Simulate streaming by yielding chunks
        const words = mockResponse.split(' ')
        for (const word of words) {
            yield word + ' '
            await new Promise(r => setTimeout(r, 50))
        }
        return
    }

    try {
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: getSystemPrompt() },
                { role: "user", content: buildUserPrompt(text, mode) }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            stream: true
        })

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
                yield content
            }
        }
    } catch (error) {
        console.error('Stream Error:', error)
        throw createError({ statusCode: 500, statusMessage: 'Stream Failed' })
    }
}
