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

const uploadMusik = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }

    const musicPath = `/api/sisya/files/${req.file.filename}`;

    const config = await prisma.konfigurasiAplikasi.upsert({
      where: { kunci: 'musik_kelulusan' },
      update: { nilai: musicPath },
      create: { 
        kunci: 'musik_kelulusan', 
        nilai: musicPath,
        label: 'Musik Latar Kelulusan'
      }
    });

    res.json({ 
      success: true, 
      message: 'Musik berhasil diunggah', 
      data: config 
    });
  } catch (error) {
    console.error('Upload Musik Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengunggah musik' });
  }
};

module.exports = {
  getAll,
  update,
  uploadMusik
};
