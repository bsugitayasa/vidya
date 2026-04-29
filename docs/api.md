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

## 🤖 Telegram Bot (Admin Only)
- **POST** `/api/telegram/hook` (Webhook)
- **Commands**: `/summary`, `/menunggu`, `/bantuan`
