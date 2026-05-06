import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../lib/axios';
import { Search, Loader2, CheckCircle2, XCircle, FileSpreadsheet, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getProgramBadgeStyle } from '../../../lib/utils';
import * as XLSX from 'xlsx';

export default function SyaratKelulusan() {
  const [data, setData] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('ALL');
  
  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'namaLengkap', direction: 'asc' });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eligRes, progRes] = await Promise.all([
        api.get('/kelulusan/eligibility'),
        api.get('/program-ajahan')
      ]);
      
      if (eligRes.data.success) {
        setData(eligRes.data.data);
      }
      if (progRes.data.success) {
        setPrograms(progRes.data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOverride = async (sisyaId, newStatus) => {
    try {
      const res = await api.patch(`/kelulusan/eligibility/${sisyaId}`, { statusKelulusan: newStatus });
      if (res.data.success) {
        toast.success('Status kelulusan diperbarui');
        // Update all program records for this sisya as status is on Sisya model
        setData(prev => prev.map(s => {
          if (s.id === sisyaId) {
            let isEligible = false;
            if (newStatus === 'LULUS') isEligible = true;
            else if (newStatus === 'TIDAK_LULUS') isEligible = false;
            else isEligible = s.persentase >= 50;
            return { ...s, statusKelulusan: newStatus, isEligible };
          }
          return s;
        }));
      }
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Processing Data: Filter -> Sort -> Paginate
  const processedData = useMemo(() => {
    let result = data.filter(s => {
      const matchSearch = (s.namaLengkap || '').toLowerCase().includes(search.toLowerCase()) ||
                          (s.nomorPendaftaran || '').toLowerCase().includes(search.toLowerCase());
      
      // Gunakan loose equality atau pastikan tipe data sama
      const matchProgram = filterProgram === 'ALL' || String(s.programId) === String(filterProgram);
      
      return matchSearch && matchProgram;
    });

    // Sorting
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, search, filterProgram, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const progsToExport = filterProgram === 'ALL' ? programs : programs.filter(p => String(p.id) === String(filterProgram));
    
    progsToExport.forEach(prog => {
      const progData = data.filter(d => String(d.programId) === String(prog.id));
      if (progData.length > 0) {
        const wsData = progData.map(d => ({
          'No Pendaftaran': d.nomorPendaftaran,
          'Nama Sisya': d.namaLengkap,
          'Program': d.programNama,
          'No Sertifikat': d.nomorSertifikat,
          'Total Hadir': d.totalHadir,
          'Persentase (%)': d.persentase,
          'Status Kelayakan': d.isEligible ? 'LULUS' : 'TIDAK LULUS',
          'Override Admin': d.statusKelulusan === 'AUTO' ? 'SISTEM' : d.statusKelulusan
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, prog.nama.substring(0, 31));
      }
    });

    if (wb.SheetNames.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }
    XLSX.writeFile(wb, `Rekap_Kelulusan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Syarat Kelulusan</h2>
          <p className="text-muted text-sm mt-1">Rekapitulasi kelayakan lulus per program ajahan.</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <FileSpreadsheet size={18} /> Export Excel
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-muted/20 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-muted/20 bg-muted/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau nomor pendaftaran..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted" />
              <select 
                value={filterProgram}
                onChange={(e) => { setFilterProgram(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-muted/30 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white font-bold min-w-[160px]"
              >
                <option value="ALL">Semua Program</option>
                {programs.map(p => <option key={p.id} value={String(p.id)}>{p.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            Total: {processedData.length} Data
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/10 text-muted-foreground font-bold border-b border-muted/20 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('nomorPendaftaran')}>
                  No Daftar {sortConfig.key === 'nomorPendaftaran' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('namaLengkap')}>
                  Nama Sisya {sortConfig.key === 'namaLengkap' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4">Program Ajahan</th>
                <th className="px-6 py-4 text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('persentase')}>
                  Hadir (%) {sortConfig.key === 'persentase' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-center">Status Akhir</th>
                <th className="px-6 py-4">Override Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted">
                    <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} /> Memuat data...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted italic">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item.spId} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted font-medium">{item.nomorPendaftaran}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text">{item.namaLengkap}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tight">{item.namaGriya}</span>
                          {item.statusSisya && item.statusSisya !== 'AKTIF' && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase border border-amber-200">
                              {item.statusSisya}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-black uppercase shadow-sm ${getProgramBadgeStyle(item.programNama)}`}>
                        {item.programNama || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-black text-sm ${item.persentase >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.persentase}%
                        </span>
                        <div className="w-12 bg-muted/20 rounded-full h-1 mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${item.persentase >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.min(100, item.persentase)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted mt-1 font-medium">({item.totalHadir}/{item.totalSesi})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.isEligible ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-200">
                          <CheckCircle2 size={12} /> LULUS
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200">
                          <XCircle size={12} /> TIDAK LULUS
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={item.statusKelulusan}
                        onChange={(e) => handleOverride(item.id, e.target.value)}
                        className={`text-[10px] border-2 rounded-lg px-2 py-1.5 outline-none font-black cursor-pointer shadow-sm transition-all
                          ${item.statusKelulusan === 'AUTO' ? 'bg-white border-muted/30 text-muted' : 
                            item.statusKelulusan === 'LULUS' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                            'bg-orange-50 border-orange-200 text-orange-700'}
                        `}
                      >
                        <option value="AUTO">OTOMATIS (Sistem)</option>
                        <option value="LULUS">PAKSA LULUS</option>
                        <option value="TIDAK_LULUS">PAKSA TIDAK LULUS</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-muted/20 bg-muted/5 flex items-center justify-between">
            <span className="text-xs font-bold text-muted">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-muted/30 bg-white hover:bg-muted/10 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-muted/30 bg-white hover:bg-muted/10 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
