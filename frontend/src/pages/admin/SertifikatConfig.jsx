import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { FileText, Save, Info } from 'lucide-react';

export default function SertifikatConfig() {
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
        kodeSertifikat: program.kodeSertifikat
      });
      if (res.data.success) {
        toast.success(`Format sertifikat ${program.nama} berhasil diperbarui.`);
        fetchPrograms(); // Refresh for soft updates
      }
    } catch (error) {
      toast.error(`Gagal memperbarui format sertifikat program ${program.nama}.`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted">Memuat konfigurasi...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
          <FileText size={28} /> Pengaturan Format Sertifikat
        </h2>
        <p className="text-sm text-muted mt-1">Kelola format nomor sertifikat per program ajahan</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3 text-blue-800 text-sm">
        <Info className="shrink-0" size={20} />
        <div>
          <p className="font-bold">Informasi Soft Update</p>
          <p>Jika Anda mengubah <strong>Kode Sertifikat</strong>, sistem akan secara otomatis memperbarui nomor registrasi seluruh siswa yang sudah terdaftar pada program tersebut agar mengikuti format baru.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {programs.map(program => (
          <div key={program.id} className="bg-surface p-6 rounded-lg shadow-sm border border-muted/20 space-y-6">
            <div className="flex items-center justify-between border-b border-muted/10 pb-4">
              <h3 className="text-lg font-bold text-primary">{program.nama}</h3>
              <Button size="sm" onClick={() => saveProgram(program.id)} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : (
                  <>
                    <Save size={16} className="mr-2" /> Simpan Format
                  </>
                )}
              </Button>
            </div>

            <div className="max-w-md space-y-4">
              <div className="p-3 bg-muted/5 rounded border border-muted/10">
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Format Saat Ini</p>
                <p className="font-mono text-sm font-bold text-primary">{program.kodeSertifikat || '-'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text uppercase tracking-wider">Ubah Format</label>
                <Input 
                  placeholder="Contoh: WLK.XVIII-BD.SDM/PDPN"
                  value={program.kodeSertifikat || ''}
                  onChange={(e) => handleProgramChange(program.id, 'kodeSertifikat', e.target.value)}
                />
                <p className="text-[10px] text-muted italic">Format akhir: NO/KODE/BULAN/TAHUN</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
