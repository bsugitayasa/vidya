import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const drawOrganizationHeader = (pdf, logoBase64) => {
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', 20, 12, 17, 17);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PERKUMPULAN DHARMOPADESA PUSAT NUSANTARA', 41, 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text('Sekretariat Kantor Pusat: Pasraman Dharma Wasitha, Wantilan Capung Mas, Banjar Batan Ancak,', 41, 20.5);
  pdf.text('Desa Mas, Kecamatan Ubud, Kabupaten Gianyar, Provinsi Bali, Indonesia - 80571', 41, 24);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text('SK Kemenkumham RI No. AHU-0000052.AH.01.07.Tahun 2020 | Website: perkumpulan-dharmopadesa-pusat-nusantara.cloud', 41, 27.5);
  pdf.setTextColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(20, 33, 190, 33);
  pdf.setLineWidth(0.2);
  pdf.line(20, 34, 190, 34);
};

const UNASSIGNED_PROGRAM = {
  id: 'UNASSIGNED',
  kode: '',
  nama: 'Belum Memiliki Program Ajahan',
  urutan: Number.MAX_SAFE_INTEGER
};

const PROGRAM_ATTENDANCE_LABELS = Object.freeze({
  KAWELAKAAN: 'KAWELAKAAN-XVII',
  KAWIKON: 'KAWIKON-IX',
  SERATI: 'SERATI-IV',
  USADHA: 'USADHA-III'
});

export const groupAttendanceByProgram = (sisyas) => {
  const programGroups = new Map();

  sisyas.forEach((sisya) => {
    const programs = sisya.programSisyas
      ?.map((programSisya) => programSisya.programAjahan)
      .filter(Boolean);
    const assignedPrograms = programs?.length ? programs : [UNASSIGNED_PROGRAM];

    assignedPrograms.forEach((program) => {
      const groupKey = String(program.id);
      if (!programGroups.has(groupKey)) {
        programGroups.set(groupKey, { program, sisyas: [] });
      }
      programGroups.get(groupKey).sisyas.push(sisya);
    });
  });

  const registrationCollator = new Intl.Collator('id-ID', {
    numeric: true,
    sensitivity: 'base'
  });
  const programCollator = new Intl.Collator('id-ID', { sensitivity: 'base' });

  return [...programGroups.values()]
    .sort((firstGroup, secondGroup) => {
      const orderDifference = (firstGroup.program.urutan ?? Number.MAX_SAFE_INTEGER)
        - (secondGroup.program.urutan ?? Number.MAX_SAFE_INTEGER);
      return orderDifference || programCollator.compare(firstGroup.program.nama, secondGroup.program.nama);
    })
    .map((group) => ({
      ...group,
      sisyas: [...group.sisyas].sort((firstSisya, secondSisya) =>
        registrationCollator.compare(firstSisya.nomorPendaftaran, secondSisya.nomorPendaftaran)
      )
    }));
};

const drawAttendancePageHeader = (pdf, logoBase64, program, generatedAt) => {
  drawOrganizationHeader(pdf, logoBase64);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAFTAR ABSENSI SISYA', 105, 42, { align: 'center' });
  pdf.setFontSize(10);
  pdf.setTextColor(183, 81, 38);
  const programCode = program.kode?.trim().toUpperCase();
  const programLabel = PROGRAM_ATTENDANCE_LABELS[programCode]
    || (program.kode ? `${program.kode} - ${program.nama}` : program.nama);
  pdf.text(`PROGRAM AJAHAN: ${programLabel}`, 105, 48, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(`Dicetak: ${generatedAt.toLocaleDateString('id-ID')}`, 190, 53, { align: 'right' });
  pdf.setTextColor(0, 0, 0);
};

const drawAttendancePageFooter = (pdf) => {
  const pageNumber = pdf.internal.getNumberOfPages();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 110, 110);
  pdf.text(`Halaman ${pageNumber}`, 190, 290, { align: 'right' });
  pdf.setTextColor(0, 0, 0);
};

export const generateAttendancePdf = (sisyas, logoBase64, generatedAt = new Date()) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const attendanceGroups = groupAttendanceByProgram(sisyas);
  const rowsPerPage = 17;
  let hasRenderedPage = false;

  attendanceGroups.forEach(({ program, sisyas: programSisyas }) => {
    for (let offset = 0; offset < programSisyas.length; offset += rowsPerPage) {
      if (hasRenderedPage) pdf.addPage();
      hasRenderedPage = true;

      drawAttendancePageHeader(pdf, logoBase64, program, generatedAt);
      const pageSisyas = programSisyas.slice(offset, offset + rowsPerPage);
      const tableRows = pageSisyas.map((sisya, index) => [
        offset + index + 1,
        sisya.namaLengkap,
        sisya.nomorPendaftaran,
        ''
      ]);

      autoTable(pdf, {
        startY: 57,
        head: [['No', 'Nama', 'No Pendaftaran', 'TTD']],
        body: tableRows,
        theme: 'grid',
        margin: { left: 20, right: 20, bottom: 16 },
        pageBreak: 'avoid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 2.5,
          lineColor: [90, 90, 90],
          lineWidth: 0.2,
          minCellHeight: 12,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [183, 81, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          minCellHeight: 9
        },
        alternateRowStyles: { fillColor: [250, 247, 243] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 73 },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 45 }
        }
      });
      drawAttendancePageFooter(pdf);
    }
  });

  if (attendanceGroups.length === 0) {
    drawAttendancePageHeader(pdf, logoBase64, UNASSIGNED_PROGRAM, generatedAt);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Tidak ada data sisya aktif.', 105, 68, { align: 'center' });
    drawAttendancePageFooter(pdf);
  }

  return pdf;
};
