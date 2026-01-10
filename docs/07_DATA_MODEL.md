# 07_DATA_MODEL.md
# Data Model Specification
## Notulen AI v2.2 — FINAL

---

## 1. Purpose

Dokumen ini mendefinisikan **struktur data, relasi, dan constraint database**
untuk sistem **Notulen AI v2.2**.

Dokumen ini bersifat:
- AI-first
- deterministic
- menjadi acuan utama implementasi Prisma
- harus selaras dengan `04_SRD.md`

Jika terjadi konflik:
> **SRD.md adalah sumber kebenaran tertinggi.**

---

## 2. Global Data Principles (NON-NEGOTIABLE)

- Database adalah **single source of truth**
- Audio **tidak wajib** disimpan
- Transcript mentah **tidak disimpan**
- Partial summary **tidak boleh disimpan**
- Final summary **wajib disimpan**
- Mutasi state **hanya boleh dilakukan backend**

---

## 3. Enum Definitions

### 3.1 MeetingState

Nilai yang diperbolehkan:
- `CREATED`
- `RECORDING`
- `PROCESSING`
- `SUMMARY_READY`
- `COMPLETED`

> Tidak boleh ada state tambahan.

---

### 3.2 SummaryMode

Nilai yang diperbolehkan:
- `STANDARD`
- `IMPORTANT`
- `DETAILED`

Mode hanya mempengaruhi **gaya bahasa**, bukan struktur.

---

## 4. Entity: Meeting

### 4.1 Deskripsi
Merepresentasikan **satu sesi rapat** dan menjadi anchor
seluruh lifecycle sistem.

---

### 4.2 Field Definition

| Field | Type | Nullable | Keterangan |
|----|----|----|----|
| id | UUID | ❌ | Primary key |
| title | String | ✅ | Judul rapat |
| participantEstimate | Int | ✅ | Estimasi peserta |
| state | MeetingState | ❌ | State machine |
| startedAt | DateTime | ❌ | Waktu mulai |
| endedAt | DateTime | ✅ | Waktu selesai |
| durationSeconds | Int | ✅ | Durasi rapat |
| totalChunks | Int | ✅ | Total audio chunk |
| processedChunks | Int | ❌ | Default 0 |
| createdAt | DateTime | ❌ | Auto |
| updatedAt | DateTime | ❌ | Auto |

---

## 5. Meeting State Constraints

### CREATED
- ✅ start recording
- ❌ upload audio
- ❌ start summary

### RECORDING
- ✅ upload audio chunk
- ✅ close recording
- `endedAt` **harus null**

### PROCESSING
- ❌ upload audio
- ✅ stream SSE
- ✅ resume summary
- `endedAt` **harus ada**
- `totalChunks` **harus ada**

### SUMMARY_READY
- ✅ view summary
- `summary` **harus sudah ada**

### COMPLETED
- Read-only
- Tidak ada mutasi data

---

## 6. Entity: Summary

### 6.1 Deskripsi
Menyimpan **hasil notulen FINAL**.
Partial summary **dilarang disimpan**.

---

### 6.2 Field Definition

| Field | Type | Nullable | Keterangan |
|----|----|----|----|
| id | UUID | ❌ | Primary key |
| meetingId | UUID | ❌ | FK → Meeting |
| mode | SummaryMode | ❌ | Mode ringkasan |
| content | JSON | ❌ | Hasil notulen |
| createdAt | DateTime | ❌ | Auto |
| updatedAt | DateTime | ❌ | Auto |

Constraint:
- **Satu meeting hanya boleh punya satu summary**

---

## 7. Relationship

- Meeting ↔ Summary : **One-to-One**
- Summary **hanya boleh ada** jika meeting state ≥ `SUMMARY_READY`
- Delete meeting → delete summary

---

## 8. Processing TTL & Recovery

- State `PROCESSING` **tidak boleh permanen**
- TTL:
  - Demo: 6 jam
  - Production: 24 jam

Jika TTL terlewati:
- Meeting ditandai stalled
- User diberi opsi:
  - Resume summary
  - Close meeting

---

## 9. Runtime Job Control (Non-Persistent)

> Bukan field database.

- Satu summary job aktif per meeting
- Resume summary harus:
  - idempotent
  - single-flight
- Resume masuk antrean jika concurrency penuh

---

## 10. Data Integrity Rules (FINAL)

- Partial summary **tidak pernah disimpan**
- Audio **tidak dibutuhkan setelah proses**
- Transcript mentah **tidak disimpan**
- Final summary **harus diambil via REST**
- State **harus konsisten dengan data**

---

## 11. Explicit Non-Persisted Data

Data berikut **tidak pernah masuk database**:
- Audio chunks
- Raw transcript
- AI token
- SSE events

---

## 12. Migration & Compatibility

- Database awal: SQLite
- Target produksi: PostgreSQL
- ORM: Prisma
- Enum native

---

## 13. Validation Checklist (AI Agent)

- Tidak ada meeting tanpa state
- Tidak ada summary tanpa meeting
- Tidak ada PROCESSING selamanya
- Tidak ada summary ganda
- Tidak ada partial data tersimpan

---

## 14. Document Status

- Document: 07_DATA_MODEL.md
- Version: v2.2
- Status: FINAL & LOCKED

---

## Guiding Rule

> Jika data terlihat ambigu,  
> berarti state machine belum ditegakkan dengan benar.
