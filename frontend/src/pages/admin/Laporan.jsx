import React, { useState, useEffect } from 'react';
import { Download, Filter, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function Laporan() {
  const [sisyas, setSisyas] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: 'SEMUA',
    programId: 'SEMUA',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchLaporan();
  }, [filters.status, filters.programId, filters.startDate, filters.endDate]);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/program-ajahan');
      if (res.data.success) {
        setPrograms(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'SEMUA') params.append('status', filters.status);
      if (filters.programId !== 'SEMUA') params.append('programId', filters.programId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await api.get(`/laporan/sisya?${params.toString()}`);
      if (res.data.success) {
        setSisyas(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (sisyas.length === 0) return;
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (filters.status !== 'SEMUA') params.append('status', filters.status);
      if (filters.programId !== 'SEMUA') params.append('programId', filters.programId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/laporan/export?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-Sisya-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Append to html link element page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting excel:', error);
      alert('Gagal mengekspor data ke Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'LUNAS': return 'bg-green-100 text-green-800 border-green-200';
      case 'BELUM_LUNAS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MENUNGGU_VERIFIKASI': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MENUNGGU_PEMBAYARAN': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'DITOLAK': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Laporan Pendaftaran</h2>
          <p className="text-sm text-muted mt-1">Unduh rekapitulasi data pendaftar dan punia</p>
        </div>
        
        <Button 
          onClick={exportToExcel} 
          disabled={sisyas.length === 0 || isExporting} 
          className="flex items-center gap-2"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting ? 'Sedang Mengekspor...' : 'Export Excel (.xlsx)'}
        </Button>
      </div>

      <div className="bg-surface p-4 rounded-lg shadow-sm border border-muted/20 flex flex-wrap gap-4 items-end">
        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium text-text">Status</label>
          <select 
            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="SEMUA">Semua Status</option>
            <option value="LUNAS">Lunas</option>
            <option value="BELUM_LUNAS">Belum Lunas (Cicil)</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
        
        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium text-text">Program Ajahan</label>
          <select 
            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
            value={filters.programId}
            onChange={(e) => setFilters(prev => ({ ...prev, programId: e.target.value }))}
          >
            <option value="SEMUA">Semua Program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium text-text">Tanggal Mulai</label>
          <Input 
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>

        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium text-text">Tanggal Akhir</label>
          <Input 
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        {(filters.status !== 'SEMUA' || filters.programId !== 'SEMUA' || filters.startDate || filters.endDate) && (
          <Button 
            variant="ghost" 
            onClick={() => setFilters({ status: 'SEMUA', programId: 'SEMUA', startDate: '', endDate: '' })}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Reset Filter
          </Button>
        )}
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text">No. Pendaftaran</th>
                <th className="p-4 font-semibold text-sm text-text">Nama Lengkap</th>
                <th className="p-4 font-semibold text-sm text-text">Program</th>
                <th className="p-4 font-semibold text-sm text-text text-right">Total Punia</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">Memuat data laporan...</td>
                </tr>
              ) : sisyas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">Tidak ada data yang sesuai filter.</td>
                </tr>
              ) : (
                sisyas.map(sisya => (
                  <tr key={sisya.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm font-mono font-medium text-primary">{sisya.nomorPendaftaran}</td>
                    <td className="p-4 text-sm font-medium">{sisya.namaLengkap}</td>
                    <td className="p-4 text-sm">
                      <div className="flex gap-1 flex-wrap">
                        {sisya.programSisyas.map(sp => (
                          <span key={sp.id} className="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded">
                            {sp.programAjahan.kode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-mono text-right font-medium">
                      Rp {sisya.totalPunia.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-sm text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getStatusBadgeColor(sisya.statusPembayaran)}`}>
                        {sisya.statusPembayaran}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
