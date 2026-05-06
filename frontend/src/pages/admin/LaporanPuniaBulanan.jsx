import React, { useState, useEffect } from 'react';
import { Download, Loader2, ChevronLeft, ChevronRight, Eye, Calendar, TrendingUp, DollarSign, ReceiptText, BarChart3, Filter } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function LaporanPuniaBulanan() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    summary: { totalNominal: 0, totalTransactions: 0, averageNominal: 0 },
    trend: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6, // Show fewer cards now that we have a dashboard
    totalPages: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchLaporan();
  }, [pagination.page]);

  const fetchDashboardStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const res = await api.get(`/laporan/punia/dashboard?${params.toString()}`);
      if (res.data.success) {
        setStats({
          summary: res.data.summary,
          trend: res.data.trend
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/laporan/punia/bulanan?page=${pagination.page}&limit=${pagination.limit}`);
      if (res.data.success) {
        setData(res.data.data);
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching laporan bulanan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return months[monthNumber - 1];
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const chartData = stats.trend.map(item => ({
    name: `${getMonthName(item.month)} ${item.year % 100}`,
    total: item.total,
    rawMonth: item.month,
    rawYear: item.year
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-muted/20 shadow-xl rounded-lg">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-sm font-bold text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Dashboard Punia Bulanan</h2>
          <p className="text-sm text-muted mt-1">Ringkasan performa dan tren kontribusi punia sisya</p>
        </div>
        
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg border border-muted/20 shadow-sm">
          <div className="flex items-center gap-2 px-2 border-r border-muted/20">
            <Filter size={14} className="text-muted" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">Filter Periode</span>
          </div>
          <Input 
            type="date" 
            className="h-8 text-[10px] w-32 border-none bg-transparent focus-visible:ring-0" 
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <span className="text-muted text-xs">-</span>
          <Input 
            type="date" 
            className="h-8 text-[10px] w-32 border-none bg-transparent focus-visible:ring-0" 
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} className="text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Dana Masuk</p>
          <h4 className="text-2xl font-black text-emerald-600 font-mono">
            {formatCurrency(stats.summary.totalNominal)}
          </h4>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <TrendingUp size={12} />
            Periode Terpilih
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ReceiptText size={48} className="text-blue-600" />
          </div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Transaksi</p>
          <h4 className="text-2xl font-black text-blue-600 font-mono">
            {stats.summary.totalTransactions} <span className="text-sm font-sans text-muted font-normal uppercase">Kuitansi</span>
          </h4>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-blue-600 font-bold bg-blue-50 w-fit px-2 py-1 rounded-md">
            <Calendar size={12} />
            Terverifikasi
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={48} className="text-amber-600" />
          </div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Rata-rata Punia</p>
          <h4 className="text-2xl font-black text-amber-600 font-mono">
            {formatCurrency(stats.summary.averageNominal)}
          </h4>
          <p className="text-[10px] text-muted mt-4 font-medium italic">
            Per transaksi masuk
          </p>
        </div>
      </div>

      {/* Main Content: Chart & Recent Months */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-muted/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-text flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Tren Kontribusi 6 Bulan Terakhir
            </h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-1 text-[10px] font-bold text-muted">
                 <div className="w-2 h-2 bg-primary rounded-full"></div> Total Nominal
               </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={(value) => `Rp${value/1000000}jt`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === chartData.length - 1 ? '#C05621' : '#F6AD55'} 
                      fillOpacity={index === chartData.length - 1 ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month Cards */}
        <div className="space-y-4">
          <h3 className="font-bold text-text flex items-center gap-2 px-1">
            <Calendar size={18} className="text-primary" />
            Rekap Bulanan
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 bg-surface rounded-xl border border-dashed border-muted">
              <p className="text-muted text-sm italic">Belum ada data bulanan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => (
                <div key={`${item.year}-${item.month}`} className="bg-surface p-4 rounded-xl shadow-sm border border-muted/20 hover:border-primary/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-xs">
                      {item.month}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text">{getMonthName(item.month)} {item.year}</h4>
                      <p className="text-[10px] text-muted uppercase font-bold tracking-tighter">{item.count} Transaksi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-black text-[#C05621]">{formatCurrency(item.total)}</p>
                    <Link to={`/admin/laporan/punia-range?startDate=${item.year}-${String(item.month).padStart(2, '0')}-01&endDate=${item.year}-${String(item.month).padStart(2, '0')}-${new Date(item.year, item.month, 0).getDate()}`}>
                      <button className="text-[10px] text-primary font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                        Detail →
                      </button>
                    </Link>
                  </div>
                </div>
              ))}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 pt-2">
                  <button 
                    className="p-1 rounded-md border border-muted/20 disabled:opacity-30"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[10px] font-bold text-muted uppercase">{pagination.page} / {pagination.totalPages}</span>
                  <button 
                    className="p-1 rounded-md border border-muted/20 disabled:opacity-30"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
