# Arsitektur Aplikasi — Notulen AI

## Gambaran Umum

Notulen AI menggunakan arsitektur sederhana berbasis web dengan pemrosesan AI di backend.

---

## Teknologi Utama

### Frontend
- Nuxt 3
- TypeScript
- Web Audio API

### Backend
- Nuxt Server Routes
- Node.js
- TypeScript

### Database
- SQLite
- Prisma ORM

### AI Service
- Speech-to-Text API (Whisper)
- LLM API (GPT-4o-mini atau setara)

---

## Diagram Arsitektur

Browser  
→ Nuxt Frontend  
→ Nuxt Server API (POST, GET, PATCH, DELETE)
→ Prisma
→ SQLite

→ AI API (OpenAI Whisper & GPT-4o-mini)

---

## Karakteristik Arsitektur

- Monorepo
- Stateless API
- Tanpa autentikasi
- Mudah diganti vendor AI
- Mudah migrasi database
