const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const programs = await prisma.programAjahan.findMany({
      where: { isAktif: true },
      orderBy: { urutan: 'asc' }
    });
    res.json({ success: true, data: programs });
  } catch (error) {
    console.error('Get Program Ajahan Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateTarif = async (req, res) => {
  try {
    const { id } = req.params;
    const { puniaNormal, puniaPasangan } = req.body;

    const updatedProgram = await prisma.programAjahan.update({
      where: { id: parseInt(id) },
      data: {
        puniaNormal: parseInt(puniaNormal),
        puniaPasangan: puniaPasangan ? parseInt(puniaPasangan) : null
      }
    });

    res.json({ success: true, message: 'Tarif program berhasil diperbarui', data: updatedProgram });
  } catch (error) {
    console.error('Update Tarif Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui tarif program' });
  }
};

module.exports = {
  getAll,
  updateTarif
};
