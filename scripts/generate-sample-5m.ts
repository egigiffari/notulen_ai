/**
 * Script to generate 5-minute sample meeting audio by looping short content
 * Run: npm run generate:sample-5m
 */
import 'dotenv/config'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

// Skrip dasar ~45-60 detik
const BASE_SCRIPT = `
Baik, mari kita lanjutkan ke sesi brainstorming untuk lima menit ke depan. 
Fokus kita sekarang adalah strategi mitigasi risiko untuk peluncuran fitur baru.
Seperti yang kita tahu, feedback dari beta user kemarin menyoroti performa di perangkat lama.
Saya ingin masukan dari tim engineering dulu.

Oke, dari sisi engineering, kami sudah profiling dan menemukan bottleneck di rendering list.
Solusinya ada dua: virtual scrolling atau pagination server-side.
Untuk jangka pendek, pagination paling aman. Tapi virtual scrolling memberikan UX lebih baik.

Bagaimana dampaknya ke timeline jika kita pilih virtual scrolling?

Implementasi virtual scrolling butuh refactor komponen utama. 
Estimasi saya tambah 2 hari kerja.

Kalau 2 hari masih masuk dalam buffer kita. 
Saya setuju demi UX yang lebih baik. Ada tanggapan lain?
Terutama dari sisi design, apakah ada concern?

Dari design aman, selama behavior scrollnya natural.
Justru ini sejalan dengan request user untuk infinite scroll experience.

Sip, kalau begitu kita kunci keputusan ini: kita switch ke virtual scrolling.
Tolong Budi update tiket Jira-nya dan set priority High.
Sari, tolong update test scenario untuk cover scrolling behavior ini.
`

async function generateLongSample() {
    console.log('Generating base audio segment...')

    const outputDir = path.join(process.cwd(), 'app', 'public', 'samples')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // 1. Generate Base Audio
    const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'onyx',
        input: BASE_SCRIPT.trim(),
        response_format: 'mp3'
    })

    const baseBuffer = Buffer.from(await response.arrayBuffer())
    console.log(`Base segment generated: ${(baseBuffer.length / 1024).toFixed(2)} KB`)

    // 2. Loop to reach ~5 minutes
    // Asumsi base script ~40 detik. 5 menit = 300 detik. Butuh ~7-8 kali loop.
    // Kita akan loop 8 kali untuk aman.
    const LOOP_COUNT = 8
    const validBuffers = [baseBuffer]

    for (let i = 0; i < LOOP_COUNT - 1; i++) {
        validBuffers.push(baseBuffer)
    }

    const finalBuffer = Buffer.concat(validBuffers)
    const outputPath = path.join(outputDir, 'sample-5m.mp3')

    fs.writeFileSync(outputPath, finalBuffer)

    console.log('==========================================')
    console.log(`✅ 5-Minute Sample Audio Generated!`)
    console.log(`Path: ${outputPath}`)
    console.log(`Size: ${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB`)
    console.log('==========================================')
}

generateLongSample().catch(console.error)
