import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../lib/axios';
import { Search, Loader2, UserCheck, UserX, FileSpreadsheet, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function AbsensiKelulusan() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'namaLengkap', direction: 'asc' });

  const fetchHadirKelulusan = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/kelulusan/absensi');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data absensi kelulusan');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHadirKelulusan();
  }, []);

  const handleToggleHadir = async (sisyaId, currentHadir) => {
    try {
      const isHadir = !currentHadir;
      const res = await api.post(`/kelulusan/absensi/${sisyaId}`, { isHadir });
      
      if (res.data.success) {
        toast.success(res.data.message);
        setData(prev => prev.map(s => {
          if (s.id === sisyaId) {
            return { ...s, isHadir, waktuHadir: isHadir ? new Date().toISOString() : null };
          }
          return s;
        }));
      }
    } catch (error) {
      toast.error('Gagal menyimpan absensi');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let result = data.filter(s => 
      s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      s.nomorPendaftaran.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, search, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    const wsData = processedData.map(d => ({
      'No Pendaftaran': d.nomorPendaftaran,
      'Nama Sisya': d.namaLengkap,
      'Program': d.program,
      'Status Kehadiran': d.isHadir ? 'HADIR' : 'BELUM HADIR',
      'Waktu Absensi': d.waktuHadir ? new Date(d.waktuHadir).toLocaleTimeString('id-ID') : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi_Kelulusan');
    XLSX.writeFile(wb, `Absensi_Kelulusan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalHadir = data.filter(s => s.isHadir).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Absensi Hari H Kelulusan</h2>
          <p className="text-muted text-sm mt-1">Tandai kehadiran sisya yang berhak mengikuti prosesi kelulusan.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToExcel} variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
            <FileSpreadsheet size={18} className="mr-2" /> Export Excel
          </Button>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold border border-primary/20 flex items-center">
            Total Hadir: {totalHadir} / {data.length}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-muted/20 overflow-hidden">
        <div className="p-4 border-b border-muted/20 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau nomor..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="text-xs text-muted font-medium">Total: {processedData.length} Eligible</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/5 text-muted font-semibold border-b border-muted/20">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('nomorPendaftaran')}>
                  No Daftar {sortConfig.key === 'nomorPendaftaran' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('namaLengkap')}>
                  Nama Sisya {sortConfig.key === 'namaLengkap' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4 text-center">Kehadiran</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Memuat data...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted italic">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                currentData.map((sisya) => (
                  <tr key={sisya.id} className={`hover:bg-muted/5 transition-colors ${sisya.isHadir ? 'bg-green-50/30' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs text-muted">{sisya.nomorPendaftaran}</td>
                    <td className="px-6 py-4 font-bold text-text">{sisya.namaLengkap}</td>
                    <td className="px-6 py-4 text-xs text-muted">{sisya.program}</td>
                    <td className="px-6 py-4 text-center">
                      {sisya.isHadir ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                            <UserCheck size={12} /> HADIR
                          </span>
                          <span className="text-[9px] text-muted mt-0.5">
                            {new Date(sisya.waktuHadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                          <UserX size={12} /> BELUM
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant={sisya.isHadir ? "outline" : "primary"}
                        className={sisya.isHadir ? "border-red-200 text-red-600 hover:bg-red-50" : ""}
                        onClick={() => handleToggleHadir(sisya.id, sisya.isHadir)}
                      >
                        {sisya.isHadir ? 'Batal' : 'Hadir'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-muted/20 flex items-center justify-between bg-muted/5">
            <span className="text-xs text-muted">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft size={16} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal Button component
function Button({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const base = "inline-flex items-center justify-center rounded-lg font-bold transition-all disabled:opacity-50";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-sm",
    outline: "border border-muted/30 bg-white text-text hover:bg-muted/5",
    ghost: "hover:bg-muted/10 text-muted hover:text-text"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}
