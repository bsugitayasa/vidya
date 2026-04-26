import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, Clock, XCircle, Upload, FileText, ArrowLeft, Info, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';

export default function CekStatus() {
  const location = useLocation();
  const [nomorPendaftaran, setNomorPendaftaran] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sisyaData, setSisyaData] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Jika ada nomor dari state (misal dari halaman sukses), otomatis isi
  useEffect(() => {
    if (location.state?.nomorPendaftaran) {
      setNomorPendaftaran(location.state.nomorPendaftaran);
      handleSearch(location.state.nomorPendaftaran);
    }
  }, [location.state]);

  const handleSearch = async (nomorToSearch = nomorPendaftaran, isRefresh = false) => {
    if (!nomorToSearch) return;
    
    setIsLoading(true);
    setError(null);
    if (!isRefresh) {
      setSisyaData(null);
      setUploadSuccess(false);
    }

    try {
      const response = await api.get(`/sisya/cari?nomor=${nomorToSearch}`);
      if (response.data.success) {
        setSisyaData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencari data. Pastikan nomor pendaftaran benar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !sisyaData) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('filePunia', file);
      formData.append('nomorPendaftaran', sisyaData.nomorPendaftaran);

      const response = await api.post(`/sisya/${sisyaData.id}/upload-punia`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setUploadSuccess(true);
        setFile(null); // Clear file after upload
        // Refresh data to show new status
        handleSearch(sisyaData.nomorPendaftaran, true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LUNAS':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><CheckCircle2 size={14} className="mr-1" /> LUNAS</span>;
      case 'MENUNGGU_VERIFIKASI':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><Clock size={14} className="mr-1" /> MENUNGGU VERIFIKASI</span>;
      case 'MENUNGGU_PEMBAYARAN':
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><Info size={14} className="mr-1" /> BELUM BAYAR</span>;
      case 'BELUM_LUNAS':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><Clock size={14} className="mr-1" /> BELUM LUNAS</span>;
      case 'DITOLAK':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><XCircle size={14} className="mr-1" /> DITOLAK</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold w-fit">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-12 px-4 font-sans">
      <div className="mb-8">
        <Link to="/" className="text-primary hover:underline flex items-center text-sm font-medium">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Beranda
        </Link>
        <h1 className="text-3xl font-bold text-text mt-4">Cek Status Pendaftaran</h1>
        <p className="text-muted">Masukkan nomor pendaftaran Anda untuk melihat status verifikasi dan mengunggah bukti punia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cari Data</CardTitle>
              <CardDescription>Gunakan format PDPN-YYYY-XXXX</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <Input 
                    placeholder="Contoh: PDPN-2026-0001" 
                    className="pl-10"
                    value={nomorPendaftaran}
                    onChange={(e) => setNomorPendaftaran(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button 
                  className="w-full font-bold" 
                  onClick={() => handleSearch()}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Cek Status
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 bg-primary/5 border border-primary/10 rounded-lg p-4">
            <h4 className="font-bold text-primary flex items-center mb-2">
              <Info size={16} className="mr-2" /> Bantuan
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Lupa nomor pendaftaran? Silakan hubungi admin melalui WhatsApp dengan menyebutkan nama lengkap dan tanggal lahir Anda.
            </p>
          </div>
        </div>

        {/* Result Area */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start mb-6">
              <AlertCircle className="mr-3 mt-0.5 shrink-0" size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {sisyaData ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="overflow-hidden border-t-4 border-t-primary">
                <CardHeader className="bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{sisyaData.namaLengkap}</CardTitle>
                      <CardDescription className="text-primary font-mono font-bold mt-1">
                        {sisyaData.nomorPendaftaran}
                      </CardDescription>
                    </div>
                    {getStatusBadge(sisyaData.statusPembayaran)}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Program Ajahan</h4>
                      <div className="divide-y border rounded-lg">
                        {sisyaData.programSisyas.map((ps, idx) => (
                          <div key={idx} className="p-3 flex justify-between items-center text-sm">
                            <span className="font-medium">{ps.programAjahan.nama}</span>
                            <span className="text-muted">Rp {ps.puniaProgram.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                        <div className="p-3 flex justify-between items-center bg-muted/20 font-bold">
                          <span>Total Punia</span>
                          <span className="text-primary text-lg">Rp {sisyaData.totalPunia.toLocaleString('id-ID')}</span>
                        </div>
                        {sisyaData.statusPembayaran === 'BELUM_LUNAS' && (
                          <div className="p-3 flex justify-between items-center text-sm text-red-600 font-bold border-t border-red-100 bg-red-50/50">
                            <span>Sisa Pembayaran</span>
                            <span>Rp {(sisyaData.totalPunia - sisyaData.totalTerbayar).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Section if needed - Show if not LUNAS */}
                    {sisyaData.statusPembayaran !== 'LUNAS' && (
                      <div className="mt-8 pt-6 border-t border-dashed">
                        <h4 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
                          {sisyaData.statusPembayaran === 'MENUNGGU_VERIFIKASI' ? 'Perbarui/Tambah Bukti Pembayaran' : 'Unggah Bukti Pembayaran'}
                        </h4>
                        
                        {uploadSuccess && (
                          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md text-sm mb-4 flex items-center">
                            <CheckCircle2 size={16} className="mr-2" /> Bukti pembayaran berhasil dikirim! Tim kami akan memverifikasi segera.
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1 relative">
                            <input 
                              type="file" 
                              id="file-upload" 
                              className="hidden" 
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                            />
                            <label 
                              htmlFor="file-upload"
                              className="flex items-center justify-center border-2 border-dashed border-muted rounded-lg p-4 h-full cursor-pointer hover:bg-muted/10 transition-colors"
                            >
                              <div className="text-center">
                                <Upload size={24} className="mx-auto text-muted mb-2" />
                                <span className="text-sm font-medium block">
                                  {file ? file.name : 'Pilih file bukti transfer'}
                                </span>
                                <span className="text-xs text-muted">JPG, PNG, PDF (Maks 5MB)</span>
                              </div>
                            </label>
                          </div>
                          <Button 
                            className="md:w-32 h-auto py-4 font-bold" 
                            disabled={!file || isUploading}
                            onClick={handleUpload}
                          >
                            {isUploading ? <Loader2 className="animate-spin" /> : 'Kirim'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : !isLoading && !error ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
              <FileText size={48} className="mx-auto text-muted/30 mb-4" />
              <h3 className="text-lg font-medium text-muted">Belum ada data yang dicari</h3>
              <p className="text-sm text-muted max-w-xs mx-auto mt-2">
                Masukkan nomor pendaftaran Anda di kolom pencarian untuk melihat status terbaru.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
