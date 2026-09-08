CREATE TYPE "StatusPaktaTemplate" AS ENUM ('DRAFT', 'AKTIF', 'DINONAKTIFKAN');
CREATE TYPE "StatusPaktaSisya" AS ENUM ('MENUNGGU', 'DITANDATANGANI', 'KEDALUWARSA', 'DIBATALKAN', 'DIGANTIKAN');

CREATE TABLE "PaktaTemplate" (
  "id" SERIAL NOT NULL,
  "kode" TEXT NOT NULL,
  "versi" INTEGER NOT NULL,
  "judul" TEXT NOT NULL,
  "pembuka" TEXT NOT NULL,
  "klausul" JSONB NOT NULL,
  "referensiPedoman" TEXT NOT NULL,
  "tanggalBerlaku" TIMESTAMP(3) NOT NULL,
  "batasHari" INTEGER NOT NULL DEFAULT 14,
  "wajibTandaUlang" BOOLEAN NOT NULL DEFAULT true,
  "status" "StatusPaktaTemplate" NOT NULL DEFAULT 'DRAFT',
  "createdById" INTEGER NOT NULL,
  "publishedById" INTEGER,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaktaTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaktaSisya" (
  "id" SERIAL NOT NULL,
  "sisyaId" INTEGER NOT NULL,
  "templateId" INTEGER NOT NULL,
  "nomorDokumen" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "tokenHint" TEXT NOT NULL,
  "verificationCode" TEXT NOT NULL,
  "status" "StatusPaktaSisya" NOT NULL DEFAULT 'MENUNGGU',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "contentSnapshot" JSONB NOT NULL,
  "programSnapshot" JSONB NOT NULL,
  "namaPenandatangan" TEXT,
  "consentSnapshot" JSONB,
  "signatureData" TEXT,
  "signedAt" TIMESTAMP(3),
  "ipHash" TEXT,
  "userAgent" TEXT,
  "documentHash" TEXT,
  "evidenceHash" TEXT,
  "revokedReason" TEXT,
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaktaSisya_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaktaAudit" (
  "id" SERIAL NOT NULL,
  "paktaSisyaId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "actorUserId" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaktaAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaktaTemplate_kode_versi_key" ON "PaktaTemplate"("kode", "versi");
CREATE INDEX "PaktaTemplate_status_tanggalBerlaku_idx" ON "PaktaTemplate"("status", "tanggalBerlaku");
CREATE UNIQUE INDEX "PaktaSisya_nomorDokumen_key" ON "PaktaSisya"("nomorDokumen");
CREATE UNIQUE INDEX "PaktaSisya_tokenHash_key" ON "PaktaSisya"("tokenHash");
CREATE UNIQUE INDEX "PaktaSisya_verificationCode_key" ON "PaktaSisya"("verificationCode");
CREATE UNIQUE INDEX "PaktaSisya_sisyaId_templateId_key" ON "PaktaSisya"("sisyaId", "templateId");
CREATE INDEX "PaktaSisya_status_expiresAt_idx" ON "PaktaSisya"("status", "expiresAt");
CREATE INDEX "PaktaSisya_templateId_status_idx" ON "PaktaSisya"("templateId", "status");
CREATE INDEX "PaktaAudit_paktaSisyaId_createdAt_idx" ON "PaktaAudit"("paktaSisyaId", "createdAt");

ALTER TABLE "PaktaSisya" ADD CONSTRAINT "PaktaSisya_sisyaId_fkey" FOREIGN KEY ("sisyaId") REFERENCES "Sisya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaktaSisya" ADD CONSTRAINT "PaktaSisya_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PaktaTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaktaAudit" ADD CONSTRAINT "PaktaAudit_paktaSisyaId_fkey" FOREIGN KEY ("paktaSisyaId") REFERENCES "PaktaSisya"("id") ON DELETE CASCADE ON UPDATE CASCADE;
