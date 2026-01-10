# 08_STATE_MACHINE.md
# State Machine Specification
## Notulen AI v2.2 — FINAL

---

## 1. Purpose

Dokumen ini mendefinisikan **state machine resmi** untuk sistem Notulen AI.

State machine ini:
- menjadi dasar seluruh alur sistem
- mencegah kondisi ambigu
- harus ditegakkan secara ketat oleh backend

Jika ada konflik:
> **State machine menang atas UX, API, dan implementasi.**

---

## 2. State List (FINAL & CLOSED)

Sistem hanya memiliki **5 state berikut**:

1. `CREATED`
2. `RECORDING`
3. `PROCESSING`
4. `SUMMARY_READY`
5. `COMPLETED`

❌ Tidak boleh ada state tambahan  
❌ Tidak boleh ada state implisit  
❌ Tidak boleh ada state sementara (PAUSED, ERROR, dsb.)

---

## 3. State Diagram (Logical)

```
CREATED
↓
RECORDING
↓
PROCESSING
↓
SUMMARY_READY
↓
COMPLETED
```

Transisi hanya boleh **searah**.

---

## 4. State Definition & Invariants

---

### 4.1 CREATED

**Deskripsi**  
Meeting telah dibuat, tetapi belum ada aktivitas rekaman.

**Allowed Actions**
- Start recording

**Forbidden Actions**
- Upload audio
- Start summary
- SSE connection

**Invariants**
- Tidak ada audio
- Tidak ada summary
- `startedAt` belum diset

---

### 4.2 RECORDING

**Deskripsi**  
Audio rapat sedang direkam dan dikirim ke backend.

**Allowed Actions**
- Upload audio chunk
- Close recording

**Forbidden Actions**
- Start summary
- Resume summary
- SSE connection

**Invariants**
- `startedAt` sudah ada
- `endedAt` harus `null`
- Summary job **BELUM** berjalan

---

### 4.3 PROCESSING

**Deskripsi**  
Rekaman telah ditutup dan sistem sedang memproses summary.

**Allowed Actions**
- View status
- SSE stream
- Resume summary (jika job berhenti)

**Forbidden Actions**
- Upload audio
- Close recording ulang

**Invariants**
- `endedAt` harus ada
- `totalChunks` harus ada
- Summary job **HARUS** berjalan atau tertunda aman
- Audio upload **DITOLAK**

---

### 4.4 SUMMARY_READY

**Deskripsi**  
Summary final telah selesai dan disimpan.

**Allowed Actions**
- View final summary
- Regenerate summary (opsional, future)

**Forbidden Actions**
- SSE stream
- Resume summary
- Upload audio

**Invariants**
- Summary final **HARUS ada**
- SSE **HARUS ditutup**
- Tidak ada partial summary aktif

---

### 4.5 COMPLETED

**Deskripsi**  
Sesi rapat ditutup secara penuh.

**Allowed Actions**
- View summary

**Forbidden Actions**
- Semua mutasi data

**Invariants**
- Read-only
- Tidak ada job aktif
- Tidak ada SSE aktif

---

## 5. Allowed State Transitions (FINAL)

| From | To | Trigger |
|----|----|--------|
| CREATED | RECORDING | Start recording |
| RECORDING | PROCESSING | Close recording |
| PROCESSING | SUMMARY_READY | Summary completed |
| SUMMARY_READY | COMPLETED | Close session |

❌ Tidak ada transisi lain yang valid

---

## 6. Forbidden Transitions (EXPLICIT)

- CREATED → PROCESSING
- RECORDING → SUMMARY_READY
- PROCESSING → RECORDING
- PROCESSING → COMPLETED
- SUMMARY_READY → RECORDING

Semua transisi di atas **HARUS DITOLAK** oleh backend.

---

## 7. Error Handling & State

- Error AI **TIDAK BOLEH**:
  - mengubah state
  - membuat state baru
- Error AI **BOLEH**:
  - menghentikan job sementara
  - memicu retry / resume

State tetap `PROCESSING` sampai summary benar-benar selesai.

---

## 8. Quota & Resume Interaction

### AI Quota Habis
- State **tetap PROCESSING**
- Summary job berhenti aman
- User diberi opsi resume

### Resume Summary
- Hanya valid di state `PROCESSING`
- Resume harus:
  - idempotent
  - single-flight
  - masuk antrean jika penuh

---

## 9. SSE Interaction with State

- SSE **HANYA BOLEH** aktif saat state = `PROCESSING`
- SSE **TIDAK BOLEH**:
  - mengubah state
  - membawa data final

Event `done`:
- Tidak membawa summary
- Menandakan summary siap diambil via REST

---

## 10. TTL & Stalled State Handling

- State `PROCESSING` memiliki TTL
- Jika TTL terlewati:
  - Meeting dianggap stalled
  - State tetap `PROCESSING`
  - UX menampilkan opsi lanjut / tutup

❌ Tidak ada state `STALLED`

---

## 11. Backend Enforcement Rules (MANDATORY)

Backend **HARUS**:
- Menolak semua transisi ilegal
- Menolak request yang tidak sesuai state
- Menjadi satu-satunya pihak yang mengubah state

Frontend **TIDAK BOLEH**:
- Menebak state
- Mengubah state sendiri

---

## 12. Validation Checklist (AI Agent)

- Tidak ada state di luar daftar resmi
- Tidak ada transisi lompat
- Tidak ada state ambigu
- Error tidak memodifikasi state
- SSE tidak mempengaruhi state

---

## 13. Document Status

- Document: 08_STATE_MACHINE.md
- Version: v2.2
- Status: FINAL & LOCKED

---

## Guiding Rule

> Jika suatu fitur membutuhkan state baru,  
> maka desain fitur tersebut **harus ditolak**.
