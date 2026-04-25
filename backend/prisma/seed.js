const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // 1. Seed Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yayasan.com' },
    update: {},
    create: {
      email: 'admin@yayasan.com',
      password: adminPassword,
      nama: 'Administrator',
      role: 'ADMIN',
    },
  })
  console.log('Admin user created/verified.')

  // 2. Seed Program Ajahan
  const programs = [
    { kode: 'KAWIKON', nama: 'Kawikon', deskripsi: 'Pendidikan untuk menjadi Sulinggih', puniaNormal: 1000000, puniaPasangan: 1500000, isPasanganTersedia: true },
    { kode: 'KAWELAKAAN', nama: 'Kawelakaan', deskripsi: 'Pendidikan pemangku', puniaNormal: 1000000, puniaPasangan: null, isPasanganTersedia: false },
    { kode: 'USADHA', nama: 'Usadha', deskripsi: 'Pengobatan tradisional Bali', puniaNormal: 500000, puniaPasangan: null, isPasanganTersedia: false },
    { kode: 'SERATI', nama: 'Serati', deskripsi: 'Pelatihan membuat banten/upakara', puniaNormal: 1000000, puniaPasangan: null, isPasanganTersedia: false },
  ]

  for (const p of programs) {
    await prisma.programAjahan.upsert({
      where: { kode: p.kode },
      update: {
        nama: p.nama,
        deskripsi: p.deskripsi,
        puniaNormal: p.puniaNormal,
        puniaPasangan: p.puniaPasangan,
        isPasanganTersedia: p.isPasanganTersedia
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
