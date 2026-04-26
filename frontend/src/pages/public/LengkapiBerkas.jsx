import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, Upload, ArrowLeft, Info, AlertCircle, FileText, User, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import api from '../../lib/axios';

export default function LengkapiBerkas() {
  const [nomorPendaftaran, setNomorPendaftaran] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sisyaData, setSisyaData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Files state
  const [files, setFiles] = useState({
    fileIdentitas: null,
    fileFoto: null,
    fileRekomendasi: null
  });

  const handleSearch = async () => {
    if (!nomorPendaftaran) return;
    
    setIsLoading(true);
    setError(null);
    setSisyaData(null);
    setSuccess(false);

    try {
      const response = await api.get(`/sisya/cari?nomor=${nomorPendaftaran}`);
      if (response.data.success) {
        setSisyaData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencari data. Pastikan nomor pendaftaran benar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e, field) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({
        ...prev,
        [field]: e.target.files[0]
      }));
    }
  };

  const handleSubmit = async () => {
    if (!sisyaData) return;
    if (!files.fileIdentitas && !files.fileFoto && !files.fileRekomendasi) {
      setError('Silakan pilih minimal satu berkas untuk diunggah.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('nomorPendaftaran', sisyaData.nomorPendaftaran);
      if (files.fileIdentitas) formData.append('fileIdentitas', files.fileIdentitas);
      if (files.fileFoto) formData.append('fileFoto', files.fileFoto);
      if (files.fileRekomendasi) formData.append('fileRekomendasi', files.fileRekomendasi);

      const response = await api.post('/sisya/lengkapi-berkas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccess(true);
        setFiles({
          fileIdentitas: null,
          fileFoto: null,
          fileRekomendasi: null
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah berkas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-12 px-4 font-sans">
      <div className="mb-8">
        <Link to="/" className="text-primary hover:underline flex items-center text-sm font-medium">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Beranda
        </Link>
        <h1 className="text-3xl font-bold text-text mt-4">Lengkapi Berkas Pendaftaran</h1>
        <p className="text-muted">Gunakan fitur ini untuk mengunggah ulang foto, KTP/KK/Ijasah, atau surat rekomendasi yang diperlukan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verifikasi Data</CardTitle>
              <CardDescription>Masukkan nomor pendaftaran Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <Input 
                    placeholder="PDPN-YYYY-XXXX" 
                    className="pl-10"
                    value={nomorPendaftaran}
                    onChange={(e) => setNomorPendaftaran(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={sisyaData && !success}
                  />
                </div>
                {sisyaData && !success ? (
                  <Button variant="outline" className="w-full" onClick={() => { setSisyaData(null); setNomorPendaftaran(''); }}>
                    Ganti Nomor
                  </Button>
                ) : (
                  <Button 
                    className="w-full font-bold" 
                    onClick={handleSearch}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Cari Data
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 bg-primary/5 border border-primary/10 rounded-lg p-4">
            <h4 className="font-bold text-primary flex items-center mb-2">
              <Info size={16} className="mr-2" /> Informasi
            </h4>
            <ul className="text-xs text-muted space-y-2 list-disc pl-4">
              <li>Pastikan file dalam format JPG, PNG, atau PDF.</li>
              <li>Ukuran maksimal setiap file adalah 5MB.</li>
              <li>Anda dapat mengunggah satu per satu atau sekaligus.</li>
            </ul>
          </div>
        </div>

        {/* Upload Area */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start mb-6">
              <AlertCircle className="mr-3 mt-0.5 shrink-0" size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center mb-6 animate-in zoom-in duration-300">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Berhasil Diperbarui!</h3>
              <p className="text-sm opacity-90 mb-6">Berkas pendaftaran Anda telah berhasil diunggah dan akan segera diverifikasi oleh admin.</p>
              <Button onClick={() => { setSuccess(false); setSisyaData(null); setNomorPendaftaran(''); }}>
                Unggah Berkas Lain
              </Button>
            </div>
          )}

          {sisyaData && !success ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-t-4 border-t-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <User className="text-primary" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{sisyaData.namaLengkap}</CardTitle>
                      <CardDescription className="font-mono font-bold text-primary">{sisyaData.nomorPendaftaran}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* File Identitas */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-text flex items-center justify-between">
                        <span className="flex items-center">
                          <FileText size={16} className="mr-2 text-primary" /> Berkas Identitas (KTP/KK/Ijasah)
                        </span>
                        {sisyaData.fileIdentitasPath && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SUDAH ADA</span>
                        )}
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                          <input 
                            type="file" 
                            id="file-identitas" 
                            className="hidden" 
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange(e, 'fileIdentitas')}
                          />
                          <label 
                            htmlFor="file-identitas"
                            className={`flex items-center justify-between border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors ${files.fileIdentitas ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/10'}`}
                          >
                            <span className="text-sm truncate max-w-[200px]">
                              {files.fileIdentitas ? files.fileIdentitas.name : sisyaData.fileIdentitasPath ? 'Ganti berkas identitas...' : 'Pilih berkas identitas...'}
                            </span>
                            <Upload size={18} className="text-muted" />
                          </label>
                        </div>
                        {files.fileIdentitas && (
                          <button onClick={() => setFiles(f => ({ ...f, fileIdentitas: null }))} className="text-xs text-red-500 font-bold">Batal</button>
                        )}
                      </div>
                    </div>

                    {/* File Foto */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-text flex items-center justify-between">
                        <span className="flex items-center">
                          <ImageIcon size={16} className="mr-2 text-primary" /> Foto Latar Merah
                        </span>
                        {sisyaData.fileFotoPath && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SUDAH ADA</span>
                        )}
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                          <input 
                            type="file" 
                            id="file-foto" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'fileFoto')}
                          />
                          <label 
                            htmlFor="file-foto"
                            className={`flex items-center justify-between border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors ${files.fileFoto ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/10'}`}
                          >
                            <span className="text-sm truncate max-w-[200px]">
                              {files.fileFoto ? files.fileFoto.name : sisyaData.fileFotoPath ? 'Ganti foto...' : 'Pilih foto...'}
                            </span>
                            <Upload size={18} className="text-muted" />
                          </label>
                        </div>
                        {files.fileFoto && (
                          <button onClick={() => setFiles(f => ({ ...f, fileFoto: null }))} className="text-xs text-red-500 font-bold">Batal</button>
                        )}
                      </div>
                    </div>

                    {/* File Rekomendasi */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-text flex items-center justify-between">
                        <span className="flex items-center">
                          <FileText size={16} className="mr-2 text-primary" /> Surat Rekomendasi
                        </span>
                        {sisyaData.fileRekomendasiPath && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SUDAH ADA</span>
                        )}
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                          <input 
                            type="file" 
                            id="file-rekomendasi" 
                            className="hidden" 
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange(e, 'fileRekomendasi')}
                          />
                          <label 
                            htmlFor="file-rekomendasi"
                            className={`flex items-center justify-between border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors ${files.fileRekomendasi ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/10'}`}
                          >
                            <span className="text-sm truncate max-w-[200px]">
                              {files.fileRekomendasi ? files.fileRekomendasi.name : sisyaData.fileRekomendasiPath ? 'Ganti surat rekomendasi...' : 'Pilih surat rekomendasi...'}
                            </span>
                            <Upload size={18} className="text-muted" />
                          </label>
                        </div>
                        {files.fileRekomendasi && (
                          <button onClick={() => setFiles(f => ({ ...f, fileRekomendasi: null }))} className="text-xs text-red-500 font-bold">Batal</button>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        className="w-full h-12 text-lg font-bold" 
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!files.fileIdentitas && !files.fileFoto && !files.fileRekomendasi)}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={20} />}
                        Unggah Sekarang
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : !isLoading && !error && !success ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
              <FileText size={48} className="mx-auto text-muted/30 mb-4" />
              <h3 className="text-lg font-medium text-muted">Belum ada data yang diverifikasi</h3>
              <p className="text-sm text-muted max-w-xs mx-auto mt-2">
                Masukkan nomor pendaftaran Anda di kolom verifikasi untuk mulai melengkapi berkas.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
