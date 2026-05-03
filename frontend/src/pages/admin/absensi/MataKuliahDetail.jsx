import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, Download, Loader2, Calendar, BookOpen, BarChart3 } from 'lucide-react';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { getProgramBadgeStyle } from '../../../lib/utils';

export default function MataKuliahDetail() {
  const { mkId } = useParams();
  const navigate = useNavigate();
  const [mataKuliah, setMataKuliah] = useState(null);
  const [sesiList, setSesiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sesiForm, setSesiForm] = useState({ tanggal: '', pertemuan: '', topik: '' });

  useEffect(() => {
    fetchData();
  }, [mkId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/absensi/mata-kuliah/${mkId}/sesi`);
      if (res.data.success) {
        setMataKuliah(res.data.data.mataKuliah);
        setSesiList(res.data.data.sesiList);
      }
    } catch (error) {
      console.error('Error fetching sesi:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data' });
    } finally {
      setIsLoading(false);
    }
  };

  const openAddSesi = () => {
    const nextPertemuan = (sesiList && sesiList.length > 0) ? Math.max(...sesiList.map(s => s.pertemuan)) + 1 : 1;
    const today = new Date().toISOString().split('T')[0];
    setSesiForm({ tanggal: today, pertemuan: String(nextPertemuan), topik: '' });
    setShowModal(true);
  };

  const handleCreateSesi = async () => {
    if (!sesiForm.tanggal || !sesiForm.pertemuan) {
      setMessage({ type: 'error', text: 'Tanggal dan pertemuan wajib diisi' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/absensi/sesi', {
        mataKuliahId: parseInt(mkId),
        tanggal: sesiForm.tanggal,
        pertemuan: parseInt(sesiForm.pertemuan),
        topik: sesiForm.topik || null
      });
      setShowModal(false);
      setMessage({ type: 'success', text: `Sesi pertemuan ke-${sesiForm.pertemuan} berhasil dibuat` });
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal membuat sesi';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const exportAbsensi = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(`/absensi/mata-kuliah/${mkId}/export`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Absensi-${mataKuliah?.kode || 'MK'}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      setMessage({ type: 'error', text: 'Gagal mengekspor data absensi' });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-muted">
        <Loader2 className="animate-spin mr-2" size={20} />
        Memuat data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/absensi')}
            className="flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft size={16} /> Kembali ke Daftar MK
          </button>
          <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
            <BookOpen size={28} />
            {mataKuliah?.nama}
          </h2>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="text-sm text-muted">Kode: <strong className="text-text">{mataKuliah?.kode}</strong></span>
            <span className="text-sm text-muted">SKS: <strong className="text-text">{mataKuliah?.sks}</strong></span>
            <span className="text-sm text-muted">Semester: <strong className="text-text">{mataKuliah?.semester}</strong></span>
            <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium border ${getProgramBadgeStyle(mataKuliah?.programAjahan?.nama)}`}>
              {mataKuliah?.programAjahan?.nama}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/absensi/${mkId}/rekap`)}
            disabled={sesiList.length === 0}
            className="flex items-center gap-2"
          >
            <BarChart3 size={16} />
            Lihat Rekap
          </Button>
          <Button
            variant="outline"
            onClick={exportAbsensi}
            disabled={sesiList.length === 0 || isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Excel
          </Button>
          <Button onClick={openAddSesi} className="flex items-center gap-2">
            <Plus size={18} /> Buat Sesi Baru
          </Button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md text-sm border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Table Sesi */}
      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text text-center">Pertemuan</th>
                <th className="p-4 font-semibold text-sm text-text">Tanggal</th>
                <th className="p-4 font-semibold text-sm text-text">Topik</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Kehadiran</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {!sesiList || sesiList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">
                    Belum ada sesi absensi. Klik "Buat Sesi Baru" untuk memulai.
                  </td>
                </tr>
              ) : (
                sesiList.map(sesi => (
                  <tr
                    key={sesi.id}
                    className="hover:bg-bg/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/absensi/sesi/${sesi.id}`)}
                  >
                    <td className="p-4 text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {sesi.pertemuan}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted" />
                        {new Date(sesi.tanggal).toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted">{sesi.topik || '—'}</td>
                    <td className="p-4 text-sm text-center">
                      {sesi.totalSisya > 0 ? (
                        <span className="text-sm font-medium">
                          <span className="text-green-600">{sesi.totalHadir}</span>
                          <span className="text-muted">/{sesi.totalSisya}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted bg-gray-100 px-2 py-1 rounded">Belum diisi</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-center">
                      <Button variant="outline" size="sm" className="text-xs">
                        Input Absensi
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Sesi */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-muted/20">
              <h3 className="text-lg font-semibold font-heading">Buat Sesi Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Pertemuan ke- <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    value={sesiForm.pertemuan}
                    onChange={(e) => setSesiForm({ ...sesiForm, pertemuan: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Tanggal <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={sesiForm.tanggal}
                    onChange={(e) => setSesiForm({ ...sesiForm, tanggal: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Topik / Materi</label>
                <Input
                  value={sesiForm.topik}
                  onChange={(e) => setSesiForm({ ...sesiForm, topik: e.target.value })}
                  placeholder="Contoh: Pengenalan Mantra Dasar"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-muted/20">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button onClick={handleCreateSesi} disabled={isSaving}>
                {isSaving ? 'Membuat...' : 'Buat Sesi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
