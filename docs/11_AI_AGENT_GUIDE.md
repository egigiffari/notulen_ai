# 11_AI_AGENT_GUIDE.md
# AI Agent Implementation Guide
## Notulen AI v2.2 — FINAL

---

## 1. Purpose

Dokumen ini adalah **panduan utama untuk AI Agent** (mis. Claude Sonnet 4.5)
yang akan:

- membaca repository Notulen AI
- melakukan reasoning terhadap arsitektur
- mengimplementasikan backend dan frontend
- melakukan perubahan kode secara aman

Dokumen ini **BUKAN** dokumentasi produk.
Dokumen ini adalah **kontrak perilaku AI Agent**.

---

## 2. Mandatory Reading Order (STRICT)

AI Agent **WAJIB** membaca dokumen dengan urutan berikut:

1. `01_README.md`
2. `04_SRD.md`
3. `08_STATE_MACHINE.md`
4. `06_API_CONTRACT.md`
5. `07_DATA_MODEL.md`
6. `10_EDGE_CASES.md`
7. `09_PROMPT_SPEC.md`

❌ Jangan mengimplementasikan apapun sebelum membaca dokumen di atas.

---

## 3. Core Mental Model (NON-NEGOTIABLE)

AI Agent **HARUS** memahami bahwa:

- Sistem ini **state-driven**
- Backend adalah **single source of truth**
- Frontend **tidak mengontrol lifecycle**
- AI job **independen dari client**
- SSE **hanya observer**
- Partial data **bukan final data**

Jika mental model ini tidak diikuti,
**implementasi dianggap salah**.

---

## 4. Absolute Constraints (MUST / MUST NOT)

### 4.1 MUST

AI Agent **MUST**:

- Menegakkan state machine secara ketat
- Menolak transisi state ilegal
- Menjadikan SRD sebagai acuan utama
- Memastikan final summary hanya via REST
- Menutup SSE secara eksplisit
- Membuat resume summary idempotent
- Menangani AI quota sebagai expected failure

---

### 4.2 MUST NOT

AI Agent **MUST NOT**:

- Menambahkan state baru
- Mengubah flow lifecycle
- Menjadikan SSE sebagai sumber data final
- Menyimpan partial summary
- Mengubah error contract
- Menggunakan WebSocket
- Mengasumsikan AI selalu sukses

---

## 5. Implementation Strategy (RECOMMENDED)

### 5.1 Backend First

Urutan implementasi backend yang direkomendasikan:

1. State machine guard
2. Meeting CRUD
3. Audio chunk upload
4. Summary job manager
5. AI adapter
6. SSE hub
7. Error handling & TTL

---

### 5.2 Frontend Second

Frontend **HANYA** boleh diimplementasikan setelah backend stabil.

Frontend fokus pada:
- rendering state
- progress feedback
- UX recovery (refresh, reconnect)

Frontend **TIDAK BOLEH**:
- menyimpan state kritis
- mengubah state meeting

---

## 6. Error Handling Expectations

AI Agent harus memperlakukan error sebagai:

- bagian normal sistem
- bukan exception langka

Semua error:
- harus punya error code
- tidak boleh mengubah state secara diam-diam
- harus recoverable jika memungkinkan

---

## 7. SSE Handling Rules

AI Agent **WAJIB** memastikan:

- SSE hanya aktif saat `PROCESSING`
- SSE ditutup saat:
  - `done`
  - `error`
  - timeout
  - client disconnect
- SSE tidak pernah membawa summary final

---

## 8. AI Quota & Resume Rules

- Quota habis = expected failure
- Tidak ada auto-resume
- Resume:
  - manual
  - idempotent
  - single-flight
  - queued jika concurrency penuh

---

## 9. Edge-Case Awareness

AI Agent **WAJIB** memeriksa implementasi terhadap:

- duplicate resume
- SSE leak
- PROCESSING tanpa TTL
- summary ganda
- partial data persistence

Jika salah satu terjadi:
> Implementasi **HARUS ditolak atau diperbaiki**.

---

## 10. What To Do If Confused

Jika AI Agent menemukan konflik:

1. Ikuti `04_SRD.md`
2. Ikuti `08_STATE_MACHINE.md`
3. Tolak fitur / perubahan
4. Laporkan konflik secara eksplisit

❌ Jangan mengarang solusi sendiri.

---

## 11. Forbidden Optimizations

AI Agent **DILARANG**:

- menambahkan cache kompleks
- menambahkan distributed queue
- mengubah arsitektur async
- melakukan speculative retry AI

Semua optimasi di atas **harus ditunda ke v3**.

---

## 12. Validation Checklist (FINAL)

Sebelum menyatakan implementasi selesai,
AI Agent **HARUS memastikan**:

- [ ] Tidak ada state tambahan
- [ ] Tidak ada summary parsial tersimpan
- [ ] Final summary via REST
- [ ] SSE observer-only
- [ ] Resume idempotent
- [ ] PROCESSING memiliki TTL
- [ ] Error code konsisten

---

## 13. Scope of Authority

AI Agent:
- ✅ boleh menulis kode
- ✅ boleh refactor internal
- ❌ tidak boleh mengubah spesifikasi
- ❌ tidak boleh memperluas scope

---

## 14. Document Status

- Document: 11_AI_AGENT_GUIDE.md
- Version: v2.2
- Status: FINAL & LOCKED

---

## Final Instruction to AI Agent

> Jika kamu ragu,
> **lebih baik menolak implementasi
> daripada merusak konsistensi sistem.**
