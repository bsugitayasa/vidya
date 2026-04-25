const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const configs = await prisma.konfigurasiAplikasi.findMany();
    // Convert array to object key-value pairs for easier frontend usage
    const configData = {};
    configs.forEach(c => {
      configData[c.kunci] = {
        id: c.id,
        nilai: c.nilai,
        label: c.label
      };
    });
    
    res.json({ success: true, data: configData });
  } catch (error) {
    console.error('Get Konfigurasi Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const update = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { kunci, nilai }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'Format data tidak valid' });
    }

    const updatedConfigs = await prisma.$transaction(
      updates.map(updateData => 
        prisma.konfigurasiAplikasi.update({
          where: { kunci: updateData.kunci },
          data: { nilai: updateData.nilai }
        })
      )
    );

    res.json({ success: true, message: 'Konfigurasi berhasil diperbarui', data: updatedConfigs });
  } catch (error) {
    console.error('Update Konfigurasi Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi' });
  }
};

module.exports = {
  getAll,
  update
};
