import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

export default function Pengaturan() {
  const [configs, setConfigs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [musicFile, setMusicFile] = useState(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/konfigurasi');
      if (res.data.success) {
        setConfigs(res.data.data);
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

  const saveConfigs = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const updates = Object.keys(configs)
        .filter(key => key !== 'musik_kelulusan') // Musik is handled separately
        .map(key => ({
          kunci: key,
          nilai: configs[key].nilai
        }));
      
      const res = await api.patch('/konfigurasi', { updates });
      if (res.data.success) {
        toast.success('Pengaturan berhasil disimpan');
        setMessage({ type: 'success', text: 'Semua perubahan berhasil disimpan.' });
      }
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMusicUpload = async () => {
    if (!musicFile) return;
    setIsUploadingMusic(true);
    try {
      const formData = new FormData();
      formData.append('musik', musicFile);
      const res = await api.post('/konfigurasi/upload-musik', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Musik berhasil diunggah');
        setMusicFile(null);
        fetchData(); // Refresh to get updated music path
      }
    } catch (error) {
      toast.error('Gagal mengunggah musik');
    } finally {
      setIsUploadingMusic(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-primary">Pengaturan Umum</h2>
        <p className="text-sm text-muted mt-1">Kelola konfigurasi sistem dan parameter prosesi</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md text-sm border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informasi Rekening */}
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/20 space-y-4">
          <div className="flex items-center gap-3 border-b border-muted/10 pb-4 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <h3 className="font-bold text-text">Informasi Pembayaran</h3>
          </div>
          
          {Object.keys(configs).filter(k => k !== 'tanggal_kelulusan' && k !== 'musik_kelulusan').map(key => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">{configs[key].label}</label>
              <Input 
                value={configs[key].nilai}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                className="bg-muted/5 border-muted/20"
              />
            </div>
          ))}
        </div>

        {/* Parameter Kelulusan */}
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/20 space-y-4">
          <div className="flex items-center gap-3 border-b border-muted/10 pb-4 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <h3 className="font-bold text-text">Parameter Prosesi</h3>
          </div>

          {configs.tanggal_kelulusan && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">{configs.tanggal_kelulusan.label}</label>
              <Input 
                type="date"
                value={configs.tanggal_kelulusan.nilai}
                onChange={(e) => handleConfigChange('tanggal_kelulusan', e.target.value)}
                className="bg-muted/5 border-muted/20"
              />
              <p className="text-[10px] text-muted italic mt-2">
                *Tanggal ini akan ditampilkan pada layar utama presentasi kelulusan.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-muted/10">
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Musik Latar Kelulusan</label>
            <div className="flex gap-2">
              <Input 
                type="file" 
                accept="audio/*" 
                onChange={(e) => setMusicFile(e.target.files[0])}
                className="bg-muted/5 border-muted/20 text-xs"
              />
              <Button 
                onClick={handleMusicUpload} 
                disabled={!musicFile || isUploadingMusic}
                variant="outline"
                className="whitespace-nowrap h-10"
              >
                {isUploadingMusic ? 'Uploading...' : 'Unggah Musik'}
              </Button>
            </div>
            {configs.musik_kelulusan && (
              <p className="text-[10px] text-emerald-600 mt-2 flex items-center gap-1 font-medium bg-emerald-50 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Musik Latar Terpasang: {configs.musik_kelulusan.nilai.split('/').pop()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={saveConfigs} disabled={isSaving} className="px-8 py-6 text-base shadow-lg shadow-primary/20">
          {isSaving ? 'Sedang Menyimpan...' : 'Simpan Semua Perubahan'}
        </Button>
      </div>
    </div>
  );
}
