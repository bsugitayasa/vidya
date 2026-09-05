import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../lib/axios';
import { formatDate, formatRupiah, RAB_STATUS } from '../../../lib/finance';
import useAuthStore from '../../../store/authStore';

const input = 'w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm';
const button = 'rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50';
const columns = [['anggaran','Anggaran Terkini'],['saldoAwal','Saldo Awal'],['danaBendahara','Bendahara'],['hibah','Hibah'],['punia','Punia'],['lainnya','Lainnya'],['danaMasuk','Total Masuk'],['realisasi','Realisasi'],['pengembalian','Pengembalian'],['sisaDana','Sisa Dana']];
export default function RekonsiliasiKeuangan() {
  const { user } = useAuthStore();
  const treasurer = ['BENDAHARA','SUPER_ADMIN'].includes(user?.role);
  const [filters, setFilters] = useState({ dari:'', sampai:'', programAjahanId:'', status:'', akunKasId:'', sumberDana:'' });
  const [data, setData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [checks, setChecks] = useState([]);
  const [check, setCheck] = useState({ akunKasId:'', tanggal:'', saldoAktual:'', alasan:'' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    setBusy(true); setError('');
    try { const [report,a,p,c] = await Promise.all([api.get('/keuangan/rekonsiliasi',{params:filters}),api.get('/keuangan/akun-kas'),api.get('/program-ajahan'),api.get('/keuangan/rekonsiliasi/kas')]); setData(report.data.data); setAccounts(a.data.data); setPrograms(p.data.data || []); setChecks(c.data.data); }
    catch(e) { setError(e.response?.data?.message || 'Gagal memuat rekonsiliasi'); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);
  const excel = async () => {
    setBusy(true);
    try { const res = await api.get('/keuangan/rekonsiliasi/export.xlsx',{params:data.filters,responseType:'blob'}); const url = URL.createObjectURL(res.data), a = document.createElement('a'); a.href=url; a.download='Rekonsiliasi-RAB.xlsx'; a.click(); URL.revokeObjectURL(url); }
    catch { toast.error('Gagal mengekspor Excel'); } finally { setBusy(false); }
  };
  const pdf = async () => {
    const doc = new jsPDF({orientation:'landscape',format:'a4'});
    let logo;
    try { logo = new Image(); logo.src='/logo.png'; await new Promise((resolve,reject)=>{logo.onload=resolve;logo.onerror=reject;}); } catch { logo=null; }
    const body = data.rows.map(r => [r.nomorRab,`${r.namaKegiatan}\n${RAB_STATUS[r.status]?.label || r.status}${r.peringatan.length ? `\n${r.peringatan.join(', ')}`:''}`,...columns.map(([k])=>Number(r[k]).toLocaleString('id-ID'))]);
    body.push(['TOTAL','',...columns.map(([k])=>Number(data.totals[k]).toLocaleString('id-ID'))]);
    const period = `${data.filters.dari || 'Awal pencatatan'} s.d. ${data.filters.sampai || 'Semua tanggal'}`;
    const filterText = [programs.find(p=>String(p.id)===data.filters.programAjahanId)?.nama || 'Semua program',RAB_STATUS[data.filters.status]?.label || 'Semua status',accounts.find(a=>String(a.id)===data.filters.akunKasId)?.nama || 'Semua kas',data.filters.sumberDana || 'Semua sumber'].join(' / ');
    autoTable(doc,{rowPageBreak:'avoid',startY:43,margin:{top:43,bottom:24,left:10,right:10},head:[['RAB','Kegiatan / Status',...columns.map(([,label])=>label)]],body,styles:{fontSize:6.5,cellPadding:1.5,overflow:'linebreak',halign:'right'},columnStyles:{0:{cellWidth:28,halign:'left'},1:{cellWidth:45,halign:'left'}},headStyles:{fillColor:[20,83,45]},didDrawPage:()=>{
      doc.setFillColor(20,83,45); doc.rect(0,0,297,30,'F'); if(logo)doc.addImage(logo,'PNG',10,5,20,20);
      doc.setFontSize(14);doc.setTextColor(255);doc.text('REKONSILIASI DANA KELOLAAN RAB',36,13);doc.setFontSize(8);doc.text(period,36,21);
      doc.setTextColor(80);doc.setFontSize(7);doc.text(doc.splitTextToSize(filterText,275),10,36);
    }});
    const count=doc.getNumberOfPages();for(let page=1;page<=count;page++){doc.setPage(page);doc.setTextColor(90);doc.setFontSize(6.5);doc.text('Nilai dalam Rupiah. Anggaran/status terkini; arus kas mengikuti periode. Filter sumber memilih RAB penerima, bukan alokasi belanja per sumber.',10,192);doc.text('Bendahara/pengembalian merupakan transfer internal. Saldo ini hanya dana kelolaan RAB, bukan seluruh kas organisasi.',10,197);doc.text(`Vidya | Halaman ${page} dari ${count}`,287,203,{align:'right'});}
    doc.save('Rekonsiliasi-RAB.pdf');
  };
  const saveCheck = async e => {
    e.preventDefault();setBusy(true);
    try { const res=await api.post('/keuangan/rekonsiliasi/kas',check);toast.success(res.data.message);setCheck({...check,saldoAktual:'',alasan:''});await load(); }
    catch(e){toast.error(e.response?.data?.message || 'Gagal menyimpan pemeriksaan');}finally{setBusy(false);}
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between gap-3"><div><Link className="text-sm text-emerald-700" to="/admin/keuangan">← Keuangan</Link><h1 className="mt-2 text-3xl font-black text-slate-800">Rekonsiliasi Dana</h1><p className="mt-1 text-sm text-slate-500">RAB, penerimaan, realisasi, pengembalian, dan sisa dana dalam satu laporan.</p></div><div className="flex items-center gap-2"><button disabled={!data || busy || !!error} className={button} onClick={excel}>Export Excel</button><button disabled={!data || busy || !!error} className={button} onClick={pdf}>Export PDF</button></div></div>
    <form onSubmit={e=>{e.preventDefault();load();}} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      {['dari','sampai'].map(k=><label key={k} className="text-xs font-semibold">{k==='dari'?'Tanggal Awal':'Tanggal Akhir'}<input className={input} type="date" value={filters[k]} onChange={e=>setFilters({...filters,[k]:e.target.value})}/></label>)}
      <label className="text-xs font-semibold">Program<select className={input} value={filters.programAjahanId} onChange={e=>setFilters({...filters,programAjahanId:e.target.value})}><option value="">Semua Program</option>{programs.map(p=><option key={p.id} value={p.id}>{p.nama}</option>)}</select></label>
      <label className="text-xs font-semibold">Status RAB<select className={input} value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">Semua Status</option>{Object.entries(RAB_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
      <label className="text-xs font-semibold">Kas Dana Kelolaan<select className={input} value={filters.akunKasId} onChange={e=>setFilters({...filters,akunKasId:e.target.value})}><option value="">Semua Kas</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.nama}</option>)}</select></label>
      <label className="text-xs font-semibold">RAB Penerima Sumber<select className={input} value={filters.sumberDana} onChange={e=>setFilters({...filters,sumberDana:e.target.value})}><option value="">Semua Sumber</option>{['BENDAHARA','HIBAH','PUNIA','LAINNYA'].map(s=><option key={s}>{s}</option>)}</select></label><button className={`${button} self-end`} disabled={busy}>{busy?'Memuat...':'Tampilkan Laporan'}</button>
    </form>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {data && <><p className="text-xs text-slate-500">Periode laporan: {data.filters.dari || 'Awal pencatatan'} — {data.filters.sampai || 'Semua tanggal'}. Klik Tampilkan Laporan setelah mengubah filter.</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['danaMasuk','Total Dana Masuk'],['realisasi','Realisasi'],['pengembalian','Dikembalikan'],['sisaDana','Saldo Akhir Kelolaan']].map(([k,label])=><div key={k} className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 break-words text-xl font-black text-emerald-800">{formatRupiah(data.totals[k])}</p></div>)}</div>
      <div className="rounded-2xl bg-white p-4 shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3 text-left">RAB / Kegiatan</th>{columns.map(([k,label])=><th key={k} className="p-3 text-right">{label}</th>)}</tr></thead><tbody>{data.rows.map(r=><tr key={r.id} className="border-b"><td className="p-3"><Link className="font-bold text-emerald-700" to={`/admin/keuangan/rab/${r.id}`}>{r.nomorRab}</Link><p>{r.namaKegiatan}</p><p className="text-xs text-slate-400">{r.program} · {RAB_STATUS[r.status]?.label}</p>{r.peringatan.map(p=><p key={p} className="text-xs text-amber-700">{p}</p>)}</td>{columns.map(([k])=><td key={k} className={`whitespace-nowrap p-3 text-right ${r[k]<0?'text-red-700':''}`}>{formatRupiah(r[k])}</td>)}</tr>)}</tbody><tfoot><tr className="bg-emerald-50 font-bold"><td className="p-3">TOTAL ({data.rows.length} RAB)</td>{columns.map(([k])=><td key={k} className="p-3 text-right">{formatRupiah(data.totals[k])}</td>)}</tr></tfoot></table></div>{!data.rows.length&&<p className="p-5 text-center text-slate-500">Tidak ada RAB yang sesuai filter.</p>}<p className="mt-3 text-xs text-slate-500">{data.scope}</p></div></>}
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-800">Pemeriksaan Kas Dana Kelolaan</h2><p className="text-sm text-slate-500">Bandingkan saldo dana RAB yang masih dipegang dengan saldo aktualnya. Jika rekening juga memuat dana lain atau saldo sebelum pencatatan, pisahkan bagian dana RAB dan jelaskan pada catatan. Riwayat ini berdiri sendiri dari filter laporan di atas.</p>
      {treasurer&&<form onSubmit={saveCheck} className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Kas<select required className={input} value={check.akunKasId} onChange={e=>setCheck({...check,akunKasId:e.target.value})}><option value="">Pilih Kas</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.nama}</option>)}</select></label><label className="text-xs">Tanggal Pemeriksaan<input required type="date" className={input} value={check.tanggal} onChange={e=>setCheck({...check,tanggal:e.target.value})}/></label><label className="text-xs">Saldo Aktual Dana RAB<input required type="number" min="0" step="1" className={input} value={check.saldoAktual} onChange={e=>setCheck({...check,saldoAktual:e.target.value})}/></label><label className="text-xs">Catatan Pemeriksaan / Penyelesaian Selisih<input required minLength={5} className={input} value={check.alasan} onChange={e=>setCheck({...check,alasan:e.target.value})}/></label><button className={button} disabled={busy}>Simpan Pemeriksaan</button></form>}
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">Tanggal / Kas</th><th>Saldo Sistem</th><th>Saldo Aktual</th><th>Selisih</th><th>Catatan</th></tr></thead><tbody>{checks.map(c=><tr key={c.id} className="border-b"><td className="p-2">{formatDate(c.tanggal)}<br/>{c.akunKas.nama}</td><td>{formatRupiah(c.saldoSistem)}</td><td>{formatRupiah(c.saldoAktual)}</td><td className={Number(c.saldoAktual)!==Number(c.saldoSistem)?'font-bold text-amber-700':'text-emerald-700'}>{formatRupiah(Number(c.saldoAktual)-Number(c.saldoSistem))}</td><td>{c.catatan}</td></tr>)}</tbody></table></div><p className="text-xs text-slate-400">Saldo sistem disimpan pada waktu pemeriksaan. Selisih tidak otomatis mengubah transaksi atau kas.</p>
    </section>
  </div>;
}
