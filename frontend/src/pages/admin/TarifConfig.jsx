import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Wallet, Save } from 'lucide-react';

export default function TarifConfig() {
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/program-ajahan');
      if (res.data.success) {
        setPrograms(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Gagal memuat data program ajahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgramChange = (id, field, value) => {
    setPrograms(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const saveProgram = async (programId) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    
    setIsSaving(true);
    try {
      const res = await api.patch(`/program-ajahan/${programId}`, {
        puniaNormal: program.puniaNormal,
        puniaPasangan: program.puniaPasangan
      });
      if (res.data.success) {
        toast.success(`Tarif ${program.nama} berhasil diperbarui.`);
      }
    } catch (error) {
      toast.error(`Gagal memperbarui tarif program ${program.nama}.`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted">Memuat data tarif...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
          <Wallet size={28} /> Pengaturan Tarif Program
        </h2>
        <p className="text-sm text-muted mt-1">Kelola nilai punia (tarif) untuk setiap program ajahan</p>
      </div>

      <div className="grid gap-6">
        {programs.map(program => (
          <div key={program.id} className="bg-surface p-6 rounded-lg shadow-sm border border-muted/20 space-y-6">
            <div className="flex items-center justify-between border-b border-muted/10 pb-4">
              <h3 className="text-lg font-bold text-primary">{program.nama}</h3>
              <Button size="sm" onClick={() => saveProgram(program.id)} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : (
                  <>
                    <Save size={16} className="mr-2" /> Simpan Tarif
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text uppercase tracking-wider">Tarif Normal (Rp)</label>
                <Input 
                  type="number"
                  value={program.puniaNormal}
                  onChange={(e) => handleProgramChange(program.id, 'puniaNormal', e.target.value)}
                />
              </div>

              {program.isPasanganTersedia && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text uppercase tracking-wider">Tarif Pasangan (Rp)</label>
                  <Input 
                    type="number"
                    value={program.puniaPasangan || 0}
                    onChange={(e) => handleProgramChange(program.id, 'puniaPasangan', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
