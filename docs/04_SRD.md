# 04_SRD.md
# System Requirements Document (SRD)
## Notulen AI v2.2 — FINAL

---

## 1. Purpose of This Document

Dokumen ini mendefinisikan **kebutuhan sistem secara teknis dan deterministik** untuk aplikasi **Notulen AI**.

SRD ini berfungsi sebagai:
- Single Source of Truth (SSOT)
- Kontrak antara Product, Engineering, dan AI Agent
- Acuan implementasi backend, frontend, dan AI workflow

---

## 2. System Overview

### 2.1 System Objective
Membangun sistem notulen rapat berbasis AI yang:
- memproses audio berdurasi panjang
- bekerja secara asinkron
- memberikan feedback progres secara realtime
- tetap stabil saat terjadi error AI, quota limit, refresh, dan disconnect

---

### 2.2 High-Level Architecture

[ Browser (Nuxt 3) ]
│
│ REST + SSE
▼
[ Backend API (Fastify, Node.js LTS) ]
│
├─ Summary Job (Async, Independent)
├─ SSE Hub (Observer-only)
├─ AI Adapter (Whisper + LLM)
│
▼
[ Database (SQLite → PostgreSQL) ]


---

## 3. Architectural Principles (NON-NEGOTIABLE)

### 3.1 State-Driven System
- Semua alur sistem dikendalikan oleh **state machine eksplisit**
- Tidak ada implicit state di frontend
- Database adalah **single source of truth**

---

### 3.2 Job Independence
- Summary job **HARUS independen dari client**
- Client disconnect / refresh **TIDAK BOLEH** mempengaruhi job
- SSE **BUKAN** pengendali job

---

### 3.3 Partial vs Final Data
- Partial summary:
  - hanya via SSE
  - tidak disimpan
- Final summary:
  - disimpan di DB
  - diambil via REST
  - tidak pernah berasal dari SSE

---

### 3.4 Error Is Expected
- Error AI, timeout, quota limit adalah kondisi normal
- Semua error harus:
  - terklasifikasi
  - recoverable
  - tidak merusak state

---

## 4. State Machine Specification

### 4.1 State Definitions

CREATED
RECORDING
PROCESSING
SUMMARY_READY
COMPLETED


---

### 4.2 Allowed Transitions (FINAL)

| From | To | Trigger |
|---|---|---|
| CREATED | RECORDING | Start recording |
| RECORDING | PROCESSING | Close recording |
| PROCESSING | SUMMARY_READY | Summary completed |
| SUMMARY_READY | COMPLETED | Close session |

❌ Tidak ada transisi lain yang valid  
❌ Tidak ada state tambahan (PAUSED, ERROR, STREAMING, dll)

---

### 4.3 State Invariants

#### RECORDING
- Audio chunk boleh dikirim
- Summary job **BELUM BOLEH** berjalan

#### PROCESSING
- Audio upload **DITOLAK**
- Summary job **HARUS sudah berjalan**
- SSE **BOLEH** aktif

#### SUMMARY_READY
- Summary final **WAJIB ada**
- SSE **HARUS ditutup**

#### COMPLETED
- Read-only
- Tidak ada mutasi data utama

---

## 5. Data Requirements

### 5.1 Persistence Rules
- Audio file: ❌ tidak wajib disimpan
- Transcript mentah: ❌ tidak disimpan
- Partial summary: ❌ tidak disimpan
- Final summary: ✅ disimpan

---

### 5.2 Core Entities

#### Meeting
- Merepresentasikan satu sesi rapat
- Menyimpan state, progress, metadata

#### Summary
- Satu-ke-satu dengan Meeting
- Hanya berisi hasil final

---

## 6. Summary Job Requirements

### 6.1 Job Lifecycle
1. Dipicu saat recording ditutup
2. Berjalan async
3. Tidak bergantung SSE
4. Menyimpan hasil final
5. Mengubah state ke SUMMARY_READY

---

### 6.2 Job Constraints
- Hanya **1 job aktif per meeting**
- Job **HARUS idempotent**
- Job **HARUS bisa dihentikan aman**

---

## 7. Server-Sent Events (SSE)

### 7.1 Purpose
SSE digunakan **hanya untuk UX feedback**, bukan data final.

---

### 7.2 SSE Rules (STRICT)

- SSE:
  - read-only
  - observer-only
- SSE:
  - tidak memicu job
  - tidak menyimpan data
- SSE:
  - boleh putus kapan saja
  - tidak mempengaruhi state

---

### 7.3 SSE Lifecycle

| Kondisi | Perilaku |
|---|---|
| State ≠ PROCESSING | SSE ditolak |
| PROCESSING | SSE boleh aktif |
| done / error | SSE ditutup |
| timeout | SSE ditutup |

---

## 8. AI Integration Requirements

### 8.1 Speech-to-Text
- Menggunakan Whisper
- Dipanggil per chunk
- Harus memiliki timeout keras

---

### 8.2 Summary LLM
- Menggunakan prompt terstruktur
- Tidak streaming token mentah
- Output harus terstruktur

---

## 9. AI Quota & Failure Handling

### 9.1 AI Quota Exceeded

Jika quota habis:
- Summary job dihentikan aman
- State **TETAP PROCESSING**
- Partial data dibuang
- SSE emit:
AI_QUOTA_EXCEEDED


---

### 9.2 Resume Strategy (FINAL)

- Resume **MANUAL**
- Endpoint:
POST /meetings/:id/resume-summary
- Resume:
- idempotent
- single-flight
- masuk antrean jika penuh

❌ Tidak ada auto-resume

---

## 10. Error Handling System

### 10.1 Error Model
- Backend mengirim:
- error code
- requestId
- Backend **TIDAK** mengirim message user-facing

---

### 10.2 Error Principles
- Error ≠ crash
- Error ≠ state corruption
- Semua error harus eksplisit

---

## 11. Edge-Case Hardening (MANDATORY)

### 11.1 Duplicate Resume
- Resume request harus single-flight
- Resume ganda ditolak

### 11.2 Starvation Job
- Resume masuk queue
- Concurrency dibatasi

### 11.3 SSE Leak
- SSE harus ditutup saat:
- done
- error
- client disconnect
- hard timeout

### 11.4 Final Summary Integrity
- Final summary **HARUS via REST**
- SSE **DILARANG** membawa final data

### 11.5 Processing TTL
- PROCESSING tidak boleh selamanya
- TTL wajib
- User diberi opsi lanjut / batalkan

---

## 12. Non-Functional Requirements

### 12.1 Reliability
- Aman terhadap refresh
- Aman terhadap multi-tab
- Aman terhadap backend restart

### 12.2 Performance
- Progress feedback < 5 detik
- SSE throttle wajib

### 12.3 Scalability
- 1000–3000 client
- Summary job concurrency dibatasi
- Scale by limiting

---

## 13. Explicit Non-Requirements

Sistem ini **TIDAK** mencakup:
- Login & authentication
- Realtime transcription
- Transcript viewer
- Collaborative editing
- Exactly-once processing

---

## 14. Definition of System Readiness

Sistem dianggap **siap** jika:
- State machine enforced
- SSE optional & safe
- Resume idempotent
- TTL PROCESSING aktif
- Tidak ada summary parsial tersimpan

---

## 15. Document Status

- **Document:** SRD
- **Version:** v2.2
- **Status:** FINAL & LOCKED
- **Next Revision:** v3 (user, team, enterprise)

---

## Guiding System Rule
> **Jika terjadi konflik antara UX dan konsistensi state,  
konsistensi state HARUS menang.**
