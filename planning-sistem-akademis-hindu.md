# 📋 Planning: Sistem Akademis Yayasan Hindu

> **Project**: Sistem Informasi Akademik Yayasan Hindu  
> **Target Deploy**: VPS (Self-hosted)  
> **Pendekatan**: Monorepo, REST API, Iteratif per Release  
> **Dokumen ini** dirancang untuk diimplementasikan oleh junior programmer atau AI model.

---

## 🗂️ Struktur Dokumen

1. [Tech Stack & Arsitektur](#tech-stack)
2. [Planning Frontend](#planning-frontend)
3. [Planning UI/UX & Flow](#planning-uiux)
4. [Planning Backend](#planning-backend)
5. [Release 1 — Registrasi & Dashboard](#release-1)
6. [Release 2 — Absensi Per Mata Kuliah](#release-2)
7. [Struktur GitHub Issues](#github-issues)
8. [Struktur Folder Proyek](#struktur-folder)
9. [Deployment VPS](#deployment)

---

## 1. Tech Stack & Arsitektur {#tech-stack}

### Frontend
| Komponen | Pilihan | Alasan |
|---|---|---|
| Framework | **React + Vite** | Ringan, cepat build, ekosistem luas |
| UI Library | **Tailwind CSS + shadcn/ui** | Komponen siap pakai, mudah dikustomisasi |
| Routing | **React Router v6** | Standar SPA routing |
| State/Data | **TanStack Query (React Query)** | Manajemen server-state & caching |
| Charts | **Recharts** | Ringan, mudah dipakai junior dev |
| Export Excel | **SheetJS (xlsx)** | Client-side export tanpa backend |
| Form | **React Hook Form + Zod** | Validasi form kuat dan ringan |
| File Upload UI | **react-dropzone** | Drag & drop upload, preview file |
| HTTP Client | **Axios** | Mudah dikonfigurasi interceptor |

### Backend
| Komponen | Pilihan | Alasan |
|---|---|---|
| Runtime | **Node.js** | Ekosistem besar, familiar |
| Framework | **Express.js** | Sederhana, cocok untuk junior dev |
| Database | **PostgreSQL** | Relasional, stabil untuk data akademis |
| ORM | **Prisma** | Schema-first, auto-generate type |
| Auth | **JWT + bcrypt** | Stateless, cukup untuk admin panel |
| Validasi | **Zod** | Shared schema bisa dipakai FE & BE |
| File Upload | **Multer** | Middleware upload file ke disk VPS |
| File/Export | **exceljs** | Generate Excel di server jika diperlukan |

### DevOps / Infrastruktur
| Komponen | Pilihan |
|---|---|
| VPS OS | Ubuntu 22.04 LTS |
| Reverse Proxy | Nginx |
| Process Manager | PM2 |
| SSL | Let's Encrypt (Certbot) |
| Version Control | GitHub (monorepo) |
| CI/CD (opsional) | GitHub Actions |
| Container (opsional) | Docker Compose |

### Struktur Monorepo
```
/
├── frontend/          ← React + Vite app
├── backend/           ← Express.js API
├── shared/            ← Shared types/schema (Zod)
├── docs/              ← Dokumentasi & planning
└── docker-compose.yml
```

---

## 2. Planning Frontend {#planning-frontend}

### 2.1 Halaman & Route

#### Public (tanpa login)
| Route | Halaman | Deskripsi |
|---|---|---|
| `/daftar` | Registrasi Sisya Baru | Form pendaftaran, tidak perlu login |
| `/daftar/sukses` | Konfirmasi Sukses | Tampil nomor pendaftaran & instruksi lanjutan |

#### Admin (dengan login)
| Route | Halaman | Deskripsi |
|---|---|---|
| `/admin/login` | Login Admin | Form login untuk admin/staff |
| `/admin/dashboard` | Dashboard | Grafik & ringkasan sisya baru |
| `/admin/sisya` | Daftar Sisya | Tabel sisya dengan filter & search |
| `/admin/sisya/:id` | Detail Sisya | Profil lengkap sisya |
| `/admin/laporan` | Laporan & Export | Summary + tombol export Excel |
| `/admin/absensi` *(Release 2)* | Kelola Absensi | Daftar per mata kuliah |
| `/admin/absensi/:id` *(Release 2)* | Input Absensi | Form input kehadiran per sesi |

### 2.2 Komponen Utama yang Dibutuhkan

```
src/
├── components/
│   ├── ui/               ← shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── AdminLayout.jsx       ← Sidebar + Header untuk admin
│   │   ├── PublicLayout.jsx      ← Layout halaman publik
│   │   └── Sidebar.jsx
│   ├── charts/
│   │   ├── SisyaBarChart.jsx    ← Grafik per program ajahan
│   │   ├── SisyaPieChart.jsx    ← Grafik per program/jenis kelamin
│   │   └── TrendLineChart.jsx    ← Trend registrasi per bulan
│   ├── forms/
│   │   ├── registrasi/
│   │   │   ├── Step1DataPribadi.jsx   ← Step 1 form
│   │   │   ├── Step2DataAjahan.jsx    ← Step 2 form + upload
│   │   │   └── RegistrasiWizard.jsx   ← Orchestrator multi-step
│   │   └── AbsensiForm.jsx            ← Form absensi (Release 2)
│   ├── upload/
│   │   └── FileDropzone.jsx           ← Komponen drag & drop (react-dropzone)
│   │       ← Props: label, accept, maxSize, required, value, onChange
│   └── tables/
│       ├── SisyaTable.jsx       ← Tabel sisya dengan pagination
│       └── AbsensiTable.jsx      ← Tabel absensi (Release 2)
├── pages/
│   ├── public/
│   │   ├── Registrasi.jsx
│   │   └── RegistrasiSukses.jsx
│   └── admin/
│       ├── Login.jsx
│       ├── Dashboard.jsx
│       ├── Sisya.jsx
│       ├── SisyaDetail.jsx
│       ├── Laporan.jsx
│       └── Absensi.jsx (Release 2)
├── hooks/
│   ├── useSisya.js          ← React Query hooks
│   ├── useAuth.js
│   └── useAbsensi.js
├── services/
│   └── api.js               ← Axios instance & endpoint functions
├── store/
│   └── authStore.js         ← Zustand untuk auth state
└── utils/
    ├── exportExcel.js       ← Helper export SheetJS
    └── formatters.js        ← Format tanggal, dsb
```

### 2.3 State Management Strategy

- **Auth state** → Zustand (persisted ke localStorage)
- **Server data** (sisya, absensi) → TanStack Query (cache otomatis)
- **Form state** → React Hook Form (lokal per form)
- **UI state** (modal, sidebar open) → useState lokal

### 2.4 Proteksi Route Admin

```jsx
// src/components/ProtectedRoute.jsx
// Cek token JWT, redirect ke /admin/login jika tidak ada
```

---

## 3. Planning UI/UX & Flow {#planning-uiux}

### 3.1 Design System

**Tema Visual:**  
Menggunakan palet warna **Saffron (kuning oranye) dan Deep Maroon** — warna khas Hindu/Bali. Bersih, formal, namun tetap hangat.

```css
/* CSS Variables */
--color-primary:   #C05621;  /* Saffron Oranye Tua */
--color-secondary: #744210;  /* Maroon */
--color-accent:    #F6AD55;  /* Kuning Emas Muda */
--color-bg:        #FFFAF0;  /* Krem Putih */
--color-surface:   #FFFFFF;
--color-text:      #2D3748;
--color-muted:     #718096;
```

**Font:**
- Heading: `Playfair Display` (elegan, formal)
- Body: `Source Sans 3` (bersih, mudah dibaca)

### 3.2 User Flow — Registrasi Sisya Baru

```
[Halaman Publik /daftar]
        │
        ▼
┌──────────────────────────────────────────────┐
│  STEP 1: Data Pribadi                        │
│                                              │
│  - Nama Lengkap *                            │
│  - Tempat Lahir *                            │
│  - Tanggal Lahir *                           │
│  - Jenis Kelamin *                           │
│  - Alamat Lengkap *                          │
│  - No. HP / WhatsApp *                       │
│  - Email (opsional)                          │
└──────────────────────────────────────────────┘
        │ Lanjut →
        ▼
┌──────────────────────────────────────────────┐
│  STEP 2: Data Ajahan & Dokumen               │
│                                              │
│  ── Informasi Ajahan ──                      │
│  - Nama Griya *                              │
│  - Nama Desa / Kecamatan *                   │
│                                              │
│  Pilih Program Ajahan * (boleh lebih dari 1) │
│  ┌─────────────────────────────────────────┐ │
│  │ ☑ KAWIKON               Rp 1.000.000   │ │
│  │   └─ Daftar bersama pasangan?          │ │
│  │      ○ Tidak  ● Ya (+Rp 500.000)       │ │
│  │ ☑ KAWELAKAAN            Rp 2.000.000   │ │
│  │ ☐ USADHA                Rp 1.500.000   │ │
│  │ ☐ SERATI                Rp 1.000.000   │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  💰 TOTAL PUNIA YANG HARUS DIBAYAR     │ │
│  │                                         │ │
│  │  KAWIKON (pasangan)  : Rp 1.500.000    │ │
│  │  KAWELAKAAN          : Rp 2.000.000    │ │
│  │  ─────────────────────────────────     │ │
│  │  TOTAL               : Rp 3.500.000    │ │
│  │                                         │ │
│  │  Rekening tujuan:                       │ │
│  │  BCA - 1234567890 a/n Yayasan ...      │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ── Upload Dokumen ──                        │
│                                              │
│  📄 KTP / KK / Ijasah Terakhir (Opsional)   │
│     [Drag & Drop atau Klik Upload]           │
│     Format: JPG, PNG, PDF | Maks: 5MB       │
│                                              │
│  🖼  Foto Latar Belakang Merah (Opsional)    │
│     [Drag & Drop atau Klik Upload]           │
│     Format: JPG, PNG | Maks: 3MB            │
│                                              │
│  💳 Bukti Transfer Punia (Opsional)          │
│     [Drag & Drop atau Klik Upload]           │
│     Format: JPG, PNG, PDF | Maks: 5MB       │
│     Dapat menyusul jika belum transfer       │
└──────────────────────────────────────────────┘
        │ Daftar →
        ▼
[Validasi Client-side (Zod)]
  ├── Field wajib: Nama Griya, Desa, min 1 Program dipilih
  └── File: semua opsional — boleh menyusul
        │
        ▼ (Lolos validasi)
[POST /api/sisya — multipart/form-data]
  ├── File (jika ada) → disimpan di disk VPS
  └── Data sisya + program[] + totalPunia → PostgreSQL
        │
        ▼
┌──────────────────────────────────────────────┐
│  /daftar/sukses                              │
│  🪷 Pendaftaran Berhasil!                    │
│                                              │
│  No. Pendaftaran : YF-2025-0042              │
│  Nama            : I Made Sudarsana          │
│                                              │
│  Program Ajahan  :                           │
│  • KAWIKON (pasangan)    Rp 1.500.000        │
│  • KAWELAKAAN            Rp 2.000.000        │
│  ────────────────────────────────────        │
│  Total Punia     :       Rp 3.500.000        │
│                                              │
│  Silakan lakukan transfer dan simpan         │
│  nomor pendaftaran ini untuk konfirmasi.     │
│                                              │
│  [Salin Nomor]   [Kembali ke Beranda]        │
└──────────────────────────────────────────────┘
```

**UX Notes — Registrasi:**
- Form **2 langkah** (wizard): progress bar `Langkah 1 dari 2` / `Langkah 2 dari 2`
- Tombol "Kembali" ke Step 1 tidak mereset data yang sudah diisi
- **Program Ajahan** ditampilkan sebagai daftar checkbox, bukan dropdown — sisya bisa pilih lebih dari 1
- **Opsi Pasangan** hanya muncul jika KAWIKON dicentang; mengubah harga KAWIKON dari Rp 1.000.000 → Rp 1.500.000
- **Kalkulasi total punia** diupdate secara real-time setiap kali checkbox berubah (client-side, tanpa API call)
- **Info rekening** ditampilkan di bawah kalkulasi — diambil dari konfigurasi admin
- Semua upload dokumen **opsional** — sisya dapat mengirim bukti transfer menyusul
- Tombol "Daftar" di-disable + spinner selama POST berlangsung
- Halaman sukses menampilkan rincian program + total punia + instruksi transfer
- Nomor pendaftaran auto-generate backend (format: `YF-YYYY-XXXX`)

**Aturan Validasi File:**

| Dokumen | Wajib | Format Diterima | Maks Ukuran |
|---|---|---|---|
| KTP / KK / Ijasah Terakhir | Opsional | JPG, PNG, PDF | 5 MB |
| Foto Latar Belakang Merah | Opsional | JPG, PNG | 3 MB |
| Bukti Transfer Punia | Opsional | JPG, PNG, PDF | 5 MB |

**Struktur penyimpanan file di VPS:**
```
/var/www/akademis-hindu/uploads/
└── sisya/
    └── {nomorPendaftaran}/
        ├── dokumen-identitas.{ext}   ← KTP/KK/Ijasah
        ├── foto-sisya.{ext}          ← Foto latar merah
        └── bukti-punia.{ext}         ← Bukti transfer punia
```

> ⚠️ **Keamanan File**: Folder `uploads/` TIDAK boleh diakses langsung via URL publik.
> File hanya bisa diakses lewat endpoint terproteksi JWT:
> `GET /api/sisya/:id/files/:namaFile [AUTH]`
> Konfigurasi Nginx wajib memblokir akses langsung ke direktori ini.

### 3.3 User Flow — Admin Dashboard

```
[/admin/login]
     │ (JWT valid)
     ▼
[/admin/dashboard]
  ├── Widget: Total Sisya (keseluruhan)
  ├── Widget: Sisya Baru Bulan Ini
  ├── Widget: Menunggu Verifikasi Pembayaran ← badge merah jika ada
  ├── Widget: Total Estimasi Punia Bulan Ini
  ├── BarChart: Pendaftar per Bulan
  ├── BarChart: Pendapatan Punia per Bulan (stacked per program)
  ├── PieChart: Distribusi Program Ajahan
  └── PieChart: Distribusi Status Pembayaran
     │
     ▼ (klik "Lihat Semua Sisya")
[/admin/sisya]
  ├── Search bar (nama / nomor pendaftaran / nama griya)
  ├── Filter: Program Ajahan (multi), Status Sisya, Status Bayar, Tahun
  ├── Tabel sisya (paginated)
  │    No. Daftar | Nama | Program (badges) | Griya | Total Punia | Bayar | Status | Aksi
  └── Tombol "Export Excel"
     │
     ▼ (klik nama)
[/admin/sisya/:id]  ← Halaman Detail Sisya
  ├── ── Info Pribadi ──
  │    Nama, Tempat/Tgl Lahir, JK, Alamat, No. HP, Email
  │
  ├── ── Program Ajahan & Punia ──
  │    Nama Griya | Nama Desa
  │    ┌──────────────────────────────────────┐
  │    │ Program        │ Pasangan │ Punia     │
  │    │ KAWIKON        │ Ya       │ 1.500.000 │
  │    │ KAWELAKAAN     │ -        │ 2.000.000 │
  │    │ ─────────────────────────────────── │
  │    │ TOTAL          │          │ 3.500.000 │
  │    └──────────────────────────────────────┘
  │
  ├── ── Status Pembayaran ──
  │    Badge: BELUM_BAYAR / MENUNGGU / LUNAS
  │    [Tandai LUNAS]  ← PATCH /api/sisya/:id/pembayaran  [AUTH]
  │
  ├── ── Dokumen Terupload ──
  │    📄 Identitas  → [Lihat] atau "Tidak diupload"
  │    🖼  Foto       → [Lihat] atau "Tidak diupload"
  │    💳 Bukti Punia → [Lihat] atau "Belum diupload" (badge oranye jika MENUNGGU)
  │
  └── ── Status Sisya ──
       Dropdown: PENDING / AKTIF / TIDAK_AKTIF
       [Simpan Status]
```

**UX Notes — Halaman Detail Sisya:**
- Tabel program menampilkan snapshot tarif saat mendaftar (bukan tarif terkini) — penting agar tidak berubah jika admin edit tarif
- Badge status pembayaran: `BELUM_BAYAR` abu-abu, `MENUNGGU` kuning (ada bukti masuk), `LUNAS` hijau
- Tombol **"Tandai LUNAS"** hanya aktif jika status pembayaran = `MENUNGGU` (sudah ada bukti)
- Tombol **"Lihat"** dokumen: fetch via JWT, buka sebagai Blob URL di tab baru
- Admin bisa ubah status sisya dan status pembayaran secara independen

### 3.3b User Flow — Admin Pengaturan Tarif Punia

```
[/admin/pengaturan]
  ├── ── Tarif Program Ajahan ──
  │    Tabel program yang bisa diedit inline:
  │    ┌──────────────────────────────────────────────────┐
  │    │ Program     │ Tarif Normal │ Tarif Pasangan │ Aktif│
  │    │ KAWIKON     │ 1.000.000    │ 1.500.000      │  ✓  │
  │    │ KAWELAKAAN  │ 2.000.000    │ -              │  ✓  │
  │    │ USADHA      │ 1.500.000    │ -              │  ✓  │
  │    │ SERATI      │ 1.000.000    │ -              │  ✓  │
  │    └──────────────────────────────────────────────────┘
  │    [Edit] per baris → PATCH /api/program-ajahan/:id/tarif
  │    [+ Tambah Program]
  │
  └── ── Info Rekening Transfer ──
       Nama Bank    : [BCA              ]
       No. Rekening : [1234567890        ]
       Nama Pemilik : [Yayasan ...       ]
       [Simpan] ← PATCH /api/konfigurasi
```

### 3.3c User Flow — Upload Bukti Punia Menyusul (Publik)

Sisya yang belum mengupload bukti transfer saat registrasi dapat melakukannya
kapan saja melalui halaman publik dengan modal nomor pendaftaran.

```
[/konfirmasi-bayar]  ← Halaman publik, tanpa login
        │
        ▼
┌──────────────────────────────────────────────┐
│  Konfirmasi Pembayaran Punia                 │
│                                              │
│  Masukkan nomor pendaftaran Anda:            │
│  [ YF-2025-____  ]   [Cari]                 │
└──────────────────────────────────────────────┘
        │ (GET /api/sisya/cari?nomor=YF-2025-0042)
        ▼
┌──────────────────────────────────────────────┐
│  ✅ Data Ditemukan                           │
│                                              │
│  Nama    : I Made Sudarsana                  │
│  Status  : Belum Bayar ← badge oranye        │
│                                              │
│  Rincian Punia:                              │
│  • KAWIKON (pasangan)    Rp 1.500.000        │
│  • KAWELAKAAN            Rp 2.000.000        │
│  ──────────────────────────────────          │
│  Total                   Rp 3.500.000        │
│                                              │
│  Rekening Tujuan:                            │
│  BCA • 1234567890 • a/n Yayasan ...          │
│                                              │
│  💳 Upload Bukti Transfer                    │
│  [Drag & Drop atau Klik Upload]              │
│  Format: JPG, PNG, PDF | Maks: 5MB          │
│                                              │
│  [Kirim Bukti Pembayaran]                    │
└──────────────────────────────────────────────┘
        │ (POST /api/sisya/:id/upload-punia)
        │   multipart/form-data, verified by nomorPendaftaran
        │   → statusPembayaran: BELUM_BAYAR → MENUNGGU
        │   → Notifikasi Telegram ke admin: "💳 Bukti punia masuk!"
        ▼
┌──────────────────────────────────────────────┐
│  🙏 Bukti Pembayaran Berhasil Dikirim        │
│                                              │
│  Terima kasih, I Made Sudarsana.             │
│  Tim kami akan memverifikasi pembayaran      │
│  Anda dalam 1×24 jam.                        │
│                                              │
│  Simpan nomor pendaftaran Anda:              │
│  YF-2025-0042                                │
└──────────────────────────────────────────────┘
```

**UX Notes — Upload Menyusul:**
- Halaman bisa diakses langsung dari link di halaman sukses registrasi: **"Sudah transfer? Kirim bukti di sini"**
- Pencarian nomor pendaftaran hanya menampilkan **nama dan status** — tidak ada data sensitif lain yang ditampilkan
- Jika status sudah `MENUNGGU` atau `LUNAS`, tampilkan pesan: *"Bukti sudah diterima / Pembayaran sudah dikonfirmasi"* dan tidak bisa upload lagi
- Endpoint upload menyusul menggunakan `nomorPendaftaran` sebagai verifikasi (bukan JWT) — tidak perlu login
- Setelah berhasil upload, Telegram notifikasi otomatis dikirim ke channel admin

**Endpoint:**
```
GET  /api/sisya/cari?nomor=YF-2025-0042   ← Cari sisya by nomor (PUBLIC — data terbatas)
POST /api/sisya/:id/upload-punia          ← Upload bukti menyusul (PUBLIC via nomor daftar)
     Body: multipart/form-data
     Field: filePunia (file), nomorPendaftaran (string, untuk verifikasi)
```

**Keamanan endpoint publik ini:**
- Parameter `nomorPendaftaran` wajib cocok dengan `:id` — double check di controller
- Rate limiting: maks 5 request/menit per IP (pakai `express-rate-limit`)
- Data yang dikembalikan `GET /cari` hanya: nama, status pembayaran, rincian program & punia — tidak ada alamat, email, dll

---

### 3.4 User Flow — Laporan & Export

```
[/admin/laporan]
  ├── Summary cards (total, per prodi, dsb)
  ├── Filter: Rentang Tanggal, Program Studi
  ├── Preview tabel di halaman
  └── [Tombol Export Excel]
         │
         ▼ (klik)
  [SheetJS generate file di browser]
         │
         ▼
  [Download otomatis: laporan-sisya-{tanggal}.xlsx]
```

### 3.5 Layout Admin

```
┌────────────────────────────────────────────┐
│  HEADER: Logo Yayasan | Nama User | Logout │
├──────────────┬─────────────────────────────┤
│              │                             │
│   SIDEBAR    │      CONTENT AREA           │
│              │                             │
│ • Dashboard  │   (halaman aktif)           │
│ • Sisya      │                             │
│ • Laporan    │                             │
│ • Absensi    │                             │
│   (R2)       │                             │
│ ─────────    │                             │
│ • Pengaturan │   ← Tarif punia & rekening  │
│              │                             │
└──────────────┴─────────────────────────────┘
```

---

## 4. Planning Backend {#planning-backend}

### 4.1 Struktur Folder Backend

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── sisya.routes.js
│   │   ├── laporan.routes.js
│   │   ├── programAjahan.routes.js
│   │   └── absensi.routes.js       (Release 2)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── sisya.controller.js
│   │   ├── laporan.controller.js
│   │   ├── programAjahan.controller.js
│   │   └── absensi.controller.js   (Release 2)
│   ├── middlewares/
│   │   ├── auth.middleware.js     ← Verifikasi JWT
│   │   ├── validate.middleware.js ← Validasi body Zod
│   │   └── upload.middleware.js   ← Multer config file upload
│   ├── services/
│   │   ├── sisya.service.js
│   │   └── absensi.service.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── app.js
├── .env
├── package.json
└── server.js
```

### 4.2 Database Schema (Prisma)

```prisma
// Release 1 Schema

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // bcrypt hash
  nama      String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
}

enum Role {
  ADMIN
  STAFF
}

// ── Konfigurasi global aplikasi (rekening, info yayasan, dll) ──────────────
model KonfigurasiAplikasi {
  id        Int      @id @default(autoincrement())
  kunci     String   @unique  // e.g. "rekening_bank", "nama_bank", "nama_rekening"
  nilai     String            // e.g. "Bank BPD Bali", "018.02.02.31507-5", "PDPN DIKJAR POLEKSOSDA"
  label     String            // Label ramah admin: "Nomor Rekening"
  updatedAt DateTime @updatedAt
}

// ── Program Ajahan — master data dengan tarif punia ─────────────────────────
model ProgramAjahan {
  id                  Int                @id @default(autoincrement())
  kode                String             @unique  // "KAWIKON", "KAWELAKAAN", dll
  nama                String             // "Kawikon", "Kawelakaan", "Usadha", "Serati"
  deskripsi           String?
  puniaNormal         Int                // Tarif standar dalam Rupiah (e.g. 1000000)
  puniaPasangan       Int?               // Tarif khusus pasangan, null jika tidak berlaku
  isPasanganTersedia  Boolean            @default(false)
  isAktif             Boolean            @default(true)
  urutan              Int                @default(0)  // Urutan tampil di form
  sisyaPrograms       SisyaProgram[]
  mataKuliahs         MataKuliah[]       // Release 2
}

// ── Junction table: Sisya ↔ ProgramAjahan (many-to-many) ────────────────────
model SisyaProgram {
  id              Int           @id @default(autoincrement())
  sisyaId         Int
  sisya           Sisya         @relation(fields: [sisyaId], references: [id])
  programAjahanId Int
  programAjahan   ProgramAjahan @relation(fields: [programAjahanId], references: [id])
  isPasangan      Boolean       @default(false)  // True jika daftar opsi pasangan
  puniaProgram    Int           // Snapshot tarif saat daftar (immutable — harga bisa berubah)
  createdAt       DateTime      @default(now())

  @@unique([sisyaId, programAjahanId])
}

// ── Model utama Sisya ────────────────────────────────────────────────────────
model Sisya {
  id                Int            @id @default(autoincrement())
  nomorPendaftaran  String         @unique  // YF-2025-0001

  // ── Data Pribadi ──────────────────────────────
  namaLengkap       String
  tempatLahir       String
  tanggalLahir      DateTime
  jenisKelamin      JenisKelamin
  alamat            String
  noHp              String
  email             String?

  // ── Data Ajahan ───────────────────────────────
  namaGriya         String
  namaDesa          String

  // ── Relasi Program (multi) ────────────────────
  programSisyas     SisyaProgram[]

  // ── Kalkulasi Punia ───────────────────────────
  totalPunia        Int            // Total yang harus dibayar (snapshot saat daftar)
  statusPembayaran  StatusPembayaran @default(BELUM_BAYAR)

  // ── Dokumen Upload (semua opsional) ───────────
  fileIdentitasPath String?        // KTP/KK/Ijasah
  fileFotoPath      String?        // Foto latar merah
  filePuniaPath     String?        // Bukti transfer punia — boleh menyusul

  // ── Status & Audit ────────────────────────────
  status            StatusSisya    @default(PENDING)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  absensiSisyas     AbsensiSisya[] // Release 2
}

enum JenisKelamin {
  LAKI_LAKI
  PEREMPUAN
}

enum StatusSisya {
  PENDING      // Baru mendaftar
  AKTIF        // Pembayaran terverifikasi, sisya aktif
  TIDAK_AKTIF  // Non-aktif
}

enum StatusPembayaran {
  BELUM_BAYAR   // Belum upload bukti transfer
  MENUNGGU      // Bukti sudah diupload, menunggu verifikasi admin
  LUNAS         // Admin sudah verifikasi pembayaran
}

// ─── Release 2: Absensi ───────────────────────────

model MataKuliah {
  id              Int           @id @default(autoincrement())
  kode            String        @unique
  nama            String
  sks             Int
  semester        Int
  programAjahanId Int
  programAjahan   ProgramAjahan @relation(fields: [programAjahanId], references: [id])
  sesiAbsensis    SesiAbsensi[]
}

model SesiAbsensi {
  id           Int          @id @default(autoincrement())
  mataKuliahId Int
  mataKuliah   MataKuliah   @relation(fields: [mataKuliahId], references: [id])
  tanggal      DateTime
  pertemuan    Int           // Pertemuan ke-berapa
  topik        String?
  createdAt    DateTime     @default(now())
  absensiSisyas     AbsensiSisya[]
}

model AbsensiSisya {
  id            Int         @id @default(autoincrement())
  sesiAbsensiId Int
  sesiAbsensi   SesiAbsensi @relation(fields: [sesiAbsensiId], references: [id])
  sisyaId       Int
  sisya         Sisya       @relation(fields: [sisyaId], references: [id])
  status        StatusAbsensi
  keterangan    String?
  createdAt     DateTime    @default(now())

  @@unique([sesiAbsensiId, sisyaId])
}

enum StatusAbsensi {
  HADIR
  IZIN
  SAKIT
  ALPHA
}
```

### 4.3 REST API Endpoints

#### Auth
```
POST   /api/auth/login        ← Login admin (return JWT)
POST   /api/auth/logout       ← Logout (clear token)
GET    /api/auth/me           ← Get current user [AUTH]
```

#### Sisya — Registrasi & Manajemen (Release 1)
```
POST   /api/sisya                        ← Registrasi baru — multipart/form-data (PUBLIC)
                                           Body: data pribadi + programIds[] + isPasangan[]
                                           + file opsional (identitas, foto, punia)
GET    /api/sisya                        ← List semua [AUTH] + filter/pagination
                                           Query: ?program=KAWIKON&status=PENDING&page=1
GET    /api/sisya/:id                    ← Detail sisya + list program + totalPunia [AUTH]
PATCH  /api/sisya/:id/status             ← Update status sisya (PENDING/AKTIF/TIDAK_AKTIF) [AUTH]
PATCH  /api/sisya/:id/pembayaran         ← Update status pembayaran + verifikasi [AUTH]
POST   /api/sisya/:id/upload-punia       ← Sisya upload bukti transfer menyusul (PUBLIC via nomor daftar)
GET    /api/sisya/:id/files/:nama        ← Akses file dokumen terproteksi [AUTH]
```

#### Dashboard & Laporan (Release 1)
```
GET    /api/dashboard/summary            ← Widget: total, bulan ini, hari ini, pending [AUTH]
GET    /api/dashboard/charts             ← Data grafik: per bulan, per program, per JK [AUTH]
GET    /api/laporan/sisya                ← Data laporan dengan filter [AUTH]
GET    /api/laporan/export               ← Export Excel termasuk kolom program & total punia [AUTH]
```

#### Program Ajahan — Master Data & Tarif
```
GET    /api/program-ajahan               ← List + tarif punia (PUBLIC — untuk form registrasi)
POST   /api/program-ajahan               ← Tambah program baru [AUTH, ADMIN]
PATCH  /api/program-ajahan/:id           ← Update nama/tarif/status [AUTH, ADMIN]
PATCH  /api/program-ajahan/:id/tarif     ← Update tarif punia saja [AUTH, ADMIN]
```

#### Konfigurasi Aplikasi (Tarif & Info Rekening)
```
GET    /api/konfigurasi                  ← Ambil semua konfigurasi (PUBLIC — rekening dll)
PATCH  /api/konfigurasi                  ← Update konfigurasi [AUTH, ADMIN]
                                           Body: { kunci: "rekening_bank", nilai: "BCA" }
```

#### Absensi (Release 2)
```
GET    /api/mata-kuliah              ← List mata kuliah [AUTH]
POST   /api/mata-kuliah              ← Tambah mata kuliah [AUTH]
POST   /api/absensi/sesi             ← Buat sesi absensi baru [AUTH]
GET    /api/absensi/sesi/:id         ← Detail sesi + list sisya [AUTH]
POST   /api/absensi/sesi/:id/input   ← Input/update kehadiran batch [AUTH]
GET    /api/absensi/sisya/:id        ← Rekap absensi per sisya [AUTH]
GET    /api/absensi/laporan          ← Laporan absensi per mata kuliah [AUTH]
```

### 4.4 Response Format Standar

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Registrasi berhasil"
}

// Paginated List
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Data tidak valid",
  "details": [ ... ]
}
```

### 4.5 Penanganan File Upload (Multer)

#### Konfigurasi Multer (`backend/src/middlewares/upload.middleware.js`)

```javascript
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_BASE = '/var/www/akademis-hindu/uploads/sisya';

// Tentukan folder & nama file tujuan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Folder dibuat setelah nomor pendaftaran di-generate
    // Simpan sementara di /tmp, pindahkan di controller
    cb(null, '/tmp/akademis-uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const map = {
      fileIdentitas : 'dokumen-identitas',
      fileFoto      : 'foto-sisya',
      filePunia     : 'bukti-punia',
    };
    cb(null, `${map[file.fieldname] || file.fieldname}${ext}`);
  }
});

// Filter tipe file
const fileFilter = (req, file, cb) => {
  const allowedMime = {
    fileIdentitas : ['image/jpeg','image/png','application/pdf'],
    fileFoto      : ['image/jpeg','image/png'],
    filePunia     : ['image/jpeg','image/png','application/pdf'],
  };
  const allowed = allowedMime[file.fieldname] || [];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file tidak didukung untuk ${file.fieldname}`), false);
  }
};

// Batas ukuran per field (bytes)
const limits = { fileSize: 5 * 1024 * 1024 }; // default 5MB

const uploadSisya = multer({ storage, fileFilter, limits }).fields([
  { name: 'fileIdentitas', maxCount: 1 },  // Opsional
  { name: 'fileFoto',      maxCount: 1 },  // Opsional
  { name: 'filePunia',     maxCount: 1 },  // WAJIB — dicek di controller
]);

module.exports = { uploadSisya, UPLOAD_BASE };
```

#### Alur di Controller registrasi

```
1. Multer memproses file → simpan di /tmp/akademis-uploads/
2. Validasi Zod untuk field teks
3. Cek filePunia ada — jika tidak → return 400
4. Generate nomorPendaftaran (YF-2025-XXXX)
5. Buat folder: /uploads/sisya/{nomorPendaftaran}/
6. Pindahkan file dari /tmp ke folder tujuan (fs.renameSync)
7. Simpan path relatif ke database
8. Return response + trigger notifikasi Telegram
```

#### Nginx — Blokir akses langsung ke uploads

```nginx
# Tambahkan di konfigurasi server block
location /uploads/ {
    deny all;
    return 403;
}
```

#### Endpoint akses file (terproteksi JWT)

```javascript
// GET /api/sisya/:id/files/:namaFile
// Hanya bisa diakses oleh admin yang sudah login
router.get('/:id/files/:namaFile', authMiddleware, async (req, res) => {
  const sisya = await prisma.sisya.findUnique({ where: { id: +req.params.id }});
  if (!sisya) return res.status(404).json({ error: 'Sisya tidak ditemukan' });

  const filePath = path.join(UPLOAD_BASE, sisya.nomorPendaftaran, req.params.namaFile);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File tidak ditemukan' });

  res.sendFile(filePath); // Express serve file langsung
});
```

---

### 4.6 Environment Variables (.env)

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/akademis_hindu"

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

---

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

---

## 6. Release 2 — Absensi Per Mata Kuliah {#release-2}

### Fitur Detail

1. **Master Data Mata Kuliah** — CRUD mata kuliah per program studi
2. **Buat Sesi Absensi** — Admin pilih mata kuliah, tanggal, pertemuan ke-berapa
3. **Input Absensi Batch** — List semua sisya aktif di program ajahan itu, centang HADIR/IZIN/SAKIT/ALPHA
4. **Rekap Per Sisya** — Persentase kehadiran per mata kuliah
5. **Laporan Absensi** — Export rekapitulasi per mata kuliah ke Excel

### User Flow Absensi

```
[/admin/absensi]
  └── List Mata Kuliah
        │ (klik mata kuliah)
        ▼
[/admin/absensi/:mkId]
  ├── List Sesi yang sudah ada
  └── [Buat Sesi Baru] →
        │
        ▼
  Modal: Pilih Tanggal + Pertemuan ke- + Topik
        │ Simpan
        ▼
[/admin/absensi/sesi/:sesiId]
  ├── Info sesi (tanggal, mata kuliah)
  ├── Tabel sisya:
  │   Nama | NIM | [HADIR] [IZIN] [SAKIT] [ALPHA]
  └── [Simpan Absensi]
```

---

## 7. Struktur GitHub Issues {#github-issues}

### Label yang Digunakan
- `release-1`, `release-2`
- `frontend`, `backend`, `ops`, `design`
- `sprint-1` … `sprint-6`
- `bug`, `enhancement`, `documentation`

### Contoh Format Issue

---

```markdown
## [BE] API Program Ajahan — CRUD + Tarif Punia

**Sprint**: 1  
**Label**: backend, release-1  
**Estimasi**: 3-4 jam  

### Deskripsi
Implementasi model ProgramAjahan dengan tarif punia yang bisa dikonfigurasi admin.
Endpoint GET bersifat PUBLIC (dipakai form registrasi), endpoint PATCH hanya ADMIN.

### Acceptance Criteria
- [ ] Model `ProgramAjahan` sesuai schema: kode, nama, puniaNormal, puniaPasangan, isPasanganTersedia, isAktif, urutan
- [ ] `GET /api/program-ajahan` mengembalikan list program aktif + tarif (PUBLIC)
- [ ] `PATCH /api/program-ajahan/:id` update semua field [AUTH, ADMIN]
- [ ] `POST /api/program-ajahan` tambah program baru [AUTH, ADMIN]
- [ ] Seed data 4 program: KAWIKON (1jt/1.5jt pasangan), KAWELAKAAN (2jt), USADHA (1.5jt), SERATI (1jt)
- [ ] Soft delete via `isAktif: false` — tidak hapus dari DB

### Referensi
- Schema: `model ProgramAjahan` di prisma/schema.prisma
- Route: `GET /api/program-ajahan` (PUBLIC), `PATCH /api/program-ajahan/:id` [AUTH]
```

---

```markdown
## [BE] API Konfigurasi Aplikasi — Rekening & Info Yayasan

**Sprint**: 1  
**Label**: backend, release-1  
**Estimasi**: 2 jam  

### Deskripsi
Tabel key-value untuk menyimpan konfigurasi yang bisa diubah admin tanpa deploy ulang.
Dipakai untuk info rekening transfer yang tampil di form registrasi dan halaman konfirmasi.

### Acceptance Criteria
- [ ] Model `KonfigurasiAplikasi` dengan kolom: kunci, nilai, label
- [ ] `GET /api/konfigurasi` mengembalikan semua config (PUBLIC) — termasuk rekening
- [ ] `PATCH /api/konfigurasi` update nilai berdasarkan kunci [AUTH, ADMIN]
- [ ] Seed data: `nama_bank`, `nomor_rekening`, `nama_pemilik_rekening`
- [ ] Frontend menggunakan data ini untuk menampilkan info rekening di Step 2 form & /konfirmasi-bayar

### Referensi
- Schema: `model KonfigurasiAplikasi` di prisma/schema.prisma
```

---

```markdown
## [BE] API POST /api/sisya — Registrasi Multi-Program

**Sprint**: 1  
**Label**: backend, release-1  
**Estimasi**: 4-5 jam  

### Deskripsi
Endpoint registrasi sisya baru. Menerima data pribadi, array program yang dipilih
(beserta flag pasangan), file opsional, dan menghitung totalPunia secara server-side.

### Acceptance Criteria
- [ ] Menerima `multipart/form-data` dengan field teks + 3 file opsional
- [ ] Field `programIds` dikirim sebagai JSON string di form-data, di-parse di controller
- [ ] Field `isPasanganIds` — array program ID yang dipilih opsi pasangan
- [ ] Validasi: minimal 1 program dipilih
- [ ] `isPasangan` hanya valid untuk program dengan `isPasanganTersedia: true`
- [ ] Total punia dihitung di server (bukan percaya nilai dari client)
  - Jika isPasangan: gunakan `puniaPasangan`, else: `puniaNormal`
- [ ] Simpan snapshot tarif ke `SisyaProgram.puniaProgram` (immutable)
- [ ] Generate nomor pendaftaran unik: format `YF-YYYY-XXXX` (zero-padded)
- [ ] Semua 3 file opsional — tidak menolak jika tidak ada
- [ ] Response 201 mengembalikan data lengkap untuk halaman sukses (tanpa perlu fetch ulang)

### Body (multipart/form-data)
```
namaLengkap, tempatLahir, tanggalLahir, jenisKelamin, alamat, noHp, email?
namaGriya, namaDesa
programIds         (JSON string, e.g. "[1,2]")
isPasanganIds      (JSON string, e.g. "[1]" — program ID yang pakai opsi pasangan)
fileIdentitas?     (file)
fileFoto?          (file)
filePunia?         (file)
```

### Referensi
- Controller: `backend/src/controllers/sisya.controller.js`
- Service: `backend/src/services/sisya.service.js` — fungsi `create()` dan `hitungTotalPunia()`
```

---

```markdown
## [BE] API POST /api/sisya/:id/upload-punia — Konfirmasi Bayar Menyusul

**Sprint**: 4  
**Label**: backend, release-1, file-upload  
**Estimasi**: 2-3 jam  

### Deskripsi
Sisya yang belum upload bukti saat registrasi dapat menguploadnya menyusul
melalui halaman publik /konfirmasi-bayar. Endpoint ini tidak perlu JWT,
tapi diverifikasi menggunakan nomorPendaftaran.

### Acceptance Criteria
- [ ] `GET /api/sisya/cari?nomor=YF-2025-0042` — cari by nomor pendaftaran (PUBLIC)
  - Response hanya: namaLengkap, statusPembayaran, programSisyas, totalPunia
  - Tidak mengekspos alamat, email, path file, dll
- [ ] `POST /api/sisya/:id/upload-punia` — upload bukti menyusul (PUBLIC)
  - Body: `multipart/form-data` dengan `filePunia` + `nomorPendaftaran`
  - Validasi: `nomorPendaftaran` harus cocok dengan sisya `:id`
  - Validasi: statusPembayaran harus `BELUM_BAYAR` — tolak jika sudah MENUNGGU/LUNAS
  - Simpan file ke `/uploads/sisya/{nomorPendaftaran}/bukti-punia.{ext}`
  - Update `filePuniaPath` dan `statusPembayaran → MENUNGGU`
  - Trigger notifikasi Telegram: formatNotifikasiBuktiPunia()
- [ ] Rate limiting: maks 5 request/menit per IP (pakai express-rate-limit)

### Referensi
- Routes: `GET /api/sisya/cari`, `POST /api/sisya/:id/upload-punia`
- Telegram: `formatNotifikasiBuktiPunia()` di telegram.service.js
```

---

```markdown
## [FE] Komponen ProgramAjahanPicker — Multi-Select + Kalkulasi Punia Real-Time

**Sprint**: 3  
**Label**: frontend, release-1  
**Estimasi**: 4-5 jam  

### Deskripsi
Komponen inti Step 2 form registrasi. Menampilkan daftar program ajahan sebagai
checkbox card. Untuk KAWIKON yang dipilih, muncul sub-opsi pasangan.
Total punia dihitung ulang setiap ada perubahan pilihan.

### Acceptance Criteria
- [ ] Data program diambil dari `GET /api/program-ajahan` saat komponen mount
- [ ] Setiap program tampil sebagai card: nama + tarif normal
- [ ] Minimal 1 program harus dipilih — validasi Zod menolak array kosong
- [ ] Jika program memiliki `isPasanganTersedia: true` DAN dicentang:
  - Muncul sub-pilihan: `● Sendiri` / `○ Bersama Pasangan (+Rp X)`
  - Default: Sendiri
- [ ] Real-time kalkulasi: setiap perubahan checkbox/radio → update total
- [ ] Komponen `RincianPunia` tampil di bawah picker:
  - Breakdown per program (nama + tarif yang berlaku)
  - Garis pemisah + TOTAL tebal
  - Info rekening (dari `GET /api/konfigurasi`)
- [ ] State yang dikirim ke parent: `{ selectedPrograms: [{id, isPasangan}] }`

### Props Interface
```tsx
interface ProgramAjahanPickerProps {
  value: { id: number; isPasangan: boolean }[]
  onChange: (selected: { id: number; isPasangan: boolean }[]) => void
  error?: string
}
```

### Referensi
- API: `GET /api/program-ajahan` (list + tarif)
- API: `GET /api/konfigurasi` (info rekening)
- Dipakai di: `Step2DataAjahan.jsx`
```

---

```markdown
## [FE] Hook usePuniaCalculator — Kalkulasi Total Punia

**Sprint**: 3  
**Label**: frontend, release-1  
**Estimasi**: 1-2 jam  

### Deskripsi
Custom hook sederhana yang menerima daftar program yang dipilih (beserta flag pasangan)
dan list tarif dari API, lalu mengembalikan breakdown dan total punia.

### Acceptance Criteria
- [ ] Input: `selected: {id, isPasangan}[]`, `programs: ProgramAjahan[]`
- [ ] Output: `breakdown: {nama, isPasangan, punia}[]`, `total: number`
- [ ] Gunakan `puniaPasangan` jika `isPasangan: true`, else `puniaNormal`
- [ ] Total = sum dari semua punia per program yang dipilih
- [ ] Pure calculation — tidak ada side effect, tidak ada API call

### Contoh
```js
const { breakdown, total } = usePuniaCalculator(
  [{ id: 1, isPasangan: true }, { id: 2, isPasangan: false }],
  programsFromApi
);
// breakdown: [{ nama: 'KAWIKON', isPasangan: true, punia: 1500000 }, { nama: 'KAWELAKAAN', ... }]
// total: 3500000
```
```

---

```markdown
## [FE] Halaman /konfirmasi-bayar — Upload Bukti Punia Menyusul

**Sprint**: 4  
**Label**: frontend, release-1, file-upload  
**Estimasi**: 3-4 jam  

### Deskripsi
Halaman publik (tanpa login) untuk sisya yang belum mengupload bukti transfer.
Sisya memasukkan nomor pendaftaran, sistem menampilkan rincian punia, lalu upload file.

### Acceptance Criteria
- [ ] Route: `/konfirmasi-bayar` — public, no auth
- [ ] Input nomor pendaftaran + tombol Cari → `GET /api/sisya/cari?nomor=...`
- [ ] Tampilkan: nama, rincian program + punia, total, info rekening
- [ ] Jika statusPembayaran = `MENUNGGU`: tampil info "Bukti sudah diterima, menunggu verifikasi"
- [ ] Jika statusPembayaran = `LUNAS`: tampil info "Pembayaran sudah dikonfirmasi" 
- [ ] Jika `BELUM_BAYAR`: tampilkan FileDropzone untuk upload + tombol "Kirim Bukti"
- [ ] Submit → `POST /api/sisya/:id/upload-punia` multipart/form-data
- [ ] Setelah sukses: tampil halaman konfirmasi terima kasih
- [ ] Link ke halaman ini juga ada di halaman /daftar/sukses: "Sudah transfer? Kirim bukti di sini"

### Referensi
- API: `GET /api/sisya/cari?nomor=` (PUBLIC)
- API: `POST /api/sisya/:id/upload-punia` (PUBLIC)
```

---

```markdown
## [FE] Halaman Admin /admin/pengaturan — Tarif Punia & Rekening

**Sprint**: 5  
**Label**: frontend, release-1  
**Estimasi**: 3-4 jam  

### Deskripsi
Halaman pengaturan admin untuk mengubah tarif punia per program dan info rekening bank.
Perubahan tarif tidak mempengaruhi data sisya yang sudah mendaftar (snapshot di SisyaProgram).

### Acceptance Criteria
- [ ] Tabel program ajahan dengan kolom: Nama, Tarif Normal, Tarif Pasangan, Pasangan Tersedia, Aktif
- [ ] Edit inline per baris: klik [Edit] → field jadi input, simpan → `PATCH /api/program-ajahan/:id`
- [ ] Toggle kolom Aktif (show/hide dari form registrasi publik)
- [ ] Tombol [+ Tambah Program] → form modal
- [ ] Seksi Info Rekening: edit Nama Bank, No. Rekening, Nama Pemilik → `PATCH /api/konfigurasi`
- [ ] Konfirmasi dialog sebelum simpan perubahan tarif: "Perubahan tarif tidak berlaku untuk sisya yang sudah mendaftar"

### Referensi
- API: `GET/PATCH /api/program-ajahan`, `GET/PATCH /api/konfigurasi`
- Akses: hanya user dengan role ADMIN
```

---

```markdown
## [BE] Seed Data — Program Ajahan & Konfigurasi Tarif Awal

**Sprint**: 1  
**Label**: backend, release-1  
**Estimasi**: 1-2 jam  

### Deskripsi
Seed data awal untuk 4 program ajahan dengan tarif default dan konfigurasi rekening.
Menggunakan upsert agar bisa dijalankan ulang tanpa duplikasi.

### Data Seed

| Kode        | Nama        | Punia Normal | Punia Pasangan | Pasangan Tersedia |
|-------------|-------------|--------------|----------------|-------------------|
| KAWIKON     | Kawikon     | 1.000.000    | 1.500.000      | Ya                |
| KAWELAKAAN  | Kawelakaan  | 2.000.000    | -              | Tidak             |
| USADHA      | Usadha      | 1.500.000    | -              | Tidak             |
| SERATI      | Serati      | 1.000.000    | -              | Tidak             |

| Kunci            | Label           | Nilai Default     |
|------------------|-----------------|-------------------|
| nama_bank        | Nama Bank       | (diisi admin)     |
| nomor_rekening   | Nomor Rekening  | (diisi admin)     |
| nama_rekening    | Nama Pemilik    | (diisi admin)     |

### Acceptance Criteria
- [ ] `prisma/seed.js` meng-upsert 4 program ajahan dengan tarif di atas
- [ ] `prisma/seed.js` meng-upsert 3 baris KonfigurasiAplikasi
- [ ] 1 user admin default (email + password dari env, bukan hardcode di seed)
- [ ] `npx prisma db seed` bisa dijalankan ulang tanpa error duplikasi
```

---

```markdown
## [BE] Setup Multer & File Upload — Registrasi Sisya

**Sprint**: 3  
**Label**: backend, release-1, file-upload  
**Estimasi**: 3-4 jam  

### Deskripsi
Implementasi middleware Multer untuk handle upload dokumen sisya saat registrasi.
File disimpan di disk VPS, path relatif disimpan ke database.

### Acceptance Criteria
- [ ] Middleware `upload.middleware.js` menggunakan diskStorage Multer
- [ ] Validasi mime type per field (fileIdentitas, fileFoto, filePunia)
- [ ] Validasi ukuran: maks 5MB identitas & punia, 3MB foto
- [ ] File tersimpan di `/var/www/akademis-hindu/uploads/sisya/{nomorPendaftaran}/`
- [ ] Nama file terstandar: `dokumen-identitas.{ext}`, `foto-sisya.{ext}`, `bukti-punia.{ext}`
- [ ] **Semua file opsional** — tidak ada yang wajib di endpoint registrasi
- [ ] Endpoint terpisah `POST /api/sisya/:id/upload-punia` untuk upload bukti menyusul
- [ ] Path relatif file tersimpan di kolom `fileIdentitasPath`, `fileFotoPath`, `filePuniaPath`
- [ ] Upload bukti punia menyusul mengubah `statusPembayaran` → `MENUNGGU` secara otomatis
- [ ] Error Multer dihandle dengan pesan yang jelas (bukan stack trace)

### Referensi
- Middleware: `backend/src/middlewares/upload.middleware.js`
- Controller: `backend/src/controllers/sisya.controller.js`
- Schema DB: semua path file `String?` (nullable — opsional)
```

---

```markdown
## [BE] Endpoint GET /api/sisya/:id/files/:namaFile — Akses Dokumen Terproteksi

**Sprint**: 3  
**Label**: backend, release-1, file-upload, security  
**Estimasi**: 2 jam  

### Deskripsi
Admin harus bisa mengakses file dokumen sisya dari panel admin.
File TIDAK boleh diakses langsung via URL — harus melalui endpoint yang terverifikasi JWT.

### Acceptance Criteria
- [ ] Endpoint hanya bisa diakses dengan JWT valid (middleware auth)
- [ ] Parameter `:namaFile` hanya menerima nilai whitelist: `dokumen-identitas`, `foto-sisya`, `bukti-punia`
- [ ] File diserve menggunakan `res.sendFile()` dengan path absolut
- [ ] Return 404 jika file tidak ditemukan di disk
- [ ] Nginx dikonfigurasi `deny all` untuk direktori `/uploads/`
- [ ] Path traversal attack dicegah (validasi `:namaFile` ketat)

### Referensi
- Route: `GET /api/sisya/:id/files/:namaFile [AUTH]`
- Docs keamanan: lihat section 4.5 planning.md
```

---

```markdown
## [FE] Komponen FileDropzone — Upload Dokumen Registrasi

**Sprint**: 3  
**Label**: frontend, release-1, file-upload  
**Estimasi**: 3 jam  

### Deskripsi
Buat komponen reusable `FileDropzone` menggunakan `react-dropzone`
yang dipakai di Step 2 form registrasi untuk 3 jenis dokumen.

### Acceptance Criteria
- [ ] Mendukung drag & drop dan klik-untuk-pilih
- [ ] Props: `label`, `accept`, `maxSizeBytes`, `required`, `value`, `onChange`, `error`
- [ ] Preview thumbnail jika file adalah gambar (JPG/PNG)
- [ ] Tampil nama file jika file adalah PDF
- [ ] Pesan error inline jika format/ukuran tidak sesuai
- [ ] Badge "Wajib" (oranye) vs "Opsional" (abu-abu) sesuai prop `required`
- [ ] Tombol X untuk hapus file yang sudah dipilih
- [ ] Disabled state saat form sedang submit

### Props Interface
```tsx
interface FileDropzoneProps {
  label: string
  accept: Record<string, string[]>  // react-dropzone format
  maxSizeBytes: number
  required?: boolean
  value: File | null
  onChange: (file: File | null) => void
  error?: string
}
```

### Referensi
- Library: `react-dropzone`
- Dipakai di: `Step2DataAjahan.jsx`
```

---

```markdown
## [FE] Multi-step Form Registrasi Sisya (2 Langkah + Upload Dokumen)

**Sprint**: 3  
**Label**: frontend, release-1  
**Estimasi**: 5-6 jam  

### Deskripsi
Orchestrator wizard 2-langkah di `/daftar`. Menggabungkan Step1DataPribadi dan
Step2DataAjahan (termasuk 3 FileDropzone), validasi Zod per step, submit multipart.

### Acceptance Criteria
- [ ] Progress bar menampilkan "Langkah 1 dari 2" / "Langkah 2 dari 2"
- [ ] Validasi Zod dijalankan sebelum lanjut ke step berikutnya
- [ ] Tombol "Kembali" ke Step 1 tidak mereset data yang sudah diisi
- [ ] Dropdown Program Ajahan diisi dari GET /api/program-ajahan (PUBLIC)
- [ ] 3 komponen FileDropzone terintegrasi dengan validasi masing-masing
- [ ] Tombol "Daftar" di-disable + spinner saat submit berlangsung
- [ ] Submit menggunakan `multipart/form-data` via Axios (`FormData`)
- [ ] Redirect ke `/daftar/sukses` + tampil nomor pendaftaran setelah berhasil
- [ ] Tombol "Salin Nomor" (copy to clipboard) di halaman sukses

### Referensi
- Komponen: `RegistrasiWizard.jsx`, `Step1DataPribadi.jsx`, `Step2DataAjahan.jsx`
- API: `POST /api/sisya` — multipart/form-data (lihat docs/api.md)
- Komponen upload: `FileDropzone.jsx` (issue terpisah)
```

---

```markdown
## [FE] Halaman Detail Sisya — Tampilkan & Akses Dokumen

**Sprint**: 4  
**Label**: frontend, release-1, file-upload  
**Estimasi**: 3 jam  

### Deskripsi
Halaman `/admin/sisya/:id` menampilkan semua data sisya lengkap termasuk
tombol untuk melihat setiap dokumen yang diupload (diakses via endpoint JWT).

### Acceptance Criteria
- [ ] Tampilkan info pribadi, data ajahan, status dengan badge warna
- [ ] Untuk setiap dokumen: tampil label + tombol "Lihat Dokumen" / "Lihat Foto" / "Lihat Bukti"
- [ ] Jika dokumen opsional tidak diupload → label abu-abu "Tidak diupload" (tanpa tombol)
- [ ] Tombol "Lihat" mengambil file via GET /api/sisya/:id/files/:nama dengan JWT header
- [ ] File dibuka di tab baru menggunakan Blob URL
- [ ] Dropdown ubah status (PENDING / AKTIF / TIDAK_AKTIF) + tombol "Simpan"
- [ ] Konfirmasi dialog sebelum mengubah status

### Referensi
- API akses file: `GET /api/sisya/:id/files/:namaFile [AUTH]`
- API ubah status: `PATCH /api/sisya/:id/status [AUTH]`
```

---

### Milestone GitHub
```
Milestone: Release 1 — Registrasi & Dashboard (Target: DD/MM/YYYY)
Milestone: Release 2 — Absensi (Target: DD/MM/YYYY)
```

---

## 8. Struktur Folder Proyek Lengkap {#struktur-folder}

```
akademis-hindu/
│
├── frontend/
│   ├── public/
│   │   └── logo-yayasan.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                       ← shadcn/ui (auto-generated)
│   │   │   ├── layout/
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── PublicLayout.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── charts/
│   │   │   │   ├── SisyaBarChart.jsx
│   │   │   │   ├── SisyaPieChart.jsx
│   │   │   │   └── TrendLineChart.jsx
│   │   │   ├── forms/
│   │   │   │   ├── registrasi/
│   │   │   │   │   ├── RegistrasiWizard.jsx  ← Orchestrator multi-step
│   │   │   │   │   ├── Step1DataPribadi.jsx
│   │   │   │   │   └── Step2DataAjahan.jsx   ← Termasuk 3 dropzone
│   │   │   │   └── AbsensiForm.jsx           ← Release 2
│   │   │   ├── upload/
│   │   │   │   └── FileDropzone.jsx          ← Komponen reusable drag & drop
│   │   │   └── tables/
│   │   │       ├── SisyaTable.jsx
│   │   │       └── AbsensiTable.jsx           ← Release 2
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── Registrasi.jsx
│   │   │   │   └── RegistrasiSukses.jsx
│   │   │   └── admin/
│   │   │       ├── Login.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Sisya.jsx                  ← Tabel + filter
│   │   │       ├── SisyaDetail.jsx            ← Detail + dokumen + status
│   │   │       ├── Laporan.jsx
│   │   │       └── Absensi.jsx               ← Release 2
│   │   ├── hooks/
│   │   │   ├── useSisya.js
│   │   │   ├── useAuth.js
│   │   │   └── useAbsensi.js
│   │   ├── services/
│   │   │   └── api.js                        ← Axios instance + endpoints
│   │   ├── store/
│   │   │   └── authStore.js                  ← Zustand auth state
│   │   └── utils/
│   │       ├── exportExcel.js
│   │       ├── fileViewer.js                 ← Helper buka file via Blob URL
│   │       └── formatters.js
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── sisya.routes.js
│   │   │   ├── laporan.routes.js
│   │   │   ├── programAjahan.routes.js
│   │   │   ├── telegram.routes.js
│   │   │   └── absensi.routes.js            ← Release 2
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── sisya.controller.js
│   │   │   ├── laporan.controller.js
│   │   │   ├── programAjahan.controller.js
│   │   │   └── absensi.controller.js        ← Release 2
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── upload.middleware.js         ← Multer config
│   │   ├── services/
│   │   │   ├── sisya.service.js
│   │   │   ├── telegram.service.js
│   │   │   └── absensi.service.js
│   │   └── app.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── uploads/                                  ← DI LUAR REPO (.gitignore)
│   └── sisya/
│       └── YF-2025-0001/
│           ├── dokumen-identitas.pdf
│           ├── foto-sisya.jpg
│           └── bukti-punia.jpg
│
├── shared/
│   └── schemas/
│       ├── sisya.schema.js        ← Zod schema registrasi (shared FE & BE)
│       └── absensi.schema.js
│
├── docs/
│   ├── planning.md               ← Dokumen ini
│   ├── api.md                    ← Dokumentasi API lengkap
│   └── deployment.md
│
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── feature.md
│       └── bug.md
│
├── .gitignore
│   # Pastikan ini masuk .gitignore:
│   # /uploads/          ← File sisya TIDAK masuk repo
│   # /backend/.env      ← Secret keys
│   # /node_modules/
│
└── docker-compose.yml
```

> ⚠️ **Penting**: Direktori `uploads/` wajib masuk `.gitignore`.
> File dokumen sisya (KTP, foto, bukti punia) adalah data pribadi
> yang tidak boleh tersimpan di repository GitHub dalam kondisi apapun.
> Backup file dilakukan terpisah langsung dari VPS.

---

## 9. Deployment VPS {#deployment}

### Setup Awal VPS

```bash
# 1. Update sistem
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 4. Install Nginx & PM2
sudo apt install -y nginx
sudo npm install -g pm2

# 5. Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Setup Direktori Upload

```bash
# Buat folder uploads dengan permission yang benar
sudo mkdir -p /var/www/akademis-hindu/uploads/sisya
sudo chown -R www-data:www-data /var/www/akademis-hindu/uploads
sudo chmod -R 755 /var/www/akademis-hindu/uploads

# Pastikan user yang menjalankan Node.js punya akses tulis
sudo usermod -aG www-data $USER
```

### Konfigurasi Nginx

```nginx
# /etc/nginx/sites-available/akademis-hindu

server {
    listen 80;
    server_name yourdomain.com;

    # ⛔ BLOKIR akses langsung ke folder uploads
    # File hanya boleh diakses via endpoint API yang terproteksi JWT
    location /uploads/ {
        deny all;
        return 403;
    }

    # Frontend (static build)
    location / {
        root /var/www/akademis-hindu/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API — termasuk endpoint serve file
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        # Perbesar batas upload untuk file dokumen (default 1MB terlalu kecil)
        client_max_body_size 15M;
    }
}
```

### PM2 Ecosystem

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'akademis-backend',
    script: './backend/server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

### Deploy Script

```bash
# deploy.sh
git pull origin main
cd backend && npm install && npx prisma migrate deploy
cd ../frontend && npm install && npm run build
pm2 restart akademis-backend
```

---

---

## 10. Integrasi Telegram Bot {#telegram}

### 10.1 Gambaran Umum

Sistem akan terhubung ke **Telegram Bot** untuk dua fungsi utama:

| Fungsi | Arah | Deskripsi |
|---|---|---|
| **Notifikasi Otomatis** | Server → Telegram | Kirim pesan ke channel/group saat ada registrasi baru |
| **Inquiry via Bot** | Telegram → Server | Admin bisa tanya summary langsung dari Telegram |

```
[Sisya daftar via web]
        │
        ▼
[Backend simpan ke DB]
        │
        ├──→ Response ke frontend (sukses)
        │
        └──→ Kirim notifikasi ke Telegram Channel
                  "📥 Sisya Baru Mendaftar!
                   Nama: I Made Sudarsana
                   Prodi: S1 Pendidikan Agama Hindu
                   No. Pendaftaran: YF-2025-0042"

[Admin ketik di Telegram: /summary]
        │
        ▼
[Telegram Bot → Webhook → Backend]
        │
        ▼
[Query DB → Format pesan]
        │
        ▼
[Bot reply ke Admin]
        "📊 Summary Sisya per Hari Ini
         Total Mendaftar : 42 sisya
         Bulan Ini       : 15 sisya
         ─────────────────────
         S1 Pend. Agama Hindu : 28
         S1 Hukum Hindu       : 10
         D3 Pariwiasata Hindu :  4"
```

---

### 10.2 Setup Telegram Bot

**Langkah persiapan (dilakukan oleh admin/devops):**

```
1. Buka @BotFather di Telegram
2. Ketik /newbot → beri nama bot (contoh: "AkademiHinduBot")
3. Simpan BOT_TOKEN yang diberikan BotFather
4. Buat Telegram Group/Channel untuk notifikasi
5. Tambahkan bot ke group/channel tersebut sebagai Admin
6. Ambil CHAT_ID group/channel:
   - Kirim pesan ke group
   - Akses: https://api.telegram.org/bot<TOKEN>/getUpdates
   - Catat nilai "chat.id" (biasanya negatif untuk group, contoh: -1001234567890)
```

**Environment variables tambahan:**
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=-1001234567890   # ID channel/group notifikasi
TELEGRAM_WEBHOOK_SECRET=random_secret_string  # Untuk verifikasi webhook
TELEGRAM_ALLOWED_CHAT_IDS=-1001234567890,123456789  # Chat ID yang boleh query
```

---

### 10.3 Arsitektur Integrasi

```
┌─────────────────────────────────────────────────────────┐
│                     BACKEND (Express)                    │
│                                                          │
│  ┌─────────────────┐    ┌──────────────────────────┐    │
│  │ TelegramService  │    │  Webhook Handler          │    │
│  │                  │    │  POST /api/telegram/hook  │    │
│  │ sendNotification │    │                           │    │
│  │ sendSummary      │◄───│  parseCommand()           │    │
│  │ formatMessage    │    │  verifySecret()           │    │
│  └────────┬─────────┘    └──────────────────────────┘    │
│           │                         ▲                     │
└───────────┼─────────────────────────┼─────────────────────┘
            │                         │
            ▼                         │
    [Telegram API]            [Telegram Server]
    sendMessage()                 (webhook)
            │                         │
            ▼                         │
    [Channel/Group]          [Admin kirim pesan]
```

**Dua mode komunikasi Telegram:**
- **Push (Notifikasi)** — Backend memanggil Telegram API langsung saat ada event
- **Pull via Webhook** — Telegram mengirim pesan user ke endpoint backend kita

---

### 10.4 Kode Implementasi

#### `backend/src/services/telegram.service.js`

```javascript
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Kirim pesan ke channel (untuk notifikasi)
async function sendMessage(chatId, text, options = {}) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options
    })
  });
  return res.json();
}

// Format notifikasi registrasi baru
function formatNotifikasiRegistrasi(sisya) {
  const programLines = sisya.programSisyas
    .map(p => `  • ${p.programAjahan.nama}${p.isPasangan ? ' (pasangan)' : ''} — Rp ${p.puniaProgram.toLocaleString('id-ID')}`)
    .join('\n');

  return `
🪷 <b>Sisya Baru Mendaftar!</b>

👤 <b>Nama</b>      : ${sisya.namaLengkap}
🏠 <b>Griya</b>     : ${sisya.namaGriya} | ${sisya.namaDesa}
📋 <b>No. Daftar</b>: <code>${sisya.nomorPendaftaran}</code>

📚 <b>Program Ajahan:</b>
${programLines}

💰 <b>Total Punia</b>: Rp ${sisya.totalPunia.toLocaleString('id-ID')}
💳 <b>Bukti Transfer</b>: ${sisya.filePuniaPath ? '✅ Sudah upload' : '⏳ Belum upload'}
📅 <b>Waktu</b>    : ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA

<i>Total mendaftar hari ini: {totalHariIni} sisya</i>
  `.trim();
}

// Format pesan summary untuk bot inquiry
function formatSummaryMessage(data) {
  const prodiLines = data.perProdi
    .map(p => `  • ${p.nama.padEnd(30)} : <b>${p.total}</b>`)
    .join('\n');

  return `
📊 <b>Summary Sisya Baru</b>
━━━━━━━━━━━━━━━━━━━━━
👥 Total Keseluruhan : <b>${data.total}</b>
📅 Bulan Ini         : <b>${data.bulanIni}</b>
📆 Hari Ini          : <b>${data.hariIni}</b>
⏳ Belum Verifikasi  : <b>${data.menungguVerifikasi}</b>

<b>Per Program Ajahan:</b>
${prodiLines}

💰 <b>Estimasi Punia Bulan Ini:</b>
   Rp ${data.estimasiPuniaBulanIni.toLocaleString('id-ID')}

🕐 <i>Data per ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA</i>
  `.trim();
}

// Format notifikasi bukti punia masuk (upload menyusul)
function formatNotifikasiBuktiPunia(sisya) {
  return `
💳 <b>Bukti Punia Masuk!</b>

👤 <b>Nama</b>      : ${sisya.namaLengkap}
📋 <b>No. Daftar</b>: <code>${sisya.nomorPendaftaran}</code>
💰 <b>Total Punia</b>: Rp ${sisya.totalPunia.toLocaleString('id-ID')}
📅 <b>Waktu</b>    : ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA

<i>Silakan verifikasi di panel admin.</i>
  `.trim();
}

module.exports = { sendMessage, formatNotifikasiRegistrasi, formatNotifikasiBuktiPunia, formatSummaryMessage };
```

---

#### `backend/src/routes/telegram.routes.js` — Webhook Handler

```javascript
const router = require('express').Router();
const telegramService = require('../services/telegram.service');
const laporanService = require('../services/laporan.service');

const ALLOWED_CHAT_IDS = process.env.TELEGRAM_ALLOWED_CHAT_IDS
  ?.split(',').map(id => id.trim()) ?? [];

// Verifikasi webhook dari Telegram (pakai secret token)
function verifyTelegramWebhook(req, res, next) {
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/telegram/hook ← Telegram kirim update ke sini
router.post('/hook', verifyTelegramWebhook, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.sendStatus(200);

  const chatId = String(message.chat.id);
  const text = message.text?.trim().toLowerCase();

  // Hanya proses dari chat ID yang diizinkan
  if (!ALLOWED_CHAT_IDS.includes(chatId)) {
    return res.sendStatus(200); // Diam saja, jangan balas stranger
  }

  try {
    if (text === '/summary' || text === '/ringkasan') {
      const data = await laporanService.getSummaryForBot();
      const pesan = telegramService.formatSummaryMessage(data);
      await telegramService.sendMessage(chatId, pesan);

    } else if (text === '/menunggu' || text === '/pending') {
      const data = await laporanService.getMenungguVerifikasi();
      const lines = data.map((s, i) =>
        `${i + 1}. ${s.namaLengkap} — <code>${s.nomorPendaftaran}</code> — Rp ${s.totalPunia.toLocaleString('id-ID')}`
      ).join('
');
      await telegramService.sendMessage(chatId,
        `💳 <b>Menunggu Verifikasi Pembayaran</b>

` +
        (data.length ? lines : 'Tidak ada yang menunggu verifikasi.') +
        `

<i>Total: ${data.length} sisya</i>`
      );

    } else if (text === '/help' || text === '/bantuan') {
      await telegramService.sendMessage(chatId, `
🤖 <b>Perintah yang tersedia:</b>

/summary   — Ringkasan jumlah sisya & estimasi punia
/menunggu  — Daftar sisya menunggu verifikasi pembayaran
/bantuan   — Tampilkan perintah ini
      `.trim());

    }
    // Command tidak dikenal → diam saja
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }

  res.sendStatus(200); // Selalu 200 agar Telegram tidak retry
});

module.exports = router;
```

---

#### Trigger notifikasi di `sisya.controller.js`

```javascript
// Setelah berhasil simpan sisya baru:
const { sendMessage, formatNotifikasiRegistrasi } = require('../services/telegram.service');

async function registrasiSisya(req, res) {
  // ... validasi & simpan ke DB ...
  const sisyaBaru = await sisyaService.create(data);

  // Kirim notifikasi ke Telegram (non-blocking, jangan sampai gagal register)
  const totalHariIni = await sisyaService.countHariIni();
  const pesan = formatNotifikasiRegistrasi({ ...sisyaBaru, totalHariIni });

  sendMessage(process.env.TELEGRAM_CHANNEL_ID, pesan)
    .catch(err => console.error('Gagal kirim notif Telegram:', err));
    // ↑ .catch() agar error Telegram tidak ganggu response ke user

  return res.status(201).json({
    success: true,
    data: {
      nomorPendaftaran : sisyaBaru.nomorPendaftaran,
      namaLengkap      : sisyaBaru.namaLengkap,
      totalPunia       : sisyaBaru.totalPunia,
      programSisyas    : sisyaBaru.programSisyas,  // list program + punia per item
      statusPembayaran : sisyaBaru.statusPembayaran,
    },
    message: 'Registrasi berhasil'
  });
  // FE menggunakan data ini untuk menampilkan rincian di halaman sukses
  // tanpa perlu fetch ulang
}
```

---

### 10.5 Daftar Command Bot

| Command | Alias | Deskripsi | Akses |
|---|---|---|---|
| `/summary` | `/ringkasan` | Summary sisya: total, bulan ini, hari ini, per program + estimasi punia | Allowed chat IDs |
| `/menunggu` | `/pending` | Daftar sisya yang sudah upload bukti tapi belum diverifikasi | Allowed chat IDs |
| `/help` | `/bantuan` | Daftar command tersedia | Allowed chat IDs |
| *(Release 2)* `/absensi` | — | Summary kehadiran hari ini per program | Allowed chat IDs |

---

### 10.6 Setup Webhook ke VPS

Setelah deploy backend, daftarkan webhook ke Telegram sekali saja:

```bash
# Jalankan sekali setelah backend live dan domain aktif
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/telegram/hook",
    "secret_token": "YOUR_WEBHOOK_SECRET"
  }'

# Verifikasi webhook aktif
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

### 10.7 Keamanan

- **TELEGRAM_WEBHOOK_SECRET** — Header rahasia untuk verifikasi request dari Telegram, bukan pihak lain
- **ALLOWED_CHAT_IDS** — Whitelist chat ID, bot tidak akan merespons perintah dari chat yang tidak terdaftar
- **Non-blocking notification** — Error Telegram tidak boleh menggagalkan proses registrasi utama
- **Rate limit** — Telegram API membatasi 30 pesan/detik; cukup untuk skala yayasan ini
- **No sensitive data** — Pesan notifikasi tidak menyertakan data sensitif (NIK, dll)

---

### 10.8 GitHub Issues untuk Fitur Telegram

```markdown
## [BE] Telegram Service — Notifikasi Registrasi Baru

**Sprint**: 5 (tambahan)
**Label**: backend, release-1, telegram
**Estimasi**: 3-4 jam

### Acceptance Criteria
- [ ] TelegramService.sendMessage() berfungsi kirim pesan ke channel
- [ ] Format pesan notifikasi sesuai template (nama, prodi, no. daftar, waktu WITA)
- [ ] Notifikasi terkirim otomatis saat registrasi baru berhasil disimpan
- [ ] Gagal kirim Telegram TIDAK menggagalkan response registrasi ke user
- [ ] BOT_TOKEN & CHANNEL_ID diambil dari environment variable
```

```markdown
## [BE] Telegram Service — Notifikasi Bukti Punia Masuk

**Sprint**: 5 (tambahan)
**Label**: backend, release-1, telegram
**Estimasi**: 1-2 jam

### Deskripsi
Ketika sisya mengupload bukti punia menyusul via `/konfirmasi-bayar`,
admin di channel Telegram otomatis mendapat notifikasi.

### Acceptance Criteria
- [ ] `formatNotifikasiBuktiPunia(sisya)` menghasilkan pesan yang benar
- [ ] Notifikasi terkirim saat `POST /api/sisya/:id/upload-punia` berhasil
- [ ] Pesan berisi: nama, nomor pendaftaran, total punia, waktu WITA
- [ ] Non-blocking: gagal kirim Telegram tidak menggagalkan upload
```

```markdown
## [BE] Telegram Bot — Webhook & Commands

**Sprint**: 5 (tambahan)
**Label**: backend, release-1, telegram
**Estimasi**: 4-5 jam

### Acceptance Criteria
- [ ] Endpoint POST /api/telegram/hook aktif dan terverifikasi secret token
- [ ] Command /summary: membalas summary sisya + estimasi punia bulan ini
- [ ] Command /menunggu: membalas daftar sisya menunggu verifikasi pembayaran
- [ ] Command /bantuan: membalas daftar semua perintah
- [ ] Bot diam saja untuk chat ID yang tidak ada di whitelist
- [ ] Webhook terdaftar ke Telegram API setelah deploy
```

---

## ✅ Checklist Sebelum Release 1 Go-Live

### Registrasi Sisya (Publik)
- [ ] Form 2-step: pindah step tidak mereset data
- [ ] Dropdown/checkbox program ajahan diisi dari API
- [ ] Multi-select program: minimal 1 wajib dipilih, validasi Zod aktif
- [ ] Opsi pasangan KAWIKON muncul hanya jika KAWIKON dicentang
- [ ] Kalkulasi total punia real-time tepat (termasuk tarif pasangan)
- [ ] Info rekening tampil dari `/api/konfigurasi` (bukan hardcode)
- [ ] Semua upload file opsional — form bisa submit tanpa file
- [ ] Validasi format & ukuran file berjalan di frontend
- [ ] Halaman sukses menampilkan rincian program + total punia + instruksi transfer
- [ ] Link ke `/konfirmasi-bayar` tersedia di halaman sukses

### Konfirmasi Pembayaran (Publik)
- [ ] Halaman `/konfirmasi-bayar` bisa diakses tanpa login
- [ ] Pencarian by nomor pendaftaran hanya tampilkan data terbatas (nama, punia)
- [ ] Sisya bisa upload bukti menyusul via halaman ini
- [ ] Upload bukti mengubah `statusPembayaran → MENUNGGU` di DB
- [ ] Notifikasi Telegram terkirim ke channel admin saat bukti masuk
- [ ] Jika status sudah MENUNGGU/LUNAS → form upload tidak muncul

### Keamanan File
- [ ] Folder `/uploads/` tidak bisa diakses langsung via URL (Nginx `deny all`)
- [ ] File hanya bisa diakses via endpoint `/api/sisya/:id/files/:nama [AUTH]`
- [ ] Folder `uploads/` masuk `.gitignore` (tidak masuk repository)

### Panel Admin
- [ ] Admin bisa login dan logout
- [ ] Dashboard: 4 widget, grafik per bulan + per program + status bayar
- [ ] Tabel sisya: search (nama/nomor/griya), filter (program, status, status bayar)
- [ ] Badge multi-program tampil di tabel dan detail sisya
- [ ] Detail sisya: tabel rincian punia + tombol lihat dokumen + ubah status
- [ ] Tombol "Tandai LUNAS" hanya aktif saat status pembayaran = MENUNGGU
- [ ] Halaman Pengaturan: tarif punia per program bisa diedit, info rekening bisa diubah
- [ ] Perubahan tarif tidak mengubah data sisya yang sudah mendaftar
- [ ] Export Excel berjalan (termasuk kolom program & total punia)

### Telegram
- [ ] Bot aktif dan terdaftar di BotFather
- [ ] Webhook terdaftar ke domain VPS (HTTPS)
- [ ] Notifikasi masuk saat uji coba registrasi baru (dengan rincian program + punia)
- [ ] Notifikasi masuk saat bukti punia diupload menyusul
- [ ] Command `/summary` membalas dengan data akurat (termasuk estimasi punia)
- [ ] Command `/menunggu` membalas daftar sisya menunggu verifikasi
- [ ] `ALLOWED_CHAT_IDS` dikonfigurasi — bot tidak respons chat asing

### Infrastruktur VPS
- [ ] SSL aktif (HTTPS via Let's Encrypt)
- [ ] Domain dapat diakses publik
- [ ] Nginx `client_max_body_size 15M` terkonfigurasi
- [ ] Direktori `/var/www/.../uploads/` dengan permission benar
- [ ] PM2 berjalan dan auto-restart saat server reboot (`pm2 startup`)
- [ ] Cron backup PostgreSQL harian aktif
- [ ] Error logging terpantau (`pm2 logs`)

---

*Dokumen dibuat: April 2025 | Versi: 2.0*  
*Diperbarui: April 2026 — Multi-program ajahan, kalkulasi punia real-time, upload bukti menyusul*
