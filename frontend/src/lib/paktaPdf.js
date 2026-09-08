import { jsPDF } from 'jspdf';

const loadImage = (src) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  };
  image.onerror = () => resolve(null);
  image.src = src;
});

export async function downloadPaktaPdf(data, qrDataUrl) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await loadImage('/logo.png');
  const margin = 18;
  const pageWidth = 210;
  const pageHeight = 297;
  let pageNumber = 1;
  let y = 18;

  const footer = () => {
    doc.setDrawColor(220, 224, 230);
    doc.line(margin, pageHeight - 17, pageWidth - margin, pageHeight - 17);
    doc.setFontSize(7.5);
    doc.setTextColor(95, 105, 120);
    doc.text('Dokumen ini merupakan bukti persetujuan elektronik internal sistem VIDYA.', margin, pageHeight - 11);
    doc.text(`Halaman ${pageNumber} • Kode verifikasi ${data.verificationCode || '-'}`, pageWidth - margin, pageHeight - 11, { align: 'right' });
  };

  const header = () => {
    doc.setTextColor(0, 0, 0);

    if (logo) {
      doc.addImage(logo, 'PNG', 20, 12, 17, 17);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PERKUMPULAN DHARMOPADESA PUSAT NUSANTARA', 41, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Sekretariat Kantor Pusat: Pasraman Dharma Wasitha, Wantilan Capung Mas, Banjar Batan Ancak,', 41, 20.5);
      doc.text('Desa Mas, Kecamatan Ubud, Kabupaten Gianyar, Provinsi Bali, Indonesia - 80571', 41, 24);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('SK KEMENAG RI DIRJEN BIMAS HINDU NO. 471/DJ.VI/BA.01.1/03/2026', 41, 27.5);
      doc.text('SK Kemenkumham RI No. AHU-0000052.AH.01.07.Tahun 2020 | Website: perkumpulan-dharmopadesa-pusat-nusantara.cloud', 41, 30.5);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PERKUMPULAN DHARMOPADESA PUSAT NUSANTARA', pageWidth / 2, 16, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Sekretariat Kantor Pusat: Pasraman Dharma Wasitha, Wantilan Capung Mas, Banjar Batan Ancak,', pageWidth / 2, 21, { align: 'center' });
      doc.text('Desa Mas, Kecamatan Ubud, Kabupaten Gianyar, Provinsi Bali, Indonesia - 80571', pageWidth / 2, 25, { align: 'center' });
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text('SK KEMENAG RI DIRJEN BIMAS HINDU NO. 471/DJ.VI/BA.01.1/03/2026', pageWidth / 2, 29, { align: 'center' });
      doc.text('SK Kemenkumham RI No. AHU-0000052.AH.01.07.Tahun 2020 | Website: perkumpulan-dharmopadesa-pusat-nusantara.cloud', pageWidth / 2, 32, { align: 'center' });
    }

    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(20, 35, 190, 35);
    doc.setLineWidth(0.2);
    doc.line(20, 36, 190, 36);
    y = 45;
  };

  const newPage = () => {
    footer();
    doc.addPage();
    pageNumber += 1;
    header();
  };

  const ensure = (height) => { if (y + height > pageHeight - 23) newPage(); };
  const paragraph = (text, options = {}) => {
    const size = options.size || 10;
    const indent = options.indent || 0;
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(options.color || '#374151');
    const lines = doc.splitTextToSize(String(text || '-'), pageWidth - (margin * 2) - indent);
    const height = lines.length * (size * 0.43) + 2;
    ensure(height);
    const align = options.align || 'left';
    const x = align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin + indent;
    doc.text(lines, x, y, { align });
    y += height;
  };

  header();
  paragraph(data.contentSnapshot?.judul || data.template?.judul || 'PAKTA INTEGRITAS SISYA', { bold: true, size: 16, align: 'center', color: '#9A4318' });
  paragraph(`Nomor: ${data.nomorDokumen}`, { size: 9, align: 'center' });
  y += 4;

  const identity = [
    ['Nama Sisya', data.sisya?.namaLengkap || data.namaPenandatangan],
    ['No. Pendaftaran', data.sisya?.nomorPendaftaran || '-'],
    ['Program Ajahan', (data.programSnapshot || []).map((item) => item.nama).join(', ') || '-'],
    ['Referensi', data.contentSnapshot?.referensiPedoman || data.template?.referensiPedoman || '-'],
    ['Versi', String(data.contentSnapshot?.versi || data.template?.versi || '-')]
  ];
  identity.forEach(([label, value]) => {
    ensure(7);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(value), 120);
    doc.text(lines, 58, y);
    y += Math.max(6, lines.length * 4.2);
  });
  y += 4;
  paragraph(data.contentSnapshot?.pembuka, { size: 10 });
  y += 2;
  (data.contentSnapshot?.klausul || []).forEach((clause, index) => {
    paragraph(`${index + 1}. ${clause.title}`, { bold: true, size: 10 });
    paragraph(clause.text, { indent: 5, size: 9.5 });
    y += 1;
  });

  ensure(55);
  y += 5;
  doc.setDrawColor(225, 228, 234);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 48, 2, 2);
  doc.setFontSize(8.5); doc.setTextColor(90, 98, 112);
  doc.text('DITANDATANGANI SECARA ELEKTRONIK OLEH', margin + 5, y + 7);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 55, 72);
  doc.text(data.namaPenandatangan || data.sisya?.namaLengkap || '-', margin + 5, y + 15);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(data.signedAt ? new Date(data.signedAt).toLocaleString('id-ID') : 'Belum ditandatangani', margin + 5, y + 21);
  if (data.signatureData) doc.addImage(data.signatureData, 'PNG', margin + 5, y + 24, 55, 18);
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 34, y + 7, 28, 28);
    doc.setFontSize(7); doc.text(data.verificationCode || '', pageWidth - margin - 20, y + 39, { align: 'center' });
  }
  y += 53;
  paragraph(`Hash dokumen: ${data.documentHash || '-'}`, { size: 7, color: '#64748B' });
  paragraph(`Hash bukti: ${data.evidenceHash || '-'}`, { size: 7, color: '#64748B' });
  footer();
  doc.save(`Pakta-Integritas-${data.sisya?.nomorPendaftaran || data.verificationCode}.pdf`);
}
