const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Utility function to generate Roman Month
const getRomanMonth = (monthIndex) => {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return roman[monthIndex];
};

// PROGRAM_PREFIXES dipindahkan ke konfigurasi database ProgramAjahan.kodeSertifikat

// Utility function to normalize name (Title Case with exceptions)
const { normalizeName } = require('../../../shared/utils/normalizeName');


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
        const prefix = dbProgram.kodeSertifikat || 'GENERIC/PDPN';
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
          namaLengkap: normalizeName(data.namaLengkap),
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
    
    // Telegram Notification (Non-blocking)
    try {
      const telegramService = require('../services/telegram.service');
      const sisyaForNotif = await prisma.sisya.findUnique({
        where: { id: newSisya.id },
        include: { programSisyas: { include: { programAjahan: true } } }
      });
      const pesan = telegramService.formatNotifikasiRegistrasi(sisyaForNotif);
      telegramService.sendMessage(process.env.TELEGRAM_CHANNEL_ID, pesan).catch(err => console.error('Telegram Notif Error:', err));
    } catch (e) {
      console.error('Gagal menyiapkan notifikasi Telegram:', e);
    }

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
      showInactive,
      griya,
      desa,
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
    if (showInactive !== 'true') {
      where.status = { not: 'TIDAK_AKTIF' };
    }

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
        { nomorPendaftaran: { contains: search, mode: 'insensitive' } },
        { namaGriya: { contains: search, mode: 'insensitive' } },
        { namaDesa: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (griya) {
      where.namaGriya = { contains: griya, mode: 'insensitive' };
    }
    
    if (desa) {
      where.namaDesa = { contains: desa, mode: 'insensitive' };
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
        },
        partner: true,
        partnerOf: true
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

const updateSisya = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedSisya = await prisma.sisya.update({
      where: { id: parseInt(id) },
      data: {
        namaLengkap: normalizeName(updateData.namaLengkap),
        tempatLahir: updateData.tempatLahir,
        tanggalLahir: updateData.tanggalLahir ? new Date(updateData.tanggalLahir) : undefined,
        jenisKelamin: updateData.jenisKelamin,
        alamat: updateData.alamat,
        noHp: updateData.noHp,
        email: updateData.email,
        namaGriya: updateData.namaGriya,
        namaDesa: updateData.namaDesa,
      }
    });

    res.json({ success: true, message: 'Data Sisya berhasil diperbarui', data: updatedSisya });
  } catch (error) {
    console.error('Update Sisya Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data Sisya tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengupdate data' });
  }
};

const updateProgramRegistrasi = async (req, res) => {
  try {
    const { spId } = req.params;
    const { nomorRegistrasi } = req.body;

    const updated = await prisma.sisyaProgram.update({
      where: { id: parseInt(spId) },
      data: { nomorRegistrasi }
    });

    res.json({ success: true, message: 'Nomor registrasi berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Update Program Registrasi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui nomor registrasi' });
  }
};

const updateProgramsSisya = async (req, res) => {
  try {
    const { id } = req.params;
    const { programs } = req.body;
    // programs = [{ programAjahanId: number, isPasangan: boolean }, ...]

    if (!programs || !Array.isArray(programs) || programs.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal harus memilih 1 program ajahan' });
    }

    const sisyaId = parseInt(id);

    // Verify sisya exists
    const existingSisya = await prisma.sisya.findUnique({
      where: { id: sisyaId },
      include: {
        programSisyas: { include: { programAjahan: true } },
        pembayarans: true
      }
    });

    if (!existingSisya) {
      return res.status(404).json({ success: false, message: 'Data Sisya tidak ditemukan' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const romanMonth = getRomanMonth(now.getMonth());

    // Fetch all requested program details from DB
    const requestedProgramIds = programs.map(p => parseInt(p.programAjahanId));
    const dbPrograms = await prisma.programAjahan.findMany({
      where: { id: { in: requestedProgramIds } }
    });

    if (dbPrograms.length !== requestedProgramIds.length) {
      return res.status(400).json({ success: false, message: 'Beberapa program ajahan tidak ditemukan' });
    }

    // Build a map for quick lookup
    const dbProgramMap = {};
    for (const p of dbPrograms) {
      dbProgramMap[p.id] = p;
    }

    // Determine which existing SisyaPrograms to keep, delete, or add
    const existingProgramIds = existingSisya.programSisyas.map(sp => sp.programAjahanId);
    const toDelete = existingSisya.programSisyas.filter(sp => !requestedProgramIds.includes(sp.programAjahanId));
    const toKeepIds = existingProgramIds.filter(pid => requestedProgramIds.includes(pid));
    const toAddProgramIds = requestedProgramIds.filter(pid => !existingProgramIds.includes(pid));

    // Execute in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete removed programs
      if (toDelete.length > 0) {
        await tx.sisyaProgram.deleteMany({
          where: {
            id: { in: toDelete.map(sp => sp.id) }
          }
        });
      }

      // 2. Update isPasangan for existing programs that are kept
      for (const prog of programs) {
        const progId = parseInt(prog.programAjahanId);
        if (toKeepIds.includes(progId)) {
          const existingSp = existingSisya.programSisyas.find(sp => sp.programAjahanId === progId);
          if (existingSp) {
            const dbProg = dbProgramMap[progId];
            const newIsPasangan = prog.isPasangan && dbProg.isPasanganTersedia;
            const newPunia = (newIsPasangan && dbProg.puniaPasangan) ? dbProg.puniaPasangan : dbProg.puniaNormal;

            if (existingSp.isPasangan !== newIsPasangan || existingSp.puniaProgram !== newPunia) {
              await tx.sisyaProgram.update({
                where: { id: existingSp.id },
                data: {
                  isPasangan: newIsPasangan,
                  puniaProgram: newPunia
                }
              });
            }
          }
        }
      }

      // 3. Add new programs
      for (const progId of toAddProgramIds) {
        const progInput = programs.find(p => parseInt(p.programAjahanId) === progId);
        const dbProg = dbProgramMap[progId];
        const isPasangan = progInput.isPasangan && dbProg.isPasanganTersedia;
        const punia = (isPasangan && dbProg.puniaPasangan) ? dbProg.puniaPasangan : dbProg.puniaNormal;

        // Generate nomor registrasi
        const programSequenceCount = await tx.sisyaProgram.count({
          where: {
            programAjahanId: progId,
            createdAt: {
              gte: new Date(year, 0, 1),
              lt: new Date(year + 1, 0, 1)
            }
          }
        });
        const sequence = String(programSequenceCount + 1).padStart(3, '0');
        const prefix = dbProg.kodeSertifikat || 'GENERIC/PDPN';
        const nomorRegistrasi = `${sequence}/${prefix}/${romanMonth}/${year}`;

        await tx.sisyaProgram.create({
          data: {
            sisyaId,
            programAjahanId: progId,
            isPasangan,
            puniaProgram: punia,
            nomorRegistrasi
          }
        });
      }

      // 4. Recalculate totalPunia from all remaining programs
      const updatedPrograms = await tx.sisyaProgram.findMany({
        where: { sisyaId }
      });
      const newTotalPunia = updatedPrograms.reduce((sum, sp) => sum + sp.puniaProgram, 0);

      // 5. Calculate totalTerbayar from verified payments
      const verifiedPayments = await tx.pembayaran.findMany({
        where: { sisyaId, status: 'VERIFIKASI' }
      });
      const totalTerbayar = verifiedPayments.reduce((sum, p) => sum + p.nominal, 0);

      // 6. Determine new statusPembayaran
      let newStatus;
      if (totalTerbayar >= newTotalPunia) {
        newStatus = 'LUNAS';
      } else if (totalTerbayar > 0) {
        newStatus = 'BELUM_LUNAS';
      } else {
        // Keep existing status if no payments
        const hasPendingPayments = await tx.pembayaran.count({
          where: { sisyaId, status: 'MENUNGGU' }
        });
        newStatus = hasPendingPayments > 0 ? 'MENUNGGU_VERIFIKASI' : 'MENUNGGU_PEMBAYARAN';
      }

      // 7. Update sisya record
      const updatedSisya = await tx.sisya.update({
        where: { id: sisyaId },
        data: {
          totalPunia: newTotalPunia,
          totalTerbayar,
          statusPembayaran: newStatus
        },
        include: {
          programSisyas: {
            include: { programAjahan: true }
          },
          pembayarans: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return updatedSisya;
    });

    res.json({
      success: true,
      message: 'Program ajahan sisya berhasil diperbarui',
      data: result
    });

  } catch (error) {
    console.error('Update Programs Sisya Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengupdate program ajahan' });
  }
};

const softDelete = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedSisya = await prisma.sisya.update({
      where: { id: parseInt(id) },
      data: { status: 'TIDAK_AKTIF' }
    });

    res.json({ success: true, message: 'Data Sisya berhasil dinonaktifkan', data: updatedSisya });
  } catch (error) {
    console.error('Soft Delete Sisya Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Data Sisya tidak ditemukan' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menonaktifkan data' });
  }
};

const getLocations = async (req, res) => {
  try {
    const griyaList = await prisma.sisya.findMany({
      distinct: ['namaGriya'],
      select: { namaGriya: true },
      where: { namaGriya: { not: '' } }
    });
    const desaList = await prisma.sisya.findMany({
      distinct: ['namaDesa'],
      select: { namaDesa: true },
      where: { namaDesa: { not: '' } }
    });

    res.json({
      success: true,
      data: {
        griya: griyaList.map(g => g.namaGriya).filter(Boolean),
        desa: desaList.map(d => d.namaDesa).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Get Locations Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

const linkPartner = async (req, res) => {
  try {
    const { id } = req.params; // ID Sisya A (yg di-link)
    const { partnerId } = req.body; // ID Sisya B (pasangannya)

    if (parseInt(id) === parseInt(partnerId)) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menautkan dengan diri sendiri' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const sisyaA = await tx.sisya.findUnique({
        where: { id: parseInt(id) },
        include: { programSisyas: { include: { programAjahan: true } } }
      });
      const sisyaB = await tx.sisya.findUnique({
        where: { id: parseInt(partnerId) },
        include: { programSisyas: { include: { programAjahan: true } } }
      });

      if (!sisyaA || !sisyaB) {
        throw new Error('Data Sisya tidak ditemukan');
      }

      if (sisyaA.partnerId || sisyaB.partnerId || sisyaA.partnerOf || sisyaB.partnerOf) {
        // Technically Prisma doesn't return `partnerOf` automatically unless included, 
        // but we can check if they are already linked by checking if their partnerId is set,
        // or by explicitly querying. Let's do a safe check.
      }
      
      const checkLinkA = await tx.sisya.findUnique({ where: { id: sisyaA.id }, include: { partner: true, partnerOf: true }});
      const checkLinkB = await tx.sisya.findUnique({ where: { id: sisyaB.id }, include: { partner: true, partnerOf: true }});

      if (checkLinkA.partnerId || checkLinkA.partnerOf || checkLinkB.partnerId || checkLinkB.partnerOf) {
        throw new Error('Salah satu atau kedua Sisya sudah memiliki pasangan yang tertaut');
      }

      const kawikonA = sisyaA.programSisyas.find(p => p.programAjahan.kode === 'KAWIKON');
      const kawikonB = sisyaB.programSisyas.find(p => p.programAjahan.kode === 'KAWIKON');

      if (!kawikonA || !kawikonB) {
        throw new Error('Kedua Sisya harus terdaftar di program KAWIKON');
      }

      // Hubungkan mereka
      const updatedSisyaA = await tx.sisya.update({
        where: { id: sisyaA.id },
        data: { partnerId: sisyaB.id }
      });

      // Hitung ulang total terbayar gabungan
      const allVerified = await tx.pembayaran.findMany({
        where: {
          sisyaId: { in: [sisyaA.id, sisyaB.id] },
          status: 'VERIFIKASI'
        }
      });
      const totalTerbayar = allVerified.reduce((acc, curr) => acc + curr.nominal, 0);

      // Keduanya sekarang berbagi tagihan 1.500.000 untuk Kawikon (Pasangan)
      const combinedPunia = 1500000;
      
      let newStatus = 'MENUNGGU_PEMBAYARAN';
      
      const pendingCount = await tx.pembayaran.count({
        where: {
          sisyaId: { in: [sisyaA.id, sisyaB.id] },
          status: 'MENUNGGU'
        }
      });

      if (totalTerbayar >= combinedPunia) {
        newStatus = 'LUNAS';
      } else if (totalTerbayar > 0) {
        newStatus = pendingCount > 0 ? 'MENUNGGU_VERIFIKASI' : 'BELUM_LUNAS';
      } else if (pendingCount > 0) {
        newStatus = 'MENUNGGU_VERIFIKASI';
      }

      // Update both A and B
      await tx.sisya.update({
        where: { id: sisyaA.id },
        data: {
          totalPunia: combinedPunia,
          totalTerbayar,
          statusPembayaran: newStatus
        }
      });

      await tx.sisya.update({
        where: { id: sisyaB.id },
        data: {
          totalPunia: combinedPunia, // Asumsi Sisya B juga di-set ke punia gabungan agar seimbang
          totalTerbayar,
          statusPembayaran: newStatus
        }
      });

      // Pastikan isPasangan diset ke true untuk program Kawikon mereka
      if (!kawikonA.isPasangan) {
        await tx.sisyaProgram.update({
          where: { id: kawikonA.id },
          data: { isPasangan: true, puniaProgram: 1500000 }
        });
      }
      if (!kawikonB.isPasangan) {
        await tx.sisyaProgram.update({
          where: { id: kawikonB.id },
          data: { isPasangan: true, puniaProgram: 1500000 }
        });
      }

      return updatedSisyaA;
    });

    res.json({ success: true, message: 'Berhasil menautkan pasangan', data: result });
  } catch (error) {
    console.error('Link Partner Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal menautkan pasangan' });
  }
};

module.exports = {
  register,
  getAll,
  getById,
  findByNomor,
  serveFile,
  lengkapiBerkas,
  updateStatus,
  updateAcademicStatus,
  updateSisya,
  updateProgramRegistrasi,
  updateProgramsSisya,
  softDelete,
  getLocations,
  linkPartner
};
