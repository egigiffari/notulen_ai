/**
 * Script to generate sample meeting audio using OpenAI TTS
 * Run: npx tsx scripts/generate-sample.ts
 */
import 'dotenv/config'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const SAMPLE_MEETING_SCRIPT = `
Selamat pagi semua, terima kasih sudah hadir di rapat mingguan tim.

Agenda hari ini ada tiga poin utama. Pertama, kita akan bahas progres proyek aplikasi mobile. Kedua, evaluasi kinerja sprint kemarin. Dan ketiga, perencanaan untuk sprint berikutnya.

Untuk progres proyek, Budi bisa jelaskan?

Ya, terima kasih. Jadi modul login sudah selesai seratus persen. Untuk modul dashboard, kita sudah capai tujuh puluh persen dan targetnya selesai minggu depan. Ada sedikit kendala di integrasi API, tapi sudah ditangani.

Bagus. Lalu bagaimana dengan testing?

Untuk testing, Sari sudah mulai buat test case. Ada sekitar dua puluh test case yang sudah running dan semua pass.

Oke, berarti bisa kita sepakati bahwa target rilis beta tetap tanggal lima belas bulan ini?

Setuju. Untuk mencapai target itu, saya usulkan kita tambah satu sesi code review per minggu.

Baik, saya setuju dengan usulan itu. Jadi keputusannya, kita akan adakan code review setiap Rabu sore jam tiga.

Ada yang perlu ditindaklanjuti. Budi tolong siapkan dokumentasi API sebelum Jumat. Sari, lanjutkan coverage testing minimal delapan puluh persen. Dan saya akan koordinasi dengan tim design untuk finalisasi UI.

Baik, kalau tidak ada yang lain, rapat kita tutup. Terima kasih semua.
`

async function generateSampleAudio() {
    console.log('Generating sample meeting audio...')

    const outputDir = path.join(process.cwd(), 'app', 'public', 'samples')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
        console.log('Created samples directory')
    }

    const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'onyx', // Professional sounding voice
        input: SAMPLE_MEETING_SCRIPT.trim(),
        response_format: 'mp3'
    })

    const buffer = Buffer.from(await response.arrayBuffer())
    const outputPath = path.join(outputDir, 'sample-meeting.mp3')

    fs.writeFileSync(outputPath, buffer)
    console.log(`Sample audio saved to: ${outputPath}`)
    console.log(`File size: ${(buffer.length / 1024).toFixed(2)} KB`)
}

generateSampleAudio().catch(console.error)
