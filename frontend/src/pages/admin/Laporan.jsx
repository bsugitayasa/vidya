import React, { useState, useEffect } from 'react';
import { Download, Filter, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getProgramBadgeStyle } from '../../lib/utils';

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
  const [sort, setSort] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchLaporan();
  }, [pagination.page, filters.status, filters.programId, filters.startDate, filters.endDate, sort]);

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
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        programId: filters.programId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder
      });

      const res = await api.get(`/laporan/sisya?${params.toString()}`);
      if (res.data.success) {
        setSisyas(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSort = (field) => {
    setSort(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSortIcon = (field) => {
    if (sort.sortBy !== field) return <ArrowUpDown size={14} className="text-muted/50" />;
    return sort.sortOrder === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
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

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-Sisya-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
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
        
        <button 
          onClick={exportToExcel} 
          disabled={sisyas.length === 0 || isExporting} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting ? 'Sedang Mengekspor...' : 'Export Excel (.xlsx)'}
        </button>
      </div>

      <div className="bg-surface p-4 rounded-lg shadow-sm border border-muted/20 flex flex-wrap gap-4 items-end">
        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium text-text">Status</label>
          <select 
            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
            value={filters.status}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, status: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
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
            onChange={(e) => {
              setFilters(prev => ({ ...prev, programId: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
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
            onChange={(e) => {
              setFilters(prev => ({ ...prev, startDate: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium text-text">Tanggal Akhir</label>
          <Input 
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, endDate: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          />
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th 
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('nomorPendaftaran')}
                >
                  <div className="flex items-center gap-1">
                    No. Pendaftaran {getSortIcon('nomorPendaftaran')}
                  </div>
                </th>
                <th 
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('namaLengkap')}
                >
                  <div className="flex items-center gap-1">
                    Nama Lengkap {getSortIcon('namaLengkap')}
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm text-text">Program</th>
                <th 
                  className="p-4 font-semibold text-sm text-text text-right cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('totalPunia')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Punia {getSortIcon('totalPunia')}
                  </div>
                </th>
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
                    <td className="p-4 text-sm font-medium">
                      <div className="flex flex-col">
                        <span>{sisya.namaLengkap}</span>
                        <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tight">{sisya.namaGriya}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex gap-1 flex-wrap">
                        {sisya.programSisyas.map(sp => (
                          <span key={sp.id} className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border shadow-sm ${getProgramBadgeStyle(sp.programAjahan.nama)}`}>
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
                        {sisya.statusPembayaran.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-muted/20 flex items-center justify-between">
            <p className="text-sm text-muted">
              Menampilkan {sisyas.length} dari {pagination.total} data
            </p>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === pagination.totalPages || (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)) {
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if ((pageNum === 2 && pagination.page > 3) || (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)) {
                    return <span key={pageNum} className="px-1 text-muted">...</span>;
                  }
                  return null;
                })}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
