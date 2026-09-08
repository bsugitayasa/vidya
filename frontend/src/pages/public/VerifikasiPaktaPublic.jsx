import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../lib/axios';

export default function VerifikasiPaktaPublic() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/pakta-integritas/public/verify/${code}`).then((res) => setResult(res.data)).catch((err) => setError(err.response?.data?.message || 'Dokumen tidak ditemukan')); }, [code]);
  if (!result && !error) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={34}/></div>;
  const valid = result?.valid;
  const data = result?.data;
  return <div className="mx-auto max-w-xl px-4 py-14"><div className="rounded-3xl border bg-white p-7 text-center shadow-xl sm:p-10"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${valid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{valid ? <CheckCircle2 size={36}/> : <AlertTriangle size={36}/>}</div><p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-slate-400"><ShieldCheck className="mr-1 inline" size={14}/> Verifikasi Dokumen</p><h1 className="mt-2 text-2xl font-black text-slate-800">{valid ? 'Pakta Integritas Terverifikasi' : 'Dokumen Tidak Valid'}</h1><p className="mt-2 text-sm text-slate-500">{result?.message || error}</p>{data && <div className="mt-7 space-y-3 rounded-2xl bg-slate-50 p-5 text-left text-sm"><Row label="Nomor dokumen" value={data.nomorDokumen}/><Row label="Nama sisya" value={data.namaPenandatangan}/><Row label="Versi" value={data.template?.versi}/><Row label="Ditandatangani" value={data.signedAt ? new Date(data.signedAt).toLocaleString('id-ID') : '-'}/><Row label="Status" value={data.status?.replaceAll('_', ' ')}/></div>}</div></div>;
}
function Row({ label, value }) { return <div className="flex justify-between gap-5"><span className="text-slate-500">{label}</span><span className="text-right font-bold text-slate-700">{value || '-'}</span></div>; }
