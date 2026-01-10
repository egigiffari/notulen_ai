# 06_API_CONTRACT.md
# API Contract
## Notulen AI v2.2 — FINAL

---

## 1. Purpose

Dokumen ini mendefinisikan **kontrak API publik** antara:
- Frontend (Nuxt 3)
- Backend (Fastify)

Kontrak ini bersifat **deterministik, stabil, dan production-grade**.

Jika implementasi menyimpang dari dokumen ini → **implementasi salah**.

---

## 2. Global API Principles (NON-NEGOTIABLE)

- Semua response dibungkus (`success`, `data` / `error`)
- Backend **TIDAK** mengirim pesan user-facing
- Error dikomunikasikan melalui **error code (slug)**
- Frontend bertanggung jawab atas i18n
- Semua endpoint **harus idempotent** jika memungkinkan

---

## 3. Response Envelope (FINAL)

### 3.1 Success Response

```json
{
  "success": true,
  "data": {}
}
```

---

### 3.2 Error Response

```json
{
  "success": false,
  "error": {
    "code": "AI_QUOTA_EXCEEDED",
    "requestId": "req_xxx"
  }
}
```

#### Invariant
- message ❌ tidak dikirim
- code ✅ wajib
- requestId ✅ wajib

---

### 4. Error Code Registry (FINAL)

#### 4.1 Client / Request

| Code                | HTTP |
| ------------------- | ---- |
| INVALID_REQUEST     | 400  |
| PAYLOAD_TOO_LARGE   | 413  |
| UNAUTHORIZED_ACTION | 401  |

---

### 4.2 Meeting / State

| Code                   | HTTP |
| ---------------------- | ---- |
| MEETING_NOT_FOUND      | 404  |
| INVALID_MEETING_STATE  | 409  |
| SESSION_ALREADY_CLOSED | 409  |


---

### 4.3 AI / System

| Code                | HTTP |
| ------------------- | ---- |
| FAILED_THIRD_PARTY  | 503  |
| AI_QUOTA_EXCEEDED   | 429  |
| SERVICE_UNAVAILABLE | 503  |
| INTERNAL_ERROR      | 500  |

---

## 5. REST Endpoints

### 5.1 Create & Start Recording

```
POST /api/meetings
```

#### Behavior
- Membuat meeting baru
- Langsung masuk state RECORDING

#### Response

```
{
  "success": true,
  "data": {
    "meetingId": "uuid",
    "state": "RECORDING"
  }
}
```

---

### 5.2 Upload Audio Chunk

```
POST /api/meetings/:id/chunks
```

#### Constraints
- Hanya valid jika state = RECORDING
- Idempotent per chunkIndex

#### Error
- INVALID_MEETING_STATE
- PAYLOAD_TOO_LARGE

---

### 5.3 Close Recording (Trigger Summary)

```
POST /api/meetings/:id/close
```

#### Behavior

- State: RECORDING → PROCESSING
- Trigger summary job (async)

#### Idempotency
- Multiple calls → safe

---

### 5.4 Resume Summary Job

```
POST /api/meetings/:id/resume-summary
```

#### Valid If

- state = PROCESSING
- job tidak sedang aktif

#### Behavior

- Masuk antrean resume
- Tidak auto-run jika concurrency penuh

#### Error

- INVALID_MEETING_STATE

---

### 5.5 Get Meeting Status

```
GET /api/meetings/:id/status
```

#### Response

```
{
  "success": true,
  "data": {
    "state": "PROCESSING",
    "processedChunks": 7,
    "totalChunks": 18
  }
}
```

---

### 5.6 Get Final Summary (REST ONLY)

```
GET /api/meetings/:id/summary
```

#### Constraints

- Hanya valid jika state = SUMMARY_READY atau COMPLETED
- FINAL SUMMARY ONLY

#### Error

- INVALID_MEETING_STATE

---

### 5.7 Get Meeting History

```
GET /api/meetings
```

#### Behavior

- Mengembalikan daftar meeting
- Menyertakan state & timestamp
- Tidak menyertakan audio / transcript

---

## 6. Server-Sent Events (SSE)

### 6.1 SSE Endpoint

```
GET /api/meetings/:id/summary/stream
```

#### Valid If

- state = PROCESSING

#### Invalid If

- state ≠ PROCESSING → JSON error response

---

### 6.2 SSE Headers

#### Client

```
Accept: text/event-stream
```

#### Server

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

---

### 6.3 SSE Event Types (FINAL)

#### progress

```
event: progress
data: {"processedChunks":7,"totalChunks":18}

```

#### section

```
event: section
data: {
  "type": "keputusan",
  "content": ["Disepakati rilis fitur minggu depan"]
}
```

Allowed type:
- ringkasan_umum
- agenda
- keputusan
- tindak_lanjut


#### info

```
event: info
data: {"message":"Menyusun keputusan"}
```

#### done

```
event: done
data: {}
```

#### Invariant
- Tidak membawa summary final

#### error

```
event: error
data: {"code":"AI_QUOTA_EXCEEDED","requestId":"req_xxx"}
```

#### ping

```
event: ping
data: {}
```

---

### 6.4 SSE Lifecycle Rules

- SSE TIDAK:
  - memicu job
  - menyimpan data

- SSE HARUS:
  - ditutup saat done
  - ditutup saat error
  - ditutup saat timeout


---

## 7. Idempotency Rules

| Endpoint             | Rule                 |
| -------------------- | -------------------- |
| POST /meetings       | Create once          |
| POST /chunks         | Idempotent per index |
| POST /close          | Safe to repeat       |
| POST /resume-summary | Single-flight        |

---

## 8. Error Handling Guarantees

- Semua error terklasifikasi
- Tidak ada silent failure
- Error tidak merusak state
- Error tidak bocorkan detail internal

---

## 9. Explicit API Non-Goals

- WebSocket
- GraphQL
- Streaming token mentah
- Batch summary endpoint

---

### 10. Explicit API Non-Goals

- WebSocket
- GraphQL
- Streaming token mentah
- Batch summary endpoint

---

### 11. Document Status

- Document: API_CONTRACT
- Version: v2.2
- Status: FINAL & LOCKED

## Guiding API Rule
> **Jika frontend bisa menebak maksud backend,
maka kontrak API belum cukup jelas.**