# Notulen AI

Notulen AI adalah aplikasi web berbasis AI yang dirancang untuk membantu pengguna merekam rapat, menghasilkan ringkasan cerdas secara otomatis, dan mengelola riwayat rapat dengan antarmuka yang modern dan ramah pengguna.

Aplikasi ini menggunakan **Nuxt 3**, **Prisma**, **OpenAI Whisper (STT)**, dan **GPT-4o-mini** untuk memberikan pengalaman notulensi yang mulus dan efisien.

## Fitur Utama

- **Rekam & Rangkum**: Rekam audio rapat dan dapatkan ringkasan cerdas (Agenda, Keputusan, Action Items) dalam hitungan detik.
- **Mode Ringkasan**: Pilih antara mode *Standar*, *Poin Penting*, atau *Detail* sesuai kebutuhan.
- **Manajemen Rapat**: Edit judul rapat langsung di halaman summary dan hapus riwayat rapat beserta file audionya.
- **Modern UI/UX**: Antarmuka minimalis dengan audio visualizer yang artistik dan navigasi yang intuitif.

---

## Dokumentasi Lengkap

Untuk informasi lebih mendalam mengenai arsitektur, flow pengguna, kontrak API, dan lainnya, silakan merujuk ke direktori [docs](./docs):

- **[Overview](./docs/01-overview-notulen-ai.md)**: Gambaran umum produk.
- **[Architecture](./docs/04-architecture.md)**: Detail teknis dan arsitektur sistem.
- **[API Contract](./docs/06-api-contract.md)**: Dokumentasi API endpoint.
- **[Color Palette](./docs/10-color-palette.md)**: Panduan desain dan warna.
- *Dan dokumen lainnya di dalam folder tersebut.*

---

## Setup

Pastikan Anda memiliki file `.env` yang berisi `OPENAI_API_KEY` dan `DATABASE_URL`.

Install dependencies:

```bash
# npm
npm install
```

## Development Server

Jalankan server pengembangan di `http://localhost:3000`:

```bash
# npm
npm run dev
```

## Production

Build aplikasi untuk produksi:

```bash
# npm
npm run build
```

Pratinjau hasil build produksi secara lokal:

```bash
# npm
npm run preview
```
