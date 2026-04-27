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
    let fileRekomendasiPath = null;

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
      if (req.files.fileRekomendasi && req.files.fileRekomendasi[0]) {
        fileRekomendasiPath = `/uploads/${req.files.fileRekomendasi[0].filename}`;
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
          fileRekomendasiPath,
          totalPunia,
          statusPembayaran: fileBuktiPuniaPath ? 'MENUNGGU_VERIFIKASI' : 'MENUNGGU_PEMBAYARAN',
          programSisyas: {
            create: sisyaProgramsData
          },
          pembayarans: fileBuktiPuniaPath ? {
            create: {
              buktiPath: fileBuktiPuniaPath,
              status: 'MENUNGGU',
              keterangan: 'Pembayaran awal pendaftaran'
            }
          } : undefined
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
    const { 
      page = 1, 
      limit = 10, 
      programId, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Validasi field yang boleh di-sort untuk keamanan
    const allowedSortFields = ['createdAt', 'namaLengkap', 'nomorPendaftaran', 'statusPembayaran'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const where = {};

    if (status) {
      where.statusPembayaran = status;
    }

    if (programId) {
      where.programSisyas = {
        some: {
          programAjahanId: parseInt(programId)
        }
      };
    }

    if (search) {
      where.OR = [
        { namaLengkap: { contains: search, mode: 'insensitive' } },
        { nomorPendaftaran: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [sisyas, total] = await prisma.$transaction([
      prisma.sisya.findMany({
        where,
        skip,
        take,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
          programSisyas: {
            include: {
              programAjahan: true
            }
          },
          pembayarans: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.sisya.count({ where })
    ]);
    
    res.json({ 
      success: true, 
      data: sisyas,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
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
        },
        pembayarans: {
          orderBy: { createdAt: 'desc' }
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

    const validStatuses = ['MENUNGGU_PEMBAYARAN', 'MENUNGGU_VERIFIKASI', 'BELUM_LUNAS', 'LUNAS', 'DITOLAK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const updatedSisya = await prisma.sisya.update({
      where: { id: parseInt(id) },
      data: { statusPembayaran: status },
      include: {
        programSisyas: {
          include: {
            programAjahan: true
          }
        }
      }
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
        totalTerbayar: true,
        fileIdentitasPath: true,
        fileFotoPath: true,
        fileRekomendasiPath: true,
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

// uploadPunia is now handled by pembayaranController.uploadBuktiBayar

const serveFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Keamanan: Cegah directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Nama file tidak valid' });
    }

    const filePath = path.join(__dirname, '../../uploads', filename);

    // Cek apakah file ada
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
    }

    // Sajikan file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve File Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil file' });
  }
};

const lengkapiBerkas = async (req, res) => {
  try {
    const { nomorPendaftaran } = req.body;
    if (!nomorPendaftaran) {
      return res.status(400).json({ success: false, message: 'Nomor pendaftaran harus diisi' });
    }

    const sisya = await prisma.sisya.findUnique({
      where: { nomorPendaftaran }
    });

    if (!sisya) {
      return res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan' });
    }

    const updateData = {};
    
    if (req.files) {
      if (req.files.fileIdentitas && req.files.fileIdentitas[0]) {
        updateData.fileIdentitasPath = `/uploads/${req.files.fileIdentitas[0].filename}`;
      }
      if (req.files.fileFoto && req.files.fileFoto[0]) {
        updateData.fileFotoPath = `/uploads/${req.files.fileFoto[0].filename}`;
      }
      if (req.files.fileRekomendasi && req.files.fileRekomendasi[0]) {
        updateData.fileRekomendasiPath = `/uploads/${req.files.fileRekomendasi[0].filename}`;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada berkas yang diunggah' });
    }

    await prisma.sisya.update({
      where: { id: sisya.id },
      data: updateData
    });

    res.json({ success: true, message: 'Berkas berhasil diperbarui' });

  } catch (error) {
    console.error('Lengkapi Berkas Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui berkas' });
  }
};

const updateAcademicStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tanggalDiksan } = req.body;

    const validStatuses = ['PENDING', 'AKTIF', 'MEDIKSA', 'TIDAK_AKTIF'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status akademik tidak valid' });
    }

    const updateData = { status };
    if (status === 'MEDIKSA' && tanggalDiksan) {
      updateData.tanggalDiksan = new Date(tanggalDiksan);
    } else if (status !== 'MEDIKSA') {
      updateData.tanggalDiksan = null;
    }

    const updatedSisya = await prisma.sisya.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ success: true, message: 'Status akademik berhasil diperbarui', data: updatedSisya });
  } catch (error) {
    console.error('Update Academic Status Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data Sisya tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  register,
  getAll,
  getById,
  updateStatus,
  findByNomor,
  serveFile,
  lengkapiBerkas,
  updateAcademicStatus
};
