const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Dapatkan daftar syarat kelulusan (dengan persentase kehadiran) - REKAP PER PROGRAM
exports.getEligibility = async (req, res) => {
  try {
    // Ambil data sisya program beserta seluruh relasi absensi dan sesinya
    // Kita hilangkan filter status AKTIF agar semua yang terdaftar muncul, 
    // namun kita sertakan informasi statusnya.
    const sisyaPrograms = await prisma.sisyaProgram.findMany({
      include: {
        sisya: {
          include: {
            absensiSisyas: true
          }
        },
        programAjahan: {
          include: {
            mataKuliahs: {
              include: {
                sesiAbsensis: true
              }
            }
          }
        }
      },
      orderBy: { sisya: { namaLengkap: 'asc' } }
    });

    const data = sisyaPrograms.map(sp => {
      const sisya = sp.sisya;
      const program = sp.programAjahan;

      // 1. Identifikasi semua SesiAbsensi yang masuk dalam Program ini
      const programSesiIds = [];
      if (program.mataKuliahs) {
        program.mataKuliahs.forEach(mk => {
          if (mk.sesiAbsensis) {
            mk.sesiAbsensis.forEach(sesi => {
              programSesiIds.push(sesi.id);
            });
          }
        });
      }

      const totalSesi = programSesiIds.length;

      // 2. Hitung berapa kali sisya hadir di sesi-sesi program tersebut
      const totalHadir = (sisya.absensiSisyas || []).filter(abs => 
        programSesiIds.includes(abs.sesiAbsensiId) && abs.status === 'HADIR'
      ).length;

      const persentase = totalSesi === 0 ? 0 : Math.round((totalHadir / totalSesi) * 100);
      
      // 3. Tentukan kelayakan
      let isEligible = false;
      if (sisya.statusKelulusan === 'LULUS') {
        isEligible = true;
      } else if (sisya.statusKelulusan === 'TIDAK_LULUS') {
        isEligible = false;
      } else {
        isEligible = persentase >= 50;
      }

      return {
        id: sisya.id,
        spId: sp.id,
        nomorPendaftaran: sisya.nomorPendaftaran,
        namaLengkap: sisya.namaLengkap,
        statusSisya: sisya.status, // Menyertakan status asli sisya
        programId: program.id,
        programNama: program.nama,
        nomorSertifikat: sp.nomorRegistrasi || '-',
        totalSesi,
        totalHadir,
        persentase,
        statusKelulusan: sisya.statusKelulusan,
        isEligible,
        namaGriya: sisya.namaGriya
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getEligibility:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// 2. Update override kelulusan per sisya
exports.updateEligibility = async (req, res) => {
  try {
    const { sisyaId } = req.params;
    const { statusKelulusan } = req.body; // 'AUTO', 'LULUS', 'TIDAK_LULUS'

    if (!['AUTO', 'LULUS', 'TIDAK_LULUS'].includes(statusKelulusan)) {
      return res.status(400).json({ success: false, error: 'Invalid statusKelulusan' });
    }

    await prisma.sisya.update({
      where: { id: parseInt(sisyaId) },
      data: { statusKelulusan }
    });

    res.json({ success: true, message: 'Status kelulusan berhasil diperbarui' });
  } catch (error) {
    console.error('Error updateEligibility:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// 3. Dapatkan daftar absensi hari H kelulusan (TETAP PER SISYA UNTUK ABSENSI)
exports.getHadirKelulusan = async (req, res) => {
  try {
    // 1. Ambil data program & sesi untuk hitung eligibility
    const programs = await prisma.programAjahan.findMany({
      include: {
        mataKuliahs: { include: { sesiAbsensis: true } }
      }
    });
    const programSesiMap = {};
    programs.forEach(p => {
      const sesiIds = [];
      p.mataKuliahs.forEach(mk => {
        mk.sesiAbsensis.forEach(s => sesiIds.push(s.id));
      });
      programSesiMap[p.id] = sesiIds;
    });

    // 2. Ambil data sisya
    const sisyas = await prisma.sisya.findMany({
      include: {
        absensiSisyas: true,
        programSisyas: {
          include: { programAjahan: true }
        },
        prosesiKelulusan: true
      },
      orderBy: { namaLengkap: 'asc' }
    });

    // Filter sisya yang eligible di minimal 1 program
    const eligibleSisyas = sisyas.filter(sisya => {
      // Jika override global LULUS, langsung masuk
      if (sisya.statusKelulusan === 'LULUS') return true;
      if (sisya.statusKelulusan === 'TIDAK_LULUS') return false;

      // Cek eligibility per program
      return sisya.programSisyas.some(sp => {
        const targetSesiIds = programSesiMap[sp.programAjahanId] || [];
        const totalSesi = targetSesiIds.length;
        const totalHadir = sisya.absensiSisyas.filter(a => 
          targetSesiIds.includes(a.sesiAbsensiId) && a.status === 'HADIR'
        ).length;
        const persentase = totalSesi === 0 ? 0 : Math.round((totalHadir / totalSesi) * 100);
        return persentase >= 50;
      });
    }).map(sisya => {
      return {
        id: sisya.id,
        nomorPendaftaran: sisya.nomorPendaftaran,
        namaLengkap: sisya.namaLengkap,
        isHadir: !!sisya.prosesiKelulusan,
        waktuHadir: sisya.prosesiKelulusan?.waktuHadir || null,
        program: sisya.programSisyas.map(p => p.programAjahan.nama).join(', '),
        namaGriya: sisya.namaGriya
      };
    });

    res.json({ success: true, data: eligibleSisyas });
  } catch (error) {
    console.error('Error getHadirKelulusan:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// 4. Input kehadiran saat prosesi kelulusan (Hadir / Tidak Hadir)
exports.inputHadirKelulusan = async (req, res) => {
  try {
    const { sisyaId } = req.params;
    const { isHadir } = req.body;

    if (isHadir) {
      await prisma.prosesiKelulusan.upsert({
        where: { sisyaId: parseInt(sisyaId) },
        update: { waktuHadir: new Date() },
        create: { sisyaId: parseInt(sisyaId), waktuHadir: new Date() }
      });
    } else {
      await prisma.prosesiKelulusan.deleteMany({
        where: { sisyaId: parseInt(sisyaId) }
      });
    }

    res.json({ success: true, message: isHadir ? 'Sisya ditandai hadir' : 'Absensi dibatalkan' });
  } catch (error) {
    console.error('Error inputHadirKelulusan:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// 5. Data presentasi (flyer) - REKAP PER PROGRAM (Satu sisya bisa muncul 2x jika ikut 2 program)
exports.getPresentasiData = async (req, res) => {
  try {
    // 1. Ambil data program & sesi untuk hitung eligibility (sama seperti logic absensi)
    const programs = await prisma.programAjahan.findMany({
      include: {
        mataKuliahs: { include: { sesiAbsensis: true } }
      }
    });
    const programSesiMap = {};
    programs.forEach(p => {
      const sesiIds = [];
      p.mataKuliahs.forEach(mk => {
        mk.sesiAbsensis.forEach(s => sesiIds.push(s.id));
      });
      programSesiMap[p.id] = sesiIds;
    });

    // 2. Ambil data prosesi yang sudah hadir
    const prosesi = await prisma.prosesiKelulusan.findMany({
      include: {
        sisya: {
          include: {
            absensiSisyas: true,
            programSisyas: {
              include: { programAjahan: true }
            }
          }
        }
      },
      orderBy: { waktuHadir: 'asc' }
    });

    const data = [];
    prosesi.forEach(p => {
      const sisya = p.sisya;
      
      // Cek apakah sisya masih eligible secara keseluruhan
      let isStillEligible = false;
      if (sisya.statusKelulusan === 'LULUS') {
        isStillEligible = true;
      } else if (sisya.statusKelulusan === 'TIDAK_LULUS') {
        isStillEligible = false;
      } else {
        // Cek eligibility minimal di 1 program
        isStillEligible = sisya.programSisyas.some(sp => {
          const targetSesiIds = programSesiMap[sp.programAjahanId] || [];
          const totalSesi = targetSesiIds.length;
          const totalHadir = sisya.absensiSisyas.filter(a => 
            targetSesiIds.includes(a.sesiAbsensiId) && a.status === 'HADIR'
          ).length;
          const persentase = totalSesi === 0 ? 0 : Math.round((totalHadir / totalSesi) * 100);
          return persentase >= 50;
        });
      }

      // Jika tidak eligible, jangan masukkan ke data presentasi
      if (!isStillEligible) return;

      sisya.programSisyas.forEach(sp => {
        // Hanya masukkan program yang eligible jika status AUTO
        // Namun jika status LULUS (paksa), masukkan semua program sisya tersebut
        let showThisProgram = false;
        if (sisya.statusKelulusan === 'LULUS') {
          showThisProgram = true;
        } else {
          const targetSesiIds = programSesiMap[sp.programAjahanId] || [];
          const totalSesi = targetSesiIds.length;
          const totalHadir = sisya.absensiSisyas.filter(a => 
            targetSesiIds.includes(a.sesiAbsensiId) && a.status === 'HADIR'
          ).length;
          const persentase = totalSesi === 0 ? 0 : Math.round((totalHadir / totalSesi) * 100);
          if (persentase >= 50) showThisProgram = true;
        }

        if (showThisProgram) {
          data.push({
            id: sisya.id,
            spId: sp.id,
            namaLengkap: sisya.namaLengkap,
            fileFotoPath: sisya.fileFotoPath,
            namaGriya: sisya.namaGriya,
            nomorSertifikat: sp.nomorRegistrasi || '-',
            programId: sp.programAjahan.id,
            programNama: sp.programAjahan.nama,
            waktuHadir: p.waktuHadir
          });
        }
      });
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getPresentasiData:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
