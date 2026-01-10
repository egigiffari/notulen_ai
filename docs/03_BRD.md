# 03_BRD.md
# Business Requirements Document (BRD)
## Notulen AI v2.2

---

## 1. Tujuan Bisnis

### 1.1 Latar Belakang
Dokumentasi rapat adalah aktivitas bernilai tinggi namun mahal secara waktu dan konsistensi.  
Notulen AI bertujuan menunjukkan bahwa proses ini dapat:
- diotomatisasi dengan AI
- tetap stabil untuk proses panjang
- memberikan UX profesional meskipun AI memiliki keterbatasan (latency, quota)

### 1.2 Tujuan Bisnis Utama
- Menjadi **showcase sistem AI yang matang** (bukan sekadar demo)
- Menunjukkan kompetensi:
  - arsitektur async
  - error handling AI
  - UX untuk proses lama
- Menjadi fondasi produk yang **mudah ditingkatkan ke v3**

---

## 2. Stakeholder

### 2.1 Stakeholder Utama
- Product Owner / Founder
- Developer / System Designer
- AI Agent (Claude Sonnet 4.5 / setara)

### 2.2 Stakeholder Sekunder
- Viewer demo (investor, klien, internal)
- Pengguna non-teknis saat showcase

---

## 3. Nilai Bisnis (Business Value)

### 3.1 Nilai yang Dihasilkan
- Penghematan waktu notulen manual
- Konsistensi format notulen
- Persepsi profesional terhadap AI system
- Kepercayaan terhadap sistem yang “tidak mudah rusak”

### 3.2 Nilai Non-Fungsional
- Menunjukkan best practice:
  - state machine eksplisit
  - SSE yang aman
  - AI quota recovery
- Menurunkan risiko demo failure

---

## 4. Ruang Lingkup Bisnis

### 4.1 In-Scope
- Rekaman rapat
- Proses AI async
- Ringkasan rapat terstruktur
- Progress feedback realtime
- Riwayat rapat
- Penanganan error & quota

### 4.2 Out-of-Scope (Keputusan Sadar)
- Monetisasi
- User account / login
- Billing
- SLA enterprise
- Compliance (ISO, SOC2, dsb.)

> Out-of-scope ini **bukan keterbatasan teknis**, tetapi **keputusan bisnis untuk menjaga fokus dan biaya rendah**.

---

## 5. Business Constraints (NON-NEGOTIABLE)

### 5.1 Biaya
- Menggunakan AI pihak ketiga
- Biaya harus:
  - terkendali
  - bisa dihentikan
  - tidak meledak saat demo

### 5.2 Operasional
- Sistem harus tetap “masuk akal” meskipun:
  - AI lambat
  - AI error
  - quota habis

### 5.3 Tim
- 1–2 developer
- Dibantu AI Agent
- Tidak ada tim DevOps khusus

---

## 6. Risiko Bisnis & Mitigasi

### 6.1 Risiko: Demo Gagal karena AI Error
**Mitigasi**
- Error diklasifikasikan
- UX menjelaskan kondisi
- Resume manual tersedia

---

### 6.2 Risiko: Sistem Terlihat “Hang”
**Mitigasi**
- SSE progress feedback
- Status PROCESSING eksplisit
- Tidak ada blank screen

---

### 6.3 Risiko: Biaya AI Membengkak
**Mitigasi**
- Resume manual
- Concurrency limit
- Tidak auto-retry

---

### 6.4 Risiko: Bug Akibat Refresh / Multi-tab
**Mitigasi**
- State di DB
- Idempotent endpoint
- SSE observer-only

---

## 7. KPI & Indikator Keberhasilan (Business View)

### 7.1 KPI Kualitatif
- Demo berjalan tanpa intervensi manual
- Stakeholder memahami alur sistem
- Tidak ada pertanyaan:
  > “Ini error atau masih proses?”

### 7.2 KPI Teknis yang Berdampak Bisnis
- Tidak ada crash saat SSE aktif
- Tidak ada summary ganda
- Tidak ada PROCESSING selamanya

---

## 8. Strategi Skalabilitas Bisnis

### 8.1 Target Awal
- 1.000–3.000 client
- Usage tidak serentak

### 8.2 Prinsip Skalabilitas
- Scale by limiting, not by brute force
- Lebih baik reject terkontrol daripada overload

---

## 9. Evolusi Produk (Business Roadmap)

### v2.2 (Saat Ini)
- Single-user
- No login
- Async AI
- SSE
- Resume manual

### v3 (Opsional, Masa Depan)
- User & team
- Summary history lintas user
- Export & sharing
- Billing & quota per user

> v3 **tidak boleh mematahkan arsitektur v2.2**.

---

## 10. Definition of Business Success

Produk dianggap **berhasil secara bisnis** jika:
- Sistem stabil saat demo
- Tidak ada error fatal
- AI Agent dapat membantu implementasi tanpa kebingungan
- Biaya AI terkendali
- Stakeholder percaya sistem ini bisa dikembangkan

---

## 11. Business Rules (FINAL)

- Sistem boleh lambat, tapi tidak boleh membingungkan
- Error boleh terjadi, tapi harus bisa dijelaskan
- User harus selalu punya jalan keluar
- Tidak ada fitur yang menambah risiko demo

---

## 12. Status Dokumen

- **Dokumen:** BRD
- **Versi:** v2.2
- **Status:** FINAL & LOCKED
- **Revisi selanjutnya:** hanya jika scope bisnis berubah

---

## Guiding Business Principle
> **Keandalan sistem adalah aset bisnis utama,  
bukan jumlah fitur.**
