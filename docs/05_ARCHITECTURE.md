# 05_ARCHITECTURE.md
# System Architecture
## Notulen AI v2.2 — FINAL

---

## 1. Purpose

Dokumen ini menjelaskan **arsitektur teknis end-to-end** Notulen AI:
- frontend
- backend
- AI workflow
- SSE
- data flow

Dokumen ini **melengkapi SRD**, bukan menggantikannya.

Jika terjadi konflik:
> **SRD menang.**

---

## 2. Architectural Goals

- Robust terhadap proses panjang
- Minim coupling antar komponen
- Mudah dianalisis AI Agent
- Mudah dikembangkan ke v3
- Tahan terhadap error eksternal (AI, network)

---

## 3. High-Level Architecture

┌─────────────────────┐
│ Browser (Nuxt 4) │
│ - UI │
│ - REST client │
│ - SSE client │
└─────────┬───────────┘
│
│ REST + SSE
▼
┌─────────────────────────────┐
│ Backend API (Fastify) │
│ - API Layer │
│ - State Guard │
│ - Summary Controller │
│ - SSE Hub │
│ - Job Manager │
│ - AI Adapter │
└─────────┬───────────────────┘
│
▼
┌─────────────────────────────┐
│ Database (SQLite / Postgres)│
│ - Meeting │
│ - Summary │
└─────────────────────────────┘


---

## 4. Frontend Architecture

### 4.1 Responsibilities
Frontend **TIDAK** bertanggung jawab atas:
- lifecycle job
- state mutation
- error recovery logic

Frontend **HANYA**:
- mengirim intent user
- merender state dari backend
- menampilkan progres

---

### 4.2 Core Modules

- `pages/`
  - Home
  - Recording
  - Processing
  - Summary
  - History

- `composables/`
  - useMeetingState
  - useSSE
  - useSummary

- `services/`
  - apiClient (REST)
  - sseClient

---

### 4.3 Frontend Invariants

- FE **MUST NOT**:
  - menyimpan state kritis sendiri
  - menganggap SSE sebagai final data
  - mengubah state meeting

- FE **MUST**:
  - fetch final summary via REST
  - reconnect SSE safely
  - handle refresh gracefully

---

## 5. Backend Architecture

### 5.1 Backend Layers

HTTP Layer (Fastify)
↓
Controller Layer
↓
Domain / State Guard
↓
Job Manager
↓
AI Adapter
↓
Database (Prisma)


---

### 5.2 API Layer
- Menerima request REST & SSE
- Validasi input
- Attach requestId
- Tidak ada logic bisnis berat

---

### 5.3 State Guard
- Memvalidasi transisi state
- Menolak state ilegal
- Satu-satunya pintu perubahan state

**Invariant**
No state mutation bypasses State Guard


---

### 5.4 Job Manager

#### Responsibilities
- Menjalankan summary job
- Menjamin:
  - 1 job per meeting
  - idempotency
  - concurrency limit

#### Internal Structures
```ts
runningJobs: Map<meetingId, Job>
resumeQueue: Queue<meetingId>
```

---
### 5.5 SSE Hub

#### Role
- Publish–subscribe
- Observer-only

#### Data Structure
```ts
sseClients: Map<meetingId, Set<SSEConnection>>
```

#### Rules
- SSE client boleh connect/disconnect bebas
- SSE hub tidak menyimpan history
- SSE hub tidak mengontrol job

---

## 6. AI Workflow Architecture

### 6.1 Speech-to-Text Flow

```
Audio Chunk
  → Whisper
  → Text
  → Aggregator
```

#### Constraints:
- Timeout keras
- Retry terbatas
- Error terklasifikasi

---

### 6.2 Summary Flow

```
Aggregated Transcript
  → Prompt Builder
  → LLM
  → Section Summary
  → Final Summary
```

#### Constraints:
- Tidak streaming token mentah
- Output terstruktur
- Mode mempengaruhi gaya, bukan struktur

---

## 7. Summary Job Lifecycle (Detailed)

```
RECORDING closed
   ↓
PROCESSING
   ↓
[ Summary Job Started ]
   ↓
Transcribe chunks
   ↓
Emit SSE progress (optional)
   ↓
Generate section summaries
   ↓
Emit SSE section (optional)
   ↓
Save final summary
   ↓
SUMMARY_READY
   ↓
Emit SSE done

```

---

## 8. SSE Integration Architecture

### 8.1 SSE Is Optional
- Summary job MUST NOT depend on SSE
- SSE adalah UX enhancement

---

### 8.2 SSE Failure Isolation
| Failure           | Impact  |
| ----------------- | ------- |
| Client disconnect | None    |
| Network issue     | None    |
| SSE crash         | UX only |

---

### 8.3 SSE Safeguards

- Explicit close on:
  - done
  - error
- Hard timeout
- Throttled emit

---

## 9. Error Handling Architecture

### 9.1 Error Classification
- Client error (4xx)
- System error (5xx)
- AI error (quota, timeout)

---

## 9.2 Error Flow

```
Error 발생
  → AppError
  → Error Handler
  → Error Code + requestId
  → FE i18n render
```

---

## 10. Resilience & Recovery

### 10.1 Quota Exhaustion

- Job paused safely
- State tetap PROCESSING
- Resume manual

---

### 10.2 Backend Restart

- State di DB
- Job bisa dilanjutkan
- SSE reconnect aman

---

## 11. Scalability Considerations
### 11.1 Concurrency Control

- Global max summary job
- Per-meeting single job

---

### 11.2 Resource Protection

- SSE connection limit
- AI call rate limit
- Timeout everywhere

---

## 12. Explicit Architecture Non-Goals

- Distributed queue (Kafka, RabbitMQ)
- Persistent job scheduler
- WebSocket
- Offline-first
Semua ini sengaja ditunda.

---

## 13. Architecture Invariants (FINAL)

- Summary job ≠ SSE lifecycle
- Partial data ≠ persistent data

- Final data = REST only
- State mutation via State Guard only
- Error is expected, not exceptional

---

## 14. Document Status
- Document: ARCHITECTURE
- Version: v2.2
- Status: FINAL & LOCKED

---

## Guiding Architecture Rule
> **Pisahkan dengan tegas antara apa yang memproses dan apa yang menampilkan.**