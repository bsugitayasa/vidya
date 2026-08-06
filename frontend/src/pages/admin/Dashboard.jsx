import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../lib/axios';
import { Users, UserCheck, CreditCard, Filter, UserRound, UserRoundSearch, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSisya: 0,
    totalKepesertaanProgram: 0,
    totalSisyaMultiProgram: 0,
    totalKepesertaanTambahan: 0,
    menungguVerifikasi: 0,
    belumLunas: 0,
    totalEstimasiPunia: 0,
    chartData: [],
    genderStats: { lakiLaki: 0, perempuan: 0 },
    programStats: [],
    programList: []
  });
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const url = selectedProgram === 'all' ? '/dashboard/stats' : `/dashboard/stats?programId=${selectedProgram}`;
        const res = await api.get(url);
        if (res.data.success && !cancelled) {
          setStats(res.data.data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError('Gagal memuat data statistik');
        console.error(err);
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [selectedProgram]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold font-heading text-primary">Dashboard</h2>
        
        <div className="flex items-center space-x-2 bg-surface p-1 rounded-lg border border-muted/20 shadow-sm">
          <div className="p-2 text-muted">
            <Filter size={18} />
          </div>
          <select 
            className="bg-transparent border-none text-sm focus:ring-0 pr-8 cursor-pointer font-medium outline-none"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
          >
            <option value="all">Semua Program Ajahan</option>
            {stats.programList.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sisya & Program Participation Card */}
        <div className="flex flex-col bg-surface p-5 rounded-xl shadow-sm border border-muted/10 group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/10 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <Users size={20} />
            </div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-wider">Sisya & Kepesertaan</h3>
          </div>

          <div className="grid grid-cols-2 divide-x divide-muted/15">
            <div className="pr-3">
              <p className="text-2xl font-black text-text">{stats.totalSisya}</p>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wide mt-0.5">Sisya Unik</p>
            </div>
            <div className="pl-3">
              <p className="text-2xl font-black text-violet-600">{stats.totalKepesertaanProgram}</p>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wide mt-0.5">Kepesertaan</p>
            </div>
          </div>
          {stats.totalSisyaMultiProgram > 0 && (
            <p className="text-[10px] text-muted leading-relaxed mt-auto pt-3 border-t border-muted/10">
              {stats.totalSisyaMultiProgram} sisya multi-program
              {stats.totalKepesertaanTambahan > 0 && ` • +${stats.totalKepesertaanTambahan} kepesertaan tambahan`}
            </p>
          )}
        </div>
        
        {/* Waiting Verification Card */}
        <Link
          to="/admin/sisya?status=MENUNGGU_VERIFIKASI"
          aria-label={`Lihat ${stats.menungguVerifikasi} sisya yang menunggu verifikasi`}
          className="flex flex-col bg-surface p-5 rounded-xl shadow-sm border border-muted/10 group hover:border-amber-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 w-10 h-10 rounded-xl flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <UserCheck size={20} />
            </div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-wider">Menunggu Verifikasi</h3>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3">{stats.menungguVerifikasi}</p>
          <div className="mt-auto pt-4">
            <p className="text-[10px] text-muted mb-2">{stats.menungguVerifikasi} dari {stats.totalSisya} sisya</p>
            <div className="w-full bg-muted/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${(stats.menungguVerifikasi / (stats.totalSisya || 1)) * 100}%` }}></div>
            </div>
          </div>
        </Link>

        {/* Belum Lunas Card */}
        <div className="flex flex-col bg-surface p-5 rounded-xl shadow-sm border border-muted/10 group hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 w-10 h-10 rounded-xl flex items-center justify-center text-rose-600 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-wider">Belum Lunas</h3>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-3">{stats.belumLunas || 0}</p>
          <div className="mt-auto pt-4">
            <p className="text-[10px] text-muted mb-2">{stats.belumLunas || 0} dari {stats.totalSisya} sisya</p>
            <div className="w-full bg-muted/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full transition-all duration-1000" style={{ width: `${((stats.belumLunas || 0) / (stats.totalSisya || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Estimated Punia Card */}
        <div className="min-w-0 overflow-hidden flex flex-col bg-surface p-5 rounded-xl shadow-sm border border-muted/10 group hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <CreditCard size={20} />
            </div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-wider">Estimasi Punia</h3>
          </div>
          <p className="text-lg 2xl:text-xl leading-tight font-black text-emerald-600 break-all mt-3">
            {formatRupiah(stats.totalEstimasiPunia)}
          </p>
          <div className="mt-auto pt-4">
            <p className="text-[10px] text-muted mb-2">Akumulasi estimasi punia aktif</p>
            <div className="w-full bg-muted/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Stats */}
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/10 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-heading text-primary">Jenis Kelamin</h3>
            {(() => {
              const programName = selectedProgram === 'all' ? 'Semua Program' : stats.programList.find(p => p.id == selectedProgram)?.nama;
              const getBadgeColor = (name) => {
                if (!name || name === 'Semua Program') return 'bg-muted/10 text-muted';
                const n = name.toLowerCase();
                if (n.includes('kawikon')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                if (n.includes('kawelakaan')) return 'bg-orange-100 text-orange-700 border-orange-200';
                if (n.includes('usadha')) return 'bg-green-100 text-green-700 border-green-200';
                if (n.includes('serati')) return 'bg-purple-100 text-purple-700 border-purple-200';
                return 'bg-muted/10 text-muted';
              };
              
              return (
                <span className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${getBadgeColor(programName)}`}>
                  {programName}
                </span>
              );
            })()}
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center text-blue-600 font-bold">
                  <UserRound size={18} className="mr-2" />
                  <span>Laki-Laki</span>
                </div>
                <span className="text-2xl font-black">{stats.genderStats.lakiLaki}</span>
              </div>
              <div className="w-full bg-blue-50 h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${(stats.genderStats.lakiLaki / (stats.genderStats.lakiLaki + stats.genderStats.perempuan || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center text-rose-600 font-bold">
                  <UserRoundSearch size={18} className="mr-2" />
                  <span>Perempuan</span>
                </div>
                <span className="text-2xl font-black">{stats.genderStats.perempuan}</span>
              </div>
              <div className="w-full bg-rose-50 h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${(stats.genderStats.perempuan / (stats.genderStats.lakiLaki + stats.genderStats.perempuan || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-muted/10 text-center">
              <p className="text-sm text-muted">
                Total: <span className="font-bold text-text">{stats.genderStats.lakiLaki + stats.genderStats.perempuan}</span> Sisya
              </p>
            </div>
          </div>
        </div>

        {/* Program Stats */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-sm border border-muted/10">
          <div className="mb-6">
            <h3 className="text-lg font-bold font-heading text-primary">Pendaftar per Program</h3>
            <p className="text-xs text-muted mt-1">
              {stats.totalKepesertaanProgram} kepesertaan dari {stats.totalSisya} sisya unik
              {stats.totalSisyaMultiProgram > 0 && ` • ${stats.totalSisyaMultiProgram} sisya mengikuti lebih dari satu program`}
            </p>
          </div>
          <div className="space-y-4">
            {stats.programStats.map((p, idx) => {
              const getProgramColor = (name) => {
                const n = name.toLowerCase();
                if (n.includes('kawikon')) return 'bg-yellow-400';
                if (n.includes('kawelakaan')) return 'bg-orange-300';
                if (n.includes('usadha')) return 'bg-green-500';
                if (n.includes('serati')) return 'bg-purple-500';
                return idx % 2 === 0 ? 'bg-primary' : 'bg-secondary';
              };
              
              return (
                <div key={p.id} className="group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-text group-hover:text-primary transition-colors">{p.nama}</span>
                    <span className="text-sm font-black text-muted">{p.total} Sisya</span>
                  </div>
                  <div className="w-full bg-muted/5 h-3 rounded-full overflow-hidden border border-muted/5">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${getProgramColor(p.nama)}`}
                      style={{ width: `${(p.total / (stats.totalSisya || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {stats.programStats.length === 0 && (
              <div className="text-center py-12 text-muted italic">Belum ada data program ajahan.</div>
            )}
          </div>
          {stats.programStats.length > 0 && (
            <p className="text-[10px] text-muted italic mt-5 pt-4 border-t border-muted/10">
              *Seorang sisya dapat tercatat pada beberapa program, sehingga akumulasi per program dapat lebih besar daripada Total Sisya.
            </p>
          )}
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/10">
        <h3 className="text-lg font-bold font-heading text-primary mb-6">Pendaftar 7 Hari Terakhir</h3>
        <div className="h-72">
          {stats.chartData && stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: '800', color: '#111827', marginBottom: '8px', fontSize: '14px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                />
                <Bar dataKey="pendaftar" fill="#c2410c" radius={[6, 6, 0, 0]} name="Jumlah Pendaftar">
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.chartData.length - 1 ? '#c2410c' : '#ea580c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted italic">Belum ada data pendaftaran mingguan.</div>
          )}
        </div>
      </div>
    </div>
  );
}
