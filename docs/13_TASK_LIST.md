# 13_TASK_LIST.md
# Implementation Task List
## Notulen AI v2.3 — FINAL & LOCKED

---

### Document Metadata
- Product Name: Notulen AI
- Document Type: Implementation Task List
- Version: 2.3
- Status: FINAL & LOCKED
- Target Agent: Claude Opus 4.5
- Scope: Implementation Only
- Aligned With: SRD v2.3

---

## GLOBAL IMPLEMENTATION RULES

- MUST follow **SRD v2.3** strictly
- MUST NOT introduce new features
- MUST NOT modify state machine
- MUST NOT store audio or raw transcript in database
- MUST use TypeScript across FE and BE
- MUST use Fastify (BE) and Nuxt 3 (FE)
- MUST enforce meeting state guards
- MUST enforce summary finality rules
- All API responses MUST follow global API contract
- All errors MUST use error codes (no free-text messages)

---

## PHASE 0 — Repository Setup

### TASK 0.1 — Initialize Monorepo

**Objective**  
Prepare a single repository for frontend, backend, and shared code.

**Actions**
- Create directory structure:
  ```
  /apps/frontend
  /apps/backend
  /packages/shared
  ```
- Configure root TypeScript settings
- Configure shared package for:
  - Error codes
  - Shared enums (MeetingState, SummaryMode)
  - Shared DTO types

**Output**
- Repository installs and builds successfully

---

## PHASE 1 — Backend (Fastify, Node.js)

### TASK 1.1 — Fastify Server Bootstrap

**Objective**  
Initialize backend server with production-safe defaults.

**Actions**
- Initialize Fastify server
- Enable requestId
- Implement global error handler:
  - Wrap all errors in API contract format
  - Map errors to error.code

**Acceptance Criteria**
- `/health` endpoint returns success response
- Invalid request returns structured error

---

### TASK 1.2 — Database Schema & Migration

**Objective**  
Implement data model aligned with SRD v2.3.

**Actions**
- Implement Prisma schema:
  - meetings
  - summaries
- Define enums:
  - MeetingState
  - SummaryMode
- Configure cascade delete (meeting → summary)
- Generate migration (v2.3)

**Acceptance Criteria**
- Migration runs without error
- Only one summary per meeting enforced

---

### TASK 1.3 — Meeting State Guard

**Objective**  
Enforce deterministic meeting lifecycle.

**Actions**
- Implement `transitionMeetingState()` helper
- Validate all state transitions
- Reject invalid transitions with:
  - error.code = INVALID_MEETING_STATE

**Acceptance Criteria**
- No endpoint can bypass state rules

---

### TASK 1.4 — Audio Ingestion & STT Pipeline

**Objective**  
Process long meeting audio safely and efficiently.

**Actions**
- Implement chunked audio upload
- Support recordings >30 minutes
- Send audio to Whisper API
- Aggregate transcript in memory only

**Acceptance Criteria**
- Audio is never stored permanently
- Raw transcript is never written to DB

---

### TASK 1.5 — Summary Generation Job

**Objective**  
Generate structured meeting summary.

**Actions**
- Implement async summary job
- Use final prompt templates (3 modes)
- Save final summary only
- Overwrite summary on re-generation
- Enforce re-generation rules:
  - Allowed only in SUMMARY_READY

**Acceptance Criteria**
- Summary stored once per meeting
- Re-generation overwrites previous content
- No AI calls allowed after COMPLETED

---

### TASK 1.6 — Summary Streaming (SSE)

**Objective**  
Provide real-time progress without affecting job integrity.

**Actions**
- Implement SSE hub
- Supported events:
  - progress
  - section
  - done
  - error
- Allow SSE connection only during PROCESSING

**Acceptance Criteria**
- SSE disconnect does not stop summary job
- SSE data is treated as temporary

---

### TASK 1.7 — Meeting Management APIs (v2.3)

**Objective**  
Support rename, delete, and session finalization.

**Actions**
- Implement endpoints:
  - PATCH /meetings/:id (rename)
  - DELETE /meetings/:id
  - POST /meetings/:id/close-session
  - POST /meetings/:id/summary/regenerate
- Enforce state rules per SRD v2.3

**Acceptance Criteria**
- Rename blocked during RECORDING & PROCESSING
- Delete blocked during RECORDING & PROCESSING
- Regenerate blocked after COMPLETED
- Correct error codes returned

---

## PHASE 2 — Frontend (Nuxt 3)

### TASK 2.1 — Frontend Bootstrap

**Objective**  
Prepare Nuxt 3 application.

**Actions**
- Setup Nuxt 3 + TypeScript
- Create API client wrapper
- Implement global error mapping (error.code → i18n)
- Implement SSE client helper

---

### TASK 2.2 — Recording Interface

**Objective**  
Provide clear audio recording UX.

**Actions**
- Implement audio visualization bar
- Support microphone (optional tab audio)
- Start / Stop recording controls

**Acceptance Criteria**
- No realtime transcription shown
- User clearly knows recording is active

---

### TASK 2.3 — Processing & SSE UX

**Objective**  
Show transparent processing state.

**Actions**
- Connect to SSE during PROCESSING
- Render progress and temporary sections
- Label all SSE content as temporary

**Acceptance Criteria**
- Temporary content never treated as final
- UI survives refresh or SSE disconnect

---

### TASK 2.4 — Summary View

**Objective**  
Display final summary and manage finality.

**Actions**
- Render structured summary:
  - Agenda
  - Decisions
  - Action Items
- Allow summary mode change only in SUMMARY_READY
- Implement “Close Session” action

**Acceptance Criteria**
- Summary locked after COMPLETED
- No regenerate controls after completion

---

### TASK 2.5 — History View (v2.3)

**Objective**  
Manage archived meetings.

**Actions**
- List meetings
- Inline rename
- Delete with confirmation dialog

**Acceptance Criteria**
- Deleted meetings removed permanently
- Renaming does not affect summary

---

## PHASE 3 — Guards & Validation

### TASK 3.1 — Token & Cost Guard

**Objective**  
Prevent unbounded AI usage.

**Actions**
- Limit summary generation count
- Reject re-generation after COMPLETED
- Reject concurrent regenerate requests

---

### TASK 3.2 — Edge Case Scenarios

**Objective**  
Ensure robustness.

**Test Scenarios**
- Delete meeting during PROCESSING
- Regenerate after COMPLETED
- Double-click regenerate
- Refresh browser during SSE
- Rename during invalid states

---

## PHASE 4 — Final Verification

### TASK 4.1 — End-to-End Validation

**Checklist**
- All APIs follow contract
- State machine cannot be bypassed
- No audio or transcript stored
- SSE safe on disconnect
- Summary finality enforced
- Token usage predictable

---

## TASK LIST STATUS

This task list is FINAL & LOCKED.  
Any implementation must conform to SRD v2.3.
