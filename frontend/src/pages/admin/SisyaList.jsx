import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Filter, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, XCircle, Info, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function SisyaList() {
  const [sisyas, setSisyas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programs, setPrograms] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [sort, setSort] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  
  // Pagination state
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
    fetchSisyas();
  }, [pagination.page, filterStatus, filterProgram, searchTerm, sort]);

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

  const fetchSisyas = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: filterStatus,
        programId: filterProgram,
        search: searchTerm,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder
      });

      const res = await api.get(`/sisya?${params.toString()}`);
      if (res.data.success) {
        setSisyas(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching sisya:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'LUNAS': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      'BELUM_LUNAS': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info },
      'MENUNGGU_VERIFIKASI': { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      'MENUNGGU_PEMBAYARAN': { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle },
      'DITOLAK': { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
    };
    
    const { color, icon: Icon } = config[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Info };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${color}`}>
        <Icon size={12} />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getAcademicStatusBadge = (status) => {
    const config = {
      'AKTIF': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      'MEDIKSA': { color: 'bg-purple-100 text-purple-700 border-purple-200' },
      'PENDING': { color: 'bg-slate-100 text-slate-600 border-slate-200' },
      'TIDAK_AKTIF': { color: 'bg-rose-100 text-rose-700 border-rose-200' },
    };
    
    const { color } = config[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase shadow-sm ${color}`}>
        {status}
      </span>
    );
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
          <h2 className="text-2xl font-bold font-heading text-primary">Data Sisya</h2>
          <p className="text-sm text-muted mt-1">Kelola data pendaftar dan status verifikasi</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <Input 
              placeholder="Cari nama atau nomor..." 
              className="pl-10 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          
          <select 
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">Semua Status</option>
            <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="BELUM_LUNAS">Belum Lunas</option>
            <option value="LUNAS">Lunas</option>
            <option value="DITOLAK">Ditolak</option>
          </select>

          <select 
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={filterProgram}
            onChange={(e) => {
              setFilterProgram(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">Semua Program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                  className="p-4 font-semibold text-sm text-text cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Tgl Daftar {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm text-text">Status</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Memuat data...</td>
                </tr>
              ) : sisyas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Belum ada data pendaftar.</td>
                </tr>
              ) : (
                sisyas.map(sisya => (
                  <tr key={sisya.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm font-mono font-medium text-primary">{sisya.nomorPendaftaran}</td>
                    <td className="p-4 text-sm font-medium">{sisya.namaLengkap}</td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-col gap-1">
                        {sisya.programSisyas.map(sp => {
                          const getProgramColor = (name) => {
                            const n = name.toLowerCase();
                            if (n.includes('kawikon')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                            if (n.includes('kawelakaan')) return 'bg-orange-100 text-orange-700 border-orange-200';
                            if (n.includes('usadha')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                            if (n.includes('serati')) return 'bg-purple-100 text-purple-700 border-purple-200';
                            return 'bg-secondary/10 text-secondary border-secondary/20';
                          };
                          
                          return (
                            <span key={sp.id} className={`inline-block px-2 py-1 text-[10px] font-bold rounded-md border w-max ${getProgramColor(sp.programAjahan.nama)}`}>
                              {sp.programAjahan.nama} {sp.isPasangan && '(+Pasangan)'}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted">
                      {new Date(sisya.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-col gap-1.5">
                        {getStatusBadge(sisya.statusPembayaran)}
                        {getAcademicStatusBadge(sisya.status)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Link to={`/admin/sisya/${sisya.id}`}>
                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-full text-muted hover:text-primary hover:bg-primary/10 transition-all active:scale-95">
                          <Eye size={20} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
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
                  // Only show current page, first, last, and pages around current
                  if (
                    pageNum === 1 || 
                    pageNum === pagination.totalPages || 
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
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
                  } else if (
                    (pageNum === 2 && pagination.page > 3) ||
                    (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                  ) {
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
