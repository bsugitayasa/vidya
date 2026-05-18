const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Generate secure 8-character alphanumeric uppercase token
const generateUniqueToken = async () => {
  let attempts = 0;
  while (attempts < 10) {
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
    const existing = await prisma.qrDocument.findUnique({
      where: { token }
    });
    if (!existing) {
      return token;
    }
    attempts++;
  }
  throw new Error('Gagal men-generate token unik');
};

// Safe helper to serialize BigInt fields to String for JSON safety
const serializeDocument = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.id.toString(),
  };
};

const createDocument = async (req, res) => {
  try {
    const { nomorSurat, keteranganSurat, tanggal, namaPejabat, jabatan, namaPejabat2, jabatan2 } = req.body;

    if (!nomorSurat || !keteranganSurat || !tanggal || !namaPejabat || !jabatan) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    const token = await generateUniqueToken();
    
    // Generate a unique 64-bit BigInt using timestamp and random tail
    const rawId = BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));

    const newDoc = await prisma.qrDocument.create({
      data: {
        id: rawId,
        token,
        nomorSurat,
        keteranganSurat,
        tanggal: new Date(tanggal),
        namaPejabat,
        jabatan,
        namaPejabat2: namaPejabat2 || null,
        jabatan2: jabatan2 || null,
      }
    });

    res.status(201).json({
      success: true,
      message: 'QR-Code Dokumen berhasil digenerate',
      data: serializeDocument(newDoc)
    });
  } catch (error) {
    console.error('Create QR Document Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat QR Dokumen' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    // Define search condition globally
    const searchCondition = search ? {
      OR: [
        { token: { contains: search, mode: 'insensitive' } },
        { nomorSurat: { contains: search, mode: 'insensitive' } },
        { keteranganSurat: { contains: search, mode: 'insensitive' } },
        { namaPejabat: { contains: search, mode: 'insensitive' } },
        { jabatan: { contains: search, mode: 'insensitive' } },
        { namaPejabat2: { contains: search, mode: 'insensitive' } },
        { jabatan2: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    // Get total items for pagination math
    const totalItems = await prisma.qrDocument.count({
      where: searchCondition
    });

    // Fetch paginated sorted records
    const docs = await prisma.qrDocument.findMany({
      where: searchCondition,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    });

    res.json({
      success: true,
      data: docs.map(serializeDocument),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Get QR Documents Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data dokumen' });
  }
};

const verifyDocumentPublic = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token tidak boleh kosong' });
    }

    const doc = await prisma.qrDocument.findUnique({
      where: { token: token.toUpperCase() }
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Dokumen tidak valid / palsu'
      });
    }

    res.json({
      success: true,
      valid: true,
      message: 'Dokumen asli terverifikasi',
      data: serializeDocument(doc)
    });
  } catch (error) {
    console.error('Verify Document Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { nomorSurat, keteranganSurat, tanggal, namaPejabat, jabatan, namaPejabat2, jabatan2 } = req.body;

    if (!nomorSurat || !keteranganSurat || !tanggal || !namaPejabat || !jabatan) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    const doc = await prisma.qrDocument.findUnique({
      where: { id: BigInt(id) }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }

    const updatedDoc = await prisma.qrDocument.update({
      where: { id: BigInt(id) },
      data: {
        nomorSurat,
        keteranganSurat,
        tanggal: new Date(tanggal),
        namaPejabat,
        jabatan,
        namaPejabat2: namaPejabat2 || null,
        jabatan2: jabatan2 || null,
        modifiedBy: req.user.email,
        modifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Dokumen berhasil diupdate (re-generate)',
      data: serializeDocument(updatedDoc)
    });
  } catch (error) {
    console.error('Update Document Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate dokumen' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await prisma.qrDocument.findUnique({
      where: { id: BigInt(id) }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }

    await prisma.qrDocument.delete({
      where: { id: BigInt(id) }
    });

    res.json({
      success: true,
      message: 'Dokumen berhasil dihapus dari sistem'
    });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus dokumen' });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  verifyDocumentPublic,
  updateDocument,
  deleteDocument
};
