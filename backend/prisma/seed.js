const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // 1. Seed Admin Users
  const superAdminPassword = await bcrypt.hash('pdpnjaya@2026', 10)

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@pdpn.com' },
    update: { 
      role: 'SUPER_ADMIN',
      password: superAdminPassword 
    },
    create: {
      email: 'admin@pdpn.com',
      password: superAdminPassword,
      nama: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  })

  // Regular Admin
  const adminPassword = await bcrypt.hash('capungmas@2026', 10)
  await prisma.user.upsert({
    where: { email: 'admin.vidya@pdpn.com' },
    update: { 
      role: 'ADMIN',
      password: adminPassword
    },
    create: {
      email: 'admin.vidya@pdpn.com',
      password: adminPassword,
      nama: 'Administrator',
      role: 'ADMIN',
    },
  })
  console.log('Admin users seeded.')

  // 2. Seed Program Ajahan
  const programs = [
    { kode: 'KAWIKON', nama: 'Kawikon', deskripsi: 'Program pendidikan disiapkan bagi para Sisya yang ingin melanjutkan perjalanan spiritual menuju jenjang Ratu Pedanda', puniaNormal: 1000000, puniaPasangan: 1500000, isPasanganTersedia: true, kodeSertifikat: 'KWN.IX-BD.SDM/PDPN' },
    { kode: 'KAWELAKAAN', nama: 'Kawelakaan', deskripsi: 'Program Pendidikan mendalami pengetahuan dan keterampilan sebagai Walaka', puniaNormal: 2000000, puniaPasangan: null, isPasanganTersedia: false, kodeSertifikat: 'WLK.XVIII-BD.SDM/PDPN' },
    { kode: 'USADHA', nama: 'Usadha', deskripsi: 'Program Pendidikan mempelajari dan melestarikan ilmu pengobatan tradisional Bali', puniaNormal: 1500000, puniaPasangan: null, isPasanganTersedia: false, kodeSertifikat: 'USH.III-BD.SDM/PDPN' },
    { kode: 'SERATI', nama: 'Serati', deskripsi: 'Program Pendidikan mendalami pengetahuan Panca Yadnya serta kemampuan praktis Keseratian', puniaNormal: 1000000, puniaPasangan: null, isPasanganTersedia: false, kodeSertifikat: 'SRT.IV-BD.SDM/PDPN' },
  ]

  for (const p of programs) {
    await prisma.programAjahan.upsert({
      where: { kode: p.kode },
      update: {
        nama: p.nama,
        deskripsi: p.deskripsi,
        puniaNormal: p.puniaNormal,
        puniaPasangan: p.puniaPasangan,
        isPasanganTersedia: p.isPasanganTersedia,
        kodeSertifikat: p.kodeSertifikat
      },
      create: p,
    })
  }
  console.log('Program Ajahan seeded.')

  // 3. Seed Konfigurasi Aplikasi (Rekening)
  const configs = [
    { kunci: 'nama_bank', nilai: 'Bank BPD Bali', label: 'Nama Bank' },
    { kunci: 'nomor_rekening', nilai: '018.02.02.31507-5', label: 'Nomor Rekening' },
    { kunci: 'nama_rekening', nilai: 'PDPN DIKJAR POLEKSOSDA', label: 'Nama Pemilik Rekening' },
    { kunci: 'tanggal_kelulusan', nilai: '2026-05-10', label: 'Tanggal Prosesi Kelulusan' },
    { kunci: 'persentase_kelulusan', nilai: '50', label: 'Persentase Minimum Kelulusan (%)' },
  ]

  for (const c of configs) {
    await prisma.konfigurasiAplikasi.upsert({
      where: { kunci: c.kunci },
      update: { nilai: c.nilai, label: c.label },
      create: c,
    })
  }
  console.log('Konfigurasi Aplikasi seeded.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
