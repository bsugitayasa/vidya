CREATE TABLE "KuesionerJawaban" (
    "id" SERIAL NOT NULL,
    "sesiAbsensiId" INTEGER NOT NULL,
    "pesanKesan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KuesionerJawaban_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalisisKuesioner" (
    "id" SERIAL NOT NULL,
    "sesiAbsensiId" INTEGER NOT NULL,
    "jumlahRespons" INTEGER NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "hasilAnalisis" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnalisisKuesioner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KuesionerJawaban_sesiAbsensiId_createdAt_idx" ON "KuesionerJawaban"("sesiAbsensiId", "createdAt");
CREATE UNIQUE INDEX "AnalisisKuesioner_sesiAbsensiId_key" ON "AnalisisKuesioner"("sesiAbsensiId");

ALTER TABLE "KuesionerJawaban" ADD CONSTRAINT "KuesionerJawaban_sesiAbsensiId_fkey" FOREIGN KEY ("sesiAbsensiId") REFERENCES "SesiAbsensi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalisisKuesioner" ADD CONSTRAINT "AnalisisKuesioner_sesiAbsensiId_fkey" FOREIGN KEY ("sesiAbsensiId") REFERENCES "SesiAbsensi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
