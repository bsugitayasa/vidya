import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import api from '../../../lib/axios';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { getProgramBadgeStyle } from '../../../lib/utils';

export default function MataKuliahList() {
  const navigate = useNavigate();
  const [mataKuliahs, setMataKuliahs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [filterProgram, setFilterProgram] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ kode: '', nama: '', sks: '', semester: '', programAjahanId: '' });

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchMataKuliah();
  }, [filterProgram]);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/program-ajahan');
      if (res.data.success) setPrograms(res.data.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchMataKuliah = async () => {
    setIsLoading(true);
    try {
      const params = filterProgram !== 'all' ? `?programId=${filterProgram}` : '';
      const res = await api.get(`/absensi/mata-kuliah${params}`);
      if (res.data.success) setMataKuliahs(res.data.data);
    } catch (error) {
      console.error('Error fetching mata kuliah:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ kode: '', nama: '', sks: '', semester: '', programAjahanId: '' });
    setShowModal(true);
  };

  const openEditModal = (mk) => {
    setEditingId(mk.id);
    setForm({
      kode: mk.kode,
      nama: mk.nama,
      sks: String(mk.sks),
      semester: String(mk.semester),
      programAjahanId: String(mk.programAjahanId)
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.kode || !form.nama || !form.sks || !form.semester || !form.programAjahanId) {
      setMessage({ type: 'error', text: 'Semua field wajib diisi' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editingId) {
        await api.patch(`/absensi/mata-kuliah/${editingId}`, form);
        setMessage({ type: 'success', text: 'Mata kuliah berhasil diperbarui' });
      } else {
        await api.post('/absensi/mata-kuliah', form);
        setMessage({ type: 'success', text: 'Mata kuliah berhasil ditambahkan' });
      }
      setShowModal(false);
      fetchMataKuliah();
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan mata kuliah';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (mk) => {
    if (!confirm(`Hapus mata kuliah "${mk.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await api.delete(`/absensi/mata-kuliah/${mk.id}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Mata kuliah berhasil dihapus' });
        fetchMataKuliah();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menghapus mata kuliah';
      setMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
            <BookOpen size={28} />
            Kelola Absensi
          </h2>
          <p className="text-sm text-muted mt-1">Manajemen mata kuliah dan absensi per program ajahan</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <Plus size={18} /> Tambah Program Ajahan
        </Button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md text-sm border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filter */}
      <div className="bg-surface p-4 rounded-lg shadow-sm border border-muted/20 flex flex-wrap gap-4 items-end">
        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium text-text">Program Ajahan</label>
          <select
            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
          >
            <option value="all">Semua Program</option>
            {programs?.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text">Kode</th>
                <th className="p-4 font-semibold text-sm text-text">Nama Mata Kuliah</th>
                <th className="p-4 font-semibold text-sm text-text text-center">SKS</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Semester</th>
                <th className="p-4 font-semibold text-sm text-text">Program</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Sesi</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted">
                    <Loader2 className="animate-spin inline mr-2" size={16} />
                    Memuat data mata kuliah...
                  </td>
                </tr>
              ) : !mataKuliahs || mataKuliahs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted">
                    Belum ada mata kuliah. Klik "Tambah Mata Kuliah" untuk memulai.
                  </td>
                </tr>
              ) : (
                mataKuliahs.map(mk => (
                  <tr
                    key={mk.id}
                    className="hover:bg-bg/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/absensi/${mk.id}`)}
                  >
                    <td className="p-4 text-sm font-mono font-medium text-primary">{mk.kode}</td>
                    <td className="p-4 text-sm font-medium">{mk.nama}</td>
                    <td className="p-4 text-sm text-center">{mk.sks}</td>
                    <td className="p-4 text-sm text-center">{mk.semester}</td>
                    <td className="p-4 text-sm">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded font-medium border ${getProgramBadgeStyle(mk.programAjahan?.nama)}`}>
                        {mk.programAjahan?.nama}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-center font-medium">{mk._count?.sesiAbsensis || 0}</td>
                    <td className="p-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(mk)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(mk)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-muted/20">
              <h3 className="text-lg font-semibold font-heading">
                {editingId ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Kode <span className="text-red-500">*</span></label>
                <Input
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
                  placeholder="Contoh: MK-KWK-01"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Nama Mata Kuliah <span className="text-red-500">*</span></label>
                <Input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: Weda Adhyayana"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">SKS <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    value={form.sks}
                    onChange={(e) => setForm({ ...form, sks: e.target.value })}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Semester <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Program Ajahan <span className="text-red-500">*</span></label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
                  value={form.programAjahanId}
                  onChange={(e) => setForm({ ...form, programAjahanId: e.target.value })}
                >
                  <option value="">Pilih Program</option>
                  {programs?.map(p => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-muted/20">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Tambah'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
