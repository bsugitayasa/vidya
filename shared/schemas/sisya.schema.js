const { z } = require('zod');

const sisyaRegistrationSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  tempatLahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.string().or(z.date()),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN'], {
    errorMap: () => ({ message: 'Jenis kelamin harus LAKI_LAKI atau PEREMPUAN' })
  }),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  noHp: z.string()
    .transform(val => val.replace(/\D/g, '')) // Hapus karakter non-digit
    .transform(val => {
      if (val.startsWith('62')) return '0' + val.substring(2);
      return val;
    })
    .refine(val => /^08\d+$/.test(val), "Nomor HP harus diawali dengan 08")
    .refine(val => val.length >= 10, "Nomor HP minimal 10 digit"),
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

const sisyaUpdateSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  tempatLahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.string().or(z.date()),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN'], {
    errorMap: () => ({ message: 'Jenis kelamin harus LAKI_LAKI atau PEREMPUAN' })
  }),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  noHp: z.string()
    .transform(val => val.replace(/\D/g, '')) // Hapus karakter non-digit
    .transform(val => {
      if (val.startsWith('62')) return '0' + val.substring(2);
      return val;
    })
    .refine(val => /^08\d+$/.test(val), "Nomor HP harus diawali dengan 08")
    .refine(val => val.length >= 10, "Nomor HP minimal 10 digit"),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  namaGriya: z.string().min(2, 'Nama Griya wajib diisi'),
  namaDesa: z.string().min(2, 'Nama Desa wajib diisi')
});

module.exports = {
  sisyaRegistrationSchema,
  sisyaUpdateSchema
};
