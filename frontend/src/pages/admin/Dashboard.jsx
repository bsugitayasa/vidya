import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../lib/axios';
import { Users, UserCheck, CreditCard, Filter, UserRound, UserRoundSearch } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSisya: 0,
    menungguVerifikasi: 0,
    totalEstimasiPunia: 0,
    chartData: [],
    genderStats: { lakiLaki: 0, perempuan: 0 },
    programStats: [],
    programList: []
  });
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async (programId) => {
    try {
      setIsLoading(true);
      const url = programId === 'all' ? '/dashboard/stats' : `/dashboard/stats?programId=${programId}`;
      const res = await api.get(url);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      setError('Gagal memuat data statistik');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedProgram);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={64} />
          </div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Total Sisya</h3>
          <p className="text-4xl font-black mt-2 text-text">{stats.totalSisya}</p>
          <div className="mt-4 w-full bg-muted/10 h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-full"></div>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserCheck size={64} />
          </div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Menunggu Verifikasi</h3>
          <p className="text-4xl font-black mt-2 text-accent">{stats.menungguVerifikasi}</p>
          <div className="mt-4 w-full bg-muted/10 h-1 rounded-full overflow-hidden">
            <div className="bg-accent h-full" style={{ width: `${(stats.menungguVerifikasi / (stats.totalSisya || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard size={64} />
          </div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Estimasi Punia</h3>
          <p className="text-3xl font-black mt-2 text-secondary">{formatRupiah(stats.totalEstimasiPunia)}</p>
          <div className="mt-4 w-full bg-muted/10 h-1 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-full"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Stats */}
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-muted/10 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-heading text-primary">Jenis Kelamin</h3>
            <span className="text-xs font-medium text-muted bg-muted/10 px-2 py-1 rounded">
              {selectedProgram === 'all' ? 'Semua Program' : stats.programList.find(p => p.id == selectedProgram)?.nama}
            </span>
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
          <h3 className="text-lg font-bold font-heading text-primary mb-6">Pendaftar per Program</h3>
          <div className="space-y-4">
            {stats.programStats.map((p, idx) => (
              <div key={p.id} className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-text group-hover:text-primary transition-colors">{p.nama}</span>
                  <span className="text-sm font-black text-muted">{p.total} Sisya</span>
                </div>
                <div className="w-full bg-muted/5 h-3 rounded-full overflow-hidden border border-muted/5">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${idx % 2 === 0 ? 'bg-primary' : 'bg-secondary'}`}
                    style={{ width: `${(p.total / (stats.totalSisya || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {stats.programStats.length === 0 && (
              <div className="text-center py-12 text-muted italic">Belum ada data program ajahan.</div>
            )}
          </div>
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
