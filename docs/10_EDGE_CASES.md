# 10_EDGE_CASES.md
# Edge Case & Failure Handling Specification
## Notulen AI v2.2 — FINAL

---

## 1. Purpose

Dokumen ini mendefinisikan **edge-case, failure scenario, dan guardrail**
yang **WAJIB** ditangani oleh sistem Notulen AI.

Tujuan utama:
- mencegah bug sistemik
- mencegah state ambiguity
- memastikan sistem tetap stabil dalam kondisi ekstrem

Jika terjadi konflik:
> **SRD.md dan STATE_MACHINE.md menang.**

---

## 2. Classification of Edge-Cases

Edge-case dibagi menjadi:

1. User behavior
2. Network & client failure
3. AI failure & quota
4. Backend failure
5. State & data integrity

Semua edge-case di bawah ini **WAJIB ditangani**.

---

## 3. Critical Edge-Cases (MUST FIX)

---

### 3.1 Duplicate Resume Request

**Scenario**
- User menekan tombol “Lanjutkan Proses” berkali-kali
- User membuka multi-tab dan resume bersamaan

**Risk**
- Summary job ganda
- Double AI call
- Inconsistent progress

**Required Handling**
- Resume harus **single-flight**
- Jika job sudah aktif → tolak resume
- Gunakan in-memory lock per meeting

**Invariant**
- Maksimal 1 summary job aktif per meeting

---

### 3.2 Starvation Job (Resume Flood)

**Scenario**
- Banyak meeting tertunda
- User melakukan resume secara bersamaan

**Risk**
- Burst AI traffic
- Rate limit
- Semua job gagal

**Required Handling**
- Resume masuk antrean
- Batasi concurrency summary job
- FIFO queue cukup

**Invariant**
- Sistem lebih baik menunggu daripada overload

---

### 3.3 SSE Connection Not Closed

**Scenario**
- SSE tidak ditutup setelah summary selesai
- Client disconnect tidak dibersihkan

**Risk**
- Memory leak
- Resource exhaustion
- Server crash

**Required Handling**
- SSE **HARUS** ditutup saat:
  - event `done`
  - event `error`
  - client disconnect
  - hard timeout

**Invariant**
- Tidak ada SSE connection zombie

---

### 3.4 Final Summary Delivered via SSE

**Scenario**
- Frontend menganggap output SSE sebagai hasil final

**Risk**
- Data sementara dianggap final
- Summary tidak konsisten

**Required Handling**
- SSE **DILARANG** membawa summary final
- Event `done` tidak membawa data
- Final summary **HARUS** diambil via REST

**Invariant**
- Final summary = REST only

---

### 3.5 Meeting Stuck in PROCESSING Forever

**Scenario**
- Summary job mati diam-diam
- Tidak ada error
- State tidak berubah

**Risk**
- UX buntu
- Data menggantung
- Tidak bisa diselesaikan

**Required Handling**
- Terapkan TTL pada state `PROCESSING`
- Jika TTL terlewati:
  - meeting ditandai stalled
  - user diberi opsi resume / close

**Invariant**
- Tidak ada PROCESSING tanpa batas waktu

---

## 4. AI Failure & Quota Edge-Cases

---

### 4.1 AI Quota Exceeded (During Processing)

**Scenario**
- Kuota AI habis di tengah summary job

**Expected Behavior**
- Summary job dihentikan aman
- State tetap `PROCESSING`
- Partial summary dibuang
- SSE emit:
  - `error: AI_QUOTA_EXCEEDED`
- SSE ditutup

**Invariant**
- Quota habis ≠ kegagalan sistem

---

### 4.2 AI Quota Restored

**Scenario**
- Kuota AI kembali tersedia

**Expected Behavior**
- Sistem **TIDAK** auto-resume
- User harus melakukan resume manual

**Rationale**
- Mencegah spam AI
- Menjaga kontrol biaya

**Invariant**
- Resume selalu eksplisit

---

### 4.3 AI Timeout / Third-Party Failure

**Scenario**
- Whisper / LLM timeout
- API eksternal tidak responsif

**Expected Behavior**
- Job dihentikan aman
- Error diklasifikasikan:
  - FAILED_THIRD_PARTY
- State tidak berubah
- Tidak ada partial data tersimpan

---

## 5. Client & Network Edge-Cases

---

### 5.1 Client Refresh / Tab Close

**Scenario**
- User refresh halaman
- User menutup tab

**Expected Behavior**
- SSE disconnect
- Summary job tetap berjalan
- Tidak ada error state

---

### 5.2 Multi-Tab Access

**Scenario**
- User membuka meeting yang sama di beberapa tab

**Expected Behavior**
- Semua tab boleh connect SSE
- Tidak memicu job baru
- Event broadcast aman

---

### 5.3 Network Flapping

**Scenario**
- Internet terputus lalu tersambung

**Expected Behavior**
- SSE reconnect diperbolehkan
- Summary job tidak terpengaruh

---

## 6. Backend Failure Edge-Cases

---

### 6.1 Backend Restart During Processing

**Scenario**
- Server restart saat summary berjalan

**Expected Behavior**
- SSE terputus
- State tetap `PROCESSING`
- Summary job dapat dilanjutkan

---

### 6.2 Backend Crash Without Cleanup

**Scenario**
- Job mati tanpa cleanup SSE

**Expected Behavior**
- SSE dibersihkan via timeout
- State tidak rusak

---

## 7. State Integrity Edge-Cases

---

### 7.1 Illegal State Transition

**Scenario**
- Request mencoba transisi state ilegal

**Expected Behavior**
- Request ditolak
- Error: INVALID_MEETING_STATE
- State tidak berubah

---

### 7.2 Partial Data Persistence

**Scenario**
- Partial summary / transcript tersimpan

**Expected Behavior**
- Ini **BUG KRITIS**
- Tidak boleh terjadi

**Invariant**
- Partial data must not persist

---

## 8. Observability & Debugging (Minimal)

Untuk semua edge-case:
- Log event penting:
  - SUMMARY_STARTED
  - SUMMARY_PAUSED
  - SUMMARY_RESUMED
  - SUMMARY_COMPLETED
  - SUMMARY_FAILED
- Sertakan requestId & meetingId

---

## 9. Explicitly Ignored Edge-Cases (By Design)

Edge-case berikut **sengaja tidak ditangani**:

- Offline-first recording
- Resume recording lintas device
- Exactly-once processing
- Collaborative realtime editing

Keputusan ini **disadari dan diterima**.

---

## 10. Validation Checklist (AI Agent)

- Tidak ada summary ganda
- Tidak ada SSE leak
- Tidak ada PROCESSING selamanya
- Tidak ada partial data tersimpan
- Tidak ada state ilegal

---

## 11. Document Status

- Document: 10_EDGE_CASES.md
- Version: v2.2
- Status: FINAL & LOCKED

---

## Guiding Rule

> Edge-case yang tidak ditangani secara eksplisit  
> adalah sumber bug terbesar.
