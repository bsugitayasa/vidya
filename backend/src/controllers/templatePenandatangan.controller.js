const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const templates = await prisma.templatePenandatangan.findMany({
      orderBy: { namaTemplate: 'asc' }
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Get Template Penandatangan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data template' });
  }
};

const create = async (req, res) => {
  try {
    const { namaTemplate, namaPejabat, jabatan, namaPejabat2, jabatan2 } = req.body;

    if (!namaTemplate || !namaPejabat || !jabatan) {
      return res.status(400).json({ success: false, message: 'Nama template, nama pejabat, dan jabatan wajib diisi' });
    }

    const existing = await prisma.templatePenandatangan.findUnique({
      where: { namaTemplate }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Nama template sudah digunakan' });
    }

    const template = await prisma.templatePenandatangan.create({
      data: {
        namaTemplate,
        namaPejabat,
        jabatan,
        namaPejabat2: namaPejabat2 || null,
        jabatan2: jabatan2 || null,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template penandatangan berhasil dibuat',
      data: template
    });
  } catch (error) {
    console.error('Create Template Penandatangan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat template' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaTemplate, namaPejabat, jabatan, namaPejabat2, jabatan2 } = req.body;

    if (!namaTemplate || !namaPejabat || !jabatan) {
      return res.status(400).json({ success: false, message: 'Nama template, nama pejabat, dan jabatan wajib diisi' });
    }

    const existing = await prisma.templatePenandatangan.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
    }

    // Check duplicate name (exclude self)
    const duplicate = await prisma.templatePenandatangan.findFirst({
      where: {
        namaTemplate,
        NOT: { id: parseInt(id) }
      }
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Nama template sudah digunakan' });
    }

    const template = await prisma.templatePenandatangan.update({
      where: { id: parseInt(id) },
      data: {
        namaTemplate,
        namaPejabat,
        jabatan,
        namaPejabat2: namaPejabat2 || null,
        jabatan2: jabatan2 || null,
      }
    });

    res.json({
      success: true,
      message: 'Template berhasil diperbarui',
      data: template
    });
  } catch (error) {
    console.error('Update Template Penandatangan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui template' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.templatePenandatangan.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
    }

    await prisma.templatePenandatangan.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Template berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete Template Penandatangan Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus template' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove
};
