import { useState } from 'react';
import { toast } from 'sonner';
import api from '../../../lib/axios';

export default function EditUraianAnggaran({ rab, item, onSaved }) {
  const [open, setOpen] = useState(false);
  const [uraian, setUraian] = useState('');
  const [alasan, setAlasan] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = ['SELESAI', 'MENUNGGU_VERIFIKASI_LPJ', 'DIBATALKAN'].includes(rab.status);
  const save = async event => {
    event.preventDefault(); setSaving(true);
    try {
      const res = await api.patch(`/keuangan/rab/${rab.id}/items/${item.id}/uraian`, { uraian, alasan, uraianSebelumnya: item.uraian });
      toast.success(res.data.message); setOpen(false); await onSaved();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal memperbarui uraian'); }
    finally { setSaving(false); }
  };
  return <>
    <button type="button" disabled={locked} aria-label={`Edit uraian ${item.uraian}`} title={locked ? 'Buka penyesuaian atau revisi LPJ terlebih dahulu' : 'Edit uraian komponen'} className="mt-1 text-xs font-semibold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400" onClick={() => { setUraian(item.uraian); setAlasan(''); setOpen(true); }}>Edit Uraian</button>
    {open && <div role="dialog" aria-modal="true" aria-label="Edit Uraian Anggaran" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 md:p-10"><form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 text-left shadow-xl"><div className="flex justify-between gap-3"><h3 className="font-bold text-slate-800">Edit Uraian Anggaran</h3><button type="button" disabled={saving} onClick={() => setOpen(false)}>Tutup</button></div><p className="text-sm text-slate-500">Nama komponen pada pilihan pengeluaran, rincian realisasi dan export akan diperbarui. Nominal dan keterangan transaksi tetap.</p>{rab.rabQrDocumentId && !['DRAFT','DITOLAK','DIAJUKAN'].includes(rab.status) && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">RAB yang sudah ditandatangani perlu ditandatangani kembali setelah uraian berubah.</p>}<label className="block text-sm font-semibold">Uraian<textarea autoFocus required maxLength={1000} rows={3} value={uraian} onChange={e=>setUraian(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="block text-sm font-semibold">Alasan Perubahan<textarea required minLength={5} rows={2} value={alasan} onChange={e=>setAlasan(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><button type="submit" disabled={saving || !uraian.trim() || alasan.trim().length<5} className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Uraian'}</button></form></div>}
  </>;
}
