import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, User, CreditCard, ExternalLink, Trash2, Download } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import useFileUrl from '../../hooks/useFileUrl';
import { getProgramBadgeStyle } from '../../lib/utils';

export default function SisyaDetail() {
  const { id } = useParams();
  const [sisya, setSisya] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = useState(null);
  const [nominalVerifikasi, setNominalVerifikasi] = useState('');
  const [keteranganVerifikasi, setKeteranganVerifikasi] = useState('');

  // Protected file URLs
  const fotoUrl = useFileUrl(sisya?.fileFotoPath);
  const ktpUrl = useFileUrl(sisya?.fileIdentitasPath);
  const rekomendasiUrl = useFileUrl(sisya?.fileRekomendasiPath);

  // Academic status state
  const [academicStatus, setAcademicStatus] = useState('');
  const [tanggalDiksan, setTanggalDiksan] = useState('');

  useEffect(() => {
    fetchSisyaDetail();
  }, [id]);

  useEffect(() => {
    if (sisya) {
      setAcademicStatus(sisya.status);
      if (sisya.tanggalDiksan) {
        setTanggalDiksan(new Date(sisya.tanggalDiksan).toISOString().split('T')[0]);
      }
    }
  }, [sisya]);

  const handleDownload = (blobUrl, label) => {
    if (!blobUrl) return;
    
    const extension = blobUrl.includes('image/png') ? 'png' : 
                    blobUrl.includes('image/jpeg') ? 'jpg' : 
                    blobUrl.includes('application/pdf') ? 'pdf' : 'jpg';
    
    const fileName = `${label}_${sisya.namaLengkap.replace(/\s+/g, '_')}`;
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Mengunduh ${label}...`);
  };

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

  const handleOpenVerifyModal = (pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setNominalVerifikasi(pembayaran.nominal || '');
    setKeteranganVerifikasi(pembayaran.keterangan || '');
    setShowVerifyModal(true);
  };

  const handleVerifikasi = async (status) => {
    if (status === 'VERIFIKASI' && !nominalVerifikasi) {
      toast.error('Masukkan nominal yang diverifikasi');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await api.patch(`/pembayaran/${selectedPembayaran.id}/verifikasi`, {
        nominal: nominalVerifikasi,
        status,
        keterangan: keteranganVerifikasi
      });

      if (res.data.success) {
        toast.success(`Pembayaran berhasil ${status === 'VERIFIKASI' ? 'diverifikasi' : 'ditolak'}`);
        setShowVerifyModal(false);
        fetchSisyaDetail(); // Refresh data
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses verifikasi');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePembayaran = async (pembayaranId) => {
    if (!confirm('Hapus bukti pembayaran ini?')) return;
    
    try {
        await api.delete(`/pembayaran/${pembayaranId}`);
        toast.success('Bukti pembayaran dihapus');
        fetchSisyaDetail();
    } catch (err) {
        toast.error('Gagal menghapus pembayaran');
    }
  };

  const handleUpdateAcademicStatus = async () => {
    setIsUpdating(true);
    try {
      const res = await api.patch(`/sisya/${id}/academic-status`, {
        status: academicStatus,
        tanggalDiksan: academicStatus === 'MEDIKSA' ? tanggalDiksan : null
      });

      if (res.data.success) {
        toast.success('Status akademik berhasil diperbarui');
        fetchSisyaDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status akademik');
    } finally {
      setIsUpdating(false);
    }
  };

  const getAcademicStatusBadgeColor = (status) => {
    switch(status) {
      case 'AKTIF': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MEDIKSA': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TIDAK_AKTIF': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'LUNAS': return 'bg-green-100 text-green-800 border-green-200';
      case 'BELUM_LUNAS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MENUNGGU_VERIFIKASI': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MENUNGGU_PEMBAYARAN': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'DITOLAK': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.replace(/_/g, ' ');
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  if (isLoading) return <div className="text-center py-12 text-muted">Memuat data...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!sisya) return <div className="text-center py-12">Data tidak ditemukan</div>;

  const sisaTagihan = sisya.totalPunia - sisya.totalTerbayar;

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
        
        {/* Kolom Kiri: Profil & Ringkasan */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-16 bg-primary/5 -z-0"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary/20 shadow-md overflow-hidden">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto Sisya" className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                    <User size={40} className="text-primary" />
                  </div>
                )}
              </div>
              
              {fotoUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-4 h-8 text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => handleDownload(fotoUrl, 'Foto')}
                >
                  <Download size={14} className="mr-1" /> Download Foto
                </Button>
              )}
              <h3 className="text-xl font-bold">{sisya.namaLengkap}</h3>
              <p className="text-sm text-muted mb-4">{sisya.email}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <div className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(sisya.statusPembayaran)}`}>
                  {formatStatus(sisya.statusPembayaran)}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getAcademicStatusBadgeColor(sisya.status)}`}>
                  {formatStatus(sisya.status)}
                </div>
              </div>

              {sisya.status === 'MEDIKSA' && sisya.tanggalDiksan && (
                <div className="mb-6 p-2 bg-purple-50 border border-purple-100 rounded-md">
                  <p className="text-[10px] font-bold text-purple-700 uppercase">Tanggal Pediksaan</p>
                  <p className="text-sm font-bold text-purple-900">{new Date(sisya.tanggalDiksan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}

              <div className="pt-4 border-t border-muted/10 text-left mb-6">
                <h4 className="text-xs font-bold text-muted uppercase mb-3">Update Status Akademik</h4>
                <div className="space-y-3">
                  <select 
                    className="w-full text-sm border-muted/20 rounded-md bg-white p-2 outline-none focus:ring-1 focus:ring-primary"
                    value={academicStatus}
                    onChange={(e) => setAcademicStatus(e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="AKTIF">AKTIF</option>
                    <option value="MEDIKSA">MEDIKSA</option>
                    <option value="TIDAK_AKTIF">TIDAK_AKTIF</option>
                  </select>

                  {academicStatus === 'MEDIKSA' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted uppercase">Tanggal Diksan</label>
                      <Input 
                        type="date" 
                        value={tanggalDiksan}
                        onChange={(e) => setTanggalDiksan(e.target.value)}
                      />
                    </div>
                  )}

                  <Button 
                    size="sm" 
                    className="w-full font-bold" 
                    onClick={handleUpdateAcademicStatus}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Menyimpan...' : 'Update Status'}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-muted/10 space-y-4">
                  <div className="text-left">
                      <span className="text-xs text-muted block mb-1">Ringkasan Punia</span>
                      <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                              <span>Total Tagihan</span>
                              <span className="font-bold">{formatRupiah(sisya.totalPunia)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                              <span>Total Terbayar</span>
                              <span className="font-bold">{formatRupiah(sisya.totalTerbayar)}</span>
                          </div>
                          <div className={`flex justify-between text-sm p-2 rounded ${sisaTagihan > 0 ? 'bg-red-50 text-red-700 font-bold' : 'bg-green-50 text-green-700 font-bold'}`}>
                              <span>Sisa Tagihan</span>
                              <span>{formatRupiah(sisaTagihan)}</span>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold border-b border-muted/20 pb-2 mb-4 text-primary">Data Pribadi</h4>
            <div className="space-y-4 text-sm">
                <div>
                    <span className="text-muted text-xs block">TTL</span>
                    <span className="font-medium">{sisya.tempatLahir}, {new Date(sisya.tanggalLahir).toLocaleDateString('id-ID')}</span>
                </div>
                <div>
                    <span className="text-muted text-xs block">Alamat</span>
                    <span className="font-medium">{sisya.alamat}</span>
                </div>
                <div>
                    <span className="text-muted text-xs block">Griya / Desa</span>
                    <span className="font-medium">{sisya.namaGriya} / {sisya.namaDesa}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Riwayat & Dokumen */}
        <div className="space-y-6 md:col-span-2">
          
          {/* Riwayat Pembayaran */}
          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold text-lg border-b border-muted/20 pb-3 mb-4 text-primary flex items-center gap-2">
                <CreditCard size={20} /> Riwayat Pembayaran (Cicilan)
            </h4>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-muted border-b border-muted/10">
                            <th className="py-2">Tanggal</th>
                            <th className="py-2">Keterangan</th>
                            <th className="py-2 text-right">Nominal</th>
                            <th className="py-2 text-center">Bukti</th>
                            <th className="py-2 text-center">Status</th>
                            <th className="py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/5">
                        {sisya.pembayarans.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-muted">Belum ada riwayat pembayaran.</td>
                            </tr>
                        ) : (
                            sisya.pembayarans.map((p) => (
                                <tr key={p.id} className="hover:bg-bg/50">
                                    <td className="py-3">{new Date(p.createdAt).toLocaleDateString('id-ID')}</td>
                                    <td className="py-3 font-medium">{p.keterangan || '-'}</td>
                                    <td className="py-3 text-right font-mono font-bold">
                                        {p.status === 'VERIFIKASI' ? formatRupiah(p.nominal) : '-'}
                                    </td>
                                    <td className="py-3 text-center">
                                        <ProofLink path={p.buktiPath} />
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                            p.status === 'VERIFIKASI' ? 'bg-green-100 text-green-700 border-green-200' :
                                            p.status === 'MENUNGGU' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                            'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        {p.status === 'MENUNGGU' && (
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" className="h-7 text-xs" onClick={() => handleOpenVerifyModal(p)}>
                                                    Verifikasi
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeletePembayaran(p.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-muted/20 p-6">
            <h4 className="font-bold text-lg border-b border-muted/20 pb-3 mb-4 text-primary">Program Ajahan Dipilih</h4>
            <div className="space-y-3">
              {sisya.programSisyas.map(sp => (
                <div key={sp.id} className={`flex justify-between items-center p-3 border rounded-md shadow-sm ${getProgramBadgeStyle(sp.programAjahan.nama)}`}>
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
            <h4 className="font-bold text-lg border-b border-muted/20 pb-3 mb-4 text-primary">Dokumen Identitas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="block text-xs font-bold text-muted uppercase tracking-wider">KTP / KK</span>
                {ktpUrl ? (
                  <div className="group relative border border-muted/20 rounded-lg overflow-hidden bg-bg aspect-video flex items-center justify-center">
                    <img src={ktpUrl} alt="KTP" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={ktpUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" className="font-bold">
                          <ExternalLink size={14} className="mr-1" /> Lihat
                        </Button>
                      </a>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="font-bold"
                        onClick={() => handleDownload(ktpUrl, 'KTP')}
                      >
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border border-dashed border-muted rounded-lg flex items-center justify-center text-sm text-muted bg-bg/50">
                    KTP tidak dilampirkan
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-muted uppercase tracking-wider">Surat Rekomendasi</span>
                {rekomendasiUrl ? (
                  <div className="group relative border border-muted/20 rounded-lg overflow-hidden bg-bg aspect-video flex items-center justify-center">
                    <img src={rekomendasiUrl} alt="Surat Rekomendasi" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={rekomendasiUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" className="font-bold">
                          <ExternalLink size={14} className="mr-1" /> Lihat
                        </Button>
                      </a>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="font-bold"
                        onClick={() => handleDownload(rekomendasiUrl, 'Rekomendasi')}
                      >
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 border border-dashed border-muted rounded-lg flex items-center justify-center text-sm text-muted bg-bg/50">
                    Surat rekomendasi tidak dilampirkan
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-muted/20">
                  <div className="p-6 border-b border-muted/10 flex justify-between items-center bg-primary/5">
                      <h3 className="font-bold text-lg text-primary">Verifikasi Pembayaran</h3>
                      <button onClick={() => setShowVerifyModal(false)} className="text-muted hover:text-text">✕</button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="aspect-video border rounded-lg overflow-hidden bg-bg flex items-center justify-center">
                         <ProofPreview path={selectedPembayaran.buktiPath} />
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-muted uppercase">Nominal Diterima (Rp)</label>
                          <Input 
                            type="number" 
                            placeholder="Contoh: 1500000"
                            value={nominalVerifikasi}
                            onChange={(e) => setNominalVerifikasi(e.target.value)}
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-muted uppercase">Catatan / Keterangan</label>
                          <Input 
                            placeholder="Catatan verifikasi..."
                            value={keteranganVerifikasi}
                            onChange={(e) => setKeteranganVerifikasi(e.target.value)}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                          <Button 
                            variant="outline" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleVerifikasi('DITOLAK')}
                            disabled={isUpdating}
                          >
                              <XCircle className="mr-2" size={18} /> Tolak
                          </Button>
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleVerifikasi('VERIFIKASI')}
                            disabled={isUpdating}
                          >
                              <CheckCircle className="mr-2" size={18} /> Verifikasi
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// Helper component for Proof Preview in Modal to avoid Hook Order Error
function ProofPreview({ path }) {
    const url = useFileUrl(path);
    if (!url) return <div className="text-muted animate-pulse">Memuat bukti...</div>;
    return <img src={url} alt="Bukti" className="max-w-full max-h-full object-contain" />;
}

// Helper component for Proof Link
function ProofLink({ path }) {
    const url = useFileUrl(path);
    if (!url) return <span className="text-muted">-</span>;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center justify-center gap-1">
            <FileText size={14} /> View
        </a>
    );
}
