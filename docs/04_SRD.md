# 04_SRD.md
# System Requirements Document (SRD)
## Notulen AI v2.3 — FINAL & LOCKED

---

### Document Metadata
- Product Name: Notulen AI
- Document Type: System Requirements Document (SRD)
- Version: 2.3
- Status: FINAL & LOCKED
- Audience: Developers, AI Agents
- Change Type: Minor Feature Update (Semantic Versioning)
- Supersedes: SRD v2.2

---

## 1. System Overview

Notulen AI is a web-based application designed to automatically generate structured meeting minutes using AI.  
The system records or accepts meeting audio, processes speech-to-text, and produces concise, structured summaries suitable for professional documentation and archival.

Primary objectives:
- Low AI operational cost
- Deterministic and robust system behavior
- Clear meeting lifecycle finality
- Professional, production-grade UX
- Suitable for long meetings (>30 minutes)

---

## 2. In Scope

- Browser-based audio recording (microphone, optional tab audio)
- Audio file upload
- Speech-to-text using Whisper
- AI-based meeting summary generation
- Three summary modes:
  - Standard
  - Important Points
  - Detailed
- Server-Sent Events (SSE) for summary progress
- Meeting history view
- Rename meeting
- Delete meeting
- Limited summary re-generation
- No authentication

---

## 3. Out of Scope

- Zoom / Google Meet bots
- Persistent audio storage
- Persistent raw transcript storage
- Desktop application
- Multi-user collaboration
- Token-level streaming
- Automatic system-wide audio capture

---

## 4. System Architecture

### 4.1 High-Level Architecture

Browser (Nuxt 4)  
→ REST API & SSE  
Backend API (Fastify, Node.js LTS)  
→ AI Services  
- Whisper (Speech-to-Text)  
- GPT-4o-mini (Summary)  
→ Database (SQLite via Prisma)

---

## 5. Technology Stack

### Frontend
- Nuxt 4
- TypeScript
- Web Audio API
- MediaRecorder API
- Server-Sent Events (SSE)

### Backend
- Node.js (LTS)
- Fastify
- TypeScript
- Prisma ORM

### Database
- SQLite (default)
- PostgreSQL compatible

### AI Services
- OpenAI Whisper (STT)
- GPT-4o-mini (Summary)

---

## 6. Meeting State Machine

```
CREATED
  ↓
RECORDING
  ↓
PROCESSING
  ↓
SUMMARY_READY (Final State)
```

Rules:
- No additional states are allowed
- No state skipping is allowed
- SSE connections are allowed ONLY during PROCESSING

---

## 7. Audio Processing

- Audio may be recorded via browser or uploaded as a file
- Audio is processed in chunks
- Audio files are NOT stored permanently
- Audio is used only for speech-to-text processing

---

## 8. AI Summary Processing

### 8.1 Summary Modes
- STANDARD: Balanced summary
- IMPORTANT: Key decisions and outcomes only
- DETAILED: Full meeting minutes



## 9. Summary Re-Generation Policy (v2.3)

- Re-generation is allowed ONLY when:
  - meeting.state == SUMMARY_READY
- Re-generation is NOT allowed when:
  - meeting.state == PROCESSING
- Only ONE summary record exists per meeting
- Re-generation MUST overwrite the previous summary
- No summary version history is stored

Backend MUST reject invalid attempts with:
- error.code = SESSION_ALREADY_CLOSED
- or error.code = INVALID_MEETING_STATE

---

## 10. Server-Sent Events (SSE)

- SSE is used ONLY for:
  - Progress updates
  - Temporary section-level summaries
- SSE MUST NOT:
  - Control job execution
  - Affect meeting state
  - Persist partial data
- SSE disconnect MUST NOT stop summary processing
- Final summary MUST always be fetched via REST API

---

## 11. Meeting Metadata Management (v2.3)

### 11.1 Rename Meeting

- Meeting title MAY be updated when state is:
  - CREATED
  - SUMMARY_READY
  - COMPLETED
- Meeting title MUST NOT be updated when state is:
  - RECORDING
  - PROCESSING
- Renaming a meeting MUST NOT:
  - Trigger AI processing
  - Modify summary content
  - Change meeting state

---

## 12. Meeting Deletion Policy (v2.3)

- Meetings MAY be deleted when state is:
  - CREATED
  - SUMMARY_READY
  - COMPLETED
- Meetings MUST NOT be deleted when state is:
  - RECORDING
  - PROCESSING
- Deletion is a HARD DELETE:
  - Meeting record is removed
  - Associated summary is removed (cascade)
  - Operation is irreversible

---

## 13. API Contract

### 13.1 Success Response
```json
{
  "success": true,
  "data": {}
}
```

### 13.2 Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "requestId": "req_xxx"
  }
}
```

### 13.3 Error Codes
- MEETING_NOT_FOUND
- INVALID_MEETING_STATE
- SESSION_ALREADY_CLOSED
- FAILED_THIRD_PARTY
- INTERNAL_ERROR

---

## 14. UX Guarantees (v2.3)

- Temporary summary content MUST be clearly labeled
- Final summary MUST be visually distinct
- Summary modification controls MUST be hidden or disabled after completion
- Users MUST be explicitly informed when a session is finalized

---

## 15. Non-Functional Requirements

### Performance
- Support 1000–3000 concurrent clients
- Asynchronous background jobs
- Throttled SSE updates

### Reliability
- Stateless backend
- Idempotent APIs
- Strict state validation

### Security
- Explicit user permissions for audio
- No system audio sniffing
- No sensitive data persistence

---

## 16. Document Status

This document is FINAL & LOCKED.  
Any modification requires a new version increment.

---

## Guiding System Rule
> **Jika terjadi konflik antara UX dan konsistensi state,  
konsistensi state HARUS menang.**
