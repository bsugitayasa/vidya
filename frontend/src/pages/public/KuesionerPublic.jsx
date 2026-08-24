import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole, MessageSquareHeart, Send } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';

export default function KuesionerPublic() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittedKey = useMemo(() => session ? `vidya_kuesioner_${session.id}` : '', [session]);
  const alreadySubmitted = Boolean(submittedKey && localStorage.getItem(submittedKey));

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = token
          ? await api.get(`/open/kuesioner/sesi/${encodeURIComponent(token)}`)
          : await api.get('/open/kuesioner/sesi-hari-ini');
        if (!active) return;
        if (token) setSession(response.data.data);
        else setSessions(response.data.data || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Kuesioner tidak dapat dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    if (!session || message.trim().length < 10) return toast.error('Pesan dan kesan minimal 10 karakter.');
    setSubmitting(true);
    try {
      await api.post('/open/kuesioner/jawaban', { token: session.token, pesanKesan: message.trim() });
      localStorage.setItem(submittedKey, new Date().toISOString());
      setMessage('');
      toast.success('Terima kasih. Jawaban anonim Anda telah tersimpan.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Jawaban gagal dikirim.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-muted">Memuat kuesioner...</div>;

  if (!token) return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center"><MessageSquareHeart size={28} /></div>
        <h1 className="text-2xl sm:text-3xl font-black text-primary">Kuesioner Pertemuan Hari Ini</h1>
        <p className="text-sm text-muted">Pilih program ajahan yang baru Anda ikuti. Jawaban tidak meminta nama atau nomor pendaftaran.</p>
      </div>
      {error && <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm">{error}</div>}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <p className="font-bold text-slate-700">Tidak ada sesi kuesioner yang tersedia hari ini.</p>
          <p className="text-sm text-muted mt-2">Kuesioner hanya terbuka pada tanggal pertemuan.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sessions.map((item) => (
            <button key={item.id} onClick={() => navigate(`/kuesioner/${item.token}`)} className="text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-primary hover:shadow-md transition-all">
              <span className="inline-flex rounded-full bg-primary/10 text-primary text-[10px] font-black px-3 py-1 uppercase tracking-wider">{item.programAjahan.nama}</span>
              <h2 className="font-bold text-slate-800 mt-3">Pertemuan {item.pertemuan}</h2>
              <p className="text-sm text-muted mt-1">{item.mataKuliah.nama}{item.topik ? ` · ${item.topik}` : ''}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );

  if (error || !session) return <div className="max-w-xl mx-auto rounded-3xl bg-white border border-red-100 p-8 text-center"><p className="font-bold text-red-700">{error || 'Sesi tidak ditemukan.'}</p></div>;

  return (
    <section className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-teal-700 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 text-white/85 text-xs font-bold uppercase tracking-widest"><LockKeyhole size={16} /> Kuesioner Anonim</div>
          <h1 className="text-2xl sm:text-3xl font-black mt-4">{session.programAjahan.nama}</h1>
          <p className="mt-2 text-white/85">Pertemuan {session.pertemuan} · {session.mataKuliah.nama}{session.topik ? ` · ${session.topik}` : ''}</p>
        </div>
        <div className="p-6 sm:p-8">
          {alreadySubmitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto text-emerald-500" size={52} />
              <h2 className="text-xl font-black text-slate-800 mt-4">Jawaban sudah terkirim</h2>
              <p className="text-sm text-muted mt-2">Perangkat ini telah mengirim kuesioner untuk sesi tersebut. Terima kasih atas masukannya.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="rounded-2xl bg-teal-50 border border-teal-100 p-4 text-sm text-teal-800">
                Tidak ada nama, nomor pendaftaran, email, atau nomor HP yang diminta maupun disimpan bersama jawaban.
              </div>
              <div>
                <label htmlFor="pesan-kesan" className="block font-bold text-slate-800 mb-2">Pesan dan kesan selama pertemuan</label>
                <textarea id="pesan-kesan" rows="7" maxLength="2000" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ceritakan hal yang bermanfaat, kendala, atau saran perbaikan..." className="w-full rounded-2xl border border-slate-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y" />
                <div className="flex justify-between text-[11px] text-muted mt-2"><span>Minimal 10 karakter</span><span>{message.length}/2000</span></div>
              </div>
              <button type="submit" disabled={submitting || message.trim().length < 10} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-white font-bold py-3.5 disabled:opacity-50 hover:brightness-110 transition"><Send size={18} />{submitting ? 'Mengirim...' : 'Kirim Secara Anonim'}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
