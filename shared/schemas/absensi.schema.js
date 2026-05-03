const { z } = require('zod');

const mataKuliahSchema = z.object({
  kode: z.string().min(2, 'Kode MK minimal 2 karakter'),
  nama: z.string().min(3, 'Nama MK minimal 3 karakter'),
  sks: z.coerce.number().int().positive('SKS harus angka positif'),
  semester: z.coerce.number().int().positive('Semester harus angka positif'),
  programAjahanId: z.coerce.number().int().positive('Pilih Program Ajahan')
});

const createSesiSchema = z.object({
  mataKuliahId: z.coerce.number().int().positive('ID Mata Kuliah tidak valid'),
  tanggal: z.string().or(z.date()),
  pertemuan: z.coerce.number().int().positive('Nomor pertemuan harus positif'),
  topik: z.string().optional()
});

const inputAbsensiSchema = z.object({
  absensi: z.array(z.object({
    sisyaId: z.number().int(),
    status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPHA'])
  })).min(1, 'Data absensi tidak boleh kosong')
});

module.exports = {
  mataKuliahSchema,
  createSesiSchema,
  inputAbsensiSchema
};
