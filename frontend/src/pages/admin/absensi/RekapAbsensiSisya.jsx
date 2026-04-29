import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, User, BookOpen } from 'lucide-react';
import api from '../../../lib/axios';
import { getProgramBadgeStyle } from '../../../lib/utils';

export default function RekapAbsensiSisya() {
  const { sisyaId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRekap();
  }, [sisyaId]);

  const fetchRekap = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/absensi/sisya/${sisyaId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching rekap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersentaseColor = (persen) => {
    if (persen >= 80) return 'text-green-600 bg-green-500';
    if (persen >= 60) return 'text-yellow-600 bg-yellow-500';
    return 'text-red-600 bg-red-500';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
          <User size={28} />
          Rekap Absensi
        </h2>
        <div className="mt-2 p-4 bg-surface rounded-lg border border-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-muted uppercase tracking-wider">Nama</span>
              <p className="font-semibold text-text">{data.sisya.namaLengkap}</p>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wider">Griya</span>
              <p className="font-semibold text-text">{data.sisya.namaGriya}</p>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wider">No. Pendaftaran</span>
              <p className="font-mono font-semibold text-primary">{data.sisya.nomorPendaftaran}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Rekap */}
      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text">Mata Kuliah</th>
                <th className="p-4 font-semibold text-sm text-text">Program</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Smt</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Sesi</th>
                <th className="p-4 font-semibold text-sm text-text text-center">
                  <span className="text-green-600">H</span>
                </th>
                <th className="p-4 font-semibold text-sm text-text text-center">
                  <span className="text-blue-600">I</span>
                </th>
                <th className="p-4 font-semibold text-sm text-text text-center">
                  <span className="text-yellow-600">S</span>
                </th>
                <th className="p-4 font-semibold text-sm text-text text-center">
                  <span className="text-red-600">A</span>
                </th>
                <th className="p-4 font-semibold text-sm text-text text-center">Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {data.rekap.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-muted">
                    Belum ada data absensi untuk sisya ini.
                  </td>
                </tr>
              ) : (
                data.rekap.map(mk => {
                  const colors = getPersentaseColor(mk.persentaseKehadiran);
                  const [textColor, barColor] = colors.split(' ');
                  return (
                    <tr key={mk.mataKuliahId} className="hover:bg-bg/50 transition-colors">
                      <td className="p-4 text-sm">
                        <div>
                          <span className="font-medium">{mk.namaMK}</span>
                          <span className="block text-xs text-muted font-mono">{mk.kodeMK}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium border ${getProgramBadgeStyle(mk.programAjahan)}`}>
                          {mk.programAjahan}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-center">{mk.semester}</td>
                      <td className="p-4 text-sm text-center font-medium">{mk.totalSesi}</td>
                      <td className="p-4 text-sm text-center font-bold text-green-600">{mk.hadir}</td>
                      <td className="p-4 text-sm text-center font-medium text-blue-600">{mk.izin}</td>
                      <td className="p-4 text-sm text-center font-medium text-yellow-600">{mk.sakit}</td>
                      <td className="p-4 text-sm text-center font-bold text-red-600">{mk.alpha}</td>
                      <td className="p-4 text-sm text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-bold text-sm ${textColor}`}>
                            {mk.persentaseKehadiran}%
                          </span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${barColor}`}
                              style={{ width: `${mk.persentaseKehadiran}%` }}
                            />
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

      {/* Summary Card */}
      {data.rekap.length > 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
          <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Ringkasan
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-bg rounded-lg">
              <p className="text-2xl font-bold text-text">
                {data.rekap.reduce((acc, mk) => acc + mk.totalSesi, 0)}
              </p>
              <p className="text-xs text-muted mt-1">Total Sesi</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {data.rekap.reduce((acc, mk) => acc + mk.hadir, 0)}
              </p>
              <p className="text-xs text-muted mt-1">Hadir</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {data.rekap.reduce((acc, mk) => acc + mk.izin, 0)}
              </p>
              <p className="text-xs text-muted mt-1">Izin</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {data.rekap.reduce((acc, mk) => acc + mk.sakit, 0)}
              </p>
              <p className="text-xs text-muted mt-1">Sakit</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {data.rekap.reduce((acc, mk) => acc + mk.alpha, 0)}
              </p>
              <p className="text-xs text-muted mt-1">Alpha</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
