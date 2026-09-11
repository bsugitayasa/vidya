-- Penanda kepesertaan kelas percepatan/pendidikan kilat khusus program Kawikon.
-- Nilai punia khusus tetap disimpan pada kolom puniaProgram yang sudah ada.
ALTER TABLE "SisyaProgram"
ADD COLUMN "isPendidikanKilat" BOOLEAN NOT NULL DEFAULT false;
