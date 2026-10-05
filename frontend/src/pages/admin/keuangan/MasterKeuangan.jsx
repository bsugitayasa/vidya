import { useEffect, useState } from 'react';
import { Landmark, Pencil, Plus, Power, ShieldCheck, Tags, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/axios';
import useAuthStore from '../../../store/authStore';

const inputClass = 'w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-emerald-500';
const emptyCategory = { kode: '', nama: '', deskripsi: '' };
const emptyAccount = { kode: '', nama: '', tipe: 'BANK', namaBank: '', nomorRekening: '' };

export default function MasterKeuangan() {
  const { user } = useAuthStore();
  const canCreate = ['BENDAHARA', 'SUPER_ADMIN'].includes(user?.role);
  const canEdit = user?.role === 'SUPER_ADMIN';
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [category, setCategory] = useState(emptyCategory);
  const [account, setAccount] = useState(emptyAccount);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [categoryResponse, accountResponse] = await Promise.all([
        api.get('/keuangan/kategori'),
        api.get('/keuangan/akun-kas')
      ]);
      setCategories(categoryResponse.data.data);
      setAccounts(accountResponse.data.data);
    } catch {
      toast.error('Gagal memuat master keuangan');
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/keuangan/kategori'),
      api.get('/keuangan/akun-kas')
    ]).then(([categoryResponse, accountResponse]) => {
      if (cancelled) return;
      setCategories(categoryResponse.data.data);
      setAccounts(accountResponse.data.data);
    }).catch(() => {
      if (!cancelled) toast.error('Gagal memuat master keuangan');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const create = async (kind) => {
    const payload = kind === 'kategori' ? category : account;
    const endpoint = kind === 'kategori' ? 'kategori' : 'akun-kas';
    try {
      setSaving(true);
      const response = await api.post(`/keuangan/${endpoint}`, payload);
      toast.success(response.data.message);
      if (kind === 'kategori') setCategory(emptyCategory);
      else setAccount(emptyAccount);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (kind, row) => {
    if (!canEdit) return;
    setEditing({
      kind,
      id: row.id,
      kode: row.kode,
      nama: row.nama,
      deskripsi: row.deskripsi || '',
      tipe: row.tipe || 'BANK',
      namaBank: row.namaBank || '',
      nomorRekening: row.nomorRekening || '',
      isAktif: row.isAktif
    });
  };

  const saveEdit = async () => {
    if (!editing || !canEdit) return;
    const endpoint = editing.kind === 'kategori' ? 'kategori' : 'akun-kas';
    const payload = editing.kind === 'kategori'
      ? {
          kode: editing.kode,
          nama: editing.nama,
          deskripsi: editing.deskripsi,
          isAktif: editing.isAktif
        }
      : {
          kode: editing.kode,
          nama: editing.nama,
          tipe: editing.tipe,
          namaBank: editing.tipe === 'BANK' ? editing.namaBank : '',
          nomorRekening: editing.tipe === 'BANK' ? editing.nomorRekening : '',
          isAktif: editing.isAktif
        };

    try {
      setSaving(true);
      const response = await api.patch(`/keuangan/${endpoint}/${editing.id}`, payload);
      toast.success(response.data.message);
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui master keuangan');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (kind, row) => {
    if (!canEdit) return;
    const endpoint = kind === 'kategori' ? 'kategori' : 'akun-kas';
    const payload = kind === 'kategori'
      ? { kode: row.kode, nama: row.nama, deskripsi: row.deskripsi || '', isAktif: !row.isAktif }
      : {
          kode: row.kode,
          nama: row.nama,
          tipe: row.tipe,
          namaBank: row.namaBank || '',
          nomorRekening: row.nomorRekening || '',
          isAktif: !row.isAktif
        };
    try {
      setSaving(true);
      await api.patch(`/keuangan/${endpoint}/${row.id}`, payload);
      toast.success(`${row.nama} ${row.isAktif ? 'dinonaktifkan' : 'diaktifkan'}`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengubah status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Konfigurasi</p>
        <h1 className="text-3xl font-black text-slate-800">Master Keuangan</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola klasifikasi pengeluaran dan akun sumber transaksi.</p>
      </div>

      {!canEdit && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldCheck size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Perubahan master dibatasi untuk SUPER_ADMIN</p>
            <p className="mt-1 text-xs leading-5">
              {canCreate
                ? 'Anda tetap dapat menambah kategori atau akun baru, tetapi data yang sudah tersimpan hanya dapat diedit oleh SUPER_ADMIN.'
                : 'Anda dapat melihat master keuangan, tetapi tidak dapat menambah atau mengubah datanya.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel icon={Tags} title="Kategori Pengeluaran" count={categories.length}>
          <div className="space-y-2">
            {categories.map((row) => (
              <MasterRow
                key={row.id}
                row={row}
                detail={row.deskripsi}
                canEdit={canEdit}
                saving={saving}
                onEdit={() => openEdit('kategori', row)}
                onToggle={() => toggle('kategori', row)}
              />
            ))}
          </div>
          {canCreate && (
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tambah Kategori</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input placeholder="Kode" value={category.kode} onChange={(event) => setCategory({ ...category, kode: event.target.value })} className={inputClass} />
                <input placeholder="Nama kategori" value={category.nama} onChange={(event) => setCategory({ ...category, nama: event.target.value })} className={`${inputClass} sm:col-span-2`} />
              </div>
              <input placeholder="Deskripsi (opsional)" value={category.deskripsi} onChange={(event) => setCategory({ ...category, deskripsi: event.target.value })} className={inputClass} />
              <button disabled={saving} onClick={() => create('kategori')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Plus size={16} /> Tambah Kategori
              </button>
            </div>
          )}
        </Panel>

        <Panel icon={Landmark} title="Akun Kas & Bank" count={accounts.length}>
          <div className="space-y-2">
            {accounts.map((row) => (
              <MasterRow
                key={row.id}
                row={row}
                detail={[row.tipe, row.namaBank, row.nomorRekening].filter(Boolean).join(' · ')}
                canEdit={canEdit}
                saving={saving}
                onEdit={() => openEdit('akun', row)}
                onToggle={() => toggle('akun', row)}
              />
            ))}
          </div>
          {canCreate && (
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tambah Akun</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input placeholder="Kode" value={account.kode} onChange={(event) => setAccount({ ...account, kode: event.target.value })} className={inputClass} />
                <input placeholder="Nama akun" value={account.nama} onChange={(event) => setAccount({ ...account, nama: event.target.value })} className={`${inputClass} sm:col-span-2`} />
              </div>
              <select value={account.tipe} onChange={(event) => setAccount({ ...account, tipe: event.target.value })} className={inputClass}>
                <option value="BANK">Bank</option>
                <option value="KAS">Kas Tunai</option>
              </select>
              {account.tipe === 'BANK' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input placeholder="Nama bank" value={account.namaBank} onChange={(event) => setAccount({ ...account, namaBank: event.target.value })} className={inputClass} />
                  <input placeholder="Nomor rekening" value={account.nomorRekening} onChange={(event) => setAccount({ ...account, nomorRekening: event.target.value })} className={inputClass} />
                </div>
              )}
              <button disabled={saving} onClick={() => create('akun')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Plus size={16} /> Tambah Akun
              </button>
            </div>
          )}
        </Panel>
      </div>

      {editing && (
        <EditModal editing={editing} setEditing={setEditing} saving={saving} onSave={saveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

const Panel = ({ icon: Icon, title, count, children }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><Icon size={20} /></span>
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{count} data</span>
    </div>
    {children}
  </section>
);

const MasterRow = ({ row, detail, canEdit, saving, onEdit, onToggle }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">{row.kode}</span>
        <span className="truncate text-sm font-semibold text-slate-700">{row.nama}</span>
      </div>
      {detail && <p className="mt-1 truncate text-xs text-slate-400">{detail}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.isAktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
        {row.isAktif ? 'Aktif' : 'Nonaktif'}
      </span>
      {canEdit && (
        <>
          <button disabled={saving} onClick={onEdit} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50" title="Edit data">
            <Pencil size={14} />
          </button>
          <button disabled={saving} onClick={onToggle} className={`rounded-lg border bg-white p-2 disabled:opacity-50 ${row.isAktif ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`} title={row.isAktif ? 'Nonaktifkan' : 'Aktifkan'}>
            <Power size={14} />
          </button>
        </>
      )}
    </div>
  </div>
);

const EditModal = ({ editing, setEditing, saving, onSave, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 md:p-10">
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Khusus SUPER_ADMIN</p>
          <h3 className="font-black text-slate-800">Edit {editing.kind === 'kategori' ? 'Kategori' : 'Akun Kas & Bank'}</h3>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Kode
            <input value={editing.kode} onChange={(event) => setEditing({ ...editing, kode: event.target.value })} className={inputClass} />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700 sm:col-span-2">
            Nama
            <input value={editing.nama} onChange={(event) => setEditing({ ...editing, nama: event.target.value })} className={inputClass} />
          </label>
        </div>

        {editing.kind === 'kategori' ? (
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Deskripsi
            <textarea rows="3" value={editing.deskripsi} onChange={(event) => setEditing({ ...editing, deskripsi: event.target.value })} className={inputClass} />
          </label>
        ) : (
          <>
            <label className="space-y-1 text-sm font-semibold text-slate-700">
              Tipe Akun
              <select value={editing.tipe} onChange={(event) => setEditing({ ...editing, tipe: event.target.value })} className={inputClass}>
                <option value="BANK">Bank</option>
                <option value="KAS">Kas Tunai</option>
              </select>
            </label>
            {editing.tipe === 'BANK' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  Nama Bank
                  <input value={editing.namaBank} onChange={(event) => setEditing({ ...editing, namaBank: event.target.value })} className={inputClass} />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  Nomor Rekening
                  <input value={editing.nomorRekening} onChange={(event) => setEditing({ ...editing, nomorRekening: event.target.value })} className={inputClass} />
                </label>
              </div>
            )}
          </>
        )}

        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
          Status master aktif
          <input type="checkbox" checked={editing.isAktif} onChange={(event) => setEditing({ ...editing, isAktif: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
        </label>
        <button disabled={saving} onClick={onSave} className="w-full rounded-xl bg-emerald-600 p-3 font-bold text-white disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  </div>
);
