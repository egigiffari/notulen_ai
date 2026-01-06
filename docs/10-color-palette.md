# Color Palette — Notulen AI

Dokumen referensi warna untuk konsistensi desain aplikasi.

---

## Primary Colors

| Variable | Hex | Usage |
|----------|-----|-------|
| `--primary` | `#06b6d4` | Tombol utama, aksen |
| `--primary-hover` | `#0891b2` | Hover state tombol |
| `--primary-light` | `#22d3ee` | Gradien, highlight |

## Accent Colors

| Variable | Hex | Usage |
|----------|-----|-------|
| `--accent` | `#8b5cf6` | Gradien judul, dekorasi |
| `--accent-hover` | `#7c3aed` | Hover aksen |

## Background Colors

| Variable | Hex | Usage |
|----------|-----|-------|
| `--bg-dark` | `#0f172a` | Background utama |
| `--bg-card` | `#1e293b` | Card, panel |
| `--bg-elevated` | `#334155` | Elevated surfaces |

## Text Colors

| Variable | Hex | Usage |
|----------|-----|-------|
| `--text-main` | `#f8fafc` | Teks utama (putih) |
| `--text-muted` | `#94a3b8` | Teks sekunder |
| `--text-subtle` | `#64748b` | Hint, placeholder |

## Status Colors

| Variable | Hex | Usage |
|----------|-----|-------|
| `--danger` | `#ef4444` | Error, hapus |
| `--success` | `#10b981` | Sukses, selesai |

---

## Gradien Utama

```css
/* Tombol Mulai */
background: linear-gradient(135deg, #06b6d4, #0891b2);

/* Judul Aplikasi */
background: linear-gradient(135deg, #06b6d4, #8b5cf6);

/* Audio Bar */
gradient: #06b6d4 → #22d3ee;
```

---

## Prinsip Desain

1. **Kontras tinggi** — Mudah dibaca untuk semua umur
2. **Warna hangat pada aksi** — Cyan untuk positif, merah untuk berhenti
3. **Gradien halus** — Kesan modern tanpa berlebihan
4. **Konsistensi** — Gunakan variabel CSS, hindari hardcode
