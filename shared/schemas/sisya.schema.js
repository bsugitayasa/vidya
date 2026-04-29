const { z } = require('zod');

const sisyaRegistrationSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  tempatLahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.string().or(z.date()),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN'], {
    errorMap: () => ({ message: 'Jenis kelamin harus LAKI_LAKI atau PEREMPUAN' })
  }),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  noHp: z.string().min(9, 'Nomor HP minimal 9 karakter'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  namaGriya: z.string().min(2, 'Nama Griya wajib diisi'),
  namaDesa: z.string().min(2, 'Nama Desa wajib diisi'),
  programs: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, 'Minimal pilih 1 program ajahan')
});

module.exports = {
  sisyaRegistrationSchema
};
