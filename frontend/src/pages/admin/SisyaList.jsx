import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Filter } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function SisyaList() {
  const [sisyas, setSisyas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSisyas();
  }, []);

  const fetchSisyas = async () => {
    try {
      const res = await api.get('/sisya');
      if (res.data.success) {
        setSisyas(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching sisya:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSisyas = sisyas.filter(s => 
    s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nomorPendaftaran.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'LUNAS': return 'bg-green-100 text-green-800 border-green-200';
      case 'MENUNGGU': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DITOLAK': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Data Sisya</h2>
          <p className="text-sm text-muted mt-1">Kelola data pendaftar dan status verifikasi</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <Input 
              placeholder="Cari nama atau nomor..." 
              className="pl-10 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="px-3">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 border-b border-muted/20">
                <th className="p-4 font-semibold text-sm text-text">No. Pendaftaran</th>
                <th className="p-4 font-semibold text-sm text-text">Nama Lengkap</th>
                <th className="p-4 font-semibold text-sm text-text">Program</th>
                <th className="p-4 font-semibold text-sm text-text">Tgl Daftar</th>
                <th className="p-4 font-semibold text-sm text-text">Status Pembayaran</th>
                <th className="p-4 font-semibold text-sm text-text text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Memuat data...</td>
                </tr>
              ) : filteredSisyas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">Belum ada data pendaftar.</td>
                </tr>
              ) : (
                filteredSisyas.map(sisya => (
                  <tr key={sisya.id} className="hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm font-mono font-medium text-primary">{sisya.nomorPendaftaran}</td>
                    <td className="p-4 text-sm font-medium">{sisya.namaLengkap}</td>
                    <td className="p-4 text-sm">
                      <div className="flex flex-col gap-1">
                        {sisya.programSisyas.map(sp => (
                          <span key={sp.id} className="inline-block px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-md w-max">
                            {sp.programAjahan.nama} {sp.isPasangan && '(+Pasangan)'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted">
                      {new Date(sisya.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(sisya.statusPembayaran)}`}>
                        {sisya.statusPembayaran}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link to={`/admin/sisya/${sisya.id}`}>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted hover:text-primary hover:bg-primary/10">
                          <Eye size={18} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
