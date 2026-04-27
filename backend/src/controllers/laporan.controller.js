const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');

const getLaporanSisya = async (req, res) => {
  try {
    const { status, startDate, endDate, programId } = req.query;

    const whereClause = {};

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

    const sisyas = await prisma.sisya.findMany({
      where: whereClause,
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
    console.error('Get Laporan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data laporan' });
  }
};

const exportSisya = async (req, res) => {
  try {
    const { status, startDate, endDate, programId } = req.query;

    const whereClause = {};
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
        { header: 'Tgl Pediksaan', key: 'tglDiksan', width: 15 }
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      data.forEach((sisya, index) => {
        // Handle Program Names & Registration Numbers
        let displayPrograms = "";
        let displayRegNos = "";

        if (targetProgramId) {
          // Specific program sheet
          const targetProg = sisya.programSisyas.find(sp => sp.programAjahanId === targetProgramId);
          displayPrograms = targetProg ? `${targetProg.programAjahan.nama}${targetProg.isPasangan ? ' (+Pasangan)' : ''}` : "";
          displayRegNos = targetProg ? targetProg.nomorRegistrasi : "";
        } else {
          // "Semua Sisya" sheet
          displayPrograms = sisya.programSisyas
            .map(sp => `${sp.programAjahan.nama}${sp.isPasangan ? ' (+Pasangan)' : ''}`)
            .join(', ');
          displayRegNos = sisya.programSisyas
            .map(sp => sp.nomorRegistrasi)
            .join(', ');
        }

        const sisaPunia = sisya.totalPunia - (sisya.totalTerbayar || 0);

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
          punia: sisya.totalPunia,
          terbayar: sisya.totalTerbayar || 0,
          sisa: sisaPunia,
          statusBayar: sisya.statusPembayaran.replace(/_/g, ' '),
          statusAkademik: sisya.status,
          tglDiksan: sisya.tanggalDiksan ? new Date(sisya.tanggalDiksan).toLocaleDateString('id-ID') : '-'
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

module.exports = {
  getLaporanSisya,
  exportSisya
};
