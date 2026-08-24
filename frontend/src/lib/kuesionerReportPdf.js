import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [194, 65, 12],
  teal: [13, 148, 136],
  violet: [124, 58, 237],
  text: [31, 41, 55],
  muted: [107, 114, 128],
  border: [226, 232, 240],
  soft: [248, 250, 252],
};

const formatDate = (value) => new Intl.DateTimeFormat('id-ID', {
  day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar'
}).format(new Date(value));

const loadLogo = async () => {
  const response = await fetch('/logo.png');
  if (!response.ok) return null;
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result), false);
    reader.addEventListener('error', () => resolve(null), false);
    reader.readAsDataURL(blob);
  });
};

const addHeader = (pdf, title, subtitle, logo) => {
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, 210, 25, 'F');
  if (logo) pdf.addImage(logo, 'PNG', 14, 3, 18, 18);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(title, logo ? 37 : 14, 11);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(subtitle, logo ? 37 : 14, 17);
  pdf.setTextColor(...COLORS.text);
};

const addSection = (pdf, title, y) => {
  pdf.setFillColor(255, 247, 237);
  pdf.roundedRect(14, y, 182, 8, 2, 2, 'F');
  pdf.setTextColor(...COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(title, 18, y + 5.4);
  pdf.setTextColor(...COLORS.text);
};

export const buildKuesionerReportPdf = (report, logo = null) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const period = `${formatDate(`${report.periode.startDate}T00:00:00Z`)} s.d. ${formatDate(`${report.periode.endDate}T00:00:00Z`)}`;
  addHeader(pdf, 'LAPORAN KUESIONER PROGRAM AJAHAN', `PDPN VIDYA - Periode ${period}`, logo);

  addSection(pdf, 'Ringkasan Per Program Ajahan', 31);
  autoTable(pdf, {
    startY: 42,
    head: [['Program Ajahan', 'Pertemuan', 'Terisi', 'Respons', 'Kehadiran', 'Rasio']],
    body: report.programs.map((program) => [
      program.nama,
      program.jumlahPertemuan,
      program.jumlahPertemuanDenganRespons,
      program.jumlahRespons,
      program.jumlahHadir,
      `${program.rasioRespons}%`,
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, textColor: COLORS.text },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.soft },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
  let noteY = (pdf.lastAutoTable?.finalY || 70) + 8;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...COLORS.muted);
  const note = 'Catatan: respons merupakan jawaban anonim, bukan jumlah orang unik. Kehadiran adalah akumulasi status HADIR per pertemuan.';
  pdf.text(pdf.splitTextToSize(note, 180), 14, noteY);

  report.programs.forEach((program) => {
    pdf.addPage();
    addHeader(pdf, `PROGRAM AJAHAN: ${program.nama.toUpperCase()}`, `Laporan kuesioner per pertemuan - ${period}`, logo);
    autoTable(pdf, {
      startY: 32,
      head: [['Pertemuan', 'Dengan Respons', 'Total Respons', 'Kehadiran', 'Rasio']],
      body: [[program.jumlahPertemuan, program.jumlahPertemuanDenganRespons, program.jumlahRespons, program.jumlahHadir, `${program.rasioRespons}%`]],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, halign: 'center', textColor: COLORS.text },
      headStyles: { fillColor: COLORS.teal, textColor: [255, 255, 255], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    if (program.pertemuan.length === 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.muted);
      pdf.text('Belum ada pertemuan pada periode laporan.', 14, 65);
      return;
    }

    program.pertemuan.forEach((meeting, meetingIndex) => {
      let startY = (pdf.lastAutoTable?.finalY || 50) + 9;
      if (startY > 250) {
        pdf.addPage();
        addHeader(pdf, `PROGRAM AJAHAN: ${program.nama.toUpperCase()}`, `Lanjutan laporan - ${period}`, logo);
        startY = 33;
      }
      autoTable(pdf, {
        startY,
        head: [[`Pertemuan ${meeting.pertemuan}`, 'Tanggal', 'Mata Kuliah', 'Topik', 'Hadir', 'Respons']],
        body: [[
          `#${meetingIndex + 1}`,
          formatDate(meeting.tanggal),
          meeting.mataKuliah.nama,
          meeting.topik || '-',
          meeting.jumlahHadir,
          meeting.jumlahRespons,
        ]],
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.2, textColor: COLORS.text },
        headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 27 }, 4: { cellWidth: 14, halign: 'right' }, 5: { cellWidth: 16, halign: 'right' } },
        margin: { left: 14, right: 14 },
      });

      if (meeting.analisis?.hasilAnalisis?.ringkasan) {
        autoTable(pdf, {
          startY: (pdf.lastAutoTable?.finalY || startY) + 3,
          head: [['Ringkasan AI Pertemuan']],
          body: [[meeting.analisis.hasilAnalisis.ringkasan]],
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5, textColor: COLORS.text },
          headStyles: { fillColor: COLORS.violet, textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [245, 243, 255] },
          margin: { left: 14, right: 14 },
        });
      }

      autoTable(pdf, {
        startY: (pdf.lastAutoTable?.finalY || startY) + 3,
        head: [['No', 'Pesan dan Kesan Anonim']],
        body: meeting.jawaban.length
          ? meeting.jawaban.map((answer, index) => [index + 1, answer.pesanKesan])
          : [['-', 'Belum ada respons pada pertemuan ini.']],
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak', textColor: COLORS.text },
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: COLORS.soft },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14, bottom: 18 },
        rowPageBreak: 'avoid',
      });
    });
  });

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...COLORS.border);
    pdf.line(14, 287, 196, 287);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 14, 292);
    pdf.text(`Halaman ${page} dari ${pages}`, 196, 292, { align: 'right' });
  }
  return pdf;
};

export const saveKuesionerReportPdf = async (report) => {
  const logo = await loadLogo();
  const pdf = buildKuesionerReportPdf(report, logo);
  const filterName = report.programs.length === 1 ? `-${report.programs[0].kode}` : '';
  pdf.save(`Laporan-Kuesioner${filterName}-${report.periode.startDate}-${report.periode.endDate}.pdf`);
};
