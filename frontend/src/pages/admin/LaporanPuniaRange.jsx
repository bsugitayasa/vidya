import React, { useState, useEffect } from 'react';
import { Download, Filter, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useSearchParams } from 'react-router-dom';
import { getProgramBadgeStyle } from '../../lib/utils';

export default function LaporanPuniaRange() {
  const [searchParams] = useSearchParams();
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalNominal: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate
  });
  const [sort, setSort] = useState({ sortBy: 'tanggalBayar', sortOrder: 'desc' });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    fetchLaporan();
  }, [pagination.page, filters.startDate, filters.endDate, sort]);

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder
      });

      const res = await api.get(`/laporan/punia/range?${params.toString()}`);
      if (res.data.success) {
        setPayments(res.data.data);
        setSummary(res.data.summary);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching laporan punia:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (payments.length === 0) return;
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/laporan/punia/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-Punia-${new Date().toISOString().split('T')[0]}.xlsx`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Laporan Punia (Range Tanggal)</h2>
          <p className="text-sm text-muted mt-1">Rekapitulasi transaksi pembayaran yang sudah terverifikasi</p>
        </div>
        
        <button 
          onClick={exportToExcel} 
          disabled={payments.length === 0 || isExporting} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting ? 'Sedang Mengekspor...' : 'Export Excel (.xlsx)'}
        </button>
      </div>

      <div className="bg-surface p-4 rounded-lg shadow-sm border border-muted/20 flex flex-wrap gap-4 items-end">
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

        <div className="flex-1"></div>

        <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
          <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Total Nominal Terverifikasi</p>
          <p className="text-xl font-mono font-bold text-primary">Rp {summary.totalNominal.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th 
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('tanggalBayar')}
                >
                  <div className="flex items-center gap-1">
                    Tgl Bayar {getSortIcon('tanggalBayar')}
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm text-text">Nama Sisya</th>
                <th className="p-4 font-semibold text-sm text-text">No. Pendaftaran</th>
                <th className="p-4 font-semibold text-sm text-text">Program Ajahan</th>
                <th 
                  className="p-4 font-semibold text-sm text-text text-right cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('nominal')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Nominal {getSortIcon('nominal')}
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm text-text">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Memuat data...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Tidak ada transaksi ditemukan.</td>
                </tr>
              ) : (
                payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm">
                      {new Date(pay.tanggalBayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <div className="flex flex-col">
                        <span>{pay.sisya.namaLengkap}</span>
                        <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tight">{pay.sisya.namaGriya}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-mono text-primary">{pay.sisya.nomorPendaftaran}</td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {pay.sisya.programSisyas?.length > 0 ? (
                          pay.sisya.programSisyas.map((p, idx) => (
                            <span 
                              key={idx}
                              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${getProgramBadgeStyle(p.programAjahan?.nama || '')}`}
                            >
                              {p.programAjahan?.nama || 'Unknown'}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-mono text-right font-bold text-emerald-600">
                      Rp {pay.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-sm text-muted max-w-xs truncate" title={pay.keterangan}>
                      {pay.keterangan || '-'}
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
              Menampilkan {payments.length} dari {pagination.total} data
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
