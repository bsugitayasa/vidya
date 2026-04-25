# 2. Planning Frontend {#planning-frontend}

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