# VIDYA - Visualisasi Data dan Sisya Administrasi Pesraman

Sistem Informasi Akademik untuk pengelolaan pendaftaran dan statistik siswa (Sisya) di Yayasan Hindu / Perkumpulan Dharmopadesa Pusat Nusantara.

## Fitur Utama
- Pendaftaran Sisya Online
- Dashboard Statistik (Jenis Kelamin & Program)
- Manajemen Program Ajahan
- Verifikasi Pembayaran (Admin)
- Laporan Pendaftaran

## Teknologi
- Backend: Node.js, Express, Prisma (PostgreSQL)
- Frontend: React, Vite, TailwindCSS, Recharts
- Authentication: JWT

## Cara Menjalankan
1. Clone repository ini.
2. Install dependencies di `backend` dan `frontend`.
3. Setup `.env` di `backend`.
4. Jalankan `npx prisma db push` dan `npx prisma db seed`.
5. Jalankan `npm run dev` di kedua direktori.
