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

export const generateAttendancePdf = (sisyas, logoBase64, generatedAt = new Date()) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const registrationCollator = new Intl.Collator('id-ID', {
    numeric: true,
    sensitivity: 'base'
  });
  const sortedSisyas = [...sisyas].sort((firstSisya, secondSisya) =>
    registrationCollator.compare(firstSisya.nomorPendaftaran, secondSisya.nomorPendaftaran)
  );

  drawOrganizationHeader(pdf, logoBase64);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('DAFTAR ABSENSI SISYA', 105, 44, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(`Dicetak: ${generatedAt.toLocaleDateString('id-ID')}`, 190, 50, { align: 'right' });
  pdf.setTextColor(0, 0, 0);

  const tableRows = sortedSisyas.map((sisya, index) => [
    index + 1,
    sisya.namaLengkap,
    sisya.nomorPendaftaran,
    ''
  ]);

  autoTable(pdf, {
    startY: 54,
    head: [['No', 'Nama', 'No Pendaftaran', 'TTD']],
    body: tableRows,
    theme: 'grid',
    margin: { left: 20, right: 20, bottom: 16 },
    showHead: 'everyPage',
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
    },
    didDrawPage: () => {
      const pageNumber = pdf.internal.getNumberOfPages();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(110, 110, 110);
      pdf.text(`Halaman ${pageNumber}`, 190, 290, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
    }
  });

  return pdf;
};
