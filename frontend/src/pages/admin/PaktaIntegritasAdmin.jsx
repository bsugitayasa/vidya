import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCopy, Download, ExternalLink, FilePlus2, FileSignature, Loader2, RefreshCw, Search, ShieldCheck, Users, XCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import { downloadPaktaPdf } from '../../lib/paktaPdf';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const defaultClauses = [
  ['tata-tertib', 'Tata Tertib Pasraman', 'Saya bersedia menaati tata tertib Pasraman, menjaga kedisiplinan, tata krama, etika, tata busana, serta ketertiban selama mengikuti kegiatan pembelajaran.'],
  ['janji-sisya', 'Janji Sisya', 'Saya bersedia mengamalkan dan menaati Janji Sisya serta menjaga nama baik Pasraman dan organisasi.'],
  ['penggunaan-materi', 'Penggunaan Materi Ajah', 'Saya menggunakan buku dan materi ajah hanya untuk kepentingan pembelajaran pribadi dalam program yang saya ikuti.'],
  ['larangan-komersial', 'Larangan Komersialisasi', 'Saya tidak akan menjual, menyewakan, atau mengomersialkan buku maupun materi ajah dalam bentuk apa pun.'],
  ['larangan-distribusi', 'Larangan Distribusi', 'Saya tidak akan mengedarkan, memberikan, meneruskan, mengunggah, atau mempublikasikan materi ajah kepada pihak yang tidak berkepentingan.'],
  ['larangan-penggandaan', 'Larangan Penggandaan', 'Saya tidak akan menggandakan materi melalui fotokopi, pemindaian, rekaman, tangkapan layar, salinan digital, atau cara lainnya tanpa izin tertulis.'],
  ['keamanan-materi', 'Keamanan dan Pelaporan', 'Saya menjaga keamanan buku, akun, tautan, dan media penyimpanan materi serta segera melaporkan kehilangan atau dugaan kebocoran.'],
  ['pembinaan-sanksi', 'Pembinaan dan Sanksi', 'Saya bersedia menerima pembinaan atau sanksi sesuai ketentuan resmi Pasraman apabila terbukti melakukan pelanggaran.']
].map(([id, title, text]) => ({ id, title, text }));

const blankForm = () => ({ kode: 'PI-SISYA', judul: 'PAKTA INTEGRITAS SISYA', pembuka: 'Dengan penuh kesadaran dan tanpa paksaan, saya menyatakan bersedia mengikuti seluruh ketentuan Pasraman Dharma Wasitha Capung Mas dan menjaga amanah atas materi ajah yang saya terima.', referensiPedoman: 'Buku Pedoman Belajar Mengajar Dikjar 2026 dan Lampiran Janji Sisya', tanggalBerlaku: new Date().toISOString().slice(0, 10), batasHari: 14, wajibTandaUlang: true, klausul: defaultClauses });
const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const input = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100';
const badge = { MENUNGGU: 'bg-amber-100 text-amber-800', DITANDATANGANI: 'bg-emerald-100 text-emerald-800', KEDALUWARSA: 'bg-red-100 text-red-700', DIBATALKAN: 'bg-slate-200 text-slate-700', DIGANTIKAN: 'bg-violet-100 text-violet-700' };

export default function PaktaIntegritasAdmin() {
  const user = useAuthStore((state) => state.user);
  const isSuper = user?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState('monitoring');
  const [templates, setTemplates] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({ search: '', status: '', templateId: '', programId: '' });
  const [preview, setPreview] = useState(null);
  const [publishTargetId, setPublishTargetId] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const qrRef = useRef(null);

  const activeTemplate = useMemo(() => templates.find((item) => item.status === 'AKTIF'), [templates]);

  const loadBase = async () => {
    const [templateRes, programRes] = await Promise.all([api.get('/pakta-integritas/templates'), api.get('/program-ajahan')]);
    setTemplates(templateRes.data.data); setPrograms(programRes.data.data);
  };
  const loadAssignments = async () => {
    const params = { ...Object.fromEntries(Object.entries(filter).filter(([, value]) => value)), limit: 2000 };
    const [listRes, statsRes] = await Promise.all([api.get('/pakta-integritas/assignments', { params }), api.get('/pakta-integritas/stats', { params: filter.templateId ? { templateId: filter.templateId } : {} })]);
    setAssignments(listRes.data.data); setStats(statsRes.data.data);
  };
  const refresh = async () => { setLoading(true); try { await Promise.all([loadBase(), loadAssignments()]); } catch (err) { toast.error(err.response?.data?.message || 'Gagal memuat Pakta Integritas'); } finally { setLoading(false); } };
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps

  const saveTemplate = async () => {
    setBusy(true);
    try {
      if (editingId) await api.put(`/pakta-integritas/templates/${editingId}`, form); else await api.post('/pakta-integritas/templates', form);
      toast.success(editingId ? 'Draft diperbarui' : 'Draft pakta berhasil dibuat'); setForm(blankForm()); setEditingId(null); await loadBase();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan template'); } finally { setBusy(false); }
  };
  const editTemplate = (item) => { setEditingId(item.id); setForm({ kode: item.kode, judul: item.judul, pembuka: item.pembuka, referensiPedoman: item.referensiPedoman, tanggalBerlaku: item.tanggalBerlaku.slice(0, 10), batasHari: item.batasHari, wajibTandaUlang: item.wajibTandaUlang, klausul: item.klausul }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const publish = (id) => setPublishTargetId(id);
  const confirmPublish = async () => {
    const id = publishTargetId;
    setBusy(true);
    try {
      const res = await api.post(`/pakta-integritas/templates/${id}/publish`);
      toast.success(res.data.message);
      setPublishTargetId(null);
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan pakta');
    } finally {
      setBusy(false);
    }
  };
  const updateClause = (index, key, value) => setForm({ ...form, klausul: form.klausul.map((item, idx) => idx === index ? { ...item, [key]: value } : item) });
  const addClause = () => setForm({ ...form, klausul: [...form.klausul, { id: `klausul-${Date.now()}`, title: '', text: '' }] });

  const copyLink = async (path) => { await navigator.clipboard.writeText(`${window.location.origin}${path}`); toast.success('Tautan disalin'); };
  const regenerate = async (item) => { setBusy(true); try { await api.post(`/pakta-integritas/assignments/${item.id}/regenerate`); toast.success('Akses pakta sisya diaktifkan kembali melalui tautan umum'); await loadAssignments(); } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengaktifkan pakta'); } finally { setBusy(false); } };
  const revoke = (item) => {
    setRevokeTarget(item);
    setRevokeReason('');
  };
  const confirmRevoke = async () => {
    if (revokeReason.trim().length < 5) return toast.warning('Alasan pembatalan minimal 5 karakter');
    setBusy(true);
    try {
      await api.post(`/pakta-integritas/assignments/${revokeTarget.id}/revoke`, { reason: revokeReason.trim() });
      toast.success('Pakta berhasil dibatalkan');
      setRevokeTarget(null);
      setRevokeReason('');
      await loadAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pakta');
    } finally {
      setBusy(false);
    }
  };
  const view = async (id) => { try { const res = await api.get(`/pakta-integritas/assignments/${id}`); setPreview(res.data.data); } catch (err) { toast.error(err.response?.data?.message || 'Gagal membuka dokumen'); } };
  const exportExcel = () => { const rows = assignments.map((item) => ({ 'No Pendaftaran': item.sisya.nomorPendaftaran, 'Nama Sisya': item.sisya.namaLengkap, 'Versi': item.template.versi, 'Nomor Dokumen': item.nomorDokumen, 'Status': item.status.replaceAll('_', ' '), 'Tenggat': new Date(item.expiresAt).toLocaleDateString('id-ID'), 'Ditandatangani': item.signedAt ? new Date(item.signedAt).toLocaleString('id-ID') : '' })); const sheet = XLSX.utils.json_to_sheet(rows); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Pakta Integritas'); XLSX.writeFile(book, 'Rekap-Pakta-Integritas.xlsx'); };
  const downloadPreview = () => downloadPaktaPdf(preview, qrRef.current?.querySelector('canvas')?.toDataURL('image/png'));

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={34}/></div>;
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Kepatuhan Sisya</p><h1 className="mt-1 text-3xl font-black text-slate-800">Pakta Integritas</h1><p className="mt-1 text-sm text-slate-500">Kelola versi pakta, distribusi tautan, tanda tangan, dan bukti persetujuan elektronik.</p></div><div className="flex gap-2"><button onClick={() => { loadAssignments(); loadBase(); }} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600"><RefreshCw size={18}/></button><button onClick={exportExcel} disabled={!assignments.length} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Download size={17}/> Export Rekap</button></div></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat icon={Users} label="Sisya Aktif" value={stats.totalSisyaAktif || 0} color="blue"/><Stat icon={FileSignature} label="Memiliki Pakta" value={stats.totalPakta || 0} color="violet"/><Stat icon={CheckCircle2} label="Ditandatangani" value={stats.DITANDATANGANI || 0} color="emerald"/><Stat icon={AlertTriangle} label="Belum Tanda Tangan" value={stats.BELUM_MENANDATANGANI || 0} color="amber"/><Stat icon={ShieldCheck} label="Kepatuhan" value={`${stats.persentase || 0}%`} color="orange"/></div>
    <div className="flex gap-2 rounded-xl bg-slate-100 p-1.5 w-fit"><Tab active={tab === 'monitoring'} onClick={() => setTab('monitoring')}>Monitoring Sisya</Tab><Tab active={tab === 'template'} onClick={() => setTab('template')}>Template & Versi</Tab></div>

    {tab === 'template' && <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      {isSuper && <section className={`${panel} p-5 sm:p-7`}><div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-slate-800">{editingId ? 'Edit Draft' : 'Buat Versi Pakta'}</h2><p className="text-xs text-slate-500">Naskah yang telah diterbitkan tidak dapat diubah.</p></div>{editingId && <button onClick={() => { setEditingId(null); setForm(blankForm()); }} className="text-sm font-bold text-slate-500">Batal</button>}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Kode"><input className={input} value={form.kode} disabled={!!editingId} onChange={(e) => setForm({ ...form, kode: e.target.value })}/></Field><Field label="Tanggal Berlaku"><input type="date" className={input} value={form.tanggalBerlaku} onChange={(e) => setForm({ ...form, tanggalBerlaku: e.target.value })}/></Field><Field label="Judul" wide><input className={input} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })}/></Field><Field label="Referensi Pedoman" wide><input className={input} value={form.referensiPedoman} onChange={(e) => setForm({ ...form, referensiPedoman: e.target.value })}/></Field><Field label="Pembuka" wide><textarea rows="3" className={input} value={form.pembuka} onChange={(e) => setForm({ ...form, pembuka: e.target.value })}/></Field><Field label="Masa Berlaku Tautan (hari)"><input type="number" min="1" max="365" className={input} value={form.batasHari} onChange={(e) => setForm({ ...form, batasHari: e.target.value })}/></Field><label className="flex items-center gap-3 self-end rounded-xl bg-violet-50 p-3 text-sm font-semibold text-violet-800"><input type="checkbox" checked={form.wajibTandaUlang} onChange={(e) => setForm({ ...form, wajibTandaUlang: e.target.checked })}/> Wajib tanda tangan ulang</label></div><div className="mt-6 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Klausul Persetujuan</h3><button onClick={addClause} className="text-sm font-bold text-orange-600">+ Tambah Klausul</button></div>{form.klausul.map((clause, index) => <div key={clause.id} className="rounded-xl border border-slate-200 p-4"><div className="flex gap-2"><span className="pt-2 text-sm font-black text-orange-600">{index + 1}.</span><div className="flex-1 space-y-2"><input className={input} placeholder="Judul klausul" value={clause.title} onChange={(e) => updateClause(index, 'title', e.target.value)}/><textarea className={input} rows="3" placeholder="Isi pernyataan" value={clause.text} onChange={(e) => updateClause(index, 'text', e.target.value)}/></div>{form.klausul.length > 1 && <button onClick={() => setForm({ ...form, klausul: form.klausul.filter((_, idx) => idx !== index) })} className="self-start p-2 text-red-500"><XCircle size={18}/></button>}</div></div>)}</div><button onClick={saveTemplate} disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><FilePlus2 size={18}/> {editingId ? 'Simpan Perubahan' : 'Simpan Draft'}</button></section>}
      <section className={`${panel} overflow-hidden`}><div className="border-b border-slate-100 p-5"><h2 className="font-black text-slate-800">Riwayat Versi</h2></div><div className="divide-y divide-slate-100">{templates.map((item) => <div key={item.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-800">{item.judul}</p><p className="mt-1 text-xs text-slate-500">{item.kode} · Versi {item.versi} · {item._count.paktaSisyas} pakta</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : item.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">{item.referensiPedoman}</p>{isSuper && item.status === 'DRAFT' && <div className="mt-4 flex gap-2"><button onClick={() => editTemplate(item)} className="rounded-lg border px-3 py-2 text-xs font-bold text-slate-600">Edit</button><button onClick={() => publish(item.id)} disabled={busy} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Terbitkan</button></div>}</div>)}</div></section>
    </div>}

    {tab === 'monitoring' && <div className="space-y-5">
      <section className={`${panel} p-5 sm:p-6`}><div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div className="flex items-center gap-4"><div className="rounded-2xl border bg-white p-2"><QRCodeCanvas value={`${window.location.origin}/pakta-integritas`} size={92} level="H" includeMargin imageSettings={{ src: '/logo.png', height: 18, width: 18, excavate: true }}/></div><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-600">Tautan untuk seluruh sisya</p><h2 className="mt-1 font-black text-slate-800">Portal Penandatanganan Pakta</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Bagikan satu tautan ini kepada seluruh sisya. Sistem mengenali sisya melalui nomor pendaftaran dan tanggal lahir, lalu membuat dokumen unik secara otomatis.</p><p className="mt-2 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">{window.location.origin}/pakta-integritas</p></div></div><div className="flex w-full gap-2 md:w-auto"><button onClick={() => copyLink('/pakta-integritas')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white"><ClipboardCopy size={17}/> Salin Tautan</button><a href="/pakta-integritas" target="_blank" className="rounded-xl border border-slate-200 p-3 text-slate-600"><ExternalLink size={18}/></a></div></div>{!activeTemplate && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Portal belum dapat digunakan karena belum ada template aktif.</p>}</section>
      <section className={`${panel} overflow-hidden`}><div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-5"><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input className={`${input} pl-9`} placeholder="Nama / no. pendaftaran" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })}/></div><select className={input} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}><option value="">Semua status</option>{Object.keys(badge).map((status) => <option key={status}>{status}</option>)}</select><select className={input} value={filter.templateId} onChange={(e) => setFilter({ ...filter, templateId: e.target.value })}><option value="">Semua versi</option>{templates.map((t) => <option key={t.id} value={t.id}>Versi {t.versi} · {t.status}</option>)}</select><select className={input} value={filter.programId} onChange={(e) => setFilter({ ...filter, programId: e.target.value })}><option value="">Semua program</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}</select><button onClick={loadAssignments} className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white">Terapkan Filter</button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Sisya</th><th className="px-5 py-3">Dokumen</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Waktu</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{assignments.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-bold text-slate-800">{item.sisya.namaLengkap}</p><p className="text-xs text-slate-500">{item.sisya.nomorPendaftaran}</p></td><td className="px-5 py-4"><p className="max-w-64 truncate text-xs font-semibold text-slate-700">{item.nomorDokumen}</p><p className="text-[11px] text-slate-400">Versi {item.template.versi}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${badge[item.status] || 'bg-slate-100'}`}>{item.status.replaceAll('_', ' ')}</span></td><td className="px-5 py-4 text-xs text-slate-500">{item.signedAt ? new Date(item.signedAt).toLocaleString('id-ID') : `Tenggat ${new Date(item.expiresAt).toLocaleDateString('id-ID')}`}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => view(item.id)} title="Lihat detail" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><ExternalLink size={16}/></button>{isSuper && ['MENUNGGU','KEDALUWARSA','DIBATALKAN'].includes(item.status) && <button onClick={() => regenerate(item)} title="Buat tautan baru" className="rounded-lg p-2 text-orange-600 hover:bg-orange-50"><RefreshCw size={16}/></button>}{isSuper && !['DIBATALKAN','DIGANTIKAN'].includes(item.status) && <button onClick={() => revoke(item)} title="Batalkan" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><XCircle size={16}/></button>}</div></td></tr>)}</tbody></table>{!assignments.length && <p className="p-10 text-center text-sm text-slate-400">Belum ada data Pakta Integritas.</p>}</div></section>
    </div>}

    {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white"><div className="sticky top-0 flex items-center justify-between border-b bg-white p-5"><div><h2 className="font-black text-slate-800">Detail Pakta Integritas</h2><p className="text-xs text-slate-500">{preview.nomorDokumen}</p></div><button onClick={() => setPreview(null)} className="p-2 text-slate-500"><XCircle/></button></div><div className="space-y-5 p-6"><div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><FieldValue label="Nama" value={preview.sisya?.namaLengkap}/><FieldValue label="No. Pendaftaran" value={preview.sisya?.nomorPendaftaran}/><FieldValue label="Program" value={preview.programSnapshot?.map((p) => p.nama).join(', ')}/><FieldValue label="Status" value={preview.status?.replaceAll('_',' ')}/></div><p className="text-sm leading-6 text-slate-600">{preview.contentSnapshot?.pembuka}</p><div className="space-y-3">{preview.contentSnapshot?.klausul?.map((item, index) => <div key={item.id} className="rounded-xl border p-4"><p className="font-bold text-slate-800">{index + 1}. {item.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p></div>)}</div>{preview.signatureData && <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold uppercase text-slate-400">Ditandatangani oleh</p><p className="mt-1 font-black text-slate-800">{preview.namaPenandatangan}</p><p className="text-xs text-slate-500">{new Date(preview.signedAt).toLocaleString('id-ID')}</p><img src={preview.signatureData} className="mt-2 h-24 max-w-64 object-contain object-left"/></div><div ref={qrRef} className="text-center"><QRCodeCanvas value={`${window.location.origin}/verifikasi-pakta/${preview.verificationCode}`} size={125} level="H" includeMargin imageSettings={{ src: '/logo.png', height: 24, width: 24, excavate: true }}/><p className="font-mono text-xs font-bold">{preview.verificationCode}</p></div></div>}{preview.status === 'DITANDATANGANI' && <button onClick={downloadPreview} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white"><Download size={17}/> Unduh PDF</button>}</div></div></div>}
    <ConfirmDialog
      open={Boolean(publishTargetId)}
      title="Terbitkan Pakta Integritas?"
      message="Versi ini akan menjadi pakta aktif dan versi aktif sebelumnya akan dinonaktifkan. Naskah yang sudah diterbitkan tidak dapat diedit."
      confirmLabel="Terbitkan"
      variant="warning"
      isLoading={busy}
      onConfirm={confirmPublish}
      onCancel={() => !busy && setPublishTargetId(null)}
    />
    {revokeTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-red-100 p-3 text-red-600"><AlertTriangle size={24}/></div><div><h2 className="text-lg font-black text-slate-800">Batalkan Pakta Integritas?</h2><p className="mt-1 text-sm text-slate-500">{revokeTarget.sisya.namaLengkap} · {revokeTarget.sisya.nomorPendaftaran}</p></div></div>
        <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-slate-500">Alasan pembatalan<textarea autoFocus rows="4" value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} placeholder="Tuliskan alasan minimal 5 karakter" className={`${input} mt-2 resize-none`}/></label>
        <div className="mt-6 flex justify-end gap-2"><button disabled={busy} onClick={() => setRevokeTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Batal</button><button disabled={busy || revokeReason.trim().length < 5} onClick={confirmRevoke} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Memproses...' : 'Batalkan Pakta'}</button></div>
      </div>
    </div>}
  </div>;
}

function Tab({ active, onClick, children }) { return <button onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-bold ${active ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500'}`}>{children}</button>; }
function Stat({ icon: Icon, label, value, color }) { const colors = { blue: 'bg-blue-100 text-blue-600', violet: 'bg-violet-100 text-violet-600', emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600', orange: 'bg-orange-100 text-orange-600' }; return <div className={`${panel} p-4`}><div className={`w-fit rounded-xl p-2 ${colors[color]}`}><Icon size={18}/></div><p className="mt-3 text-2xl font-black text-slate-800">{value}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p></div>; }
function Field({ label, wide, children }) { return <label className={`${wide ? 'sm:col-span-2' : ''} block`}><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>; }
function FieldValue({ label, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-700">{value || '-'}</p></div>; }
