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

const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { puniaNormal, puniaPasangan, kodeSertifikat, nama, urutan, isPasanganTersedia, isAktif } = req.body;

    const oldProgram = await prisma.programAjahan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!oldProgram) {
      return res.status(404).json({ success: false, message: 'Program tidak ditemukan' });
    }

    const updatedProgram = await prisma.programAjahan.update({
      where: { id: parseInt(id) },
      data: {
        nama: nama !== undefined ? nama : oldProgram.nama,
        puniaNormal: puniaNormal !== undefined ? parseInt(puniaNormal) : oldProgram.puniaNormal,
        puniaPasangan: puniaPasangan !== undefined ? (puniaPasangan ? parseInt(puniaPasangan) : null) : oldProgram.puniaPasangan,
        kodeSertifikat: kodeSertifikat !== undefined ? kodeSertifikat : oldProgram.kodeSertifikat,
        urutan: urutan !== undefined ? parseInt(urutan) : oldProgram.urutan,
        isPasanganTersedia: isPasanganTersedia !== undefined ? isPasanganTersedia : oldProgram.isPasanganTersedia,
        isAktif: isAktif !== undefined ? isAktif : oldProgram.isAktif
      }
    });

    // Soft update logic for nomorRegistrasi in SisyaProgram
    if (kodeSertifikat && oldProgram.kodeSertifikat && kodeSertifikat !== oldProgram.kodeSertifikat) {
      const sisyaPrograms = await prisma.sisyaProgram.findMany({
        where: { programAjahanId: parseInt(id) }
      });

      for (const sp of sisyaPrograms) {
        if (sp.nomorRegistrasi && sp.nomorRegistrasi.includes(oldProgram.kodeSertifikat)) {
          const newNomorRegistrasi = sp.nomorRegistrasi.replace(oldProgram.kodeSertifikat, kodeSertifikat);
          await prisma.sisyaProgram.update({
            where: { id: sp.id },
            data: { nomorRegistrasi: newNomorRegistrasi }
          });
        }
      }
    }

    res.json({ success: true, message: 'Program berhasil diperbarui', data: updatedProgram });
  } catch (error) {
    console.error('Update Program Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui program' });
  }
};

module.exports = {
  getAll,
  updateProgram
};
