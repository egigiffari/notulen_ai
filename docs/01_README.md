# Notulen AI

## Overview
**Notulen AI** adalah aplikasi web berbasis AI untuk merekam rapat berdurasi panjang dan menghasilkan **ringkasan rapat terstruktur** (notulen) secara otomatis.

Sistem ini dirancang untuk:
- proses asinkron yang panjang
- UX yang transparan (progress-aware)
- minim bug melalui desain state machine & constraint
- mudah dianalisis dan diimplementasikan oleh AI Agent

---

## Core Capabilities
- 🎙️ Rekam audio rapat (multi peserta, durasi panjang)
- 🧠 Transkripsi menggunakan AI (Whisper)
- 📝 Ringkasan rapat otomatis (3 mode)
- 🔄 Re-generate summary selama sesi aktif
- 📡 Progress feedback realtime menggunakan SSE
- 🛡️ Robust terhadap refresh, disconnect, dan error AI

---

## Summary Modes
Sistem mendukung **3 mode notulen**:

1. **STANDARD**  
   Ringkasan seimbang (default)

2. **IMPORTANT**  
   Hanya poin-poin krusial (eksekutif)

3. **DETAILED**  
   Notulen lengkap dan rinci (administratif)

> Semua mode menggunakan struktur:
> - Ringkasan Umum  
> - Agenda  
> - Keputusan  
> - Tindak Lanjut (Action Item)

---

## Key Design Principles (NON-NEGOTIABLE)

### 1. State-Driven System
- Semua alur dikendalikan oleh **state machine eksplisit**
- Tidak ada state implisit di frontend
- Database adalah **single source of truth**

### 2. AI Job Independence
- Proses summary **tidak bergantung pada client**
- Client boleh keluar / refresh tanpa mempengaruhi job
- SSE hanya observer, bukan pengendali

### 3. Partial ≠ Final
- Partial summary:
  - hanya ditampilkan via SSE
  - **tidak pernah disimpan**
- Final summary:
  - **hanya disimpan setelah selesai**
  - **selalu diambil via REST**

### 4. Error Is Expected
- AI failure dan quota limit adalah kondisi normal
- Semua error diklasifikasikan dan recoverable
- Tidak ada silent failure

---

## Architecture Snapshot

Browser (Nuxt 3)
│
│ REST + SSE
▼
Backend API (Fastify, Node.js)
│
├─ Summary Job (Async, Independent)
├─ SSE Hub (Observer only)
├─ AI Adapter (Whisper + LLM)
│
▼
Database (SQLite → Postgres)


---

## Technology Stack

### Frontend
- Nuxt 3
- TypeScript
- REST + Server-Sent Events (SSE)
- No PWA
- No Login

### Backend
- Node.js LTS
- Fastify
- TypeScript
- Prisma ORM

### AI
- Speech-to-Text: Whisper
- Summary: LLM (GPT-4o-mini or equivalent)

---

## Non-Goals (Explicit)

Sistem ini **SECARA SADAR** tidak mencakup:
- User authentication / login
- Realtime transcription
- Transcript viewer
- Collaborative editing
- Offline-first recording
- Exactly-once processing

> Semua non-goals ini dikeluarkan untuk menjaga sistem tetap ringan, stabil, dan mudah dianalisis.

---

## Repository Structure (Logical)

Dokumentasi utama dalam repo ini:

1. `01_README.md` — Overview & principles  
2. `02_PRD.md` — Product Requirements  
3. `03_BRD.md` — Business Requirements  
4. `04_SRD.md` — System Requirements (FINAL)  
5. `05_ARCHITECTURE.md` — FE + BE + AI + SSE  
6. `06_API_CONTRACT.md` — REST & SSE contract  
7. `07_DATA_MODEL.md` — Database & Prisma schema  
8. `08_STATE_MACHINE.md` — State & transitions  
9. `09_PROMPT_SPEC.md` — AI prompting rules  
10. `10_EDGE_CASES.md` — Hardened edge-cases  
11. `11_AI_AGENT_GUIDE.md` — AI Agent instructions  

---

## How to Read This Repo (IMPORTANT)

### For AI Agent
- Mulai dari `04_SRD.md`
- Ikuti constraint & invariant
- Jangan menambah state atau flow baru tanpa eksplisit

### For Developer
- Anggap semua dokumen sebagai **kontrak**
- Jika implementasi bertentangan dengan dokumen → implementasi salah

---

## Project Status
- **Version:** v2.2
- **Status:** Architecture Locked
- **Scope:** Production-light / Showcase
- **Next Major Change:** v3 (login, team, enterprise)

---

## Guiding Rule
> **Jika ragu, prioritaskan konsistensi state dan kejelasan UX  
> daripada kecanggihan fitur.**
