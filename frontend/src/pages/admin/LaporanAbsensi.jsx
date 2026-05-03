import React, { useState, useEffect } from 'react';
import { Download, Loader2, FileText, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { getProgramBadgeStyle } from '../../lib/utils';

export default function LaporanAbsensi() {
  const [data, setData] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [summary, setSummary] = useState({ HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 });
  const [filters, setFilters] = useState({
    programId: '',
    page: 1,
    limit: 10,
    sortBy: 'namaLengkap',
    sortOrder: 'asc'
  });
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
    if (filters.programId) {
      fetchData();
    }
  }, [filters]);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/program-ajahan');
      if (res.data.success) {
        setPrograms(res.data.data);
        if (res.data.data.length > 0) {
          setFilters(prev => ({ ...prev, programId: res.data.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/laporan/absensi?${params}`);
      if (res.data.success) {
        setData(res.data.data);
        setSummary(res.data.summary);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching laporan absensi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/laporan/absensi/export', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap-Absensi-Nasional-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error exporting excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const SortIcon = ({ field }) => {
    if (filters.sortBy !== field) return <ChevronUp size={14} className="opacity-20" />;
    return filters.sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
            <FileText size={28} />
            Rekapitulasi Absensi
          </h2>
          <p className="text-sm text-muted mt-1">Laporan tingkat kehadiran sisya per program ajahan</p>
        </div>
        <Button 
          onClick={exportToExcel} 
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-lg border border-muted/20 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        
        <select
          className="p-2 text-sm border border-muted/30 rounded-md bg-white min-w-[200px]"
          value={filters.programId}
          onChange={(e) => setFilters({ ...filters, programId: e.target.value, page: 1 })}
        >
          <option value="">Pilih Program Ajahan</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.nama}</option>
          ))}
        </select>
      </div>

      {/* Stats Summary Bar */}
      {filters.programId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
            <p className="text-xl font-bold text-green-600">{summary.HADIR}</p>
            <p className="text-[10px] text-green-700 font-medium uppercase tracking-wider">Total Hadir</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
            <p className="text-xl font-bold text-blue-600">{summary.IZIN}</p>
            <p className="text-[10px] text-blue-700 font-medium uppercase tracking-wider">Total Izin</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
            <p className="text-xl font-bold text-yellow-600">{summary.SAKIT}</p>
            <p className="text-[10px] text-yellow-700 font-medium uppercase tracking-wider">Total Sakit</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
            <p className="text-xl font-bold text-red-600">{summary.ALPHA}</p>
            <p className="text-[10px] text-red-700 font-medium uppercase tracking-wider">Total Alpha</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text text-center w-16">No</th>
                <th 
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('namaLengkap')}
                >
                  <div className="flex items-center gap-2">
                    Nama Sisya
                    <SortIcon field="namaLengkap" />
                  </div>
                </th>
                <th 
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('namaGriya')}
                >
                  <div className="flex items-center gap-2">
                    Griya
                    <SortIcon field="namaGriya" />
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm text-text text-center">Total Sesi</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Hadir</th>
                <th 
                  className="p-4 font-semibold text-sm text-text text-center cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('persentase')}
                >
                  <div className="flex items-center justify-center gap-2">
                    % Kehadiran
                    <SortIcon field="persentase" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted">
                    <Loader2 className="animate-spin inline mr-2" size={20} />
                    Memuat data...
                  </td>
                </tr>
              ) : !filters.programId ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted italic">
                    Silakan pilih program ajahan untuk melihat laporan.
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted">
                    Tidak ada data absensi untuk program ini.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm text-center text-muted">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="p-4 text-sm font-medium text-text">{item.namaLengkap}</td>
                    <td className="p-4 text-sm text-muted">{item.namaGriya || '-'}</td>
                    <td className="p-4 text-sm text-center">{item.totalSesi}</td>
                    <td className="p-4 text-sm text-center text-green-600 font-semibold">{item.totalHadir}</td>
                    <td className="p-4 text-sm text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-bold ${item.persentase >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                          {item.persentase}%
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.persentase >= 75 ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${item.persentase}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-muted/10 flex justify-between items-center bg-gray-50/50">
            <p className="text-xs text-muted">
              Menampilkan {data.length} dari {pagination.total} data
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              >
                Prev
              </Button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={pagination.page === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
