# User Flow — Notulen AI (Final)

Dokumen ini mendeskripsikan alur pengguna secara end-to-end.

---

## Alur Utama (Happy Path)

1. Pengguna membuka aplikasi
2. Pengguna menekan tombol "Mulai Rekam Rapat"
3. Sistem membuat sesi rapat (Meeting)
4. Pengguna merekam audio
5. Pengguna menekan "Selesai Rekam"
6. Pengguna memilih apakah audio disimpan
7. Pengguna menekan "Buat Ringkasan"
8. Sistem memproses audio → summary AI
9. Ringkasan ditampilkan
10. Pengguna dapat:
    - mengganti judul rapat (edit langsung)
    - mengganti mode ringkasan (re-generate)
    - menutup sesi
11. Setelah sesi ditutup:
    - sistem menutup akses perubahan
    - sistem mengarahkan ke halaman Riwayat
12. Pengguna dapat melihat kembali atau menghapus hasil di halaman Riwayat

---

## Aturan Penting

- Re-generate summary hanya boleh saat sesi masih ACTIVE
- Setelah sesi ditutup, audio dihapus (jika tidak disimpan)
- Ringkasan tersimpan bersifat read-only

---

## State Sesi Rapat

- ACTIVE
- COMPLETED
