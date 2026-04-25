## 5. Release 1 — Registrasi & Dashboard {#release-1}

### Milestone & Urutan Pengerjaan

```
Sprint 1 (Backend Foundation)
  ├── [BE] Setup project Express + Prisma
  ├── [BE] Schema DB: Sisya, SisyaProgram, ProgramAjahan, KonfigurasiAplikasi
  ├── [BE] Migration + Seed: admin user, 4 program ajahan + tarif, konfigurasi rekening
  ├── [BE] API Auth (login/logout/me)
  ├── [BE] Setup Multer — upload.middleware.js (semua file opsional)
  ├── [BE] API GET /api/program-ajahan — list + tarif (PUBLIC)
  ├── [BE] API GET /api/konfigurasi — info rekening (PUBLIC)
  ├── [BE] API POST /api/sisya — multipart/form-data, programIds[], isPasangan[]
  └── [BE] API GET /api/sisya/:id/files/:nama — terproteksi JWT

Sprint 2 (Frontend Foundation)
  ├── [FE] Setup project React + Vite + Tailwind + shadcn
  ├── [FE] Routing structure (React Router)
  ├── [FE] Layout: Public & Admin (sidebar + menu Pengaturan)
  ├── [FE] Halaman Login Admin
  └── [FE] Protected Route + auth store (Zustand)

Sprint 3 (Form Registrasi + Kalkulasi Punia)
  ├── [FE] Komponen ProgramAjahanPicker.jsx — multi-checkbox + opsi pasangan
  ├── [FE] Hook usePuniaCalculator.js — kalkulasi total real-time
  ├── [FE] Komponen RincianPunia.jsx — tampilkan breakdown + info rekening
  ├── [FE] Komponen FileDropzone.jsx — reusable, semua opsional
  ├── [FE] Step1DataPribadi.jsx + Step2DataAjahan.jsx + RegistrasiWizard.jsx
  ├── [FE] Submit via FormData (multipart) + programIds[] sebagai JSON string
  └── [FE] Halaman /daftar/sukses: rincian program + total punia + instruksi transfer

Sprint 4 (Dashboard, Tabel, Detail & Pembayaran)
  ├── [BE] API GET /dashboard/summary & /charts (termasuk estimasi punia)
  ├── [BE] API GET /api/sisya (filter multi-program, status bayar)
  ├── [BE] API PATCH /api/sisya/:id/status & /api/sisya/:id/pembayaran
  ├── [BE] API POST /api/sisya/:id/upload-punia — sisya upload bukti menyusul
  ├── [FE] Dashboard: widget + grafik punia per bulan (stacked bar)
  ├── [FE] Tabel sisya: badge multi-program + kolom total punia + status bayar
  └── [FE] Detail sisya: tabel program+punia, verifikasi pembayaran, lihat dokumen

Sprint 5 (Pengaturan, Laporan, Export & Telegram)
  ├── [BE] API PATCH /api/program-ajahan/:id/tarif — update tarif punia
  ├── [BE] API PATCH /api/konfigurasi — update info rekening
  ├── [BE] API GET /api/laporan/sisya (filter + kolom punia)
  ├── [BE] Telegram: notifikasi registrasi + total punia + status bukti
  ├── [BE] Telegram: command /summary dengan estimasi punia bulan ini
  ├── [FE] Halaman Pengaturan: tabel tarif program (edit inline) + info rekening
  ├── [FE] Halaman Laporan + Export Excel (termasuk kolom program & punia)
  └── [QA] Testing end-to-end + bug fix

Sprint 6 (Polish & Deploy)
  ├── [OPS] Setup VPS: Nginx, PM2, SSL (Let's Encrypt)
  ├── [OPS] Nginx: deny all /uploads/ + client_max_body_size 15M
  ├── [OPS] Buat direktori uploads/sisya/ + permission
  ├── [OPS] Deploy backend + frontend + migrate production DB
  ├── [OPS] Daftarkan Telegram webhook ke domain VPS
  ├── [OPS] Setup cron backup PostgreSQL harian
  └── [QA] UAT dengan stakeholder yayasan
```
