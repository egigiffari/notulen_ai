# API Contract — Notulen AI

Base URL: /api

---

## POST /meetings
Membuat sesi rapat baru.

Request:
{
  "title": "optional"
}

Response:
{
  "id": "string",
  "status": "ACTIVE",
  "startedAt": "ISO Date"
}

---

## POST /meetings/:id/transcribe
Upload audio & proses STT.

Request:
- multipart/form-data
  - audio: file
  - saveAudio: boolean

Response:
{
  "message": "Audio berhasil diproses",
  "durationSeconds": number
}

---

## POST /meetings/:id/summarize
Generate / re-generate summary.

Request:
{
  "mode": "STANDARD | IMPORTANT | DETAILED"
}

Response:
{
  "mode": "IMPORTANT",
  "content": {
    "ringkasan": "",
    "agenda": [],
    "keputusan": [],
    "action_items": []
  }
}

---

## POST /meetings/:id/close
Menutup sesi rapat. Setelah ini, ringkasan tidak bisa di-regenerate.

Response:
{
  "status": "COMPLETED"
}

---

## PATCH /meetings/:id
Memperbarui metadata rapat (misal: judul).

Request:
{
  "title": "Judul Baru"
}

Response:
{
  "id": "string",
  "title": "Judul Baru",
  ...
}

---

## DELETE /meetings/:id
Menghapus rapat, ringkasan, dan file audio terkait.

Response:
{
  "success": true,
  "message": "Meeting and audio deleted successfully"
}

---

## GET /meetings
Ambil riwayat rapat.

Response:
[
  {
    "id": "",
    "title": "",
    "startedAt": "",
    "durationSeconds": 0,
    "status": "COMPLETED"
  }
]

---

## GET /meetings/:id
Detail rapat & summary.

Response:
{
  "id": "",
  "summary": { ... }
}
