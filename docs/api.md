# 📚 API Documentation — Vidya

## 🔐 Authentication
Semua endpoint admin membutuhkan header `Authorization: Bearer <TOKEN>`.

### Login
- **POST** `/api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ success, token, user }`

---

## 👤 Sisya (Siswa)

### Registrasi Baru (Public)
- **POST** `/api/sisya/register`
- **Body**: `multipart/form-data`
  - `namaLengkap`, `tempatLahir`, `tanggalLahir`, `jenisKelamin`, `alamat`, `noHp`, `email`
  - `namaGriya`, `namaDesa`
  - `programs`: JSON string `[{ id: 1, isPasangan: false }]`
  - Files: `fileIdentitas`, `fileFoto`, `filePunia`, `fileRekomendasi`

### List Sisya (Admin)
- **GET** `/api/sisya`
- **Query**: `?page=1&limit=10&search=...&status=...&programId=...`

### Detail Sisya (Admin)
- **GET** `/api/sisya/:id`

---

## 📝 Absensi (Admin)

### List Mata Kuliah
- **GET** `/api/absensi/mata-kuliah`

### Buat Sesi Absensi
- **POST** `/api/absensi/sesi`
- **Body**: `{ mataKuliahId, tanggal, pertemuan, topik }`

### Input Absensi
- **POST** `/api/absensi/sesi/:sesiId/input`
- **Body**: `{ absensi: [{ sisyaId, status }] }`
  - Status: `HADIR`, `IZIN`, `SAKIT`, `ALPHA`

---

## 💬 Kuesioner Anonim

Endpoint publik tidak memerlukan login dan tidak menerima nama atau nomor
pendaftaran sisya.

### Sesi Hari Ini (Public)
- **GET** `/api/open/kuesioner/sesi-hari-ini`
- Mengembalikan sesi aktif pada tanggal hari ini beserta token link sesi.

### Detail Link Sesi (Public)
- **GET** `/api/open/kuesioner/sesi/:token`
- Link hanya valid pada tanggal pertemuan.

### Kirim Jawaban (Public)
- **POST** `/api/open/kuesioner/jawaban`
- **Body**: `{ token, pesanKesan }`
- `pesanKesan` minimal 10 dan maksimal 2.000 karakter.

### Daftar Pertemuan (Admin)
- **GET** `/api/kuesioner?date=YYYY-MM-DD&programId=1`

### Detail Respons (Admin)
- **GET** `/api/kuesioner/sesi/:id`

### Laporan Per Program Ajahan (Admin)
- **GET** `/api/kuesioner/laporan/program?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&programId=1`
- Merangkum jumlah pertemuan, akumulasi kehadiran, jumlah respons, rasio
  respons, serta seluruh jawaban anonim yang dikelompokkan per program dan
  pertemuan.

### Analisis AI (Admin)
- **POST** `/api/kuesioner/sesi/:id/analisis-ai`
- Memerlukan `OPENAI_API_KEY`, konfigurasi AI aktif oleh SUPER_ADMIN, dan
  jumlah respons minimum sesuai pengaturan.

---

## 🤖 Telegram Bot (Admin Only)
- **POST** `/api/telegram/hook` (Webhook)
- **Commands**: `/summary`, `/menunggu`, `/bantuan`
