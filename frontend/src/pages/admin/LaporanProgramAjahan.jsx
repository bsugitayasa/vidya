import React, { useState, useEffect } from 'react';
import { Download, Loader2, Calendar } from 'lucide-react';
import api from '../../lib/axios';

export default function LaporanProgramAjahan() {
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/laporan/program-ajahan-rekap');
      if (res.data.success) {
        setPrograms(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching laporan program ajahan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (programs.length === 0) return;
    setIsExporting(true);

    try {
      const response = await api.get('/laporan/program-ajahan-rekap/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan-Program-Ajahan-${new Date().toISOString().split('T')[0]}.xlsx`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Rekapitulasi Program Ajahan</h2>
          <p className="text-sm text-muted mt-1">Laporan lengkap daftar program, ajahan (tingkat), dan jadwal pelaksanaannya</p>
        </div>
        
        <button 
          onClick={exportToExcel} 
          disabled={programs.length === 0 || isExporting} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting ? 'Sedang Mengekspor...' : 'Export Excel (.xlsx)'}
        </button>
      </div>

      <div className="space-y-8">
        {isLoading ? (
          <div className="p-12 text-center text-muted bg-surface rounded-lg shadow-sm border border-muted/20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Memuat rekapitulasi data...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="p-12 text-center text-muted bg-surface rounded-lg shadow-sm border border-muted/20">
            Tidak ada data program ajahan aktif.
          </div>
        ) : (
          programs.map(program => (
            <div key={program.id} className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-muted/20">
                <h3 className="text-lg font-bold text-primary">{program.nama}</h3>
                <p className="text-sm text-muted">{program.kode} • Urutan: {program.urutan}</p>
              </div>
              
              <div className="p-0">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-muted/20">
                      <th className="p-3 font-semibold text-slate-700">Smt</th>
                      <th className="p-3 font-semibold text-slate-700">Program Ajahan</th>
                      <th className="p-3 font-semibold text-slate-700">Pertemuan</th>
                      <th className="p-3 font-semibold text-slate-700">Tanggal</th>
                      <th className="p-3 font-semibold text-slate-700">Narawakya</th>
                      <th className="p-3 font-semibold text-slate-700">Topik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {program.mataKuliahs && program.mataKuliahs.length > 0 ? (
                      program.mataKuliahs.map((mk, mkIdx) => {
                        const rowCount = mk.sesiAbsensis && mk.sesiAbsensis.length > 0 ? mk.sesiAbsensis.length : 1;
                        
                        if (rowCount === 1 && (!mk.sesiAbsensis || mk.sesiAbsensis.length === 0)) {
                          return (
                            <tr key={`${mk.id}-empty`} className="hover:bg-slate-50/50">
                              <td className="p-3 font-medium align-top border-r border-muted/10">{mk.semester}</td>
                              <td className="p-3 font-medium align-top border-r border-muted/10">{mk.nama}</td>
                              <td className="p-3 text-muted text-center">-</td>
                              <td className="p-3 text-muted text-center">-</td>
                              <td className="p-3 text-muted text-center">-</td>
                              <td className="p-3 text-muted italic">Belum ada jadwal</td>
                            </tr>
                          );
                        }

                        return mk.sesiAbsensis.map((sesi, sesiIdx) => (
                          <tr key={sesi.id} className="hover:bg-slate-50/50">
                            {sesiIdx === 0 && (
                              <>
                                <td rowSpan={rowCount} className="p-3 font-medium align-top border-r border-muted/10 bg-white">
                                  {mk.semester}
                                </td>
                                <td rowSpan={rowCount} className="p-3 font-medium align-top border-r border-muted/10 bg-white">
                                  {mk.nama}
                                </td>
                              </>
                            )}
                            <td className="p-3 text-center bg-transparent">Ke-{sesi.pertemuan}</td>
                            <td className="p-3 whitespace-nowrap bg-transparent">
                              <div className="flex items-center gap-1.5 justify-center">
                                <Calendar size={14} className="text-muted" />
                                {new Date(sesi.tanggal).toLocaleDateString('id-ID', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="p-3 bg-transparent">{sesi.narawakya || '-'}</td>
                            <td className="p-3 bg-transparent">{sesi.topik || '-'}</td>
                          </tr>
                        ));
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-muted italic">
                          Belum ada ajahan untuk program ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
