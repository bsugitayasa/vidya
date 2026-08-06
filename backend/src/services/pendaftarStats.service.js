const summarizeProgramParticipation = programs => {
  const participationCounts = new Map();

  const perProgram = programs.map(program => {
    let lakiLaki = 0;
    let perempuan = 0;

    program.sisyaPrograms.forEach(({ sisyaId, sisya }) => {
      participationCounts.set(sisyaId, (participationCounts.get(sisyaId) || 0) + 1);

      if (sisya.jenisKelamin === 'LAKI_LAKI') lakiLaki += 1;
      if (sisya.jenisKelamin === 'PEREMPUAN') perempuan += 1;
    });

    return {
      id: program.id,
      nama: program.nama,
      total: program.sisyaPrograms.length,
      lakiLaki,
      perempuan
    };
  });

  const counts = Array.from(participationCounts.values());

  return {
    perProgram,
    totalKepesertaanProgram: perProgram.reduce((sum, program) => sum + program.total, 0),
    totalSisyaMultiProgram: counts.filter(count => count > 1).length,
    totalKepesertaanTambahan: counts.reduce((sum, count) => sum + Math.max(0, count - 1), 0)
  };
};

const getProgramParticipationSummary = async prisma => {
  const programs = await prisma.programAjahan.findMany({
    where: { isAktif: true },
    select: {
      id: true,
      nama: true,
      sisyaPrograms: {
        where: {
          sisya: { status: { not: 'TIDAK_AKTIF' } }
        },
        select: {
          sisyaId: true,
          sisya: { select: { jenisKelamin: true } }
        }
      }
    },
    orderBy: { urutan: 'asc' }
  });

  return summarizeProgramParticipation(programs);
};

module.exports = {
  getProgramParticipationSummary,
  summarizeProgramParticipation
};
