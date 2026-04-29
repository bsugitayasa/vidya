import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, BookOpen, BarChart3 } from 'lucide-react';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/button';
import { getProgramBadgeStyle } from '../../../lib/utils';

const STATUS_LABEL = { HADIR: 'H', IZIN: 'I', SAKIT: 'S', ALPHA: 'A' };
const STATUS_COLORS = {
  HADIR: 'text-green-700 bg-green-100',
  IZIN: 'text-blue-700 bg-blue-100',
  SAKIT: 'text-yellow-700 bg-yellow-100',
  ALPHA: 'text-red-700 bg-red-100',
};

export default function RekapMataKuliah() {
  const { mkId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchRekap();
  }, [mkId]);

  const fetchRekap = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/absensi/mata-kuliah/${mkId}/rekap`);
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      console.error('Error fetching rekap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAbsensi = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(`/absensi/mata-kuliah/${mkId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Absensi-${data?.mataKuliah?.kode || 'MK'}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getPersentaseStyle = (persen) => {
    if (persen >= 80) return { text: 'text-green-700', bar: 'bg-green-500' };
    if (persen >= 60) return { text: 'text-yellow-700', bar: 'bg-yellow-500' };
    return { text: 'text-red-700', bar: 'bg-red-500' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-muted">
        <Loader2 className="animate-spin mr-2" size={20} />
        Memuat rekap absensi...
      </div>
    );
  }

  if (!data) return null;

  const { mataKuliah, sesiHeaders, sisyaRows, totalSesi } = data;

  // Hitung total statistik
  const totalHadir = sisyaRows.reduce((a, s) => a + s.hadir, 0);
  const totalIzin = sisyaRows.reduce((a, s) => a + s.izin, 0);
  const totalSakit = sisyaRows.reduce((a, s) => a + s.sakit, 0);
  const totalAlpha = sisyaRows.reduce((a, s) => a + s.alpha, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <button
            onClick={() => navigate(`/admin/absensi/${mkId}`)}
            className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft size={16} /> Kembali ke Daftar Sesi
          </button>
          <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
            <BarChart3 size={28} />
            Rekap Absensi
          </h2>
        </div>
        <Button
          onClick={exportAbsensi}
          disabled={isExporting || sisyaRows.length === 0}
          className="flex items-center gap-2"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {isExporting ? 'Mengekspor...' : 'Export Excel'}
        </Button>
      </div>

      {/* MK Info Card */}
      <div className="bg-surface rounded-lg border border-muted/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-block px-2.5 py-1 text-sm rounded font-semibold border ${getProgramBadgeStyle(mataKuliah.programAjahan?.nama)}`}>
            {mataKuliah.programAjahan?.nama}
          </span>
          <span className="text-muted text-sm">—</span>
          <span className="text-sm text-muted">Program Ajahan</span>
        </div>
        <h3 className="text-xl font-bold text-text">{mataKuliah.nama}</h3>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
          <span>Kode: <strong className="text-text">{mataKuliah.kode}</strong></span>
          <span>SKS: <strong className="text-text">{mataKuliah.sks}</strong></span>
          <span>Semester: <strong className="text-text">{mataKuliah.semester}</strong></span>
          <span>Total Sesi: <strong className="text-text">{totalSesi}</strong></span>
          <span>Jumlah Sisya: <strong className="text-text">{sisyaRows.length}</strong></span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
          <p className="text-2xl font-bold text-green-600">{totalHadir}</p>
          <p className="text-xs text-green-700 mt-1">Total Hadir</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalIzin}</p>
          <p className="text-xs text-blue-700 mt-1">Total Izin</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
          <p className="text-2xl font-bold text-yellow-600">{totalSakit}</p>
          <p className="text-xs text-yellow-700 mt-1">Total Sakit</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
          <p className="text-2xl font-bold text-red-600">{totalAlpha}</p>
          <p className="text-xs text-red-700 mt-1">Total Alpha</p>
        </div>
      </div>

      {/* Rekap Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className={`border-b border-muted/20 ${getProgramBadgeStyle(mataKuliah.programAjahan?.nama)}`}>
                <th className={`p-3 font-bold text-center sticky left-0 z-20 w-10 border-b border-muted/20 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>No</th>
                <th className={`p-3 font-bold sticky left-10 z-20 min-w-[150px] max-w-[150px] md:max-w-none truncate border-b border-muted/20 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>Nama Sisya</th>
                <th className="p-3 font-bold min-w-[120px] border-b border-muted/20">Griya</th>
                {sesiHeaders.map(sesi => (
                  <th key={sesi.id} className="p-3 font-bold text-center min-w-[50px] border-b border-muted/20" title={sesi.topik || `Pertemuan ${sesi.pertemuan}`}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-bold">P{sesi.pertemuan}</span>
                      <span className="text-[10px] opacity-80 font-normal">
                        {new Date(sesi.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="p-3 font-bold text-center min-w-[70px] border-b border-muted/20">Kehadiran</th>
                <th className="p-3 font-bold text-center min-w-[90px] border-b border-muted/20">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {sisyaRows.length === 0 ? (
                <tr>
                  <td colSpan={5 + sesiHeaders.length} className="p-8 text-center text-muted">
                    Belum ada data absensi.
                  </td>
                </tr>
              ) : (
                sisyaRows.map((row, index) => {
                  const style = getPersentaseStyle(row.persentase);
                  return (
                    <tr key={row.sisyaId} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}>
                      <td className="p-3 text-center text-muted sticky left-0 z-10 border-b border-muted/10 bg-inherit">{index + 1}</td>
                      <td className="p-3 font-medium sticky left-10 z-10 min-w-[150px] max-w-[150px] md:max-w-none truncate border-b border-muted/10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-inherit">{row.namaLengkap}</td>
                      <td className="p-3 text-muted border-b border-muted/10">{row.namaGriya}</td>
                      {sesiHeaders.map(sesi => {
                        const status = row.perSesi[sesi.id];
                        return (
                          <td key={sesi.id} className="p-3 text-center border-b border-muted/10">
                            {status ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${STATUS_COLORS[status]}`}>
                                {STATUS_LABEL[status]}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center font-medium border-b border-muted/10">
                        <span className="text-green-600">{row.hadir}</span>
                        <span className="text-muted">/{totalSesi}</span>
                      </td>
                      <td className="p-3 text-center border-b border-muted/10">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-bold text-xs ${style.text}`}>{row.persentase}%</span>
                          <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${row.persentase}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-5 rounded bg-green-100 text-green-700 font-bold text-center leading-5">H</span> Hadir</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-5 rounded bg-blue-100 text-blue-700 font-bold text-center leading-5">I</span> Izin</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-5 rounded bg-yellow-100 text-yellow-700 font-bold text-center leading-5">S</span> Sakit</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-5 rounded bg-red-100 text-red-700 font-bold text-center leading-5">A</span> Alpha</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-5 rounded bg-gray-100 text-gray-400 font-bold text-center leading-5">-</span> Belum diisi</span>
      </div>
    </div>
  );
}
