-- Add the treasurer role without changing existing user roles.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BENDAHARA';

CREATE TYPE "StatusRab" AS ENUM ('DRAFT', 'DIAJUKAN', 'DISETUJUI', 'DITOLAK', 'DICAIRKAN_SEBAGIAN', 'DICAIRKAN_PENUH', 'REALISASI', 'MENUNGGU_VERIFIKASI_LPJ', 'PERLU_REVISI', 'SELESAI', 'DIBATALKAN');
CREATE TYPE "TipeAkunKas" AS ENUM ('KAS', 'BANK');
CREATE TYPE "StatusTransaksiKeuangan" AS ENUM ('AKTIF', 'DIBATALKAN');
CREATE TYPE "StatusPengeluaran" AS ENUM ('MENUNGGU_VERIFIKASI', 'VERIFIKASI', 'DITOLAK', 'DIBATALKAN');
CREATE TYPE "MetodePembayaranKeuangan" AS ENUM ('TUNAI', 'TRANSFER', 'QRIS', 'LAINNYA');

CREATE TABLE "KategoriKeuangan" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KategoriKeuangan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AkunKas" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" "TipeAkunKas" NOT NULL,
    "namaBank" TEXT,
    "nomorRekening" TEXT,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AkunKas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RencanaAnggaran" (
    "id" SERIAL NOT NULL,
    "nomorRab" TEXT NOT NULL,
    "namaKegiatan" TEXT NOT NULL,
    "programAjahanId" INTEGER,
    "penanggungJawab" TEXT NOT NULL,
    "tujuan" TEXT,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "totalDiajukan" DECIMAL(18,0) NOT NULL,
    "totalDisetujui" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "status" "StatusRab" NOT NULL DEFAULT 'DRAFT',
    "dokumenPath" TEXT,
    "catatan" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdById" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "closedById" INTEGER,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RencanaAnggaran_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemAnggaran" (
    "id" SERIAL NOT NULL,
    "rabId" INTEGER NOT NULL,
    "kategoriId" INTEGER,
    "uraian" TEXT NOT NULL,
    "volume" DECIMAL(12,2) NOT NULL,
    "satuan" TEXT NOT NULL,
    "hargaSatuan" DECIMAL(18,0) NOT NULL,
    "jumlahDiajukan" DECIMAL(18,0) NOT NULL,
    "jumlahDisetujui" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ItemAnggaran_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PencairanDana" (
    "id" SERIAL NOT NULL,
    "rabId" INTEGER NOT NULL,
    "akunKasId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "nominal" DECIMAL(18,0) NOT NULL,
    "sumberDana" TEXT NOT NULL,
    "nomorReferensi" TEXT,
    "buktiPath" TEXT,
    "keterangan" TEXT,
    "status" "StatusTransaksiKeuangan" NOT NULL DEFAULT 'AKTIF',
    "createdById" INTEGER NOT NULL,
    "cancelledById" INTEGER,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PencairanDana_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PengeluaranRab" (
    "id" SERIAL NOT NULL,
    "rabId" INTEGER NOT NULL,
    "itemAnggaranId" INTEGER,
    "kategoriId" INTEGER NOT NULL,
    "akunKasId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "uraian" TEXT NOT NULL,
    "penerima" TEXT,
    "nominal" DECIMAL(18,0) NOT NULL,
    "metode" "MetodePembayaranKeuangan" NOT NULL,
    "nomorBukti" TEXT,
    "buktiPath" TEXT,
    "status" "StatusPengeluaran" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "keterangan" TEXT,
    "allowOverBudget" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "createdById" INTEGER NOT NULL,
    "verifiedById" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "cancelledById" INTEGER,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PengeluaranRab_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PengembalianDana" (
    "id" SERIAL NOT NULL,
    "rabId" INTEGER NOT NULL,
    "akunKasId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "nominal" DECIMAL(18,0) NOT NULL,
    "nomorReferensi" TEXT,
    "buktiPath" TEXT,
    "keterangan" TEXT,
    "status" "StatusTransaksiKeuangan" NOT NULL DEFAULT 'AKTIF',
    "createdById" INTEGER NOT NULL,
    "cancelledById" INTEGER,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PengembalianDana_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditKeuangan" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditKeuangan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KategoriKeuangan_kode_key" ON "KategoriKeuangan"("kode");
CREATE UNIQUE INDEX "AkunKas_kode_key" ON "AkunKas"("kode");
CREATE UNIQUE INDEX "RencanaAnggaran_nomorRab_key" ON "RencanaAnggaran"("nomorRab");
CREATE INDEX "RencanaAnggaran_status_createdAt_idx" ON "RencanaAnggaran"("status", "createdAt");
CREATE INDEX "RencanaAnggaran_programAjahanId_idx" ON "RencanaAnggaran"("programAjahanId");
CREATE INDEX "ItemAnggaran_rabId_urutan_idx" ON "ItemAnggaran"("rabId", "urutan");
CREATE INDEX "PencairanDana_rabId_status_idx" ON "PencairanDana"("rabId", "status");
CREATE INDEX "PengeluaranRab_rabId_status_idx" ON "PengeluaranRab"("rabId", "status");
CREATE INDEX "PengeluaranRab_kategoriId_tanggal_idx" ON "PengeluaranRab"("kategoriId", "tanggal");
CREATE INDEX "PengembalianDana_rabId_status_idx" ON "PengembalianDana"("rabId", "status");
CREATE INDEX "AuditKeuangan_entityType_entityId_createdAt_idx" ON "AuditKeuangan"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditKeuangan_userId_createdAt_idx" ON "AuditKeuangan"("userId", "createdAt");

ALTER TABLE "RencanaAnggaran" ADD CONSTRAINT "RencanaAnggaran_programAjahanId_fkey" FOREIGN KEY ("programAjahanId") REFERENCES "ProgramAjahan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RencanaAnggaran" ADD CONSTRAINT "RencanaAnggaran_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RencanaAnggaran" ADD CONSTRAINT "RencanaAnggaran_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RencanaAnggaran" ADD CONSTRAINT "RencanaAnggaran_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemAnggaran" ADD CONSTRAINT "ItemAnggaran_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "RencanaAnggaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemAnggaran" ADD CONSTRAINT "ItemAnggaran_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriKeuangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PencairanDana" ADD CONSTRAINT "PencairanDana_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "RencanaAnggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PencairanDana" ADD CONSTRAINT "PencairanDana_akunKasId_fkey" FOREIGN KEY ("akunKasId") REFERENCES "AkunKas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PencairanDana" ADD CONSTRAINT "PencairanDana_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PencairanDana" ADD CONSTRAINT "PencairanDana_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengeluaranRab" ADD CONSTRAINT "PengeluaranRab_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "RencanaAnggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengeluaranRab" ADD CONSTRAINT "PengeluaranRab_itemAnggaranId_fkey" FOREIGN KEY ("itemAnggaranId") REFERENCES "ItemAnggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengeluaranRab" ADD CONSTRAINT "PengeluaranRab_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriKeuangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengeluaranRab" ADD CONSTRAINT "PengeluaranRab_akunKasId_fkey" FOREIGN KEY ("akunKasId") REFERENCES "AkunKas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengeluaranRab" ADD CONSTRAINT "PengeluaranRab_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengeluaranRab" ADD CONSTRAINT "PengeluaranRab_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengeluaranRab" ADD CONSTRAINT "PengeluaranRab_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengembalianDana" ADD CONSTRAINT "PengembalianDana_rabId_fkey" FOREIGN KEY ("rabId") REFERENCES "RencanaAnggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengembalianDana" ADD CONSTRAINT "PengembalianDana_akunKasId_fkey" FOREIGN KEY ("akunKasId") REFERENCES "AkunKas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengembalianDana" ADD CONSTRAINT "PengembalianDana_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PengembalianDana" ADD CONSTRAINT "PengembalianDana_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditKeuangan" ADD CONSTRAINT "AuditKeuangan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "KategoriKeuangan" ("kode", "nama", "deskripsi", "updatedAt") VALUES
  ('KONSUMSI', 'Konsumsi', 'Konsumsi peserta, panitia, dan narawakya', CURRENT_TIMESTAMP),
  ('PERLENGKAPAN', 'Perlengkapan', 'Perlengkapan kegiatan dan bahan habis pakai', CURRENT_TIMESTAMP),
  ('TRANSPORTASI', 'Transportasi', 'Transportasi dan perjalanan kegiatan', CURRENT_TIMESTAMP),
  ('HONORARIUM', 'Honorarium', 'Honorarium narawakya atau tenaga pendukung', CURRENT_TIMESTAMP),
  ('DOKUMENTASI', 'Dokumentasi', 'Dokumentasi, cetak, dan publikasi', CURRENT_TIMESTAMP),
  ('LAINNYA', 'Lainnya', 'Pengeluaran operasional lainnya', CURRENT_TIMESTAMP)
ON CONFLICT ("kode") DO NOTHING;

INSERT INTO "AkunKas" ("kode", "nama", "tipe", "updatedAt") VALUES
  ('KAS-UTAMA', 'Kas Utama', 'KAS', CURRENT_TIMESTAMP)
ON CONFLICT ("kode") DO NOTHING;
