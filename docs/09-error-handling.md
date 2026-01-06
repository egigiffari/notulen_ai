# Error Handling & Edge Case — Notulen AI

Dokumen ini mendefinisikan perilaku sistem saat error.

---

## Error Global

### API Tidak Merespons
UX:
- "Terjadi gangguan sistem. Silakan coba lagi."

---

## Rekaman Audio

### Permission Ditolak
UX:
- "Aplikasi memerlukan akses mikrofon untuk merekam rapat."

### Audio Kosong
UX:
- "Tidak ada suara yang terdeteksi."

---

## Summary

### AI Gagal Menghasilkan Output
UX:
- "Ringkasan belum berhasil dibuat. Silakan coba ulang."

### Output Bukan JSON
System:
- Retry sekali
- Jika gagal, tampilkan error UX

---

## Lifecycle Meeting

### Re-generate Setelah Close
Response:
- HTTP 409
UX:
- "Sesi rapat sudah ditutup."

---

## Management Features

### Gagal Update Judul
UX:
- Message box: "Gagal mengubah judul. Silakan coba lagi."

### Gagal Hapus Riwayat
UX:
- Message box: "Gagal menghapus riwayat. Pastikan koneksi stabil."

---

## Prinsip Error UX

- Bahasa manusia
- Tidak menyebut AI / teknis
- Selalu ada jalan kembali