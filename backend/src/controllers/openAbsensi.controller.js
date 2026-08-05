const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const ABSENSI_TIME_ZONE = 'Asia/Makassar';

const getCurrentAbsensiDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ABSENSI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

const getEndOfCurrentAbsensiDate = () =>
  new Date(`${getCurrentAbsensiDateKey()}T23:59:59.999Z`);

const isFutureAbsensiDate = tanggal =>
  tanggal.toISOString().slice(0, 10) > getCurrentAbsensiDateKey();

const isFutureAbsensiEnabled = async () => {
  const config = await prisma.konfigurasiAplikasi.findUnique({
    where: { kunci: 'absensi_allow_future_date' },
    select: { nilai: true }
  });

  return config?.nilai === 'true';
};

// ─── GET /api/open/absensi/program-ajahan ────────────────────────────────────
// Daftar program ajahan aktif (tanpa PIN)
const getPrograms = async (req, res) => {
  try {
    const programs = await prisma.programAjahan.findMany({
      where: { isAktif: true },
      select: {
        id: true,
        kode: true,
        nama: true,
        deskripsi: true
      },
      orderBy: { urutan: 'asc' }
    });

    res.json({ success: true, data: programs });
  } catch (error) {
    console.error('Open Absensi - Get Programs Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar program' });
  }
};

// ─── POST /api/open/absensi/verify-pin ───────────────────────────────────────
// Verifikasi PIN koordinator
const verifyPin = async (req, res) => {
  try {
    const { programId, pin } = req.body;

    if (!programId || !pin) {
      return res.status(400).json({ success: false, message: 'Program ID dan PIN wajib diisi' });
    }

    const program = await prisma.programAjahan.findUnique({
      where: { id: parseInt(programId) },
      select: {
        id: true,
        nama: true,
        pinKoordinator: true,
        isAktif: true
      }
    });

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program tidak ditemukan' });
    }

    if (!program.isAktif) {
      return res.status(400).json({ success: false, message: 'Program tidak aktif' });
    }

    if (!program.pinKoordinator) {
      return res.status(400).json({ success: false, message: 'PIN koordinator belum diatur untuk program ini. Hubungi admin.' });
    }

    if (program.pinKoordinator !== pin) {
      return res.status(401).json({ success: false, message: 'PIN tidak valid' });
    }

    res.json({
      success: true,
      message: 'PIN valid',
      data: {
        programId: program.id,
        programNama: program.nama
      }
    });
  } catch (error) {
    console.error('Open Absensi - Verify PIN Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi PIN' });
  }
};

// ─── GET /api/open/absensi/program-ajahan/:programId/mata-kuliah ─────────────
// Daftar mata kuliah per program (setelah PIN verified)
const getMataKuliahByProgram = async (req, res) => {
  try {
    const { programId } = req.params;

    const mataKuliahs = await prisma.mataKuliah.findMany({
      where: { programAjahanId: parseInt(programId) },
      include: {
        programAjahan: {
          select: { id: true, nama: true, kode: true }
        },
        _count: {
          select: { sesiAbsensis: true }
        }
      },
      orderBy: [{ semester: 'asc' }, { nama: 'asc' }]
    });

    res.json({ success: true, data: mataKuliahs });
  } catch (error) {
    console.error('Open Absensi - Get MK Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data mata kuliah' });
  }
};

// ─── GET /api/open/absensi/mata-kuliah/:mkId/sesi ────────────────────────────
// Daftar sesi per MK dengan tanggal
const getSesiByMataKuliah = async (req, res) => {
  try {
    const { mkId } = req.params;

    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(mkId) },
      include: {
        programAjahan: { select: { id: true, nama: true, kode: true } }
      }
    });

    if (!mataKuliah) {
      return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    }

    const allowFutureDate = await isFutureAbsensiEnabled();
    const sesiList = await prisma.sesiAbsensi.findMany({
      where: {
        mataKuliahId: parseInt(mkId),
        ...(allowFutureDate ? {} : { tanggal: { lte: getEndOfCurrentAbsensiDate() } })
      },
      include: {
        _count: { select: { absensiSisyas: true } },
        absensiSisyas: {
          select: { status: true }
        }
      },
      orderBy: { pertemuan: 'desc' }
    });

    // Hitung statistik per sesi
    const sesiWithStats = sesiList.map(sesi => {
      const total = sesi.absensiSisyas.length;
      const hadir = sesi.absensiSisyas.filter(a => a.status === 'HADIR').length;
      return {
        id: sesi.id,
        tanggal: sesi.tanggal,
        pertemuan: sesi.pertemuan,
        topik: sesi.topik,
        narawakya: sesi.narawakya,
        createdAt: sesi.createdAt,
        totalSisya: total,
        totalHadir: hadir
      };
    });

    res.json({ success: true, data: { mataKuliah, sesiList: sesiWithStats } });
  } catch (error) {
    console.error('Open Absensi - Get Sesi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data sesi' });
  }
};

// ─── GET /api/open/absensi/sesi/:sesiId ──────────────────────────────────────
// Detail sesi + daftar sisya (reuse logic dari absensi.controller)
const getSesiDetail = async (req, res) => {
  try {
    const { sesiId } = req.params;

    const sesi = await prisma.sesiAbsensi.findUnique({
      where: { id: parseInt(sesiId) },
      include: {
        mataKuliah: {
          include: {
            programAjahan: { select: { id: true, nama: true, kode: true } }
          }
        },
        absensiSisyas: {
          include: {
            sisya: {
              select: { id: true, namaLengkap: true, namaGriya: true, nomorPendaftaran: true }
            }
          }
        }
      }
    });

    if (!sesi) {
      return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan' });
    }

    if (isFutureAbsensiDate(sesi.tanggal) && !(await isFutureAbsensiEnabled())) {
      return res.status(403).json({
        success: false,
        message: 'Sesi yang akan datang belum dapat diakses'
      });
    }

    // Ambil semua sisya aktif di program ajahan terkait
    const programId = sesi.mataKuliah.programAjahanId;
    const allSisyaInProgram = await prisma.sisya.findMany({
      where: {
        status: { in: ['AKTIF', 'MEDIKSA'] },
        programSisyas: {
          some: { programAjahanId: programId }
        }
      },
      select: {
        id: true,
        namaLengkap: true,
        namaGriya: true,
        nomorPendaftaran: true
      },
      orderBy: { namaLengkap: 'asc' }
    });

    // Gabungkan data absensi dengan daftar sisya
    const absensiMap = {};
    sesi.absensiSisyas.forEach(a => {
      absensiMap[a.sisyaId] = { status: a.status, keterangan: a.keterangan };
    });

    const daftarSisya = allSisyaInProgram.map(sisya => ({
      sisyaId: sisya.id,
      namaLengkap: sisya.namaLengkap,
      namaGriya: sisya.namaGriya,
      nomorPendaftaran: sisya.nomorPendaftaran,
      status: absensiMap[sisya.id]?.status || null,
      keterangan: absensiMap[sisya.id]?.keterangan || null
    }));

    res.json({
      success: true,
      data: {
        id: sesi.id,
        tanggal: sesi.tanggal,
        pertemuan: sesi.pertemuan,
        topik: sesi.topik,
        narawakya: sesi.narawakya,
        dokSisyaPath: sesi.dokSisyaPath,
        dokNarawakPath: sesi.dokNarawakPath,
        dokPanitiaPath: sesi.dokPanitiaPath,
        mataKuliah: sesi.mataKuliah,
        daftarSisya
      }
    });
  } catch (error) {
    console.error('Open Absensi - Get Sesi Detail Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail sesi' });
  }
};

// ─── POST /api/open/absensi/sesi/:sesiId/input ──────────────────────────────
// Simpan absensi (reuse logic dari absensi.controller)
const inputAbsensi = async (req, res) => {
  try {
    const { sesiId } = req.params;
    const { absensi } = req.body; // Array of { sisyaId, status, keterangan? }

    if (!absensi || !Array.isArray(absensi) || absensi.length === 0) {
      return res.status(400).json({ success: false, message: 'Data absensi wajib berupa array' });
    }

    const validStatuses = ['HADIR', 'IZIN', 'SAKIT', 'ALPHA'];

    // Validasi status
    for (const item of absensi) {
      if (!item.sisyaId || !item.status) {
        return res.status(400).json({ success: false, message: 'Setiap item harus memiliki sisyaId dan status' });
      }
      if (!validStatuses.includes(item.status)) {
        return res.status(400).json({ success: false, message: `Status "${item.status}" tidak valid` });
      }
    }

    const sesi = await prisma.sesiAbsensi.findUnique({
      where: { id: parseInt(sesiId) },
      select: { tanggal: true }
    });

    if (!sesi) {
      return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan' });
    }

    if (isFutureAbsensiDate(sesi.tanggal) && !(await isFutureAbsensiEnabled())) {
      return res.status(403).json({
        success: false,
        message: 'Absensi untuk sesi yang akan datang belum dapat diinput'
      });
    }

    // Upsert batch menggunakan transaksi
    const results = await prisma.$transaction(
      absensi.map(item =>
        prisma.absensiSisya.upsert({
          where: {
            sesiAbsensiId_sisyaId: {
              sesiAbsensiId: parseInt(sesiId),
              sisyaId: parseInt(item.sisyaId)
            }
          },
          update: {
            status: item.status,
            keterangan: item.keterangan || null
          },
          create: {
            sesiAbsensiId: parseInt(sesiId),
            sisyaId: parseInt(item.sisyaId),
            status: item.status,
            keterangan: item.keterangan || null
          }
        })
      )
    );

    res.json({ success: true, data: results, message: `Absensi ${results.length} sisya berhasil disimpan` });
  } catch (error) {
    console.error('Open Absensi - Input Absensi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan absensi' });
  }
};

// ─── POST /api/open/absensi/sesi/:sesiId/upload-dokumentasi ──────────────────
// Upload dokumentasi KBM (tanpa auth, untuk koordinator)
const uploadDokumentasi = async (req, res) => {
  try {
    const { sesiId } = req.params;

    const sesi = await prisma.sesiAbsensi.findUnique({
      where: { id: parseInt(sesiId) }
    });

    if (!sesi) {
      return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan' });
    }

    const updateData = {};
    const filesToDelete = [];

    // Mapping field name to database column
    const fieldMap = {
      dokSisya: 'dokSisyaPath',
      dokNarawak: 'dokNarawakPath',
      dokPanitia: 'dokPanitiaPath'
    };

    if (req.files) {
      for (const [fieldName, dbField] of Object.entries(fieldMap)) {
        if (req.files[fieldName] && req.files[fieldName][0]) {
          // If there's an existing file, mark it for deletion
          if (sesi[dbField]) {
            const oldFilename = sesi[dbField].split('/').pop();
            const oldFilePath = path.join(__dirname, '../../uploads', oldFilename);
            filesToDelete.push(oldFilePath);
          }
          updateData[dbField] = `/uploads/${req.files[fieldName][0].filename}`;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }

    // Delete old files from disk
    for (const filePath of filesToDelete) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error('Failed to delete old file:', e);
      }
    }

    const updated = await prisma.sesiAbsensi.update({
      where: { id: parseInt(sesiId) },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        dokSisyaPath: updated.dokSisyaPath,
        dokNarawakPath: updated.dokNarawakPath,
        dokPanitiaPath: updated.dokPanitiaPath
      },
      message: 'Dokumentasi berhasil diunggah'
    });
  } catch (error) {
    console.error('Open Absensi - Upload Dokumentasi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengunggah dokumentasi' });
  }
};

// ─── GET /api/open/absensi/files/:filename ──────────────────────────────────
// Serve uploaded documentation files for preview
const serveFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads', filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File tidak ditemukan' });
  }
};

module.exports = {
  getPrograms,
  verifyPin,
  getMataKuliahByProgram,
  getSesiByMataKuliah,
  getSesiDetail,
  inputAbsensi,
  uploadDokumentasi,
  serveFile
};
