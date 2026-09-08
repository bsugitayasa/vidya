const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_CLAUSES = [
  { id: 'tata-tertib', title: 'Tata Tertib Pasraman', text: 'Saya bersedia menaati tata tertib Pasraman, menjaga kedisiplinan, tata krama, etika, tata busana, serta ketertiban selama mengikuti kegiatan pembelajaran.' },
  { id: 'janji-sisya', title: 'Janji Sisya', text: 'Saya bersedia mengamalkan dan menaati Janji Sisya serta menjaga nama baik Pasraman dan organisasi.' },
  { id: 'penggunaan-materi', title: 'Penggunaan Materi Ajah', text: 'Saya menggunakan buku dan materi ajah hanya untuk kepentingan pembelajaran pribadi dalam program yang saya ikuti.' },
  { id: 'larangan-komersial', title: 'Larangan Komersialisasi', text: 'Saya tidak akan menjual, menyewakan, atau mengomersialkan buku maupun materi ajah dalam bentuk apa pun.' },
  { id: 'larangan-distribusi', title: 'Larangan Distribusi', text: 'Saya tidak akan mengedarkan, memberikan, meneruskan, mengunggah, atau mempublikasikan materi ajah kepada pihak yang tidak berkepentingan.' },
  { id: 'larangan-penggandaan', title: 'Larangan Penggandaan', text: 'Saya tidak akan menggandakan materi melalui fotokopi, pemindaian, rekaman, tangkapan layar, salinan digital, atau cara lainnya tanpa izin tertulis.' },
  { id: 'keamanan-materi', title: 'Keamanan dan Pelaporan', text: 'Saya menjaga keamanan buku, akun, tautan, dan media penyimpanan materi serta segera melaporkan kehilangan atau dugaan kebocoran.' },
  { id: 'pembinaan-sanksi', title: 'Pembinaan dan Sanksi', text: 'Saya bersedia menerima pembinaan atau sanksi sesuai ketentuan resmi Pasraman apabila terbukti melakukan pelanggaran.' }
];

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');
const randomCode = () => crypto.randomBytes(7).toString('hex').toUpperCase();
const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
const dateOnly = (value) => new Date(value).toISOString().slice(0, 10);
const safeUserAgent = (value) => String(value || '').slice(0, 500);
const actorId = (req) => Number(req.user?.id) || null;
const identityAttempts = new Map();
const IDENTITY_WINDOW_MS = 15 * 60 * 1000;
const MAX_IDENTITY_ATTEMPTS = 5;

const attemptKey = (registrationNumber) => sha256(normalize(registrationNumber));
const isIdentityBlocked = (registrationNumber) => {
  const key = attemptKey(registrationNumber);
  const entry = identityAttempts.get(key);
  if (!entry || entry.resetAt <= Date.now()) {
    identityAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_IDENTITY_ATTEMPTS;
};
const recordIdentityFailure = (registrationNumber) => {
  if (identityAttempts.size > 1000) {
    const now = Date.now();
    for (const [key, entry] of identityAttempts) if (entry.resetAt <= now) identityAttempts.delete(key);
  }
  const key = attemptKey(registrationNumber);
  const current = identityAttempts.get(key);
  identityAttempts.set(key, !current || current.resetAt <= Date.now()
    ? { count: 1, resetAt: Date.now() + IDENTITY_WINDOW_MS }
    : { ...current, count: current.count + 1 });
};
const clearIdentityFailures = (registrationNumber) => identityAttempts.delete(attemptKey(registrationNumber));

const maskName = (name) => String(name || '').split(/\s+/).map((part) => {
  if (part.length <= 2) return `${part[0] || ''}*`;
  return `${part[0]}${'*'.repeat(Math.min(part.length - 2, 5))}${part.at(-1)}`;
}).join(' ');

const publicPayload = (assignment, includePrivate = false) => ({
  id: assignment.id,
  nomorDokumen: assignment.nomorDokumen,
  verificationCode: assignment.verificationCode,
  status: assignment.status,
  expiresAt: assignment.expiresAt,
  signedAt: assignment.signedAt,
  namaPenandatangan: includePrivate ? assignment.namaPenandatangan : maskName(assignment.namaPenandatangan || assignment.sisya?.namaLengkap),
  sisya: assignment.sisya ? {
    namaLengkap: includePrivate ? assignment.sisya.namaLengkap : maskName(assignment.sisya.namaLengkap),
    nomorPendaftaran: includePrivate ? assignment.sisya.nomorPendaftaran : `***${assignment.sisya.nomorPendaftaran.slice(-4)}`
  } : undefined,
  template: assignment.template ? {
    id: assignment.template.id,
    kode: assignment.template.kode,
    versi: assignment.template.versi,
    judul: assignment.template.judul,
    referensiPedoman: assignment.template.referensiPedoman
  } : undefined,
  contentSnapshot: assignment.contentSnapshot,
  programSnapshot: assignment.programSnapshot,
  signatureData: includePrivate ? assignment.signatureData : undefined,
  documentHash: assignment.documentHash,
  evidenceHash: assignment.evidenceHash
});

const expirePending = () => prisma.paktaSisya.updateMany({
  where: { status: 'MENUNGGU', expiresAt: { lt: new Date() } },
  data: { status: 'KEDALUWARSA' }
});

const isFeatureEnabled = async () => {
  const config = await prisma.konfigurasiAplikasi.findUnique({ where: { kunci: 'pakta_integritas_enabled' } });
  return !config || config.nilai === 'true';
};

const getTemplates = async (req, res) => {
  try {
    const data = await prisma.paktaTemplate.findMany({
      include: { _count: { select: { paktaSisyas: true } } },
      orderBy: [{ createdAt: 'desc' }]
    });
    res.json({ success: true, data, defaults: { clauses: DEFAULT_CLAUSES } });
  } catch (error) {
    console.error('Get Pakta Templates Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat template pakta' });
  }
};

const validateTemplate = (body) => {
  const clauses = Array.isArray(body.klausul) ? body.klausul
    .map((item, index) => ({ id: String(item.id || `klausul-${index + 1}`), title: String(item.title || '').trim(), text: String(item.text || '').trim() }))
    .filter((item) => item.title && item.text) : [];
  if (!body.kode?.trim() || !body.judul?.trim() || !body.pembuka?.trim() || !body.referensiPedoman?.trim() || !body.tanggalBerlaku || clauses.length === 0) return null;
  return {
    kode: body.kode.trim().toUpperCase(), judul: body.judul.trim(), pembuka: body.pembuka.trim(),
    referensiPedoman: body.referensiPedoman.trim(), tanggalBerlaku: new Date(body.tanggalBerlaku),
    batasHari: Math.min(365, Math.max(1, Number(body.batasHari) || 14)),
    wajibTandaUlang: body.wajibTandaUlang !== false, klausul: clauses
  };
};

const createTemplate = async (req, res) => {
  try {
    const data = validateTemplate(req.body);
    if (!data || Number.isNaN(data.tanggalBerlaku.getTime())) return res.status(400).json({ success: false, message: 'Data template dan minimal satu klausul wajib diisi lengkap' });
    const latest = await prisma.paktaTemplate.aggregate({ where: { kode: data.kode }, _max: { versi: true } });
    const created = await prisma.paktaTemplate.create({ data: { ...data, versi: (latest._max.versi || 0) + 1, createdById: actorId(req) } });
    res.status(201).json({ success: true, message: 'Draft pakta berhasil dibuat', data: created });
  } catch (error) {
    console.error('Create Pakta Template Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat draft pakta' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.paktaTemplate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
    if (existing.status !== 'DRAFT') return res.status(409).json({ success: false, message: 'Template yang sudah diterbitkan tidak dapat diubah. Buat versi baru agar dokumen lama tetap utuh.' });
    const data = validateTemplate(req.body);
    if (!data) return res.status(400).json({ success: false, message: 'Data template belum lengkap' });
    delete data.kode;
    const updated = await prisma.paktaTemplate.update({ where: { id }, data });
    res.json({ success: true, message: 'Draft pakta berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Update Pakta Template Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui draft pakta' });
  }
};

const publishTemplate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const template = await prisma.paktaTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
    if (template.status !== 'DRAFT') return res.status(409).json({ success: false, message: 'Hanya draft yang dapat diterbitkan' });
    const result = await prisma.$transaction(async (tx) => {
      await tx.paktaTemplate.updateMany({ where: { status: 'AKTIF' }, data: { status: 'DINONAKTIFKAN' } });
      if (template.wajibTandaUlang) await tx.paktaSisya.updateMany({ where: { status: 'DITANDATANGANI' }, data: { status: 'DIGANTIKAN' } });
      return tx.paktaTemplate.update({ where: { id }, data: { status: 'AKTIF', publishedAt: new Date(), publishedById: actorId(req) } });
    });
    res.json({ success: true, message: 'Pakta resmi diterbitkan. Selanjutnya buat tautan untuk sisya aktif.', data: result });
  } catch (error) {
    console.error('Publish Pakta Template Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menerbitkan pakta' });
  }
};

const getAssignments = async (req, res) => {
  try {
    await expirePending();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(2000, Math.max(10, Number(req.query.limit) || 25));
    const search = String(req.query.search || '').trim();
    const templateId = Number(req.query.templateId);
    const programId = Number(req.query.programId);
    const status = String(req.query.status || '');
    const where = {
      ...(templateId ? { templateId } : {}),
      ...(status ? { status } : {}),
      ...(search ? { sisya: { OR: [{ namaLengkap: { contains: search, mode: 'insensitive' } }, { nomorPendaftaran: { contains: search, mode: 'insensitive' } }] } } : {}),
      ...(programId ? { sisya: { ...(search ? { OR: [{ namaLengkap: { contains: search, mode: 'insensitive' } }, { nomorPendaftaran: { contains: search, mode: 'insensitive' } }] } : {}), programSisyas: { some: { programAjahanId: programId } } } } : {})
    };
    const [data, total] = await Promise.all([
      prisma.paktaSisya.findMany({ where, include: { sisya: { select: { id: true, namaLengkap: true, nomorPendaftaran: true, noHp: true } }, template: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.paktaSisya.count({ where })
    ]);
    res.json({ success: true, data: data.map((item) => ({ ...item, signatureData: undefined })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get Pakta Assignments Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat daftar pakta sisya' });
  }
};

const getStats = async (req, res) => {
  try {
    await expirePending();
    let templateId = Number(req.query.templateId);
    if (!templateId) {
      const active = await prisma.paktaTemplate.findFirst({ where: { status: 'AKTIF' }, select: { id: true } });
      templateId = active?.id;
    }
    const where = templateId ? { templateId } : { id: -1 };
    const grouped = await prisma.paktaSisya.groupBy({ by: ['status'], where, _count: { _all: true } });
    const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));
    const totalAktif = await prisma.sisya.count({ where: { status: { not: 'TIDAK_AKTIF' } } });
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const signed = counts.DITANDATANGANI || 0;
    res.json({ success: true, data: { totalSisyaAktif: totalAktif, totalPakta: total, ...counts, BELUM_MENANDATANGANI: Math.max(0, totalAktif - signed), persentase: totalAktif ? Math.round((signed / totalAktif) * 100) : 0 } });
  } catch (error) {
    console.error('Get Pakta Stats Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik pakta' });
  }
};

const buildAssignment = (sisya, template, req, rawToken) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + template.batasHari * 86400000);
  const programs = sisya.programSisyas.map((item) => ({ id: item.programAjahan.id, kode: item.programAjahan.kode, nama: item.programAjahan.nama, nomorRegistrasi: item.nomorRegistrasi }));
  const content = { judul: template.judul, pembuka: template.pembuka, klausul: template.klausul, referensiPedoman: template.referensiPedoman, kode: template.kode, versi: template.versi, tanggalBerlaku: template.tanggalBerlaku };
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return {
    sisyaId: sisya.id, templateId: template.id,
    nomorDokumen: `PI/${new Date().getFullYear()}/${template.versi}/${sisya.nomorPendaftaran}/${suffix}`,
    tokenHash: sha256(rawToken), tokenHint: rawToken.slice(-6), verificationCode: randomCode(), expiresAt,
    contentSnapshot: content, programSnapshot: programs, createdById: actorId(req)
  };
};

const generateAssignments = async (req, res) => {
  try {
    const templateId = Number(req.body.templateId);
    const template = await prisma.paktaTemplate.findUnique({ where: { id: templateId } });
    if (!template || template.status !== 'AKTIF') return res.status(400).json({ success: false, message: 'Pilih template pakta yang aktif' });
    const ids = Array.isArray(req.body.sisyaIds) ? req.body.sisyaIds.map(Number).filter(Boolean) : [];
    const programId = Number(req.body.programId);
    const sisyas = await prisma.sisya.findMany({
      where: { status: { not: 'TIDAK_AKTIF' }, ...(ids.length ? { id: { in: ids } } : {}), ...(programId ? { programSisyas: { some: { programAjahanId: programId } } } : {}) },
      include: { programSisyas: { include: { programAjahan: { select: { id: true, kode: true, nama: true } } } } },
      orderBy: { nomorPendaftaran: 'asc' }
    });
    if (!sisyas.length) return res.status(404).json({ success: false, message: 'Tidak ada sisya aktif yang sesuai' });
    const existing = await prisma.paktaSisya.findMany({ where: { templateId, sisyaId: { in: sisyas.map((item) => item.id) } }, select: { sisyaId: true } });
    const existingIds = new Set(existing.map((item) => item.sisyaId));
    const generated = [];
    for (const sisya of sisyas.filter((item) => !existingIds.has(item.id))) {
      const rawToken = randomToken();
      const assignment = await prisma.paktaSisya.create({ data: buildAssignment(sisya, template, req, rawToken) });
      await prisma.paktaAudit.create({ data: { paktaSisyaId: assignment.id, action: 'LINK_DIBUAT', actorType: 'ADMIN', actorUserId: actorId(req) } });
      generated.push({ id: assignment.id, sisyaId: sisya.id, namaLengkap: sisya.namaLengkap, nomorPendaftaran: sisya.nomorPendaftaran, publicPath: `/pakta-integritas/${rawToken}`, expiresAt: assignment.expiresAt });
    }
    res.status(201).json({ success: true, message: `${generated.length} tautan baru dibuat; ${existing.length} sisya sudah memiliki pakta versi ini.`, data: generated, skipped: existing.length });
  } catch (error) {
    console.error('Generate Pakta Assignments Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat tautan pakta' });
  }
};

const regenerateAssignment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.paktaSisya.findUnique({ where: { id }, include: { template: true, sisya: true } });
    if (!item || item.status === 'DITANDATANGANI') return res.status(409).json({ success: false, message: 'Pakta tidak ditemukan atau sudah ditandatangani' });
    const rawToken = randomToken();
    const expiresAt = new Date(Date.now() + item.template.batasHari * 86400000);
    await prisma.$transaction([
      prisma.paktaSisya.update({ where: { id }, data: { tokenHash: sha256(rawToken), tokenHint: rawToken.slice(-6), expiresAt, status: 'MENUNGGU', revokedReason: null } }),
      prisma.paktaAudit.create({ data: { paktaSisyaId: id, action: 'LINK_DIPERBARUI', actorType: 'ADMIN', actorUserId: actorId(req) } })
    ]);
    res.json({ success: true, message: 'Tautan baru berhasil dibuat', data: { publicPath: `/pakta-integritas/${rawToken}`, expiresAt } });
  } catch (error) {
    console.error('Regenerate Pakta Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui tautan' });
  }
};

const revokeAssignment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) return res.status(400).json({ success: false, message: 'Alasan pembatalan minimal 5 karakter' });
    await prisma.$transaction([
      prisma.paktaSisya.update({ where: { id }, data: { status: 'DIBATALKAN', revokedReason: reason } }),
      prisma.paktaAudit.create({ data: { paktaSisyaId: id, action: 'DIBATALKAN', actorType: 'ADMIN', actorUserId: actorId(req), metadata: { reason } } })
    ]);
    res.json({ success: true, message: 'Pakta berhasil dibatalkan' });
  } catch (error) {
    console.error('Revoke Pakta Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membatalkan pakta' });
  }
};

const getAdminDocument = async (req, res) => {
  try {
    const item = await prisma.paktaSisya.findUnique({ where: { id: Number(req.params.id) }, include: { sisya: true, template: true, audits: { orderBy: { createdAt: 'asc' } } } });
    if (!item) return res.status(404).json({ success: false, message: 'Pakta tidak ditemukan' });
    res.json({ success: true, data: { ...publicPayload(item, true), audits: item.audits, revokedReason: item.revokedReason } });
  } catch (error) {
    console.error('Get Admin Pakta Document Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat dokumen pakta' });
  }
};

const findByRawToken = (token) => prisma.paktaSisya.findUnique({ where: { tokenHash: sha256(token) }, include: { sisya: true, template: true } });

const resolveGeneralAssignment = async (sisya, template) => {
  let assignment = await prisma.paktaSisya.findUnique({
    where: { sisyaId_templateId: { sisyaId: sisya.id, templateId: template.id } },
    include: { sisya: true, template: true }
  });
  if (!assignment) {
    const rawToken = randomToken();
    try {
      const created = await prisma.paktaSisya.create({
        data: { ...buildAssignment(sisya, template, { user: { id: template.publishedById || template.createdById } }, rawToken), expiresAt: new Date('2099-12-31T23:59:59.000Z') }
      });
      await prisma.paktaAudit.create({ data: { paktaSisyaId: created.id, action: 'DIBUAT_DARI_PORTAL_UMUM', actorType: 'SYSTEM' } });
    } catch (error) {
      if (error.code !== 'P2002') throw error;
    }
    assignment = await prisma.paktaSisya.findUnique({
      where: { sisyaId_templateId: { sisyaId: sisya.id, templateId: template.id } },
      include: { sisya: true, template: true }
    });
  }
  if (assignment.status === 'KEDALUWARSA') {
    assignment = await prisma.paktaSisya.update({
      where: { id: assignment.id }, data: { status: 'MENUNGGU', expiresAt: new Date('2099-12-31T23:59:59.000Z') },
      include: { sisya: true, template: true }
    });
  }
  return assignment;
};

const verifyIdentityGeneral = async (req, res) => {
  try {
    if (!(await isFeatureEnabled())) return res.status(503).json({ success: false, message: 'Penandatanganan Pakta Integritas sedang dinonaktifkan' });
    const registrationNumber = String(req.body.nomorPendaftaran || '').trim();
    if (!registrationNumber || !req.body.tanggalLahir) return res.status(400).json({ success: false, message: 'Nomor pendaftaran dan tanggal lahir wajib diisi' });
    if (isIdentityBlocked(registrationNumber)) return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Silakan coba kembali setelah 15 menit.' });
    const [sisya, template] = await Promise.all([
      prisma.sisya.findFirst({
        where: { nomorPendaftaran: { equals: registrationNumber, mode: 'insensitive' }, status: { not: 'TIDAK_AKTIF' } },
        include: { programSisyas: { include: { programAjahan: { select: { id: true, kode: true, nama: true } } } } }
      }),
      prisma.paktaTemplate.findFirst({ where: { status: 'AKTIF', tanggalBerlaku: { lte: new Date() } }, orderBy: { versi: 'desc' } })
    ]);
    if (!sisya || dateOnly(sisya.tanggalLahir) !== String(req.body.tanggalLahir)) {
      recordIdentityFailure(registrationNumber);
      return res.status(400).json({ success: false, message: 'Data tidak ditemukan atau tidak sesuai' });
    }
    if (!template) return res.status(404).json({ success: false, message: 'Belum ada Pakta Integritas aktif' });
    clearIdentityFailures(registrationNumber);
    const item = await resolveGeneralAssignment(sisya, template);
    if (['DIBATALKAN', 'DIGANTIKAN'].includes(item.status)) return res.status(409).json({ success: false, message: 'Pakta tidak dapat diproses. Silakan hubungi admin Pasraman.' });
    await prisma.paktaAudit.create({ data: { paktaSisyaId: item.id, action: 'IDENTITAS_DIVERIFIKASI_PORTAL_UMUM', actorType: 'SISYA' } });
    if (item.status === 'DITANDATANGANI') {
      return res.json({ success: true, message: 'Pakta Integritas telah ditandatangani', data: { alreadySigned: true, pakta: publicPayload(item, true) } });
    }
    const verificationToken = jwt.sign({ type: 'pakta-sign', assignmentId: item.id, tokenHash: item.tokenHash }, process.env.JWT_SECRET, { expiresIn: '20m' });
    res.json({ success: true, message: 'Identitas berhasil diverifikasi', data: { alreadySigned: false, verificationToken, pakta: publicPayload(item, true) } });
  } catch (error) {
    console.error('Verify General Pakta Identity Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi identitas' });
  }
};

const getPublicPakta = async (req, res) => {
  try {
    if (!(await isFeatureEnabled())) return res.status(503).json({ success: false, message: 'Penandatanganan Pakta Integritas sedang dinonaktifkan' });
    const item = await findByRawToken(req.params.token);
    if (!item) return res.status(404).json({ success: false, message: 'Tautan Pakta Integritas tidak valid' });
    if (item.status === 'MENUNGGU' && item.expiresAt < new Date()) {
      await prisma.paktaSisya.update({ where: { id: item.id }, data: { status: 'KEDALUWARSA' } });
      item.status = 'KEDALUWARSA';
    }
    res.json({ success: true, data: { ...publicPayload(item, item.status === 'DITANDATANGANI'), requiresVerification: item.status === 'MENUNGGU' } });
  } catch (error) {
    console.error('Get Public Pakta Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat Pakta Integritas' });
  }
};

const verifyIdentity = async (req, res) => {
  try {
    if (!(await isFeatureEnabled())) return res.status(503).json({ success: false, message: 'Penandatanganan Pakta Integritas sedang dinonaktifkan' });
    const item = await findByRawToken(req.params.token);
    if (!item || item.status !== 'MENUNGGU' || item.expiresAt < new Date()) return res.status(403).json({ success: false, message: 'Tautan tidak aktif atau sudah kedaluwarsa' });
    if (normalize(req.body.nomorPendaftaran) !== normalize(item.sisya.nomorPendaftaran) || String(req.body.tanggalLahir || '') !== dateOnly(item.sisya.tanggalLahir)) {
      return res.status(400).json({ success: false, message: 'Nomor pendaftaran atau tanggal lahir tidak sesuai' });
    }
    const verificationToken = jwt.sign({ type: 'pakta-sign', assignmentId: item.id, tokenHash: item.tokenHash }, process.env.JWT_SECRET, { expiresIn: '20m' });
    await prisma.paktaAudit.create({ data: { paktaSisyaId: item.id, action: 'IDENTITAS_DIVERIFIKASI', actorType: 'SISYA' } });
    res.json({ success: true, message: 'Identitas berhasil diverifikasi', data: { verificationToken, pakta: publicPayload(item, true) } });
  } catch (error) {
    console.error('Verify Pakta Identity Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi identitas' });
  }
};

const signPakta = async (req, res) => {
  try {
    if (!(await isFeatureEnabled())) return res.status(503).json({ success: false, message: 'Penandatanganan Pakta Integritas sedang dinonaktifkan' });
    let proof;
    try { proof = jwt.verify(String(req.body.verificationToken || ''), process.env.JWT_SECRET); } catch { return res.status(401).json({ success: false, message: 'Sesi verifikasi telah berakhir. Silakan verifikasi ulang.' }); }
    if (proof.type !== 'pakta-sign') return res.status(401).json({ success: false, message: 'Sesi verifikasi tidak valid' });
    const item = await prisma.paktaSisya.findUnique({ where: { id: Number(proof.assignmentId) }, include: { sisya: true, template: true } });
    if (!item || item.tokenHash !== proof.tokenHash || item.status !== 'MENUNGGU' || item.expiresAt < new Date()) return res.status(409).json({ success: false, message: 'Pakta sudah diproses atau tautan tidak lagi aktif' });
    const name = String(req.body.namaPenandatangan || '').trim().replace(/\s+/g, ' ');
    if (normalize(name) !== normalize(item.sisya.namaLengkap)) return res.status(400).json({ success: false, message: 'Nama penandatangan harus sesuai dengan nama lengkap sisya' });
    const clauses = Array.isArray(item.contentSnapshot?.klausul) ? item.contentSnapshot.klausul : [];
    const accepted = Array.isArray(req.body.acceptedClauseIds) ? [...new Set(req.body.acceptedClauseIds.map(String))] : [];
    if (!req.body.readAgreement || clauses.some((clause) => !accepted.includes(String(clause.id)))) return res.status(400).json({ success: false, message: 'Seluruh pernyataan Pakta Integritas wajib disetujui' });
    const signature = String(req.body.signatureData || '');
    if (!/^data:image\/(png|jpeg);base64,/.test(signature) || signature.length > 900000) return res.status(400).json({ success: false, message: 'Tanda tangan belum tersedia atau ukurannya tidak valid' });
    const signedAt = new Date();
    const documentHash = sha256(JSON.stringify({ number: item.nomorDokumen, sisya: item.sisyaId, content: item.contentSnapshot, programs: item.programSnapshot }));
    const consentSnapshot = clauses.map((clause) => ({ id: clause.id, accepted: true }));
    const evidenceHash = sha256(JSON.stringify({ documentHash, signedAt: signedAt.toISOString(), name, consentSnapshot, signatureHash: sha256(signature) }));
    const ip = req.ip || req.socket?.remoteAddress || '';
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.paktaSisya.updateMany({ where: { id: item.id, status: 'MENUNGGU' }, data: { status: 'DITANDATANGANI', namaPenandatangan: name, consentSnapshot, signatureData: signature, signedAt, ipHash: sha256(`${process.env.JWT_SECRET}:${ip}`), userAgent: safeUserAgent(req.headers['user-agent']), documentHash, evidenceHash } });
      if (result.count !== 1) throw new Error('ALREADY_SIGNED');
      await tx.paktaAudit.create({ data: { paktaSisyaId: item.id, action: 'DITANDATANGANI', actorType: 'SISYA', metadata: { evidenceHash } } });
      return tx.paktaSisya.findUnique({ where: { id: item.id }, include: { sisya: true, template: true } });
    });
    res.status(201).json({ success: true, message: 'Pakta Integritas berhasil ditandatangani', data: publicPayload(updated, true) });
  } catch (error) {
    console.error('Sign Pakta Error:', error);
    res.status(error.message === 'ALREADY_SIGNED' ? 409 : 500).json({ success: false, message: error.message === 'ALREADY_SIGNED' ? 'Pakta sudah ditandatangani' : 'Gagal menyimpan tanda tangan' });
  }
};

const verifyPublicDocument = async (req, res) => {
  try {
    const item = await prisma.paktaSisya.findUnique({ where: { verificationCode: String(req.params.code || '').toUpperCase() }, include: { sisya: true, template: true } });
    if (!item) return res.status(404).json({ success: false, valid: false, message: 'Dokumen Pakta Integritas tidak ditemukan' });
    const valid = item.status === 'DITANDATANGANI';
    res.json({ success: true, valid, message: valid ? 'Dokumen Pakta Integritas terverifikasi' : `Dokumen berstatus ${item.status}`, data: publicPayload(item, false) });
  } catch (error) {
    console.error('Verify Public Pakta Document Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi dokumen' });
  }
};

module.exports = { DEFAULT_CLAUSES, getTemplates, createTemplate, updateTemplate, publishTemplate, getAssignments, getStats, generateAssignments, regenerateAssignment, revokeAssignment, getAdminDocument, getPublicPakta, verifyIdentityGeneral, verifyIdentity, signPakta, verifyPublicDocument };
