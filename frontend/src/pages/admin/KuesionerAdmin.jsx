import { useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BarChart3, Bot, CalendarRange, ClipboardCopy, ExternalLink, FileBarChart2, FileDown, Loader2, MessageSquareText, RefreshCw, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { saveKuesionerReportPdf } from '../../lib/kuesionerReportPdf';

const today = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const ResultList = ({ title, items, empty = 'Belum ada poin.' }) => (
  <div>
    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">{title}</h4>
    {items?.length ? <ul className="space-y-2 text-sm text-slate-700">{items.map((item, index) => <li key={`${title}-${index}`} className="flex gap-2"><span className="text-primary">•</span><span>{item}</span></li>)}</ul> : <p className="text-sm text-slate-400">{empty}</p>}
  </div>
);

const formatDate = (value) => new Intl.DateTimeFormat('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Makassar'
}).format(new Date(value));

const ProgramReport = ({ report, loading, exporting, onExport }) => {
  if (loading) return <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-muted">Memuat laporan per program...</div>;
  if (!report?.programs?.length) return <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-muted">Tidak ada program pada filter yang dipilih.</div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" onClick={onExport} disabled={exporting || !report.totalProgram} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50">
          {exporting ? <Loader2 size={17} className="animate-spin" /> : <FileDown size={17} />}
          {exporting ? 'Membuat PDF...' : 'Export PDF'}
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><FileBarChart2 className="text-primary" /><p className="text-3xl font-black mt-3">{report.totalProgram}</p><p className="text-xs font-bold text-muted uppercase">Program Ajahan</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><MessageSquareText className="text-teal-600" /><p className="text-3xl font-black mt-3">{report.totalRespons}</p><p className="text-xs font-bold text-muted uppercase">Total Respons</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><CalendarRange className="text-violet-600" /><p className="text-lg font-black mt-3">{formatDate(`${report.periode.startDate}T00:00:00Z`)}</p><p className="text-xs font-bold text-muted uppercase">s.d. {formatDate(`${report.periode.endDate}T00:00:00Z`)}</p></div>
      </div>

      {report.programs.map((program) => (
        <section key={program.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div><span className="text-[10px] font-black uppercase tracking-widest text-primary">{program.kode}</span><h2 className="text-xl font-black text-slate-800 mt-1">{program.nama}</h2></div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                {[
                  ['Pertemuan', program.jumlahPertemuan],
                  ['Terisi', program.jumlahPertemuanDenganRespons],
                  ['Respons', program.jumlahRespons],
                  ['Kehadiran', program.jumlahHadir],
                  ['Rasio', `${program.rasioRespons}%`]
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-white border border-slate-200 px-3 py-2 min-w-20"><p className="font-black text-slate-800">{value}</p><p className="text-[9px] uppercase font-bold text-muted">{label}</p></div>)}
              </div>
            </div>
          </div>

          {program.pertemuan.length === 0 ? <p className="p-6 text-sm text-muted">Belum ada pertemuan pada periode ini.</p> : (
            <div className="divide-y divide-slate-100">
              {program.pertemuan.map((meeting) => (
                <details key={meeting.id} className="group p-5 open:bg-slate-50/60">
                  <summary className="cursor-pointer list-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div><p className="font-bold text-slate-800">Pertemuan {meeting.pertemuan} · {meeting.mataKuliah.nama}</p><p className="text-xs text-muted mt-1">{formatDate(meeting.tanggal)}{meeting.topik ? ` · ${meeting.topik}` : ''}</p></div>
                    <div className="flex items-center gap-2"><span className="rounded-full bg-teal-50 text-teal-700 px-3 py-1 text-xs font-bold">{meeting.jumlahRespons} respons</span><span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold">{meeting.jumlahHadir} hadir</span><span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span></div>
                  </summary>
                  <div className="mt-5 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-primary/20 space-y-4">
                    {meeting.analisis?.hasilAnalisis && (
                      <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-violet-700 mb-2">Ringkasan AI Pertemuan</p>
                        <p className="text-sm text-violet-950">{meeting.analisis.hasilAnalisis.ringkasan}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Isian Kuesioner</p>
                      {meeting.jawaban.length ? <div className="grid lg:grid-cols-2 gap-2">{meeting.jawaban.map((answer, index) => <div key={answer.id} className="rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700"><span className="font-black text-primary mr-2">#{index + 1}</span>{answer.pesanKesan}</div>)}</div> : <p className="text-sm text-slate-400">Belum ada respons pada pertemuan ini.</p>}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      ))}
      <p className="text-xs text-muted">Kehadiran merupakan akumulasi catatan HADIR per pertemuan. Respons tetap dihitung sebagai jawaban anonim, bukan orang unik.</p>
    </div>
  );
};

export default function KuesionerAdmin() {
  const [viewMode, setViewMode] = useState('pertemuan');
  const [date, setDate] = useState(today());
  const [startDate, setStartDate] = useState(`${today().slice(0, 4)}-01-01`);
  const [endDate, setEndDate] = useState(today());
  const [programId, setProgramId] = useState('');
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportExporting, setReportExporting] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (programId) params.set('programId', programId);
      const response = await api.get(`/kuesioner?${params}`);
      setSessions(response.data.data || []);
      if (selected && !(response.data.data || []).some((item) => item.id === selected.id)) setSelected(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Data kuesioner gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/program-ajahan').then((res) => setPrograms(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (viewMode !== 'pertemuan') return undefined;
    let active = true;
    const params = new URLSearchParams({ date });
    if (programId) params.set('programId', programId);
    api.get(`/kuesioner?${params}`)
      .then((response) => {
        if (active) setSessions(response.data.data || []);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Data kuesioner gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [date, programId, viewMode]);

  useEffect(() => {
    if (viewMode !== 'laporan') return undefined;
    let active = true;
    const params = new URLSearchParams({ startDate, endDate });
    if (programId) params.set('programId', programId);
    api.get(`/kuesioner/laporan/program?${params}`)
      .then((response) => { if (active) setReport(response.data.data); })
      .catch((error) => { if (active) toast.error(error.response?.data?.message || 'Laporan kuesioner gagal dimuat.'); })
      .finally(() => { if (active) setReportLoading(false); });
    return () => { active = false; };
  }, [startDate, endDate, programId, viewMode]);

  const openDetail = async (session) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/kuesioner/sesi/${session.id}`);
      setSelected(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Detail kuesioner gagal dimuat.');
    } finally {
      setDetailLoading(false);
    }
  };

  const publicLink = selected ? `${window.location.origin}/kuesioner/${selected.token}` : '';
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      toast.success('Link kuesioner disalin.');
    } catch {
      toast.error('Link tidak dapat disalin otomatis.');
    }
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/kuesioner/sesi/${selected.id}/analisis-ai`);
      await openDetail(selected);
      await loadSessions();
      toast.success('Analisis AI berhasil diperbarui.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Analisis AI gagal dibuat.');
    } finally {
      setAnalyzing(false);
    }
  };

  const totals = useMemo(() => sessions.reduce((acc, item) => ({
    responses: acc.responses + item.jumlahRespons,
    attendance: acc.attendance + item.jumlahHadir
  }), { responses: 0, attendance: 0 }), [sessions]);

  const analysis = selected?.analisis?.hasilAnalisis;
  const sentimentTotal = analysis ? analysis.sentimen.positif + analysis.sentimen.netral + analysis.sentimen.negatif : 0;

  const exportReport = async () => {
    if (!report) return;
    setReportExporting(true);
    try {
      await saveKuesionerReportPdf(report);
      toast.success('Laporan PDF berhasil dibuat.');
    } catch (error) {
      console.error('Questionnaire Report PDF Error:', error);
      toast.error('Laporan PDF gagal dibuat.');
    } finally {
      setReportExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-3"><MessageSquareText /> Analisis Kuesioner</h1>
          <p className="text-sm text-muted mt-1">Pantau respons anonim per program ajahan dan pertemuan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {viewMode === 'pertemuan' ? <label className="text-xs font-bold text-slate-500">Tanggal
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="block mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" />
          </label> : <>
            <label className="text-xs font-bold text-slate-500">Dari Tanggal
              <input type="date" value={startDate} max={endDate} onChange={(e) => { setReportLoading(true); setStartDate(e.target.value); }} className="block mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" />
            </label>
            <label className="text-xs font-bold text-slate-500">Sampai Tanggal
              <input type="date" value={endDate} min={startDate} onChange={(e) => { setReportLoading(true); setEndDate(e.target.value); }} className="block mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" />
            </label>
          </>}
          <label className="text-xs font-bold text-slate-500">Program Ajahan
            <select value={programId} onChange={(e) => { if (viewMode === 'laporan') setReportLoading(true); setProgramId(e.target.value); }} className="block mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white min-w-52">
              <option value="">Semua program</option>
              {programs.map((item) => <option value={item.id} key={item.id}>{item.nama}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button onClick={() => setViewMode('pertemuan')} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${viewMode === 'pertemuan' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}><MessageSquareText size={16} /> Per Pertemuan</button>
        <button onClick={() => { if (viewMode !== 'laporan') { setReportLoading(true); setViewMode('laporan'); } }} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${viewMode === 'laporan' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}><FileBarChart2 size={16} /> Laporan Per Program</button>
      </div>

      {viewMode === 'laporan' ? <ProgramReport report={report} loading={reportLoading} exporting={reportExporting} onExport={exportReport} /> : <>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><MessageSquareText className="text-teal-600" /><p className="text-3xl font-black mt-3">{totals.responses}</p><p className="text-xs font-bold text-muted uppercase">Respons Anonim</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><UsersRound className="text-blue-600" /><p className="text-3xl font-black mt-3">{totals.attendance}</p><p className="text-xs font-bold text-muted uppercase">Kehadiran Tercatat</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><BarChart3 className="text-violet-600" /><p className="text-3xl font-black mt-3">{totals.attendance ? Math.round((totals.responses / totals.attendance) * 100) : 0}%</p><p className="text-xs font-bold text-muted uppercase">Rasio Respons</p></div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] gap-6 items-start">
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h2 className="font-black text-slate-800">Pertemuan</h2><button onClick={loadSessions} className="p-2 rounded-lg hover:bg-slate-100" title="Muat ulang"><RefreshCw size={17} /></button></div>
          {loading ? <p className="p-8 text-center text-muted">Memuat data...</p> : sessions.length === 0 ? <p className="p-8 text-center text-muted">Tidak ada pertemuan pada tanggal ini.</p> : (
            <div className="divide-y divide-slate-100">
              {sessions.map((item) => {
                const ratio = item.jumlahHadir ? Math.round((item.jumlahRespons / item.jumlahHadir) * 100) : 0;
                return <button key={item.id} onClick={() => openDetail(item)} className={`w-full text-left p-5 hover:bg-slate-50 transition ${selected?.id === item.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}>
                  <div className="flex justify-between gap-4">
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-primary">{item.programAjahan.nama}</span><h3 className="font-bold text-slate-800 mt-1">Pertemuan {item.pertemuan} · {item.mataKuliah.nama}</h3><p className="text-xs text-muted mt-1">{item.topik || 'Tanpa keterangan topik'}</p></div>
                    <div className="text-right shrink-0"><p className="font-black text-lg">{item.jumlahRespons}</p><p className="text-[10px] text-muted">dari {item.jumlahHadir} hadir · {ratio}%</p>{item.analisis && <span className="inline-block mt-2 rounded-full bg-violet-50 text-violet-700 px-2 py-1 text-[9px] font-bold">AI tersedia</span>}</div>
                  </div>
                </button>;
              })}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 xl:sticky xl:top-8">
          {detailLoading ? <p className="py-12 text-center text-muted">Memuat detail...</p> : !selected ? <div className="py-12 text-center"><MessageSquareText className="mx-auto text-slate-300" size={42} /><p className="text-sm text-muted mt-3">Pilih pertemuan untuk melihat link, respons, dan analisis.</p></div> : (
            <div className="space-y-6">
              <div><span className="text-[10px] font-black text-primary uppercase tracking-wider">{selected.programAjahan.nama}</span><h2 className="font-black text-xl text-slate-800 mt-1">Pertemuan {selected.pertemuan}</h2><p className="text-sm text-muted">{selected.mataKuliah.nama}</p></div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-xl"><QRCodeCanvas value={publicLink} size={112} level="M" /></div>
                <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-700">Link khusus sesi</p><p className="text-[10px] text-muted mt-1 break-all">{publicLink}</p><div className="flex gap-2 mt-3"><button onClick={copyLink} className="inline-flex items-center gap-1 rounded-lg bg-primary text-white px-3 py-2 text-xs font-bold"><ClipboardCopy size={14} /> Salin</button><a href={publicLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold"><ExternalLink size={14} /> Buka</a></div></div>
              </div>
              {date !== today() && <p className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">Link hanya menerima jawaban pada tanggal pertemuan. Data lama tetap dapat dianalisis.</p>}

              <div>
                <div className="flex items-center justify-between mb-3"><h3 className="font-black text-slate-800">Respons ({selected.jumlahRespons})</h3></div>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">{selected.jawaban.length ? selected.jawaban.map((item, index) => <div key={item.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700"><span className="font-black text-primary mr-2">#{index + 1}</span>{item.pesanKesan}</div>) : <p className="text-sm text-muted">Belum ada respons.</p>}</div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-5">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-slate-800 flex items-center gap-2"><Bot size={18} /> Analisis AI</h3>{selected.analisis?.isUsang && <p className="text-[10px] text-amber-600 font-bold mt-1">Ada respons baru; analisis perlu diperbarui.</p>}</div><button onClick={analyze} disabled={analyzing || selected.jumlahRespons === 0} className="rounded-xl bg-violet-600 text-white px-3 py-2 text-xs font-bold disabled:opacity-50">{analyzing ? 'Menganalisis...' : analysis ? 'Perbarui' : 'Buat Analisis'}</button></div>
                {analysis ? <div className="space-y-5">
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-sm text-violet-950">{analysis.ringkasan}</div>
                  <div><h4 className="text-xs font-black uppercase text-slate-500 mb-2">Sentimen</h4><div className="grid grid-cols-3 gap-2 text-center">{[['Positif', analysis.sentimen.positif, 'text-emerald-600'], ['Netral', analysis.sentimen.netral, 'text-slate-600'], ['Negatif', analysis.sentimen.negatif, 'text-red-600']].map(([label, value, color]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className={`font-black text-xl ${color}`}>{sentimentTotal ? Math.round((value / sentimentTotal) * 100) : 0}%</p><p className="text-[10px] text-muted">{label} ({value})</p></div>)}</div></div>
                  <ResultList title="Tema Positif" items={analysis.temaPositif} />
                  <ResultList title="Kendala" items={analysis.kendala} />
                  <ResultList title="Rekomendasi" items={analysis.rekomendasi} />
                  <ResultList title="Catatan Risiko" items={analysis.catatanRisiko} />
                  <p className="text-[10px] text-muted">Model: {selected.analisis.model} · {selected.analisis.jumlahRespons} respons. Hasil AI perlu ditinjau admin.</p>
                </div> : <p className="text-sm text-muted">Belum ada analisis. Fitur harus diaktifkan SUPER_ADMIN dan backend memerlukan API key.</p>}
              </div>
            </div>
          )}
        </section>
      </div>
      </>}
    </div>
  );
}
