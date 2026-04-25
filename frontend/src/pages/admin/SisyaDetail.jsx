import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, User } from 'lucide-react';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';

export default function SisyaDetail() {
  const { id } = useParams();
  const [sisya, setSisya] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSisyaDetail();
  }, [id]);

  const fetchSisyaDetail = async () => {
    try {
      const res = await api.get(`/sisya/${id}`);
      if (res.data.success) {
        setSisya(res.data.data);
      }
    } catch (err) {
      setError('Gagal memuat detail sisya');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      const res = await api.patch(`/sisya/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setSisya(res.data.data);
        // re-fetch to get nested relations if needed
        fetchSisyaDetail();
      }
    } catch (err) {
      alert('Gagal memperbarui status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'LUNAS': return 'bg-green-100 text-green-800 border-green-200';
      case 'MENUNGGU': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DITOLAK': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  if (isLoading) return <div className="text-center py-12 text-muted">Memuat data...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!sisya) return <div className="text-center py-12">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/sisya">
          <Button variant="outline" className="w-10 h-10 p-0 rounded-full">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold font-heading text-primary">Detail Sisya</h2>
          <p className="text-sm text-muted">No. {sisya.nomorPendaftaran}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Profil & Status */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 overflow-hidden">
              {sisya.fileFotoPath ? (
                <img src={`http://localhost:3001${sisya.fileFotoPath}`} alt="Foto Sisya" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-primary" />
              )}
            </div>
            <h3 className="text-xl font-bold">{sisya.namaLengkap}</h3>
            <p className="text-sm text-muted mb-4">{sisya.email}</p>
            
            <div className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold mb-6 ${getStatusBadgeColor(sisya.statusPembayaran)}`}>
              Status: {sisya.statusPembayaran}
            </div>

            <div className="space-y-3">
              {sisya.statusPembayaran !== 'LUNAS' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 font-bold"
                  onClick={() => updateStatus('LUNAS')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2" size={18} /> Verifikasi (Lunas)
                </Button>
              )}
              {sisya.statusPembayaran !== 'MENUNGGU' && (
                <Button 
                  variant="outline"
                  className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50 font-bold"
                  onClick={() => updateStatus('MENUNGGU')}
                  disabled={isUpdating}
                >
                  <Clock className="mr-2" size={18} /> Set Menunggu
                </Button>
              )}
              {sisya.statusPembayaran !== 'DITOLAK' && (
                <Button 
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 font-bold"
                  onClick={() => updateStatus('DITOLAK')}
                  disabled={isUpdating}
                >
                  <XCircle className="mr-2" size={18} /> Tolak Pendaftaran
                </Button>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold border-b border-muted/20 pb-2 mb-4 text-primary">Informasi Pembayaran</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total Estimasi Punia</span>
                <span className="font-bold text-lg text-primary">{formatRupiah(sisya.totalPunia)}</span>
              </div>
            </div>
            {sisya.fileBuktiPuniaPath && (
              <div className="mt-4 pt-4 border-t border-muted/20">
                <a href={`http://localhost:3001${sisya.fileBuktiPuniaPath}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full font-bold">
                    <FileText size={16} className="mr-2 text-primary" /> Lihat Bukti Transfer
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Data Lengkap & Dokumen */}
        <div className="space-y-6 md:col-span-2">
          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold text-lg border-b border-muted/20 pb-3 mb-4 text-primary">Data Pribadi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-muted text-xs mb-1">Tempat, Tanggal Lahir</span>
                <span className="font-medium">{sisya.tempatLahir}, {new Date(sisya.tanggalLahir).toLocaleDateString('id-ID')}</span>
              </div>
              <div>
                <span className="block text-muted text-xs mb-1">Jenis Kelamin</span>
                <span className="font-medium">{sisya.jenisKelamin === 'LAKI_LAKI' ? 'Laki-Laki' : 'Perempuan'}</span>
              </div>
              <div>
                <span className="block text-muted text-xs mb-1">Nomor HP/WA</span>
                <span className="font-medium">{sisya.noHp}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-muted text-xs mb-1">Alamat Lengkap</span>
                <span className="font-medium">{sisya.alamat}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-muted text-xs mb-1">Nama Griya & Desa/Kecamatan</span>
                <span className="font-medium">{sisya.namaGriya} - {sisya.namaDesa}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold text-lg border-b border-muted/20 pb-3 mb-4 text-primary">Program Ajahan Dipilih</h4>
            <div className="space-y-3">
              {sisya.programSisyas.map(sp => (
                <div key={sp.id} className="flex justify-between items-center p-3 border border-muted/20 rounded-md bg-bg/50">
                  <div>
                    <span className="font-bold block">{sp.programAjahan.nama}</span>
                    <span className="text-xs text-muted">{sp.isPasangan ? 'Termasuk Pasangan' : 'Individu'}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">{formatRupiah(sp.puniaProgram)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold text-lg border-b border-muted/20 pb-3 mb-4 text-primary">Dokumen Lampiran</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sisya.fileKtpPath ? (
                <a href={`http://localhost:3001${sisya.fileKtpPath}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 border border-muted/20 rounded hover:bg-bg transition-colors">
                  <FileText className="text-primary mr-3" size={24} />
                  <div>
                    <span className="block font-medium text-sm">Dokumen Identitas (KTP)</span>
                    <span className="text-xs text-muted">Klik untuk melihat</span>
                  </div>
                </a>
              ) : (
                <div className="p-3 border border-dashed border-muted rounded text-center text-sm text-muted">KTP tidak dilampirkan</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
