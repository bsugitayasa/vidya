const { Prisma } = require('@prisma/client');

const ACTIVE_EXPENSE_STATUSES = ['MENUNGGU_VERIFIKASI', 'VERIFIKASI'];

const rabInclude = {
  arsips: { select: { id: true, revision: true, alasan: true, createdAt: true }, orderBy: { revision: 'desc' } },
  perubahanAnggarans: { orderBy: { createdAt: 'desc' } },
  programAjahan: { select: { id: true, kode: true, nama: true } },
  createdBy: { select: { id: true, nama: true, role: true } },
  approvedBy: { select: { id: true, nama: true } },
  closedBy: { select: { id: true, nama: true } },
  rabQrDocument: true,
  lpjQrDocument: true,
  items: {
    include: { kategori: true },
    orderBy: { urutan: 'asc' }
  },
  pencairans: {
    include: {
      akunKas: true,
      createdBy: { select: { id: true, nama: true } },
      cancelledBy: { select: { id: true, nama: true } }
    },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }]
  },
  pengeluarans: {
    include: {
      kategori: true,
      akunKas: true,
      itemAnggaran: { select: { id: true, uraian: true } },
      createdBy: { select: { id: true, nama: true } },
      verifiedBy: { select: { id: true, nama: true } },
      cancelledBy: { select: { id: true, nama: true } }
    },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }]
  },
  pengembalians: {
    include: {
      akunKas: true,
      createdBy: { select: { id: true, nama: true } },
      cancelledBy: { select: { id: true, nama: true } }
    },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }]
  }
};

const money = (value) => Number(value || 0);
const sum = (rows, selector) => rows.reduce((total, row) => total + money(selector(row)), 0);

const summarizeRab = (rab) => {
  const danaMasuk = sum(rab.pencairans || [], (row) => row.status === 'AKTIF' ? row.nominal : 0);
  const pengeluaranTerverifikasi = sum(rab.pengeluarans || [], (row) => row.status === 'VERIFIKASI' ? row.nominal : 0);
  const pengeluaranMenunggu = sum(rab.pengeluarans || [], (row) => row.status === 'MENUNGGU_VERIFIKASI' ? row.nominal : 0);
  const danaDikembalikan = sum(rab.pengembalians || [], (row) => row.status === 'AKTIF' ? row.nominal : 0);
  const totalDisetujui = money(rab.totalDisetujui);

  return {
    pencairanBendahara: sum(rab.pencairans || [], row => row.status === 'AKTIF' && (!row.jenisSumber || row.jenisSumber === 'BENDAHARA') ? row.nominal : 0),
    danaTambahan: sum(rab.pencairans || [], row => row.status === 'AKTIF' && row.jenisSumber && row.jenisSumber !== 'BENDAHARA' ? row.nominal : 0),
    penerimaanMenunggu: sum(rab.pencairans || [], row => row.status === 'MENUNGGU_VERIFIKASI' ? row.nominal : 0),
    danaMasuk,
    pengeluaranTerverifikasi,
    pengeluaranMenunggu,
    danaDikembalikan,
    sisaKas: danaMasuk - pengeluaranTerverifikasi - danaDikembalikan,
    kasTersediaUntukInput: danaMasuk - pengeluaranTerverifikasi - pengeluaranMenunggu - danaDikembalikan,
    sisaAnggaran: totalDisetujui - pengeluaranTerverifikasi,
    persentaseRealisasi: totalDisetujui > 0 ? Math.round((pengeluaranTerverifikasi / totalDisetujui) * 10000) / 100 : 0
  };
};

const serializeQrDocument = (document) => document ? { ...document, id: document.id.toString() } : null;
const summarizeAccount = (rab, akunKasId) => summarizeRab({ ...rab,
  pencairans: (rab.pencairans || []).filter(r => r.akunKasId === Number(akunKasId)),
  pengeluarans: (rab.pengeluarans || []).filter(r => r.akunKasId === Number(akunKasId)),
  pengembalians: (rab.pengembalians || []).filter(r => r.akunKasId === Number(akunKasId))
});

const withSummary = (rab) => ({
  ...rab,
  rabQrDocumentId: rab.rabQrDocumentId?.toString() || null,
  lpjQrDocumentId: rab.lpjQrDocumentId?.toString() || null,
  rabQrDocument: serializeQrDocument(rab.rabQrDocument),
  lpjQrDocument: serializeQrDocument(rab.lpjQrDocument),
  ringkasan: summarizeRab(rab)
});

const audit = (tx, { entityType, entityId, action, oldValue, newValue, reason, userId }) => tx.auditKeuangan.create({
  data: {
    entityType,
    entityId,
    action,
    oldValue: oldValue === undefined ? Prisma.JsonNull : oldValue,
    newValue: newValue === undefined ? Prisma.JsonNull : newValue,
    reason: reason || null,
    userId
  }
});

const financeRoles = ['ADMIN', 'BENDAHARA', 'SUPER_ADMIN'];
const treasurerRoles = ['BENDAHARA', 'SUPER_ADMIN'];

module.exports = {
  ACTIVE_EXPENSE_STATUSES,
  rabInclude,
  money,
  summarizeRab,
  summarizeAccount,
  withSummary,
  audit,
  financeRoles,
  treasurerRoles
};
