import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Calendar, BookOpen, Check } from 'lucide-react';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/button';
import { getProgramBadgeStyle } from '../../../lib/utils';

const STATUS_OPTIONS = [
  { value: 'HADIR', label: 'H', color: 'bg-green-500', hoverBg: 'hover:bg-green-100', activeBg: 'bg-green-100 ring-2 ring-green-500', textColor: 'text-green-700' },
  { value: 'IZIN', label: 'I', color: 'bg-blue-500', hoverBg: 'hover:bg-blue-100', activeBg: 'bg-blue-100 ring-2 ring-blue-500', textColor: 'text-blue-700' },
  { value: 'SAKIT', label: 'S', color: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-100', activeBg: 'bg-yellow-100 ring-2 ring-yellow-500', textColor: 'text-yellow-700' },
  { value: 'ALPHA', label: 'A', color: 'bg-red-500', hoverBg: 'hover:bg-red-100', activeBg: 'bg-red-100 ring-2 ring-red-500', textColor: 'text-red-700' },
];

export default function SesiAbsensi() {
  const { sesiId } = useParams();
  const navigate = useNavigate();
  const [sesiData, setSesiData] = useState(null);
  const [absensiState, setAbsensiState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSesiDetail();
  }, [sesiId]);

  const fetchSesiDetail = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/absensi/sesi/${sesiId}`);
      if (res.data.success) {
        setSesiData(res.data.data);
        // Inisialisasi state absensi
        const initialState = {};
        res.data.data.daftarSisya?.forEach(sisya => {
          initialState[sisya.sisyaId] = sisya.status || null;
        });
        setAbsensiState(initialState);
      }
    } catch (error) {
      console.error('Error fetching sesi:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data sesi' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (sisyaId, status) => {
    setAbsensiState(prev => ({
      ...prev,
      [sisyaId]: prev[sisyaId] === status ? null : status
    }));
    setHasChanges(true);
  };

  const setAllStatus = (status) => {
    const newState = {};
    sesiData?.daftarSisya?.forEach(sisya => {
      newState[sisya.sisyaId] = status;
    });
    setAbsensiState(newState);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Hanya kirim sisya yang sudah diberi status
    const absensi = Object.entries(absensiState)
      .filter(([_, status]) => status !== null)
      .map(([sisyaId, status]) => ({
        sisyaId: parseInt(sisyaId),
        status
      }));

    if (absensi.length === 0) {
      setMessage({ type: 'error', text: 'Pilih status kehadiran minimal untuk 1 sisya' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post(`/absensi/sesi/${sesiId}/input`, { absensi });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        setHasChanges(false);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan absensi';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Hitung statistik
  const stats = {
    hadir: Object.values(absensiState).filter(s => s === 'HADIR').length,
    izin: Object.values(absensiState).filter(s => s === 'IZIN').length,
    sakit: Object.values(absensiState).filter(s => s === 'SAKIT').length,
    alpha: Object.values(absensiState).filter(s => s === 'ALPHA').length,
    belum: Object.values(absensiState).filter(s => s === null).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-muted">
        <Loader2 className="animate-spin mr-2" size={20} />
        Memuat data sesi...
      </div>
    );
  }

  if (!sesiData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <button
            onClick={() => navigate(`/admin/absensi/${sesiData.mataKuliah.id}`)}
            className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft size={16} /> Kembali ke {sesiData.mataKuliah.nama}
          </button>
          <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
            <BookOpen size={28} />
            Input Absensi — Pertemuan {sesiData.pertemuan}
          </h2>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="text-sm text-muted flex items-center gap-1">
              <Calendar size={14} />
              {new Date(sesiData.tanggal).toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
            {sesiData.topik && (
              <span className="text-sm text-muted">Topik: <strong className="text-text">{sesiData.topik}</strong></span>
            )}
            <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium border ${getProgramBadgeStyle(sesiData.mataKuliah.programAjahan?.nama)}`}>
              {sesiData.mataKuliah.programAjahan?.nama}
            </span>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="flex items-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
        </Button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md text-sm border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">Hadir: {stats.hadir}</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-blue-700">Izin: {stats.izin}</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm font-medium text-yellow-700">Sakit: {stats.sakit}</span>
        </div>
        <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-700">Alpha: {stats.alpha}</span>
        </div>
        {stats.belum > 0 && (
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-sm font-medium text-gray-500">Belum: {stats.belum}</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted self-center mr-1">Set semua:</span>
        {STATUS_OPTIONS?.map(opt => (
          <button
            key={opt.value}
            onClick={() => setAllStatus(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${opt.hoverBg} ${opt.textColor} border-current/20`}
          >
            Semua {opt.value}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text text-center w-12">No</th>
                <th className="p-4 font-semibold text-sm text-text">Nama Sisya</th>
                <th className="p-4 font-semibold text-sm text-text">Griya</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {!sesiData?.daftarSisya || sesiData.daftarSisya.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-muted">
                    Tidak ada sisya aktif di program ini. Pastikan status sisya sudah diubah ke AKTIF atau MEDIKSA.
                  </td>
                </tr>
              ) : (
                sesiData.daftarSisya.map((sisya, index) => (
                  <tr key={sisya.sisyaId} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm text-center text-muted">{index + 1}</td>
                    <td className="p-4 text-sm font-medium">{sisya.namaLengkap}</td>
                    <td className="p-4 text-sm text-muted">{sisya.namaGriya}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {STATUS_OPTIONS?.map(opt => {
                          const isActive = absensiState[sisya.sisyaId] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(sisya.sisyaId, opt.value)}
                              className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                                isActive
                                  ? `${opt.activeBg} ${opt.textColor} scale-110`
                                  : `bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200`
                              }`}
                              title={opt.value}
                            >
                              {isActive && <Check size={12} className="inline mr-0.5" />}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Save Button (mobile) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-lg rounded-full px-6 py-3 flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
}
