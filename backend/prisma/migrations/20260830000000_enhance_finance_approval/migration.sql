ALTER TABLE "RencanaAnggaran"
ADD COLUMN "nomorReferensi" TEXT,
ADD COLUMN "rabQrDocumentId" BIGINT,
ADD COLUMN "lpjQrDocumentId" BIGINT;

CREATE UNIQUE INDEX "RencanaAnggaran_rabQrDocumentId_key"
ON "RencanaAnggaran"("rabQrDocumentId");

CREATE UNIQUE INDEX "RencanaAnggaran_lpjQrDocumentId_key"
ON "RencanaAnggaran"("lpjQrDocumentId");

ALTER TABLE "RencanaAnggaran"
ADD CONSTRAINT "RencanaAnggaran_rabQrDocumentId_fkey"
FOREIGN KEY ("rabQrDocumentId") REFERENCES "qr_document"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RencanaAnggaran"
ADD CONSTRAINT "RencanaAnggaran_lpjQrDocumentId_fkey"
FOREIGN KEY ("lpjQrDocumentId") REFERENCES "qr_document"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
