# Penyesuaian RAB / LPJ dan rekonsiliasi dana

## Penggunaan

1. Buka Keuangan → RAB & LPJ → Detail RAB.
2. Untuk RAB **Selesai**, SUPER_ADMIN memilih **Buka Penyesuaian RAB / LPJ** dan mengisi alasan. Versi selesai disimpan sebagai arsip; revisi bertambah dan tanda tangan LPJ revisi dikosongkan.
3. Pilih **Tambah Dana Masuk**. Isi tanggal, sumber (Bendahara, Hibah, Punia, Lainnya), pemberi, nominal, kas penerima, referensi, keterangan dan bukti.
4. Bendahara / SUPER_ADMIN memilih **Periksa Penerimaan** kemudian verifikasi. Penerimaan menunggu tidak menambah kas. Dana tambahan boleh melampaui anggaran karena penerimaan berbeda dari persetujuan belanja.
5. Jika anggaran berubah, pilih **Sesuaikan Komponen Anggaran**. Komponen yang sudah ada tetap memiliki ID yang sama; komponen baru dapat ditambahkan. Bendahara / SUPER_ADMIN memutuskan usulan sebelum nilai anggaran berubah. Nilai komponen tidak dapat diturunkan di bawah realisasi dan pengeluaran yang menunggu.
6. Setelah perubahan anggaran, QR RAB lama dilepas dari versi terkini. Gunakan **Tanda Tangani RAB Revisi** untuk tanda tangan baru. QR yang terikat pada arsip LPJ tidak dapat dipakai ulang.
7. Catat / koreksi pengeluaran. Koreksi memakai pembatalan dengan alasan dan pencatatan pengganti; riwayat transaksi serta audit dipertahankan. Transaksi yang sudah diverifikasi tidak ditimpa nominalnya.
8. Selesaikan semua verifikasi, kembalikan sisa dana, lalu **Ajukan LPJ** → **Verifikasi & Tutup**. Penutupan tetap mensyaratkan saldo nol. LPJ revisi memerlukan QR persetujuan baru.
9. Arsip LPJ dapat dibuka dari Detail RAB dan diekspor sebagai PDF / Excel. Arsip menggunakan snapshot data dan penandatangan versi tersebut.

## Rekonsiliasi

### Edit uraian komponen

Pada Detail RAB → Rincian Anggaran, SUPER_ADMIN dapat memilih **Edit Uraian** dan mengisi alasan. ID komponen, nominal, serta relasi pengeluaran tetap dipertahankan. Pilihan Item RAB pada pengeluaran, label komponen pada realisasi, rincian PDF dan sheet Rincian Anggaran Excel mengikuti uraian terkini. Uraian transaksi pengeluaran merupakan keterangan bukti transaksi tersendiri dan tidak ditimpa.

Usulan penyesuaian anggaran yang masih menunggu diselaraskan agar tidak mengembalikan uraian lama saat disetujui. Perubahan dicatat di Jejak Audit. RAB bertanda tangan yang uraiannya berubah memerlukan tanda tangan RAB kembali. LPJ selesai harus dibuka untuk penyesuaian, dan LPJ yang sedang diverifikasi harus dikembalikan untuk revisi terlebih dahulu. Arsip LPJ tetap memuat nama komponen pada versi lama.

Menu **Keuangan → Rekonsiliasi Dana** merangkum seluruh RAB. Tersedia filter periode transaksi, program, status terkini, kas, serta RAB penerima sumber dana tertentu.

- Saldo awal: penerimaan terverifikasi sebelum periode dikurangi realisasi dan pengembalian sebelum periode.
- Saldo akhir: saldo awal + dana masuk periode − realisasi periode − pengembalian periode.
- Dana masuk dipisah menjadi Bendahara, Hibah, Punia dan Lainnya.
- Filter sumber memilih RAB penerima sumber tersebut dalam periode/kas terpilih dan tetap menyertakan seluruh arus kas RAB yang cocok. Belanja tidak dialokasikan secara fiktif ke suatu sumber dana.
- Anggaran dan status pada laporan adalah posisi terkini; periode mengatur transaksi. Koreksi/pembatalan tercermin pada rekap terkini. Arsip LPJ mempertahankan laporan versi yang sudah selesai.
- Excel memuat rekap dan rincian transaksi; PDF menggunakan A4 landscape dengan logo, filter, total dan nomor halaman.

**Cakupan kas:** laporan ini adalah dana yang dipercayakan kepada kegiatan/RAB, bukan seluruh kas organisasi. Pencairan Bendahara dan pengembalian merupakan transfer internal; tidak dihitung sebagai pendapatan atau beban eksternal organisasi. Akun kas pada penerimaan adalah kas penerima/pemegang dana RAB; pengeluaran dan pengembalian mengurangi akun itu.

Pada **Pemeriksaan Kas Dana Kelolaan**, Bendahara/SUPER_ADMIN mengisi saldo aktual pada tanggal tertentu dan catatan pemeriksaan. Sistem menyimpan saldo menurut pencatatan, saldo aktual, serta selisihnya. Selisih tidak otomatis membuat transaksi. Saldo awal organisasi di luar pencatatan RAB tidak diasumsikan nol atau dimasukkan sebagai penerimaan baru; pisahkan bagian dana RAB ketika membandingkan rekening campuran dan jelaskan dalam catatan.

Penerimaan lama tetap diklasifikasikan sebagai Bendahara sesuai alur pencairan sebelumnya. Sistem tidak menebak klasifikasi Hibah/Punia dari teks lama. Apabila data lama sebenarnya berbeda, lakukan koreksi melalui alur penyesuaian agar auditnya jelas.

## Deployment

Update ini **memerlukan migrasi** `20260905000000_finance_reconciliation`. Migrasi hanya menambah enum, kolom dan tabel, tanpa menghapus tabel/data lama.

Setelah perubahan sudah tersedia di branch main, dari direktori `/var/www/vidya`:

```sh
mkdir -p backups
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/vidya-before-reconciliation-$(date +%Y%m%d-%H%M%S).dump"
# Pastikan perintah backup berhasil dan file backup berukuran bukan nol.
git pull origin main
docker compose build backend frontend
docker compose run --rm backend npx prisma migrate deploy
# Lanjutkan hanya setelah migrasi berhasil.
docker compose up -d --no-deps backend frontend
docker compose logs --tail=80 backend
```

Jangan gunakan `prisma migrate reset`, `db push --accept-data-loss`, atau `docker compose down -v` pada production. Build backend sudah menjalankan Prisma generate; migrasi tetap harus dijalankan terhadap database sebelum backend versi baru aktif. Database Docker lokal telah menerima migrasi tambahan ini untuk verifikasi.

## Verifikasi developer

Dari direktori backend:

```sh
node --test tests/keuangan.service.test.js tests/rekonsiliasi.service.test.js
node tests/rekonsiliasi.http-smoke.js
```

HTTP smoke memakai server sementara di port acak dan menjalankan fixture dalam transaksi PostgreSQL yang di-rollback. Mencakup role, RAB selesai, arsip, dana tambahan, pending/verified, revisi komponen, QR baru, realisasi, pengembalian, penutupan LPJ, rekap periode, pemeriksaan kas dan export Excel.
