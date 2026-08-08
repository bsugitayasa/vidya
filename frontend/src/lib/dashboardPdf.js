import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [194, 65, 12],
  primaryLight: [255, 247, 237],
  violet: [124, 58, 237],
  blue: [37, 99, 235],
  rose: [225, 29, 72],
  amber: [217, 119, 6],
  emerald: [5, 150, 105],
  text: [31, 41, 55],
  muted: [107, 114, 128],
  border: [229, 231, 235],
};

const formatRupiahPdf = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const addPageHeader = (pdf, filterLabel, subtitle, logoBase64) => {
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, 210, 24, 'F');
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', 14, 3, 18, 18);
  }
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('LAPORAN STATISTIK DASHBOARD', 37, 11);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(subtitle, 37, 17);
  pdf.text(`Filter: ${filterLabel}`, 196, 11, { align: 'right' });
  pdf.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 196, 17, { align: 'right' });
  pdf.setTextColor(...COLORS.text);
};

const addSectionTitle = (pdf, title, y) => {
  pdf.setFillColor(...COLORS.primaryLight);
  pdf.roundedRect(14, y, 182, 8, 2, 2, 'F');
  pdf.setTextColor(...COLORS.primary);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(title, 18, y + 5.3);
  pdf.setTextColor(...COLORS.text);
};

const drawSummaryCard = (pdf, x, y, width, label, value, color) => {
  pdf.setDrawColor(...COLORS.border);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, width, 25, 2, 2, 'FD');
  pdf.setFillColor(...color);
  pdf.roundedRect(x, y, 3, 25, 1.5, 1.5, 'F');
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text(label.toUpperCase(), x + 7, y + 8);
  pdf.setTextColor(...color);
  pdf.setFontSize(value.length > 17 ? 11 : 16);
  pdf.text(value, x + 7, y + 18);
  pdf.setTextColor(...COLORS.text);
};

const drawHorizontalBar = (pdf, { label, value, maxValue, x, y, labelWidth = 48, barWidth = 112, color }) => {
  const safeMax = maxValue || 1;
  const filledWidth = Math.max(value > 0 ? 1 : 0, (value / safeMax) * barWidth);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.text);
  const displayLabel = label.length > 28 ? `${label.slice(0, 27)}...` : label;
  pdf.text(displayLabel, x, y + 3.5);
  pdf.setFillColor(243, 244, 246);
  pdf.roundedRect(x + labelWidth, y, barWidth, 5, 1.5, 1.5, 'F');
  pdf.setFillColor(...color);
  pdf.roundedRect(x + labelWidth, y, filledWidth, 5, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.text(String(value), x + labelWidth + barWidth + 4, y + 3.7);
};

export const buildDashboardPdf = (stats, filterLabel = 'Semua Program Ajahan', logoBase64 = null) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const subtitle = 'PDPN VIDYA - Ringkasan statistik administrasi sisya';

  addPageHeader(pdf, filterLabel, subtitle, logoBase64);
  addSectionTitle(pdf, 'Ringkasan Utama', 30);

  const cardWidth = 42.5;
  const cardGap = 4;
  drawSummaryCard(pdf, 14, 42, cardWidth, 'Sisya Unik', String(stats.totalSisya || 0), COLORS.blue);
  drawSummaryCard(pdf, 14 + cardWidth + cardGap, 42, cardWidth, 'Kepesertaan', String(stats.totalKepesertaanProgram || 0), COLORS.violet);
  drawSummaryCard(pdf, 14 + (cardWidth + cardGap) * 2, 42, cardWidth, 'Menunggu Verifikasi', String(stats.menungguVerifikasi || 0), COLORS.amber);
  drawSummaryCard(pdf, 14 + (cardWidth + cardGap) * 3, 42, cardWidth, 'Belum Lunas', String(stats.belumLunas || 0), COLORS.rose);
  drawSummaryCard(pdf, 14, 71, 89, 'Estimasi Punia', formatRupiahPdf(stats.totalEstimasiPunia), COLORS.emerald);
  drawSummaryCard(pdf, 107, 71, 89, 'Sisya Multi-program', `${stats.totalSisyaMultiProgram || 0} sisya - +${stats.totalKepesertaanTambahan || 0} kepesertaan`, COLORS.violet);

  addSectionTitle(pdf, 'Komposisi Jenis Kelamin', 102);
  const genderTotal = (stats.genderStats?.lakiLaki || 0) + (stats.genderStats?.perempuan || 0);
  drawHorizontalBar(pdf, {
    label: 'Laki-Laki', value: stats.genderStats?.lakiLaki || 0, maxValue: genderTotal,
    x: 18, y: 116, labelWidth: 34, barWidth: 118, color: COLORS.blue,
  });
  drawHorizontalBar(pdf, {
    label: 'Perempuan', value: stats.genderStats?.perempuan || 0, maxValue: genderTotal,
    x: 18, y: 126, labelWidth: 34, barWidth: 118, color: COLORS.rose,
  });
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.muted);
  pdf.setFontSize(8);
  pdf.text(`Total berdasarkan filter: ${genderTotal} sisya`, 18, 139);

  addSectionTitle(pdf, 'Pendaftar per Program', 147);
  autoTable(pdf, {
    startY: 158,
    head: [['Program Ajahan', 'Jumlah Sisya', 'Persentase dari Sisya Unik']],
    body: (stats.programStats || []).map((program) => [
      program.nama,
      program.total,
      `${((program.total / (stats.totalSisya || 1)) * 100).toFixed(1)}%`,
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: COLORS.text },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
  const programTableEnd = pdf.lastAutoTable?.finalY || 190;
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...COLORS.muted);
  pdf.setFontSize(7.5);
  pdf.text(
    'Catatan: satu sisya dapat tercatat pada beberapa program sehingga total kepesertaan dapat melebihi sisya unik.',
    14,
    Math.min(programTableEnd + 7, 282),
  );

  pdf.addPage();
  addPageHeader(pdf, filterLabel, subtitle, logoBase64);
  addSectionTitle(pdf, 'Persebaran Sisya Berdasarkan Kabupaten/Kota', 30);
  const locationStats = stats.locationStats || [];
  const maxLocation = Math.max(...locationStats.map((item) => item.total), 1);
  if (locationStats.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('Belum ada data Kabupaten/Kota untuk ditampilkan.', 18, 48);
  } else {
    locationStats.forEach((item, index) => {
      drawHorizontalBar(pdf, {
        label: item.namaKabupaten,
        value: item.total,
        maxValue: maxLocation,
        x: 18,
        y: 43 + index * 10,
        color: COLORS.violet,
      });
    });
  }

  const locationEndY = locationStats.length > 0 ? 47 + locationStats.length * 10 : 53;
  autoTable(pdf, {
    startY: locationEndY + 8,
    head: [['Kabupaten / Kota', 'Jumlah Sisya']],
    body: locationStats.map((item) => [item.namaKabupaten, item.total]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, textColor: COLORS.text },
    headStyles: { fillColor: COLORS.violet, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  pdf.addPage();
  addPageHeader(pdf, filterLabel, subtitle, logoBase64);
  const recentSectionY = 30;
  addSectionTitle(pdf, 'Pendaftar 7 Hari Terakhir', recentSectionY);
  const chartData = stats.chartData || [];
  const chartTop = recentSectionY + 16;
  const chartHeight = 43;
  const chartLeft = 20;
  const chartWidth = 170;
  const maxRecent = Math.max(...chartData.map((item) => item.pendaftar), 1);

  pdf.setDrawColor(...COLORS.border);
  pdf.line(chartLeft, chartTop + chartHeight, chartLeft + chartWidth, chartTop + chartHeight);
  if (chartData.length > 0) {
    const slotWidth = chartWidth / chartData.length;
    chartData.forEach((item, index) => {
      const barHeight = (item.pendaftar / maxRecent) * chartHeight;
      const barWidth = Math.min(14, slotWidth * 0.55);
      const x = chartLeft + index * slotWidth + (slotWidth - barWidth) / 2;
      const y = chartTop + chartHeight - barHeight;
      pdf.setFillColor(...COLORS.primary);
      if (barHeight > 0) pdf.roundedRect(x, y, barWidth, barHeight, 1.2, 1.2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...COLORS.text);
      pdf.text(String(item.pendaftar), x + barWidth / 2, Math.max(chartTop + 3, y - 2), { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(item.date, x + barWidth / 2, chartTop + chartHeight + 6, { align: 'center' });
    });
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('Belum ada data pendaftaran mingguan.', 105, chartTop + 22, { align: 'center' });
  }

  autoTable(pdf, {
    startY: chartTop + chartHeight + 12,
    head: [['Tanggal', 'Jumlah Pendaftar', 'Estimasi Punia']],
    body: chartData.map((item) => [item.date, item.pendaftar, formatRupiahPdf(item.punia)]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, textColor: COLORS.text },
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...COLORS.border);
    pdf.line(14, 288, 196, 288);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('PDPN VIDYA - Laporan Statistik Dashboard', 14, 292.5);
    pdf.text(`Halaman ${page} dari ${totalPages}`, 196, 292.5, { align: 'right' });
  }

  return pdf;
};

const loadLogoAsDataUrl = async () => {
  const response = await fetch('/logo.png');
  if (!response.ok) throw new Error('Logo PDPN tidak dapat dimuat');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result), false);
    reader.addEventListener('error', () => reject(new Error('Logo PDPN tidak dapat dibaca')), false);
    reader.readAsDataURL(blob);
  });
};

export const saveDashboardPdf = async (stats, filterLabel) => {
  const logoBase64 = await loadLogoAsDataUrl();
  const pdf = buildDashboardPdf(stats, filterLabel, logoBase64);
  const date = new Date().toISOString().split('T')[0];
  pdf.save(`Dashboard-Statistik-${date}.pdf`);
};
