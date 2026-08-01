const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');

const getLaporanSisya = async (req, res) => {
  try {
    const { status, startDate, endDate, programId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const whereClause = { status: { not: 'TIDAK_AKTIF' } };

    if (status && status !== 'SEMUA') {
      whereClause.statusPembayaran = status;
    }

    if (programId && programId !== 'SEMUA') {
      whereClause.programSisyas = {
        some: {
          programAjahanId: parseInt(programId)
        }
      };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const allowedSortFields = ['createdAt', 'namaLengkap', 'nomorPendaftaran', 'totalPunia'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [sisyas, total] = await prisma.$transaction([
      prisma.sisya.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
          programSisyas: {
            include: {
              programAjahan: true
            }
          }
        }
      }),
      prisma.sisya.count({ where: whereClause })
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
    console.error('Get Laporan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data laporan' });
  }
};

const getLaporanPuniaRange = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortBy = 'tanggalBayar',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      status: 'VERIFIKASI',
      sisya: { status: { not: 'TIDAK_AKTIF' } }
    };

    if (startDate || endDate) {
      where.tanggalBayar = {};
      if (startDate) where.tanggalBayar.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggalBayar.lte = end;
      }
    }

    const allowedSortFields = ['tanggalBayar', 'nominal', 'createdAt'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'tanggalBayar';
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [payments, total] = await prisma.$transaction([
      prisma.pembayaran.findMany({
        where,
        skip,
        take,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
          sisya: {
            select: {
              id: true,
              namaLengkap: true,
              nomorPendaftaran: true,
              namaGriya: true,
              programSisyas: {
                include: {
                  programAjahan: {
                    select: {
                      nama: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.pembayaran.count({ where })
    ]);

    // Summary total nominal for the filter
    const summary = await prisma.pembayaran.aggregate({
      where,
      _sum: {
        nominal: true
      }
    });

    res.json({
      success: true,
      data: payments,
      summary: {
        totalNominal: summary._sum.nominal || 0
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get Punia Range Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data laporan punia' });
  }
};

const getLaporanPuniaBulanan = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get monthly sums using raw query (PostgreSQL specific)
    const result = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM p."tanggalBayar")::text as year,
        EXTRACT(MONTH FROM p."tanggalBayar")::text as month,
        SUM(p.nominal)::bigint as total,
        COUNT(p.id)::int as count
      FROM "Pembayaran" p
      INNER JOIN "Sisya" s ON p."sisyaId" = s.id
      WHERE p.status = 'VERIFIKASI' AND s.status != 'TIDAK_AKTIF'
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT ${take} OFFSET ${skip}
    `;

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM (
        SELECT 1 FROM "Pembayaran" p
        INNER JOIN "Sisya" s ON p."sisyaId" = s.id
        WHERE p.status = 'VERIFIKASI' AND s.status != 'TIDAK_AKTIF'
        GROUP BY EXTRACT(YEAR FROM p."tanggalBayar"), EXTRACT(MONTH FROM p."tanggalBayar")
      ) as sub
    `;

    const totalMonths = Number(countResult[0].total);

    res.json({
      success: true,
      data: result.map(r => ({
        year: parseInt(r.year),
        month: parseInt(r.month),
        total: Number(r.total),
        count: r.count
      })),
      pagination: {
        total: totalMonths,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalMonths / take)
      }
    });
  } catch (error) {
    console.error('Get Punia Bulanan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil rekapitulasi bulanan' });
  }
};

const getLaporanPuniaDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      status: 'VERIFIKASI',
      sisya: { status: { not: 'TIDAK_AKTIF' } }
    };
    if (startDate || endDate) {
      where.tanggalBayar = {};
      if (startDate) where.tanggalBayar.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggalBayar.lte = end;
      }
    }

    // 1. Summary Stats
    const summary = await prisma.pembayaran.aggregate({
      where,
      _sum: { nominal: true },
      _count: { id: true },
      _avg: { nominal: true }
    });

    // 2. Monthly Trend (Last 6 Months)
    const trendResult = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM p."tanggalBayar")::text as year,
        EXTRACT(MONTH FROM p."tanggalBayar")::text as month,
        SUM(p.nominal)::bigint as total
      FROM "Pembayaran" p
      INNER JOIN "Sisya" s ON p."sisyaId" = s.id
      WHERE p.status = 'VERIFIKASI' AND s.status != 'TIDAK_AKTIF'
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 6
    `;

    res.json({
      success: true,
      summary: {
        totalNominal: Number(summary._sum.nominal || 0),
        totalTransactions: summary._count.id || 0,
        averageNominal: Math.round(Number(summary._avg.nominal || 0))
      },
      trend: trendResult.map(r => ({
        month: parseInt(r.month),
        year: parseInt(r.year),
        total: Number(r.total)
      })).reverse()
    });
  } catch (error) {
    console.error('Get Punia Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data statistik dashboard' });
  }
};


const exportSisya = async (req, res) => {
  try {
    const { status, startDate, endDate, programId } = req.query;

    const whereClause = { status: { not: 'TIDAK_AKTIF' } };
    if (status && status !== 'SEMUA') whereClause.statusPembayaran = status;
    if (programId && programId !== 'SEMUA') {
      whereClause.programSisyas = { some: { programAjahanId: parseInt(programId) } };
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const sisyas = await prisma.sisya.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        programSisyas: {
          include: { programAjahan: true }
        }
      }
    });

    const programsData = await prisma.programAjahan.findMany({
      where: { isAktif: true },
      orderBy: { urutan: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();

    // Helper function to setup and fill a worksheet
    const fillWorksheet = (sheetName, data, targetProgramId = null) => {
      // Clean sheet name (Excel limits: max 31 chars, no special chars)
      const safeName = sheetName.replace(/[:\\/?*[\]]/g, '').substring(0, 31);
      const worksheet = workbook.addWorksheet(safeName);

      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC05621' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Tgl Daftar', key: 'tgl', width: 12 },
        { header: 'No. Pendaftaran', key: 'noDaftar', width: 18 },
        { header: 'No. Registrasi', key: 'noReg', width: 25 },
        { header: 'Nama Lengkap', key: 'nama', width: 25 },
        { header: 'L/P', key: 'jk', width: 5 },
        { header: 'No. HP', key: 'hp', width: 15 },
        { header: 'Griya', key: 'griya', width: 20 },
        { header: 'Desa', key: 'desa', width: 15 },
        { header: 'Program', key: 'program', width: 25 },
        { header: 'Total Punia', key: 'punia', width: 12 },
        { header: 'Terbayar', key: 'terbayar', width: 12 },
        { header: 'Sisa Punia', key: 'sisa', width: 12 },
        { header: 'Status Pembayaran', key: 'statusBayar', width: 15 },
        { header: 'Status Akademik', key: 'statusAkademik', width: 15 },
        { header: 'Tgl Pediksaan', key: 'tglDiksan', width: 15 },
        { header: 'Foto', key: 'fileFotoPath', width: 15 },
        { header: 'KTP/KK/Ijasah', key: 'fileIdentitasPath', width: 15 },
        { header: 'Surat Rekomendasi', key: 'fileRekomendasiPath', width: 15 }
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      data.forEach((sisya, index) => {
        // Handle Program Names & Registration Numbers
        let displayPrograms = "";
        let displayRegNos = "";
        let displayPunia = sisya.totalPunia;
        let displayTerbayar = sisya.totalTerbayar || 0;

        if (targetProgramId) {
          // Specific program sheet
          const targetProg = sisya.programSisyas.find(sp => sp.programAjahanId === targetProgramId);
          displayPrograms = targetProg ? `${targetProg.programAjahan.nama}${targetProg.isPasangan ? ' (+Pasangan)' : ''}` : "";
          displayRegNos = targetProg ? targetProg.nomorRegistrasi : "";

          if (targetProg) {
            displayPunia = targetProg.puniaProgram;
            // Allocate payment sequentially based on programId to avoid double counting across sheets
            let allocated = sisya.totalTerbayar || 0;
            const sortedProgs = [...sisya.programSisyas].sort((a, b) => a.programAjahanId - b.programAjahanId);
            for (const sp of sortedProgs) {
              let amount = Math.min(sp.puniaProgram, allocated);
              if (sp.programAjahanId === targetProgramId) {
                displayTerbayar = amount;
                break;
              }
              allocated -= amount;
            }
          }
        } else {
          // "Semua Sisya" sheet
          displayPrograms = sisya.programSisyas
            .map(sp => `${sp.programAjahan.nama}${sp.isPasangan ? ' (+Pasangan)' : ''}`)
            .join(', ');
          displayRegNos = sisya.programSisyas
            .map(sp => sp.nomorRegistrasi)
            .join(', ');
        }

        const sisaPunia = displayPunia - displayTerbayar;

        const row = worksheet.addRow({
          no: index + 1,
          tgl: new Date(sisya.createdAt).toLocaleDateString('id-ID'),
          noDaftar: sisya.nomorPendaftaran,
          noReg: displayRegNos,
          nama: sisya.namaLengkap,
          jk: sisya.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P',
          hp: sisya.noHp,
          griya: sisya.namaGriya,
          desa: sisya.namaDesa,
          program: displayPrograms,
          punia: sisya.partnerId ? '' : displayPunia,
          terbayar: sisya.partnerId ? '' : displayTerbayar,
          sisa: sisya.partnerId ? '' : sisaPunia,
          statusBayar: sisya.statusPembayaran.replace(/_/g, ' '),
          statusAkademik: sisya.status,
          tglDiksan: sisya.tanggalDiksan ? new Date(sisya.tanggalDiksan).toLocaleDateString('id-ID') : '-',
          fileFotoPath: sisya.fileFotoPath !== null ? 'Sudah' : 'Belum',
          fileIdentitasPath: sisya.fileIdentitasPath !== null ? 'Sudah' : 'Belum',
          fileRekomendasiPath: sisya.fileRekomendasiPath !== null ? 'Sudah' : 'Belum'
        });

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
        });

        // Currency formatting
        row.getCell('punia').numFmt = '#,##0';
        row.getCell('terbayar').numFmt = '#,##0';
        row.getCell('sisa').numFmt = '#,##0';

        if (index % 2 !== 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }
      });

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length }
      };
    };

    // 1. Sheet untuk semua data
    fillWorksheet('Semua Sisya', sisyas);

    // 2. Sheet per Program
    programsData.forEach(program => {
      const filteredSisyas = sisyas.filter(s =>
        s.programSisyas.some(sp => sp.programAjahanId === program.id)
      );

      if (filteredSisyas.length > 0) {
        fillWorksheet(program.nama, filteredSisyas, program.id);
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-Sisya-${new Date().getTime()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Excel Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data ke Excel' });
  }
};

const exportPuniaRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      status: 'VERIFIKASI',
      sisya: { status: { not: 'TIDAK_AKTIF' } }
    };

    if (startDate || endDate) {
      where.tanggalBayar = {};
      if (startDate) where.tanggalBayar.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggalBayar.lte = end;
      }
    }

    const payments = await prisma.pembayaran.findMany({
      where,
      orderBy: { tanggalBayar: 'asc' },
      include: {
        sisya: {
          select: {
            namaLengkap: true,
            nomorPendaftaran: true,
            programSisyas: {
              include: {
                programAjahan: {
                  select: {
                    nama: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Punia');

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C5282' } }, // Dark blue
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal Bayar', key: 'tanggal', width: 15 },
      { header: 'Nama Sisya', key: 'nama', width: 30 },
      { header: 'No. Pendaftaran', key: 'noDaftar', width: 20 },
      { header: 'Program Ajahan', key: 'program', width: 30 },
      { header: 'Nominal', key: 'nominal', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 40 }
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    let totalNominal = 0;
    payments.forEach((pay, index) => {
      totalNominal += pay.nominal;
      const row = worksheet.addRow({
        no: index + 1,
        tanggal: new Date(pay.tanggalBayar).toLocaleDateString('id-ID'),
        nama: pay.sisya.namaLengkap,
        noDaftar: pay.sisya.nomorPendaftaran,
        program: pay.sisya.programSisyas?.map(p => p.programAjahan.nama).join(', ') || '-',
        nominal: pay.nominal,
        keterangan: pay.keterangan || '-'
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      row.getCell('nominal').numFmt = '#,##0';
    });

    // Summary Row
    const summaryRow = worksheet.addRow({
      no: '',
      tanggal: '',
      nama: 'TOTAL',
      noDaftar: '',
      program: '',
      nominal: totalNominal,
      keterangan: ''
    });

    summaryRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    summaryRow.getCell('nominal').numFmt = '#,##0';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-Punia-${new Date().getTime()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Punia Range Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data punia ke Excel' });
  }
};

const getLaporanAbsensi = async (req, res) => {
  try {
    const { programId, page = 1, limit = 10, sortBy = 'namaLengkap', sortOrder = 'asc' } = req.query;

    if (!programId || programId === 'SEMUA') {
      return res.status(400).json({ success: false, message: 'Pilih Program Ajahan terlebih dahulu' });
    }

    const progId = parseInt(programId);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 1. Ambil total sesi yang sudah dibuat untuk program ini
    const totalSesi = await prisma.sesiAbsensi.count({
      where: { mataKuliah: { programAjahanId: progId } }
    });

    // 2. Ambil daftar sisya di program ini
    const whereSisya = {
      status: { not: 'TIDAK_AKTIF' },
      programSisyas: { some: { programAjahanId: progId } }
    };

    const totalSisya = await prisma.sisya.count({ where: whereSisya });

    const sisyas = await prisma.sisya.findMany({
      where: whereSisya,
      select: {
        id: true,
        namaLengkap: true,
        namaGriya: true,
        nomorPendaftaran: true,
        absensiSisyas: {
          where: {
            sesiAbsensi: { mataKuliah: { programAjahanId: progId } }
          },
          select: {
            status: true
          }
        }
      }
    });

    // 3. Kalkulasi rekap per sisya dan summary program
    const globalSummary = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 };

    let rekapData = sisyas.map(s => {
      const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 };
      s.absensiSisyas.forEach(a => {
        counts[a.status]++;
        globalSummary[a.status]++;
      });

      const persen = totalSesi > 0 ? Math.round((counts.HADIR / totalSesi) * 100) : 0;
      return {
        id: s.id,
        namaLengkap: s.namaLengkap,
        namaGriya: s.namaGriya,
        nomorPendaftaran: s.nomorPendaftaran,
        totalSesi,
        totalHadir: counts.HADIR,
        persentase: persen
      };
    });

    // 4. Sorting manual
    const order = sortOrder === 'asc' ? 1 : -1;
    rekapData.sort((a, b) => {
      if (sortBy === 'persentase') return (a.persentase - b.persentase) * order;
      if (sortBy === 'namaGriya') return (a.namaGriya || '').localeCompare(b.namaGriya || '') * order;
      return (a.namaLengkap || '').localeCompare(b.namaLengkap || '') * order;
    });

    // 5. Pagination manual
    const paginatedData = rekapData.slice(skip, skip + take);

    res.json({
      success: true,
      data: paginatedData,
      summary: globalSummary,
      pagination: {
        total: totalSisya,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalSisya / take)
      }
    });
  } catch (error) {
    console.error('Get Laporan Absensi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat laporan absensi' });
  }
};

const exportLaporanAbsensi = async (req, res) => {
  try {
    const programs = await prisma.programAjahan.findMany({
      where: { isAktif: true },
      orderBy: { urutan: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();

    for (const program of programs) {
      const progId = program.id;

      // Hitung total sesi di program ini
      const totalSesi = await prisma.sesiAbsensi.count({
        where: { mataKuliah: { programAjahanId: progId } }
      });

      // Ambil sisya di program ini
      const sisyas = await prisma.sisya.findMany({
        where: {
          status: { not: 'TIDAK_AKTIF' },
          programSisyas: { some: { programAjahanId: progId } }
        },
        include: {
          absensiSisyas: {
            where: {
              sesiAbsensi: { mataKuliah: { programAjahanId: progId } },
              status: 'HADIR'
            }
          }
        }
      });

      if (sisyas.length === 0) continue;

      const safeName = program.nama.replace(/[:\\/?*[\]]/g, '').substring(0, 31);
      const worksheet = workbook.addWorksheet(safeName);

      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B46C1' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Lengkap', key: 'nama', width: 35 },
        { header: 'Griya', key: 'griya', width: 25 },
        { header: 'No. Pendaftaran', key: 'noDaftar', width: 20 },
        { header: 'Total Sesi', key: 'totalSesi', width: 12 },
        { header: 'Hadir', key: 'hadir', width: 10 },
        { header: 'Persentase (%)', key: 'persen', width: 15 }
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      sisyas.forEach((s, idx) => {
        const hadir = s.absensiSisyas.length;
        const persen = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0;
        const row = worksheet.addRow({
          no: idx + 1,
          nama: s.namaLengkap,
          griya: s.namaGriya,
          noDaftar: s.nomorPendaftaran,
          totalSesi,
          hadir,
          persen: `${persen}%`
        });

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    }

    if (workbook.worksheets.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada data untuk diekspor' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Rekap-Absensi-Nasional-${new Date().getTime()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Absensi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data absensi' });
  }
};

const getProgramAjahanRekap = async (req, res) => {
  try {
    const programs = await prisma.programAjahan.findMany({
      where: { isAktif: true },
      orderBy: { urutan: 'asc' },
      include: {
        mataKuliahs: {
          orderBy: { semester: 'asc' },
          include: {
            sesiAbsensis: {
              orderBy: { pertemuan: 'asc' }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: programs
    });
  } catch (error) {
    console.error('Get Program Ajahan Rekap Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil rekapitulasi program ajahan' });
  }
};

const exportProgramAjahanRekap = async (req, res) => {
  try {
    const programs = await prisma.programAjahan.findMany({
      where: { isAktif: true },
      orderBy: { urutan: 'asc' },
      include: {
        mataKuliahs: {
          orderBy: { semester: 'asc' },
          include: {
            sesiAbsensis: {
              orderBy: { pertemuan: 'asc' }
            }
          }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();

    for (const program of programs) {
      const safeName = program.nama.replace(/[:\\/?*[\]]/g, '').substring(0, 31);
      const worksheet = workbook.addWorksheet(safeName);

      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      worksheet.columns = [
        { header: 'Semester', key: 'semester', width: 10 },
        { header: 'Ajahan (Tingkat)', key: 'mataKuliah', width: 30 },
        { header: 'Pertemuan', key: 'pertemuan', width: 12 },
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'Narawakya', key: 'narawakya', width: 30 },
        { header: 'Topik', key: 'topik', width: 40 }
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      program.mataKuliahs.forEach(mk => {
        if (mk.sesiAbsensis.length === 0) {
          const row = worksheet.addRow({
            semester: mk.semester,
            mataKuliah: mk.nama,
            pertemuan: '-',
            tanggal: '-',
            narawakya: '-',
            topik: 'Belum ada jadwal'
          });
          row.eachCell((cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { vertical: 'middle' };
          });
        } else {
          mk.sesiAbsensis.forEach((sesi, idx) => {
            const row = worksheet.addRow({
              semester: idx === 0 ? mk.semester : '',
              mataKuliah: idx === 0 ? mk.nama : '',
              pertemuan: sesi.pertemuan,
              tanggal: new Date(sesi.tanggal).toLocaleDateString('id-ID'),
              narawakya: sesi.narawakya || '-',
              topik: sesi.topik || '-'
            });
            row.eachCell((cell) => {
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
              cell.alignment = { vertical: 'middle' };
            });
          });
        }
      });
    }

    if (workbook.worksheets.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada data program ajahan' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Rekap-Program-Ajahan-${new Date().getTime()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Program Ajahan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data program ajahan' });
  }
};

module.exports = {
  getLaporanSisya,
  exportSisya,
  getLaporanPuniaRange,
  getLaporanPuniaBulanan,
  getLaporanPuniaDashboard,
  exportPuniaRange,
  getLaporanAbsensi,
  exportLaporanAbsensi,
  getProgramAjahanRekap,
  exportProgramAjahanRekap
};
