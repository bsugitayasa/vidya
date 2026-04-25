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