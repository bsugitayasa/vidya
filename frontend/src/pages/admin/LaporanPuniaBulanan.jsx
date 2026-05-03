import React, { useState, useEffect } from 'react';
import { Download, Loader2, ChevronLeft, ChevronRight, Eye, Calendar } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';

export default function LaporanPuniaBulanan() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });

  useEffect(() => {
    fetchLaporan();
  }, [pagination.page]);

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/laporan/punia/bulanan?page=${pagination.page}&limit=${pagination.limit}`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching laporan bulanan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-heading text-primary">Rekapitulasi Punia Bulanan</h2>
        <p className="text-sm text-muted mt-1">Total pendapatan punia yang masuk setiap bulannya</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : data.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-surface rounded-lg border border-dashed border-muted">
            <Calendar size={48} className="mx-auto text-muted mb-4 opacity-20" />
            <p className="text-muted">Belum ada data pembayaran terverifikasi.</p>
          </div>
        ) : (
          data.map((item, idx) => (
            <div key={`${item.year}-${item.month}`} className="bg-surface p-6 rounded-xl shadow-sm border border-muted/20 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-text">{getMonthName(item.month)}</h3>
                  <p className="text-sm text-muted font-mono">{item.year}</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                  <Calendar size={20} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Total Dana Masuk</p>
                  <p className="text-2xl font-mono font-bold text-emerald-600">Rp {item.total.toLocaleString('id-ID')}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-muted/10">
                  <span className="text-xs text-muted">{item.count} Transaksi Terverifikasi</span>
                  <Link to={`/admin/laporan/punia-range?startDate=${item.year}-${String(item.month).padStart(2, '0')}-01&endDate=${item.year}-${String(item.month).padStart(2, '0')}-${new Date(item.year, item.month, 0).getDate()}`}>
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 gap-1 h-8">
                      <Eye size={14} /> Detail
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft size={16} /> Sebelumnya
          </Button>
          <span className="text-sm font-medium">Halaman {pagination.page} dari {pagination.totalPages}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Berikutnya <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
