import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function Pengaturan() {
  const [activeTab, setActiveTab] = useState('rekening');
  const [configs, setConfigs] = useState({});
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [confRes, progRes] = await Promise.all([
        api.get('/konfigurasi'),
        api.get('/program-ajahan')
      ]);
      
      if (confRes.data.success) {
        setConfigs(confRes.data.data);
      }
      if (progRes.data.success) {
        setPrograms(progRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data pengaturan.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (kunci, value) => {
    setConfigs(prev => ({
      ...prev,
      [kunci]: { ...prev[kunci], nilai: value }
    }));
  };

  const handleProgramChange = (id, field, value) => {
    setPrograms(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const saveConfigs = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const updates = Object.keys(configs).map(key => ({
        kunci: key,
        nilai: configs[key].nilai
      }));
      
      const res = await api.patch('/konfigurasi', { updates });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Informasi rekening berhasil disimpan.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan informasi rekening.' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveProgramTarif = async (programId) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;
    
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.patch(`/program-ajahan/${programId}/tarif`, {
        puniaNormal: program.puniaNormal,
        puniaPasangan: program.puniaPasangan
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: `Tarif program ${program.nama} berhasil diperbarui.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Gagal memperbarui tarif program ${program.nama}.` });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-primary">Pengaturan</h2>
        <p className="text-sm text-muted mt-1">Kelola konfigurasi aplikasi dan tarif program</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md text-sm border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex border-b border-muted/20">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rekening' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
          }`}
          onClick={() => setActiveTab('rekening')}
        >
          Informasi Rekening
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tarif' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
          }`}
          onClick={() => setActiveTab('tarif')}
        >
          Tarif Program Ajahan
        </button>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-muted/20">
        {activeTab === 'rekening' && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold mb-4">Informasi Rekening Bank</h3>
            
            {Object.keys(configs).map(key => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-text">{configs[key].label}</label>
                <Input 
                  value={configs[key].nilai}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                />
              </div>
            ))}

            <div className="pt-4">
              <Button onClick={saveConfigs} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'tarif' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Tarif Program Ajahan (Rp)</h3>
            
            <div className="grid gap-6">
              {programs.map(program => (
                <div key={program.id} className="p-4 border border-muted/20 rounded-md flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium text-text">{program.nama} - Tarif Normal</label>
                    <Input 
                      type="number"
                      value={program.puniaNormal}
                      onChange={(e) => handleProgramChange(program.id, 'puniaNormal', e.target.value)}
                    />
                  </div>
                  {program.isPasanganTersedia && (
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-sm font-medium text-text">{program.nama} - Tarif Pasangan</label>
                      <Input 
                        type="number"
                        value={program.puniaPasangan || 0}
                        onChange={(e) => handleProgramChange(program.id, 'puniaPasangan', e.target.value)}
                      />
                    </div>
                  )}
                  <div className="w-full md:w-auto">
                    <Button variant="outline" onClick={() => saveProgramTarif(program.id)} disabled={isSaving}>
                      Update {program.nama}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
