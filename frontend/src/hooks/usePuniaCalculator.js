import { useMemo } from 'react';

/**
 * Hook untuk mengkalkulasi total punia secara real-time
 * @param {Array} selectedPrograms - Array of selected program IDs
 * @param {Object} pasanganOptions - Object map of programId -> boolean (true if pasangan is selected)
 * @param {Array} programList - Array of all available programs from API
 */
export function usePuniaCalculator(selectedPrograms, pasanganOptions, programList) {
  const calculations = useMemo(() => {
    if (!programList || programList.length === 0) return { total: 0, items: [] };

    let total = 0;
    const items = [];

    selectedPrograms.forEach(programId => {
      const program = programList.find(p => p.id === programId);
      if (program) {
        const isPasangan = pasanganOptions[programId] && program.isPasanganTersedia;
        const harga = isPasangan && program.puniaPasangan ? program.puniaPasangan : program.puniaNormal;
        
        total += harga;
        items.push({
          id: program.id,
          nama: program.nama,
          isPasangan,
          harga
        });
      }
    });

    return { total, items };
  }, [selectedPrograms, pasanganOptions, programList]);

  return calculations;
}
