import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAccountingRupiah, formatDate, formatRupiah } from './finance.js';

const ACTIVE_RECEIPT_STATUS = 'AKTIF';
const VERIFIED_EXPENSE_STATUS = 'VERIFIKASI';

const loadImage = async (source) => {
  try {
    const image = new Image();
    image.src = source;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    return image;
  } catch {
    return null;
  }
};

const formatVolume = (value) => Number(value || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export const buildFinanceLedger = (rab) => {
  const itemById = new Map((rab.items || []).map((item) => [String(item.id), item]));
  const receipts = (rab.pencairans || [])
    .filter((row) => row.status === ACTIVE_RECEIPT_STATUS)
    .map((row) => ({
      id: Number(row.id || 0),
      date: row.tanggal,
      typeOrder: 0,
      description: [
        'Dana masuk',
        row.jenisSumber && row.jenisSumber !== 'BENDAHARA' ? row.jenisSumber : null,
        row.sumberDana,
        row.keterangan
      ].filter(Boolean).join(' - '),
      volume: '-',
      unit: '-',
      income: Number(row.nominal || 0),
      expense: 0
    }));
  const expenses = (rab.pengeluarans || [])
    .filter((row) => row.status === VERIFIED_EXPENSE_STATUS)
    .map((row) => {
      const item = row.itemAnggaran || itemById.get(String(row.itemAnggaranId));
      return {
        id: Number(row.id || 0),
        date: row.tanggal,
        typeOrder: 1,
        description: `${row.uraian}${row.kategori?.nama ? ` (${row.kategori.nama})` : ''}`,
        volume: item ? formatVolume(item.volume) : '-',
        unit: item ? `${item.satuan || 'unit'} @ ${formatRupiah(item.hargaSatuan)}` : '-',
        income: 0,
        expense: Number(row.nominal || 0)
      };
    });
  const returns = (rab.pengembalians || [])
    .filter((row) => row.status === ACTIVE_RECEIPT_STATUS)
    .map((row) => ({
      id: Number(row.id || 0),
      date: row.tanggal,
      typeOrder: 2,
      description: `Pengembalian dana${row.keterangan ? ` - ${row.keterangan}` : ''}`,
      volume: '-',
      unit: '-',
      income: 0,
      expense: Number(row.nominal || 0)
    }));

  const transactions = [...receipts, ...expenses, ...returns].sort((left, right) => {
    const dateDifference = new Date(left.date).getTime() - new Date(right.date).getTime();
    return dateDifference || left.typeOrder - right.typeOrder || left.id - right.id;
  });

  let balance = 0;
  return transactions.map((transaction, index) => {
    balance += transaction.income - transaction.expense;
    return { ...transaction, number: index + 1, balance };
  });
};

const ledgerRowsByDate = (ledger) => {
  const groups = [];
  ledger.forEach((row) => {
    const dateLabel = formatDate(row.date);
    const lastGroup = groups.at(-1);
    if (lastGroup?.dateLabel === dateLabel) lastGroup.rows.push(row);
    else groups.push({ dateLabel, rows: [row] });
  });

  return groups.flatMap((group) => {
    const dailyIncome = group.rows.reduce((total, row) => total + row.income, 0);
    const dailyExpense = group.rows.reduce((total, row) => total + row.expense, 0);
    return [
      [{
        content: `TANGGAL: ${group.dateLabel}  |  ${group.rows.length} transaksi  |  Masuk ${formatRupiah(dailyIncome)}  |  Keluar ${formatRupiah(dailyExpense)}`,
        colSpan: 8,
        styles: {
          fillColor: [226, 232, 240],
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          fontSize: 7,
          cellPadding: 2
        }
      }],
      ...group.rows.map((row) => [
        row.number,
        group.dateLabel,
        row.description,
        row.volume,
        row.unit,
        row.income ? formatRupiah(row.income) : '-',
        row.expense ? formatRupiah(row.expense) : '-',
        formatAccountingRupiah(row.balance)
      ])
    ];
  });
};

export const exportFinanceSummaryPdf = async (rab) => {
  const isLpj = ['REALISASI', 'MENUNGGU_VERIFIKASI_LPJ', 'PERLU_REVISI', 'DALAM_PENYESUAIAN', 'SELESAI'].includes(rab.status);
  const verification = isLpj ? (rab.status === 'SELESAI' ? rab.lpjQrDocument : null) : rab.rabQrDocument;
  const title = isLpj ? 'LAPORAN SUMMARY PERTANGGUNGJAWABAN DANA' : 'LAPORAN SUMMARY RENCANA ANGGARAN BIAYA';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await loadImage('/logo.png');
  const ledger = buildFinanceLedger(rab);
  const shorten = (value, limit = 105) => String(value || '').length > limit
    ? `${String(value).slice(0, limit - 3)}...`
    : String(value || '');

  const drawHeader = () => {
    doc.setFillColor(20, 83, 45);
    doc.rect(0, 0, 210, 32, 'F');
    if (logo) doc.addImage(logo, 'PNG', 14, 6, 20, 20);
    doc.setTextColor(255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 40, 13.5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(shorten(`${rab.nomorRab} - ${rab.namaKegiatan}`), 40, 20.5, { maxWidth: 155 });
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.text('SK KEMENAG RI DIRJEN BIMAS HINDU NO. 471/DJ.VI/BA.01.1/03/2026', 40, 25.5);
    doc.text('SK Kemenkumham RI No. AHU-0000052.AH.01.07.Tahun 2020', 40, 29);
  };
  const ensureSpace = (currentY, requiredHeight = 24) => {
    if (currentY + requiredHeight <= 260) return currentY;
    doc.addPage();
    return 42;
  };
  const sectionTitle = (label, currentY) => {
    const y = ensureSpace(currentY, 18);
    doc.setTextColor(35, 45, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(label, 14, y);
    return y + 3;
  };

  drawHeader();
  autoTable(doc, {
    startY: 38,
    margin: { top: 38, bottom: 24, left: 14, right: 14 },
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 141 } },
    body: [
      ['No. Referensi', rab.nomorReferensi || '-'],
      ['Program Ajahan', rab.programAjahan?.nama || 'Umum'],
      ['Penanggung Jawab', rab.penanggungJawab || '-'],
      ['Periode', `${formatDate(rab.tanggalMulai)} - ${formatDate(rab.tanggalSelesai)}`],
      ['Status', String(rab.status || '-').replaceAll('_', ' ')]
    ]
  });

  let y = sectionTitle('Ringkasan Dana', doc.lastAutoTable.finalY + 6);
  autoTable(doc, {
    startY: y,
    margin: { top: 38, bottom: 24, left: 14, right: 14 },
    theme: 'grid',
    head: [['Dana Disetujui', 'Dana Masuk', 'Realisasi', 'Dikembalikan', 'Sisa Kas']],
    body: [[
      formatRupiah(rab.totalDisetujui),
      formatRupiah(rab.ringkasan.danaMasuk),
      formatRupiah(rab.ringkasan.pengeluaranTerverifikasi),
      formatRupiah(rab.ringkasan.danaDikembalikan),
      formatAccountingRupiah(rab.ringkasan.sisaKas)
    ]],
    headStyles: { fillColor: [22, 101, 52], fontSize: 7.5, halign: 'center' },
    styles: { fontSize: 7.5, halign: 'right', cellPadding: 2 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4 && Number(rab.ringkasan.sisaKas) < 0) {
        data.cell.styles.textColor = [220, 38, 38];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  y = sectionTitle('Rincian Anggaran dan Realisasi', doc.lastAutoTable.finalY + 7);
  autoTable(doc, {
    startY: y,
    margin: { top: 38, bottom: 24, left: 14, right: 14 },
    rowPageBreak: 'avoid',
    head: [['No.', 'Uraian', 'Kategori', 'Volume', 'Harga Satuan', 'Disetujui', 'Realisasi', 'Sisa']],
    body: (rab.items || []).map((item, index) => {
      const realization = (rab.pengeluarans || [])
        .filter((expense) => String(expense.itemAnggaranId) === String(item.id) && expense.status === VERIFIED_EXPENSE_STATUS)
        .reduce((total, expense) => total + Number(expense.nominal || 0), 0);
      return [
        index + 1,
        item.uraian,
        item.kategori?.nama || '-',
        `${formatVolume(item.volume)} ${item.satuan || ''}`.trim(),
        formatRupiah(item.hargaSatuan),
        formatRupiah(item.jumlahDisetujui),
        formatRupiah(realization),
        formatAccountingRupiah(Number(item.jumlahDisetujui || 0) - realization)
      ];
    }),
    headStyles: { fillColor: [30, 41, 59], fontSize: 6.5, halign: 'center' },
    styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 39 },
      2: { cellWidth: 22 },
      3: { cellWidth: 17, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' }
    }
  });

  y = sectionTitle('Buku Kas per Tanggal', doc.lastAutoTable.finalY + 7);
  autoTable(doc, {
    startY: y,
    margin: { top: 38, bottom: 24, left: 14, right: 14 },
    rowPageBreak: 'avoid',
    head: [
      [
        { content: 'NO.', rowSpan: 2 },
        { content: 'TANGGAL', rowSpan: 2 },
        { content: 'URAIAN', rowSpan: 2 },
        { content: 'VOLUME / HARGA', colSpan: 2 },
        { content: 'PEMASUKAN', rowSpan: 2 },
        { content: 'PENGELUARAN', rowSpan: 2 },
        { content: 'SALDO', rowSpan: 2 }
      ],
      [{ content: 'JUMLAH' }, { content: 'UNIT' }]
    ],
    body: ledger.length
      ? ledgerRowsByDate(ledger)
      : [[{ content: 'Belum ada transaksi aktif atau terverifikasi.', colSpan: 8, styles: { halign: 'center', textColor: [100, 116, 139] } }]],
    headStyles: { fillColor: [20, 83, 45], fontSize: 6.2, halign: 'center', valign: 'middle' },
    styles: { fontSize: 6.2, cellPadding: 1.45, overflow: 'linebreak', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 42 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 29 },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 23, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7 && data.row.raw?.[0]?.colSpan !== 8) {
        const ledgerRow = ledger.find((row) => row.number === Number(data.row.raw?.[0]));
        if (ledgerRow?.balance < 0) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  if (verification) {
    y = ensureSpace(doc.lastAutoTable.finalY + 12, 45);
    doc.setTextColor(35, 45, 55);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(verification.jabatan || '-', 45, y, { align: 'center', maxWidth: 55 });
    doc.text(verification.jabatan2 || '-', 165, y, { align: 'center', maxWidth: 55 });
    const qrCanvas = typeof document !== 'undefined'
      ? document.getElementById(`finance-qr-${verification.token}`)
      : null;
    if (qrCanvas) doc.addImage(qrCanvas.toDataURL('image/png'), 'PNG', 92, y - 3, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(verification.namaPejabat || '-', 45, y + 27, { align: 'center', maxWidth: 58 });
    doc.text(verification.namaPejabat2 || '-', 165, y + 27, { align: 'center', maxWidth: 58 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(90);
    doc.text(`Verifikasi: ${verification.token}`, 105, y + 27, { align: 'center' });
    doc.text(formatDate(verification.tanggal), 105, y + 31, { align: 'center' });
  }

  const disclaimer = verification
    ? 'Dokumen ini ditandatangani secara elektronik menggunakan verifikasi QR-Code terenkripsi sistem. Informasi di atas adalah mutlak benar dan sesuai dengan data resmi terverifikasi secara elektronik di dalam server PDPN.'
    : 'Dokumen ini belum disetujui dan belum ditandatangani secara elektronik.';
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawHeader();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110);
    doc.text(`Dicetak dari Vidya - Halaman ${page} dari ${pageCount}`, 105, 283, { align: 'center' });
    doc.setFontSize(6.2);
    doc.text(doc.splitTextToSize(disclaimer, 180), 105, 288, { align: 'center', lineHeightFactor: 1.15 });
  }

  doc.save(`SUMMARY-${isLpj ? 'LPJ' : 'RAB'}-${rab.nomorRab.replaceAll('/', '-')}-Revisi-${rab.revision}.pdf`);
};
