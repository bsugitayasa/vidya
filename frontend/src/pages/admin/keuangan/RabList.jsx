import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilePlus2, Filter, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/axios';
import { formatDate, formatRupiah, RAB_STATUS, StatusRabBadge } from '../../../lib/finance';

const emptyItem = () => ({ kategoriId: '', uraian: '', volume: 1, satuan: 'unit', hargaSatuan: '' });

export default function RabList() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ namaKegiatan: '', nomorReferensi: '', rabQrDocumentId: '', programAjahanId: '', penanggungJawab: '', tujuan: '', tanggalMulai: '', tanggalSelesai: '', catatan: '', dokumen: null, items: [emptyItem()] });
  const showForm = params.get('new') === '1';

  const load = async () => {
    setLoading(true);
    try {
      const [rabRes, categoryRes, programRes, verificationRes] = await Promise.all([
        api.get('/keuangan/rab', { params: { search: search || undefined, status: status || undefined, limit: 100 } }),
        api.get('/keuangan/kategori'), api.get('/program-ajahan'), api.get('/keuangan/verification-documents')
      ]);
      setRows(rabRes.data.data); setCategories(categoryRes.data.data.filter((item) => item.isAktif));
      setPrograms((programRes.data.data || programRes.data || []).filter((item) => item.isAktif !== false));
      setVerificationDocuments(verificationRes.data.data || []);
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal memuat data RAB'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [status]);

  const total = useMemo(() => form.items.reduce((sum, item) => sum + (Number(item.volume) || 0) * (Number(item.hargaSatuan) || 0), 0), [form.items]);
  const setItem = (index, field, value) => setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  const closeForm = () => { setParams({}); setForm({ namaKegiatan: '', nomorReferensi: '', rabQrDocumentId: '', programAjahanId: '', penanggungJawab: '', tujuan: '', tanggalMulai: '', tanggalSelesai: '', catatan: '', dokumen: null, items: [emptyItem()] }); };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (key === 'items') payload.append('items', JSON.stringify(value)); else if (key === 'dokumen') { if (value) payload.append('dokumen', value); } else payload.append(key, value); });
      const res = await api.post('/keuangan/rab', payload);
      toast.success(res.data.message); closeForm(); load();
    } catch (error) { toast.error(error.response?.data?.message || 'Gagal membuat RAB'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Pengajuan & Pertanggungjawaban</p><h1 className="text-3xl font-black text-slate-800">Rencana Anggaran Biaya</h1></div><button onClick={() => setParams({ new: '1' })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"><Plus size={18} /> Pengajuan Baru</button></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Cari nomor RAB, kegiatan, atau penanggung jawab..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" /></div><div className="relative"><Filter size={16} className="absolute left-3 top-3 text-slate-400" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 py-2.5 pl-9 pr-8 text-sm"><option value="">Semua status</option>{Object.entries(RAB_STATUS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div><button onClick={load} className="rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600">Terapkan</button></div>
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">RAB / Kegiatan</th><th className="px-5 py-4">Periode</th><th className="px-5 py-4">Anggaran</th><th className="px-5 py-4">Realisasi</th><th className="px-5 py-4">Status</th><th className="px-5 py-4"></th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="6" className="p-10 text-center text-slate-400">Memuat data...</td></tr> : !rows.length ? <tr><td colSpan="6" className="p-12 text-center"><FilePlus2 className="mx-auto mb-3 text-slate-300" /><p className="font-semibold text-slate-500">Belum ada pengajuan RAB</p></td></tr> : rows.map((row) => <tr key={row.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-bold text-slate-800">{row.namaKegiatan}</p><p className="mt-1 text-xs text-slate-500">{row.nomorRab} · {row.programAjahan?.nama || 'Umum'}</p>{row.nomorReferensi&&<p className="mt-1 text-[11px] font-semibold text-emerald-700">Ref: {row.nomorReferensi}</p>}</td><td className="px-5 py-4 text-slate-600">{formatDate(row.tanggalMulai)}<br/><span className="text-xs text-slate-400">s.d. {formatDate(row.tanggalSelesai)}</span></td><td className="px-5 py-4 font-semibold text-slate-700">{formatRupiah(Number(row.totalDisetujui) || Number(row.totalDiajukan))}</td><td className="px-5 py-4"><p className="font-semibold text-violet-700">{formatRupiah(row.ringkasan.pengeluaranTerverifikasi)}</p><p className="text-xs text-slate-400">{row.ringkasan.persentaseRealisasi}%</p></td><td className="px-5 py-4"><StatusRabBadge status={row.status} /></td><td className="px-5 py-4 text-right"><Link to={`/admin/keuangan/rab/${row.id}`} className="font-bold text-emerald-600 hover:text-emerald-800">Detail →</Link></td></tr>)}</tbody></table></div></div>

    {showForm && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 md:p-8"><form onSubmit={submit} className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-black text-slate-800">Buat Draft RAB</h2><p className="text-sm text-slate-500">Nomor RAB dibuat otomatis oleh sistem.</p></div><button type="button" onClick={closeForm} className="rounded-full p-2 hover:bg-slate-100"><X /></button></div><div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold text-slate-600">Nama Kegiatan<input required value={form.namaKegiatan} onChange={(e) => setForm({...form, namaKegiatan:e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">No. Referensi Surat Permohonan<input value={form.nomorReferensi} onChange={(e) => setForm({...form, nomorReferensi:e.target.value})} placeholder="Contoh: 012/PDPN/VIII/2026" className="w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Program Ajahan<select value={form.programAjahanId} onChange={(e) => setForm({...form, programAjahanId:e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 font-normal"><option value="">Kegiatan umum</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.nama}</option>)}</select></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Penanggung Jawab<input required value={form.penanggungJawab} onChange={(e) => setForm({...form, penanggungJawab:e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600 md:col-span-2">QR-Code Verifikasi Dokumen<select value={form.rabQrDocumentId} onChange={(e) => setForm({...form, rabQrDocumentId:e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 font-normal"><option value="">Buat QR baru saat persetujuan RAB</option>{verificationDocuments.map((document) => <option key={document.id} value={document.id} disabled={!document.tersedia}>{document.nomorSurat} · {document.token} · {document.namaPejabat}{!document.tersedia?' (sudah digunakan)':''}</option>)}</select><span className="block text-xs font-normal text-slate-400">Pilihan berasal dari Riwayat & Pemantauan Verifikasi Dokumen.</span></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Dokumen Pendukung (opsional)<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setForm({...form, dokumen:e.target.files[0]})} className="w-full rounded-xl border border-slate-200 p-2 text-sm font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Tanggal Mulai<input required type="date" value={form.tanggalMulai} onChange={(e) => setForm({...form, tanggalMulai:e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Tanggal Selesai<input required type="date" min={form.tanggalMulai} value={form.tanggalSelesai} onChange={(e) => setForm({...form, tanggalSelesai:e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600 md:col-span-2">Tujuan Kegiatan<textarea value={form.tujuan} onChange={(e) => setForm({...form, tujuan:e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 font-normal" rows="2" /></label>
      </div>
      <div><div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-slate-800">Rincian Anggaran</h3><button type="button" onClick={() => setForm({...form, items:[...form.items, emptyItem()]})} className="text-sm font-bold text-emerald-600">+ Tambah Item</button></div><div className="space-y-3">{form.items.map((item,index) => <div key={index} className="grid grid-cols-12 gap-2 rounded-xl bg-slate-50 p-3"><select value={item.kategoriId} onChange={(e)=>setItem(index,'kategoriId',e.target.value)} className="col-span-12 rounded-lg border border-slate-200 p-2 text-sm md:col-span-2"><option value="">Kategori</option>{categories.map(c=><option key={c.id} value={c.id}>{c.nama}</option>)}</select><input required placeholder="Uraian" value={item.uraian} onChange={(e)=>setItem(index,'uraian',e.target.value)} className="col-span-12 rounded-lg border border-slate-200 p-2 text-sm md:col-span-3"/><input required type="number" min="0.01" step="0.01" placeholder="Volume" value={item.volume} onChange={(e)=>setItem(index,'volume',e.target.value)} className="col-span-3 rounded-lg border border-slate-200 p-2 text-sm md:col-span-1"/><input required placeholder="Satuan" value={item.satuan} onChange={(e)=>setItem(index,'satuan',e.target.value)} className="col-span-3 rounded-lg border border-slate-200 p-2 text-sm md:col-span-1"/><input required type="number" min="1" placeholder="Harga satuan" value={item.hargaSatuan} onChange={(e)=>setItem(index,'hargaSatuan',e.target.value)} className="col-span-5 rounded-lg border border-slate-200 p-2 text-sm md:col-span-2"/><div className="col-span-10 flex items-center justify-end font-bold text-slate-700 md:col-span-2">{formatRupiah((Number(item.volume)||0)*(Number(item.hargaSatuan)||0))}</div><button type="button" disabled={form.items.length===1} onClick={()=>setForm({...form,items:form.items.filter((_,i)=>i!==index)})} className="col-span-2 text-red-400 disabled:opacity-30 md:col-span-1"><Trash2 size={17}/></button></div>)}</div><div className="mt-4 flex justify-end text-lg font-black text-slate-800">Total Diajukan: <span className="ml-3 text-emerald-700">{formatRupiah(total)}</span></div></div>
    </div><div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5"><button type="button" onClick={closeForm} className="rounded-xl px-5 py-2.5 font-bold text-slate-600">Batal</button><button disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white disabled:opacity-50">{saving?'Menyimpan...':'Simpan Draft'}</button></div></form></div>}
  </div>;
}
