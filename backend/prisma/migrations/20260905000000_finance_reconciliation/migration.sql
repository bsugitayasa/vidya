-- Additive migration: existing receipts remain active Bendahara disbursements.
ALTER TYPE "StatusRab" ADD VALUE 'DALAM_PENYESUAIAN';
ALTER TYPE "StatusTransaksiKeuangan" ADD VALUE 'MENUNGGU_VERIFIKASI';
ALTER TABLE "PencairanDana" ADD COLUMN "jenisSumber" TEXT NOT NULL DEFAULT 'BENDAHARA',
  ADD COLUMN "verifiedById" INTEGER, ADD COLUMN "verifiedAt" TIMESTAMP(3);
CREATE TABLE "ArsipLpj" (
 "id" SERIAL PRIMARY KEY, "rabId" INTEGER NOT NULL REFERENCES "RencanaAnggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "revision" INTEGER NOT NULL, "snapshot" JSONB NOT NULL, "alasan" TEXT NOT NULL,
 "userId" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ArsipLpj_rabId_revision_key" ON "ArsipLpj"("rabId", "revision");
CREATE TABLE "PerubahanAnggaran" (
 "id" SERIAL PRIMARY KEY, "rabId" INTEGER NOT NULL REFERENCES "RencanaAnggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "items" JSONB NOT NULL, "alasan" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
 "userId" INTEGER NOT NULL, "verifiedById" INTEGER, "verifiedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PerubahanAnggaran_rabId_status_idx" ON "PerubahanAnggaran"("rabId", "status");
CREATE TABLE "RekonsiliasiKas" (
 "id" SERIAL PRIMARY KEY, "akunKasId" INTEGER NOT NULL REFERENCES "AkunKas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "tanggal" TIMESTAMP(3) NOT NULL, "saldoSistem" DECIMAL(18,0) NOT NULL, "saldoAktual" DECIMAL(18,0) NOT NULL,
 "catatan" TEXT NOT NULL, "userId" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "RekonsiliasiKas_akunKasId_tanggal_idx" ON "RekonsiliasiKas"("akunKasId", "tanggal");
