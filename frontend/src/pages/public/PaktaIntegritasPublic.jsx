import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Download, Eraser, FileSignature, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import DatePicker, { registerLocale } from 'react-datepicker';
import { id as localeId } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../lib/axios';
import { downloadPaktaPdf } from '../../lib/paktaPdf';

registerLocale('id', localeId);

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100';
const toIsoDate = (date) => date
  ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  : null;

export default function PaktaIntegritasPublic() {
  const { token } = useParams();
  const isGeneralPortal = !token;
  const [data, setData] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [identity, setIdentity] = useState({ nomorPendaftaran: '' });
  const [birthDate, setBirthDate] = useState(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState({});
  const [readAgreement, setReadAgreement] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const qrRef = useRef(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    api.get(`/pakta-integritas/public/${token}`).then((res) => {
      setData(res.data.data);
      if (res.data.data.status === 'DITANDATANGANI') setDocument(res.data.data);
    }).catch((err) => setError(err.response?.data?.message || 'Pakta Integritas tidak dapat dimuat')).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!verificationToken || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1e293b';
  }, [verificationToken]);

  const verify = async (event) => {
    event.preventDefault();
    const tanggalLahir = toIsoDate(birthDate);
    if (!tanggalLahir) return toast.warning('Pilih tanggal lahir terlebih dahulu');
    setBusy(true);
    try {
      const endpoint = isGeneralPortal ? '/pakta-integritas/public/identity' : `/pakta-integritas/public/${token}/identity`;
      const res = await api.post(endpoint, { ...identity, tanggalLahir });
      setVerificationToken(res.data.data.verificationToken);
      setDocument(res.data.data.pakta); setName(res.data.data.pakta.sisya.namaLengkap);
      setData(res.data.data.pakta);
      toast.success('Identitas berhasil diverifikasi');
    } catch (err) { toast.error(err.response?.data?.message || 'Verifikasi gagal'); }
    finally { setBusy(false); }
  };

  const point = (event) => { const rect = canvasRef.current.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const startDraw = (event) => { drawing.current = true; const p = point(event); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); canvasRef.current.setPointerCapture(event.pointerId); };
  const draw = (event) => { if (!drawing.current) return; const p = point(event); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasSignature(true); };
  const stopDraw = () => { drawing.current = false; };
  const clearSignature = () => { const canvas = canvasRef.current; canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); setHasSignature(false); };

  const sign = async () => {
    const clauses = document.contentSnapshot.klausul || [];
    if (!readAgreement || clauses.some((clause) => !accepted[clause.id]) || !hasSignature) return toast.warning('Setujui seluruh pernyataan dan bubuhkan tanda tangan terlebih dahulu');
    setBusy(true);
    try {
      const endpoint = isGeneralPortal ? '/pakta-integritas/public/sign' : `/pakta-integritas/public/${token}/sign`;
      const res = await api.post(endpoint, { verificationToken, namaPenandatangan: name, acceptedClauseIds: clauses.map((item) => item.id), readAgreement, signatureData: canvasRef.current.toDataURL('image/png') });
      setDocument(res.data.data); setData(res.data.data); setVerificationToken('');
      toast.success('Pakta Integritas berhasil ditandatangani'); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan tanda tangan'); }
    finally { setBusy(false); }
  };

  const download = () => downloadPaktaPdf(document, qrRef.current?.querySelector('canvas')?.toDataURL('image/png'));

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={34}/></div>;
  if (error) return <StateCard icon={AlertTriangle} title="Pakta tidak tersedia" text={error} danger/>;
  if (data && data.status !== 'MENUNGGU' && data.status !== 'DITANDATANGANI') return <StateCard icon={AlertTriangle} title="Tautan tidak aktif" text={`Dokumen ini berstatus ${data.status.replaceAll('_', ' ').toLowerCase()}. Hubungi admin Pasraman untuk memperoleh tautan baru.`} danger/>;

  if (data?.status === 'DITANDATANGANI' && !verificationToken) {
    const verifyUrl = `${window.location.origin}/verifikasi-pakta/${data.verificationCode}`;
    return <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-3xl border border-emerald-100 bg-white p-7 text-center shadow-xl shadow-emerald-100/50 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={36}/></div>
        <h1 className="mt-5 text-2xl font-black text-slate-800">Pakta Integritas Telah Ditandatangani</h1>
        <p className="mt-2 text-sm text-slate-500">Nomor dokumen {data.nomorDokumen}</p>
        <div ref={qrRef} className="mx-auto mt-6 w-fit rounded-2xl border p-3"><QRCodeCanvas value={verifyUrl} size={150} level="H" includeMargin imageSettings={{ src: '/logo.png', height: 28, width: 28, excavate: true }}/></div>
        <p className="mt-3 font-mono text-sm font-bold tracking-wider text-slate-700">{data.verificationCode}</p>
        <button onClick={download} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"><Download size={18}/> Unduh Pakta Integritas</button>
      </div>
    </div>;
  }

  if (!verificationToken) return <div className="mx-auto max-w-xl px-4 py-10">
    <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-xl shadow-orange-100/40 sm:p-9">
      <div className="flex items-center gap-4"><div className="rounded-2xl bg-orange-100 p-3 text-orange-700"><LockKeyhole size={28}/></div><div><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-600">Verifikasi Sisya</p><h1 className="text-2xl font-black text-slate-800">Pakta Integritas</h1></div></div>
      <p className="mt-6 text-sm leading-6 text-slate-600">Masukkan identitas sesuai data pendaftaran untuk membuka dokumen. Satu halaman ini dapat digunakan oleh seluruh sisya dan data hanya dipakai untuk memastikan pakta ditandatangani oleh orang yang tepat.</p>
      <form onSubmit={verify} className="mt-6 space-y-4">
        <label className="block text-sm font-bold text-slate-700">Nomor Pendaftaran<input required value={identity.nomorPendaftaran} onChange={(e) => setIdentity({ ...identity, nomorPendaftaran: e.target.value })} className={`${inputClass} mt-2`} placeholder="Contoh: 2026-0001"/></label>
        <label className="block text-sm font-bold text-slate-700">Tanggal Lahir
          <DatePicker
            selected={birthDate}
            onChange={setBirthDate}
            dateFormat="dd/MM/yyyy"
            locale="id"
            placeholderText="DD/MM/YYYY"
            maxDate={new Date()}
            minDate={new Date(1920, 0, 1)}
            showMonthDropdown
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            dropdownMode="select"
            calendarStartDay={1}
            strictParsing
            autoComplete="bday"
            wrapperClassName="mt-2 w-full"
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs font-normal text-slate-400">Format tanggal: DD/MM/YYYY. Klik kolom untuk memilih dari kalender.</span>
        </label>
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18}/>} Verifikasi dan Buka Pakta</button>
      </form>
    </div>
  </div>;

  const clauses = document.contentSnapshot.klausul || [];
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <header className="bg-gradient-to-br from-orange-700 to-amber-600 px-6 py-8 text-white sm:px-10"><div className="flex items-center gap-4"><img src="/logo.png" className="h-14 w-14 object-contain"/><div><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-100">Pasraman Dharma Wasitha Capung Mas</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">{document.contentSnapshot.judul}</h1></div></div><p className="mt-5 text-sm text-orange-50">{document.nomorDokumen}</p></header>
      <div className="space-y-7 p-6 sm:p-10">
        <div className="grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2"><Info label="Nama" value={document.sisya.namaLengkap}/><Info label="No. Pendaftaran" value={document.sisya.nomorPendaftaran}/><Info label="Program" value={(document.programSnapshot || []).map((p) => p.nama).join(', ')}/><Info label="Referensi" value={document.contentSnapshot.referensiPedoman}/></div>
        <p className="leading-7 text-slate-700">{document.contentSnapshot.pembuka}</p>
        <div className="space-y-4">{clauses.map((clause, index) => <label key={clause.id} className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${accepted[clause.id] ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-orange-200'}`}><input type="checkbox" checked={!!accepted[clause.id]} onChange={(e) => setAccepted({ ...accepted, [clause.id]: e.target.checked })} className="mt-1 h-5 w-5 accent-emerald-600"/><span><span className="font-bold text-slate-800">{index + 1}. {clause.title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{clause.text}</span></span></label>)}</div>
        <label className="flex gap-3 rounded-2xl border-2 border-orange-200 bg-orange-50 p-5"><input type="checkbox" checked={readAgreement} onChange={(e) => setReadAgreement(e.target.checked)} className="mt-1 h-5 w-5 accent-orange-600"/><span className="text-sm font-semibold leading-6 text-orange-950">Saya telah membaca, memahami, dan menyetujui seluruh isi Pakta Integritas serta bersedia mempertanggungjawabkan pernyataan ini.</span></label>
        <div><label className="text-sm font-bold text-slate-700">Nama lengkap penandatangan</label><input value={name} readOnly className={`${inputClass} mt-2 bg-slate-50 font-semibold`}/></div>
        <div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-bold text-slate-700">Tanda tangan pada kotak berikut</label><button type="button" onClick={clearSignature} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600"><Eraser size={14}/> Hapus</button></div><canvas ref={canvasRef} onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerCancel={stopDraw} onPointerLeave={stopDraw} className="h-48 w-full touch-none rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50"/></div>
        <button onClick={sign} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={19}/> : <FileSignature size={20}/>} Tandatangani Pakta Integritas</button>
      </div>
    </article>
  </div>;
}

function Info({ label, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value || '-'}</p></div>; }
function StateCard({ icon: Icon, title, text, danger }) { return <div className="mx-auto max-w-lg px-4 py-16"><div className="rounded-3xl border bg-white p-9 text-center shadow-lg"><div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${danger ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}><Icon size={30}/></div><h1 className="mt-5 text-xl font-black text-slate-800">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div></div>; }
