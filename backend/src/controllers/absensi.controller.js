const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();

// ─── MATA KULIAH ────────────────────────────────────────────────────────────

// GET /api/absensi/mata-kuliah
const getMataKuliah = async (req, res) => {
  try {
    const { programId } = req.query;

    const whereClause = {};
    if (programId && programId !== 'all') {
      whereClause.programAjahanId = parseInt(programId);
    }

    const mataKuliahs = await prisma.mataKuliah.findMany({
      where: whereClause,
      include: {
        programAjahan: {
          select: { id: true, nama: true, kode: true }
        },
        _count: {
          select: { sesiAbsensis: true }
        }
      },
      orderBy: [{ programAjahanId: 'asc' }, { semester: 'asc' }, { nama: 'asc' }]
    });

    res.json({ success: true, data: mataKuliahs });
  } catch (error) {
    console.error('Get Mata Kuliah Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data mata kuliah' });
  }
};

// POST /api/absensi/mata-kuliah
const createMataKuliah = async (req, res) => {
  try {
    const { kode, nama, sks, semester, programAjahanId } = req.body;

    if (!kode || !nama || !sks || !semester || !programAjahanId) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi (kode, nama, sks, semester, programAjahanId)' });
    }

    // Cek kode unik
    const existing = await prisma.mataKuliah.findUnique({ where: { kode } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Kode mata kuliah "${kode}" sudah digunakan` });
    }

    const mataKuliah = await prisma.mataKuliah.create({
      data: {
        kode,
        nama,
        sks: parseInt(sks),
        semester: parseInt(semester),
        programAjahanId: parseInt(programAjahanId)
      },
      include: {
        programAjahan: { select: { id: true, nama: true, kode: true } }
      }
    });

    res.status(201).json({ success: true, data: mataKuliah, message: 'Mata kuliah berhasil ditambahkan' });
  } catch (error) {
    console.error('Create Mata Kuliah Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan mata kuliah' });
  }
};

// PATCH /api/absensi/mata-kuliah/:id
const updateMataKuliah = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode, nama, sks, semester, programAjahanId } = req.body;

    const mataKuliah = await prisma.mataKuliah.update({
      where: { id: parseInt(id) },
      data: {
        ...(kode && { kode }),
        ...(nama && { nama }),
        ...(sks && { sks: parseInt(sks) }),
        ...(semester && { semester: parseInt(semester) }),
        ...(programAjahanId && { programAjahanId: parseInt(programAjahanId) })
      },
      include: {
        programAjahan: { select: { id: true, nama: true, kode: true } }
      }
    });

    res.json({ success: true, data: mataKuliah, message: 'Mata kuliah berhasil diperbarui' });
  } catch (error) {
    console.error('Update Mata Kuliah Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui mata kuliah' });
  }
};

// DELETE /api/absensi/mata-kuliah/:id
const deleteMataKuliah = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah ada sesi terkait
    const sesiCount = await prisma.sesiAbsensi.count({
      where: { mataKuliahId: parseInt(id) }
    });

    if (sesiCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak bisa menghapus mata kuliah ini karena sudah memiliki ${sesiCount} sesi absensi`
      });
    }

    await prisma.mataKuliah.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Mata kuliah berhasil dihapus' });
  } catch (error) {
    console.error('Delete Mata Kuliah Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus mata kuliah' });
  }
};

// ─── SESI ABSENSI ───────────────────────────────────────────────────────────

// GET /api/absensi/mata-kuliah/:mkId/sesi
const getSesiList = async (req, res) => {
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

    const sesiList = await prisma.sesiAbsensi.findMany({
      where: { mataKuliahId: parseInt(mkId) },
      include: {
        _count: { select: { absensiSisyas: true } },
        absensiSisyas: {
          select: { status: true }
        }
      },
      orderBy: { pertemuan: 'asc' }
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
        createdAt: sesi.createdAt,
        totalSisya: total,
        totalHadir: hadir
      };
    });

    res.json({ success: true, data: { mataKuliah, sesiList: sesiWithStats } });
  } catch (error) {
    console.error('Get Sesi List Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data sesi' });
  }
};

// POST /api/absensi/sesi
const createSesi = async (req, res) => {
  try {
    const { mataKuliahId, tanggal, pertemuan, topik } = req.body;

    if (!mataKuliahId || !tanggal || !pertemuan) {
      return res.status(400).json({ success: false, message: 'Field wajib: mataKuliahId, tanggal, pertemuan' });
    }

    // Cek duplikat pertemuan
    const existing = await prisma.sesiAbsensi.findFirst({
      where: {
        mataKuliahId: parseInt(mataKuliahId),
        pertemuan: parseInt(pertemuan)
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Pertemuan ke-${pertemuan} sudah ada untuk mata kuliah ini`
      });
    }

    const sesi = await prisma.sesiAbsensi.create({
      data: {
        mataKuliahId: parseInt(mataKuliahId),
        tanggal: new Date(tanggal),
        pertemuan: parseInt(pertemuan),
        topik: topik || null
      },
      include: {
        mataKuliah: {
          select: { nama: true, kode: true }
        }
      }
    });

    res.status(201).json({ success: true, data: sesi, message: 'Sesi absensi berhasil dibuat' });
  } catch (error) {
    console.error('Create Sesi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat sesi absensi' });
  }
};

// GET /api/absensi/sesi/:sesiId
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
        mataKuliah: sesi.mataKuliah,
        daftarSisya
      }
    });
  } catch (error) {
    console.error('Get Sesi Detail Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail sesi' });
  }
};

// POST /api/absensi/sesi/:sesiId/input
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
    console.error('Input Absensi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan absensi' });
  }
};

// ─── REKAP ──────────────────────────────────────────────────────────────────

// GET /api/absensi/sisya/:sisyaId
const getRekapSisya = async (req, res) => {
  try {
    const { sisyaId } = req.params;

    const sisya = await prisma.sisya.findUnique({
      where: { id: parseInt(sisyaId) },
      select: {
        id: true,
        namaLengkap: true,
        namaGriya: true,
        nomorPendaftaran: true,
        programSisyas: {
          include: {
            programAjahan: { select: { id: true, nama: true } }
          }
        }
      }
    });

    if (!sisya) {
      return res.status(404).json({ success: false, message: 'Sisya tidak ditemukan' });
    }

    // Ambil semua program sisya
    const programIds = sisya.programSisyas.map(sp => sp.programAjahanId);

    // Ambil semua MK di program-program sisya
    const mataKuliahs = await prisma.mataKuliah.findMany({
      where: { programAjahanId: { in: programIds } },
      include: {
        programAjahan: { select: { nama: true } },
        sesiAbsensis: {
          include: {
            absensiSisyas: {
              where: { sisyaId: parseInt(sisyaId) }
            }
          }
        }
      },
      orderBy: [{ programAjahanId: 'asc' }, { semester: 'asc' }]
    });

    // Hitung rekap per MK
    const rekap = mataKuliahs.map(mk => {
      const totalSesi = mk.sesiAbsensis.length;
      let hadir = 0, izin = 0, sakit = 0, alpha = 0;

      mk.sesiAbsensis.forEach(sesi => {
        const record = sesi.absensiSisyas[0]; // Hanya 1 record per sisya per sesi
        if (record) {
          switch (record.status) {
            case 'HADIR': hadir++; break;
            case 'IZIN': izin++; break;
            case 'SAKIT': sakit++; break;
            case 'ALPHA': alpha++; break;
          }
        }
      });

      const persentase = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0;

      return {
        mataKuliahId: mk.id,
        kodeMK: mk.kode,
        namaMK: mk.nama,
        programAjahan: mk.programAjahan.nama,
        semester: mk.semester,
        totalSesi,
        hadir,
        izin,
        sakit,
        alpha,
        persentaseKehadiran: persentase
      };
    });

    res.json({
      success: true,
      data: {
        sisya: {
          id: sisya.id,
          namaLengkap: sisya.namaLengkap,
          namaGriya: sisya.namaGriya,
          nomorPendaftaran: sisya.nomorPendaftaran
        },
        rekap
      }
    });
  } catch (error) {
    console.error('Get Rekap Sisya Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil rekap absensi' });
  }
};

// GET /api/absensi/mata-kuliah/:mkId/rekap
const getRekapMataKuliah = async (req, res) => {
  try {
    const { mkId } = req.params;

    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(mkId) },
      include: {
        programAjahan: { select: { id: true, nama: true, kode: true } },
        sesiAbsensis: {
          orderBy: { pertemuan: 'asc' },
          include: {
            absensiSisyas: {
              include: {
                sisya: {
                  select: { id: true, namaLengkap: true, namaGriya: true, nomorPendaftaran: true }
                }
              }
            }
          }
        }
      }
    });

    if (!mataKuliah) {
      return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    }

    // Ambil semua sisya aktif di program
    const allSisya = await prisma.sisya.findMany({
      where: {
        status: { in: ['AKTIF', 'MEDIKSA'] },
        programSisyas: {
          some: { programAjahanId: mataKuliah.programAjahanId }
        }
      },
      select: { id: true, namaLengkap: true, namaGriya: true, nomorPendaftaran: true },
      orderBy: { namaLengkap: 'asc' }
    });

    // Build absensi lookup: sesiId -> sisyaId -> status
    const absensiLookup = {};
    mataKuliah.sesiAbsensis.forEach(sesi => {
      absensiLookup[sesi.id] = {};
      sesi.absensiSisyas.forEach(a => {
        absensiLookup[sesi.id][a.sisya.id] = a.status;
      });
    });

    const totalSesi = mataKuliah.sesiAbsensis.length;

    // Build data per sisya
    const sisyaRows = allSisya.map(sisya => {
      const perSesi = {};
      let hadir = 0, izin = 0, sakit = 0, alpha = 0;

      mataKuliah.sesiAbsensis.forEach(sesi => {
        const status = absensiLookup[sesi.id]?.[sisya.id] || null;
        perSesi[sesi.id] = status;
        if (status === 'HADIR') hadir++;
        else if (status === 'IZIN') izin++;
        else if (status === 'SAKIT') sakit++;
        else if (status === 'ALPHA') alpha++;
      });

      return {
        sisyaId: sisya.id,
        namaLengkap: sisya.namaLengkap,
        namaGriya: sisya.namaGriya,
        nomorPendaftaran: sisya.nomorPendaftaran,
        perSesi,
        hadir,
        izin,
        sakit,
        alpha,
        persentase: totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0
      };
    });

    // Sesi list untuk header kolom
    const sesiHeaders = mataKuliah.sesiAbsensis.map(sesi => ({
      id: sesi.id,
      pertemuan: sesi.pertemuan,
      tanggal: sesi.tanggal,
      topik: sesi.topik
    }));

    res.json({
      success: true,
      data: {
        mataKuliah: {
          id: mataKuliah.id,
          kode: mataKuliah.kode,
          nama: mataKuliah.nama,
          sks: mataKuliah.sks,
          semester: mataKuliah.semester,
          programAjahan: mataKuliah.programAjahan
        },
        sesiHeaders,
        sisyaRows,
        totalSesi
      }
    });
  } catch (error) {
    console.error('Get Rekap MK Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil rekap absensi' });
  }
};

// GET /api/absensi/mata-kuliah/:mkId/export
const exportAbsensi = async (req, res) => {
  try {
    const { mkId } = req.params;

    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(mkId) },
      include: {
        programAjahan: { select: { nama: true, kode: true } },
        sesiAbsensis: {
          orderBy: { pertemuan: 'asc' },
          include: {
            absensiSisyas: {
              include: {
                sisya: {
                  select: { id: true, namaLengkap: true, namaGriya: true, nomorPendaftaran: true }
                }
              }
            }
          }
        }
      }
    });

    if (!mataKuliah) {
      return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    }

    // Ambil semua sisya aktif di program
    const allSisya = await prisma.sisya.findMany({
      where: {
        status: { in: ['AKTIF', 'MEDIKSA'] },
        programSisyas: {
          some: { programAjahanId: mataKuliah.programAjahanId }
        }
      },
      select: { id: true, namaLengkap: true, namaGriya: true, nomorPendaftaran: true },
      orderBy: { namaLengkap: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const safeName = `${mataKuliah.kode} - ${mataKuliah.nama}`.replace(/[:\\/?*[\]]/g, '').substring(0, 31);
    const worksheet = workbook.addWorksheet(safeName);

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    };

    // Kolom dinamis: No, Nama, Griya, [Sesi 1, Sesi 2, ...], Total Hadir, Persentase
    const columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Sisya', key: 'nama', width: 25 },
      { header: 'Griya', key: 'griya', width: 18 },
    ];

    // Tambahkan kolom per sesi
    mataKuliah.sesiAbsensis.forEach(sesi => {
      const tgl = new Date(sesi.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      columns.push({
        header: `P${sesi.pertemuan}\n${tgl}`,
        key: `sesi_${sesi.id}`,
        width: 10
      });
    });

    columns.push(
      { header: 'Hadir', key: 'totalHadir', width: 7 },
      { header: '%', key: 'persentase', width: 7 }
    );

    worksheet.columns = columns;
    worksheet.getRow(1).eachCell(cell => { cell.style = headerStyle; });

    // Build absensi lookup: sesiId -> sisyaId -> status
    const absensiLookup = {};
    mataKuliah.sesiAbsensis.forEach(sesi => {
      absensiLookup[sesi.id] = {};
      sesi.absensiSisyas.forEach(a => {
        absensiLookup[sesi.id][a.sisya.id] = a.status;
      });
    });

    const totalSesi = mataKuliah.sesiAbsensis.length;

    // Isi data per sisya
    allSisya.forEach((sisya, index) => {
      const rowData = {
        no: index + 1,
        nama: sisya.namaLengkap,
        griya: sisya.namaGriya,
      };

      let hadirCount = 0;

      mataKuliah.sesiAbsensis.forEach(sesi => {
        const status = absensiLookup[sesi.id]?.[sisya.id] || '-';
        rowData[`sesi_${sesi.id}`] = status === 'HADIR' ? 'H' : status === 'IZIN' ? 'I' : status === 'SAKIT' ? 'S' : status === 'ALPHA' ? 'A' : '-';
        if (status === 'HADIR') hadirCount++;
      });

      rowData.totalHadir = hadirCount;
      rowData.persentase = totalSesi > 0 ? Math.round((hadirCount / totalSesi) * 100) + '%' : '0%';

      const row = worksheet.addRow(rowData);
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Warna berdasarkan status
        const val = cell.value;
        if (val === 'H') cell.font = { color: { argb: 'FF16A34A' }, bold: true };
        else if (val === 'I') cell.font = { color: { argb: 'FF2563EB' } };
        else if (val === 'S') cell.font = { color: { argb: 'FFCA8A04' } };
        else if (val === 'A') cell.font = { color: { argb: 'FFDC2626' }, bold: true };
      });

      // Nama rata kiri
      row.getCell('nama').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('griya').alignment = { vertical: 'middle', horizontal: 'left' };

      if (index % 2 !== 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Absensi-${mataKuliah.kode}-${new Date().getTime()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Absensi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data absensi' });
  }
};

module.exports = {
  getMataKuliah,
  createMataKuliah,
  updateMataKuliah,
  deleteMataKuliah,
  getSesiList,
  createSesi,
  getSesiDetail,
  inputAbsensi,
  getRekapSisya,
  getRekapMataKuliah,
  exportAbsensi
};
