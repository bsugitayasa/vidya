import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Banknote, CircleDollarSign, ClipboardCheck, FileClock, Plus, ReceiptText, WalletCards } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../../lib/axios';
import { formatRupiah } from '../../../lib/finance';

const StatCard = ({ icon: Icon, label, value, tone = 'emerald', hint }) => {
  const tones = { emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
  return <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className={`mb-4 inline-flex rounded-xl p-3 ${tones[tone]}`}><Icon size={22} /></div>
    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black tracking-tight text-slate-800">{value}</p>
    {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
  </div>;
};

export default function KeuanganDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/keuangan/dashboard').then((res) => setData(res.data.data)).catch((err) => setError(err.response?.data?.message || 'Gagal memuat dashboard keuangan')); }, []);

  if (error) return <div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div>;
  if (!data) return <div className="flex min-h-[50vh] items-center justify-center text-slate-400">Memuat data keuangan...</div>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-600">Keuangan Operasional</p><h1 className="text-3xl font-black text-slate-800">Dashboard Keuangan</h1><p className="mt-1 text-sm text-slate-500">Ringkasan RAB, dana masuk, realisasi, dan saldo pertanggungjawaban.</p></div>
      <Link to="/admin/keuangan/rab?new=1" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"><Plus size={18} /> Buat RAB</Link>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={ClipboardCheck} label="Anggaran Disetujui" value={formatRupiah(data.totalAnggaranDisetujui)} hint={`${data.totalRab} pengajuan RAB`} />
      <StatCard icon={Banknote} label="Dana Masuk" value={formatRupiah(data.totalDanaMasuk)} tone="blue" />
      <StatCard icon={ReceiptText} label="Realisasi Terverifikasi" value={formatRupiah(data.totalPengeluaran)} tone="violet" />
      <StatCard icon={WalletCards} label="Sisa Kas Dipertanggungjawabkan" value={formatRupiah(data.totalSisaKas)} tone="amber" />
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
        <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><BarChart3 size={20} /></div><div><h2 className="font-bold text-slate-800">Realisasi per Kategori</h2><p className="text-xs text-slate-500">Hanya pengeluaran yang telah diverifikasi</p></div></div>
        {data.pengeluaranPerKategori.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.pengeluaranPerKategori} layout="vertical" margin={{ left: 20, right: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000000)}jt`} /><YAxis type="category" dataKey="kategori" width={110} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => formatRupiah(v)} /><Bar dataKey="total" fill="#059669" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div> : <div className="flex h-72 items-center justify-center text-sm text-slate-400">Belum ada pengeluaran terverifikasi</div>}
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm"><CircleDollarSign className="mb-5 text-emerald-400" /><p className="text-sm text-slate-300">Perlu ditindaklanjuti</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/10 p-4"><p className="text-2xl font-black">{data.menungguPersetujuan}</p><p className="mt-1 text-xs text-slate-300">RAB menunggu persetujuan</p></div><div className="rounded-xl bg-white/10 p-4"><p className="text-2xl font-black">{data.menungguVerifikasiPengeluaran}</p><p className="mt-1 text-xs text-slate-300">Bukti pengeluaran</p></div></div></div>
        <Link to="/admin/keuangan/rab" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-emerald-200"><div className="flex items-center gap-3"><FileClock className="text-emerald-600" /><div><p className="font-bold text-slate-800">Semua Pengajuan</p><p className="text-xs text-slate-500">Pantau status RAB dan LPJ</p></div></div><span className="text-xl text-slate-300">→</span></Link>
      </div>
    </div>
  </div>;
}
