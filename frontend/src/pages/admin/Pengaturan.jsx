import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function Pengaturan() {
  const [configs, setConfigs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  if (isLoading) {
    return <div className="p-8 text-center text-muted">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-primary">Pengaturan Umum</h2>
        <p className="text-sm text-muted mt-1">Kelola konfigurasi informasi rekening yayasan</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md text-sm border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-muted/20">
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
      </div>
    </div>
  );
}
