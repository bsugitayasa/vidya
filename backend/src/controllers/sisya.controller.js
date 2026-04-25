const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Utility function to generate Roman Month
const getRomanMonth = (monthIndex) => {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return roman[monthIndex];
};

const PROGRAM_PREFIXES = {
  'Kawelakaan': 'WLK.XVII-BD.SDM/PDPN',
  'Kawikon': 'KWN.IX-BD.SDM/PDPN',
  'Usadha': 'USH.III-BD.SDM/PDPN',
  'Serati': 'SRT.IV-BD.SDM/PDPN'
};

// Utility function to generate Nomor Pendaftaran
const generateNomorPendaftaran = async () => {
  const year = new Date().getFullYear();
  // Hitung jumlah pendaftar tahun ini untuk urutan
  const count = await prisma.sisya.count({
    where: {
      nomorPendaftaran: {
        startsWith: `PDPN-${year}-`
      }
    }
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `PDPN-${year}-${sequence}`;
};

const register = async (req, res) => {
  try {
    const data = req.body;
    
    // Parse programs array from JSON string
    let parsedPrograms = [];
    try {
      parsedPrograms = JSON.parse(data.programs);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Format program tidak valid' });
    }

    if (!parsedPrograms || parsedPrograms.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal pilih 1 program ajahan' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const romanMonth = getRomanMonth(now.getMonth());

    // Ambil data program dari DB untuk kalkulasi total punia
    let totalPunia = 0;
    const sisyaProgramsData = [];

    for (const prog of parsedPrograms) {
      const dbProgram = await prisma.programAjahan.findUnique({ where: { id: parseInt(prog.id) } });
      if (dbProgram) {
        const isPasangan = prog.isPasangan && dbProgram.isPasanganTersedia;
        const harga = (isPasangan && dbProgram.puniaPasangan) ? dbProgram.puniaPasangan : dbProgram.puniaNormal;
        totalPunia += harga;

        // Hitung sequence pendaftaran per program untuk tahun ini
        const programSequenceCount = await prisma.sisyaProgram.count({
          where: {
            programAjahanId: dbProgram.id,
            createdAt: {
              gte: new Date(year, 0, 1),
              lt: new Date(year + 1, 0, 1)
            }
          }
        });
        
        const sequence = String(programSequenceCount + 1).padStart(3, '0');
        const prefix = PROGRAM_PREFIXES[dbProgram.nama] || 'GENERIC/PDPN';
        const nomorRegistrasi = `${sequence}/${prefix}/${romanMonth}/${year}`;

        sisyaProgramsData.push({
          programAjahanId: dbProgram.id,
          isPasangan: isPasangan,
          puniaProgram: harga,
          nomorRegistrasi: nomorRegistrasi
        });
      }
    }

    // Handle files
    let fileKtpPath = null;
    let fileFotoPath = null;
    let fileBuktiPuniaPath = null;

    if (req.files) {
      if (req.files.fileIdentitas && req.files.fileIdentitas[0]) {
        fileKtpPath = `/uploads/${req.files.fileIdentitas[0].filename}`;
      }
      if (req.files.fileFoto && req.files.fileFoto[0]) {
        fileFotoPath = `/uploads/${req.files.fileFoto[0].filename}`;
      }
      if (req.files.filePunia && req.files.filePunia[0]) {
        fileBuktiPuniaPath = `/uploads/${req.files.filePunia[0].filename}`;
      }
    }

    const nomorPendaftaran = await generateNomorPendaftaran();

    // Buat record Sisya menggunakan transaksi
    const newSisya = await prisma.$transaction(async (tx) => {
      const sisya = await tx.sisya.create({
        data: {
          nomorPendaftaran,
          namaLengkap: data.namaLengkap,
          tempatLahir: data.tempatLahir,
          tanggalLahir: new Date(data.tanggalLahir),
          jenisKelamin: data.jenisKelamin,
          alamat: data.alamat,
          noHp: data.noHp,
          email: data.email || null,
          namaGriya: data.namaGriya,
          namaDesa: data.namaDesa,
          fileIdentitasPath: fileKtpPath,
          fileFotoPath,
          filePuniaPath: fileBuktiPuniaPath,
          totalPunia,
          // Jika ada bukti punia, otomatis MENUNGGU. Jika tidak ada, tetap MENUNGGU (menunggu pembayaran) atau bisa dibuat status BELUM_BAYAR jika ada fiturnya. Di schema defaultnya MENUNGGU
          statusPembayaran: fileBuktiPuniaPath ? 'MENUNGGU' : 'MENUNGGU',
          programSisyas: {
            create: sisyaProgramsData
          }
        },
        include: {
          programSisyas: true
        }
      });
      return sisya;
    });

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil',
      data: {
        nomorPendaftaran: newSisya.nomorPendaftaran,
        namaLengkap: newSisya.namaLengkap,
        totalPunia: newSisya.totalPunia
      }
    });

  } catch (error) {
    console.error('Register Sisya Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menyimpan data pendaftaran' });
  }
};

const getAll = async (req, res) => {
  try {
    const sisyas = await prisma.sisya.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        programSisyas: {
          include: {
            programAjahan: true
          }
        }
      }
    });
    
    res.json({ success: true, data: sisyas });
  } catch (error) {
    console.error('Get All Sisya Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const sisya = await prisma.sisya.findUnique({
      where: { id: parseInt(id) },
      include: {
        programSisyas: {
          include: {
            programAjahan: true
          }
        }
      }
    });

    if (!sisya) {
      return res.status(404).json({ success: false, message: 'Data Sisya tidak ditemukan' });
    }

    res.json({ success: true, data: sisya });
  } catch (error) {
    console.error('Get By Id Sisya Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['MENUNGGU', 'LUNAS', 'DITOLAK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const updatedSisya = await prisma.sisya.update({
      where: { id: parseInt(id) },
      data: { statusPembayaran: status }
    });

    res.json({ success: true, message: 'Status berhasil diperbarui', data: updatedSisya });
  } catch (error) {
    console.error('Update Status Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data Sisya tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const findByNomor = async (req, res) => {
  try {
    const { nomor } = req.query;
    if (!nomor) {
      return res.status(400).json({ success: false, message: 'Nomor pendaftaran harus diisi' });
    }

    const sisya = await prisma.sisya.findUnique({
      where: { nomorPendaftaran: nomor },
      select: {
        id: true,
        nomorPendaftaran: true,
        namaLengkap: true,
        statusPembayaran: true,
        totalPunia: true,
        programSisyas: {
          select: {
            puniaProgram: true,
            programAjahan: {
              select: {
                nama: true
              }
            }
          }
        }
      }
    });

    if (!sisya) {
      return res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan' });
    }

    res.json({ success: true, data: sisya });
  } catch (error) {
    console.error('Find By Nomor Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const uploadPunia = async (req, res) => {
  try {
    const { id } = req.params;
    const { nomorPendaftaran } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File bukti punia harus diunggah' });
    }

    // Verifikasi ID dan Nomor Pendaftaran cocok
    const sisya = await prisma.sisya.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sisya || sisya.nomorPendaftaran !== nomorPendaftaran) {
      // Hapus file jika verifikasi gagal agar tidak menumpuk sampah
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Verifikasi data gagal' });
    }

    // Update path file punia dan status
    const updatedSisya = await prisma.sisya.update({
      where: { id: parseInt(id) },
      data: {
        filePuniaPath: `/uploads/${req.file.filename}`,
        statusPembayaran: 'MENUNGGU' // Set ke menunggu verifikasi
      }
    });

    res.json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah',
      data: {
        nomorPendaftaran: updatedSisya.nomorPendaftaran,
        statusPembayaran: updatedSisya.statusPembayaran
      }
    });

  } catch (error) {
    console.error('Upload Punia Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengunggah bukti pembayaran' });
  }
};

module.exports = {
  register,
  getAll,
  getById,
  updateStatus,
  findByNomor,
  uploadPunia
};
