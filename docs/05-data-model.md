# Data Model — Notulen AI

## Entity Utama

### Meeting

Mewakili satu sesi rapat.

Field utama:
- id
- title
- startedAt
- endedAt
- durationSeconds
- audioSaved
- audioPath
- status

---

### Summary

Mewakili ringkasan rapat.

Field utama:
- id
- meetingId
- mode
- content (JSON)
- createdAt
- updatedAt

---

## Relasi

Meeting 1 — 1 Summary

---

## Enum

### MeetingStatus
- ACTIVE
- COMPLETED

### SummaryMode
- STANDARD
- IMPORTANT
- DETAILED

---

## Prinsip Penyimpanan

- Audio: opsional & sementara (dihapus saat record dihapus)
- Transcript: disimpan pada record Meeting untuk pemrosesan AI
- Summary: disimpan permanen & terhubung ke Meeting
