# 02_PRD.md
# Product Requirements Document (PRD)
## Notulen AI v2.2

---

## 1. Tujuan Produk

### 1.1 Masalah yang Diselesaikan
- Rapat berdurasi panjang sulit didokumentasikan secara konsisten
- Notulen manual:
  - memakan waktu
  - rawan bias
  - sulit distandarkan
- Proses AI sering gagal secara UX (menunggu lama, tidak jelas progres)

### 1.2 Tujuan Utama
Menyediakan aplikasi web yang:
- merekam rapat
- memproses hasil rapat menggunakan AI
- menghasilkan notulen terstruktur
- **tetap usable dan stabil meskipun proses AI lama**

---

## 2. Target Pengguna

### 2.1 Primary User
- Profesional / tim kecil
- Admin / sekretaris rapat
- Pengguna non-teknis
- Usia beragam (termasuk pengguna senior)

### 2.2 Karakteristik
- Tidak peduli detail teknis AI
- Menginginkan:
  - kejelasan proses
  - hasil yang rapi
  - sistem yang “tidak aneh” saat lama

---

## 3. Value Proposition

### 3.1 Nilai Utama
- **Notulen otomatis yang konsisten**
- **UX transparan untuk proses panjang**
- **Tahan terhadap refresh, tab close, dan error AI**
- **Bisa ditunjukkan sebagai showcase teknologi yang matang**

### 3.2 Bukan Nilai Utama (Out of Scope)
- Realtime collaboration
- Transkripsi realtime
- Akurasi AI absolut (100%)

---

## 4. Core User Journey (High-Level)

1. User membuka aplikasi
2. User mulai merekam rapat
3. User menghentikan rekaman
4. Sistem memproses rapat (PROCESSING)
5. User melihat progres (SSE)
6. Ringkasan selesai
7. User menyimpan / melihat ulang hasil

---

## 5. Fitur Utama (MVP)

### 5.1 Rekam Audio Rapat
**Deskripsi**
- User merekam audio rapat
- Audio dibagi menjadi chunk
- Chunk dikirim ke backend

**Requirement**
- Durasi > 30 menit
- Peserta > 10 orang
- Tanpa realtime transcription

**Constraint**
- Audio hanya digunakan untuk proses AI
- Audio tidak wajib disimpan permanen

---

### 5.2 Proses Summary Berbasis AI
**Deskripsi**
- Setelah rekaman ditutup, sistem memproses rapat
- Proses berjalan async

**Requirement**
- Proses tidak tergantung client
- Client boleh refresh / keluar

**Constraint**
- Proses summary hanya boleh dimulai sekali
- Tidak boleh ada summary ganda

---

### 5.3 Summary Modes
Sistem menyediakan **3 mode ringkasan**:

| Mode | Tujuan |
|----|------|
| STANDARD | Ringkasan seimbang |
| IMPORTANT | Poin krusial saja |
| DETAILED | Notulen lengkap |

**Constraint**
- Struktur output selalu konsisten
- Mode hanya mempengaruhi gaya, bukan struktur

---

### 5.4 Realtime Feedback (SSE)
**Deskripsi**
- User melihat progres summary secara realtime

**Yang Ditampilkan**
- Progress chunk
- Section summary sementara

**Yang Tidak Ditampilkan**
- Token mentah
- Hasil final

**Constraint (NON-NEGOTIABLE)**
- SSE hanya observer
- Partial summary tidak disimpan
- Final summary selalu via REST

---

### 5.5 Resume Summary (Quota Handling)
**Deskripsi**
- Jika AI quota habis, proses berhenti aman
- User dapat melanjutkan secara manual

**Requirement**
- Resume manual
- Resume idempotent
- Tidak auto-resume

---

### 5.6 Riwayat Rapat
**Deskripsi**
- User dapat melihat daftar rapat
- User dapat membuka kembali summary

**Constraint**
- Hanya summary final yang ditampilkan
- Tidak ada audio / transcript viewer

---

## 6. UX Principles (Product-Level)

### 6.1 Transparansi
- Sistem harus selalu memberi tahu:
  - sedang apa
  - status apa
- Tidak ada loading tanpa konteks

---

### 6.2 Kesabaran Sistem
- Proses lama adalah normal
- Sistem tidak terlihat “error” hanya karena lambat

---

### 6.3 Kejujuran UX
- Partial ≠ final
- Error AI ≠ kesalahan user
- Quota habis ≠ kegagalan sistem

---

## 7. Error Handling (Product View)

### 7.1 Klasifikasi Error
| Jenis | Perlakuan UX |
|----|------------|
| Error AI sementara | Informasi + retry |
| Quota habis | Informasi + resume |
| Error sistem | Pesan umum |

### 7.2 Prinsip
- Error message dikontrol frontend (i18n)
- Backend hanya kirim error code

---

## 8. Non-Functional Product Requirements

### 8.1 Performance (Perceived)
- User melihat progres < 5 detik setelah PROCESSING
- Tidak ada “blank waiting”

### 8.2 Reliability
- Tidak ada data rusak akibat refresh
- Tidak ada hasil setengah matang disimpan

### 8.3 Simplicity
- Tanpa login
- Tanpa setup panjang

---

## 9. Out of Scope (Explicit)

Produk **TIDAK** mencakup:
- Login & user management
- Team / organization
- Realtime transcription
- Editing hasil summary
- Export PDF / DOCX (v2.2)

---

## 10. Success Metrics (Kualitatif)

Produk dianggap berhasil jika:
- User memahami apa yang sedang terjadi
- User tidak bingung saat proses lama
- Tidak ada laporan “hasil aneh”
- Demo berjalan mulus tanpa intervensi manual

---

## 11. Product Constraints (FINAL)

- State-driven system
- Async-first
- SSE optional
- Resume manual
- Error expected & recoverable
- Minimal feature surface

---

## 12. Status Dokumen

- **Dokumen:** PRD
- **Versi:** v2.2
- **Status:** FINAL & LOCKED
- **Perubahan besar selanjutnya:** v3 (user, team, enterprise)

---

## Guiding Product Rule
> **Lebih baik sistem lambat tapi jelas  
daripada cepat tapi membingungkan.**
