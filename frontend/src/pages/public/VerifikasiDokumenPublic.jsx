import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Loader2, ArrowLeft, Calendar, User, Briefcase, FileText } from 'lucide-react';
import api from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function VerifikasiDokumenPublic() {
  const { token } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docData, setDocData] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/qr-document/public/${token}`);
        if (response.data.success) {
          setDocData(response.data.data);
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.response?.data?.message || 'Gagal memverifikasi dokumen.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Premium Header - Matching /daftar Page exactly (With bold logo, no white border, same subtitle) */}
      <nav className="sticky top-0 z-50 bg-primary shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <img src="/logo.png" alt="Logo PDPN" className="w-12 h-12 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight text-white leading-none">PDPN - VIDYA</span>
                  <p className="text-white/95 text-[10px] mt-1.5 uppercase tracking-[0.15em] font-black">
                    Visualisasi Data dan Sisya Administrasi Pesraman
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/95 hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                <ArrowLeft size={16} /> Beranda
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Verification Dashboard */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700">Sedang Memverifikasi Dokumen...</h3>
            <p className="text-slate-500 text-sm">Menghubungkan ke database aman PDPN</p>
          </div>
        ) : docData ? (
          /* SUCCESS CASE - VALID ORIGINAL DOCUMENT */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Trust Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center shadow-sm">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-2xl font-black text-emerald-800 tracking-tight">DOKUMEN ASLI & VALID</h2>
              <p className="text-emerald-700 text-xs mt-1 font-semibold uppercase tracking-wider">
                Terverifikasi Resmi oleh Sistem Vidya - PDPN
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-mono font-bold tracking-wider">
                TOKEN: {docData.token}
              </div>
            </div>

            {/* Document Details Metadata (Mimics the official PDF layout with Logo and multiline letterhead) */}
            <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8 space-y-6">
                
                {/* 1. PDF Kop Surat Header */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-center text-center sm:text-left border-b-[3px] border-b-slate-800 pb-4">
                  <img 
                    src="/logo.png" 
                    alt="Logo PDPN" 
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white shrink-0" 
                  />
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[13px] md:text-sm lg:text-base text-slate-900 tracking-tight leading-snug">
                      PERKUMPULAN DHARMOPADESA PUSAT NUSANTARA
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-slate-600 leading-normal">
                      Sekretariat Kantor Pusat: Pasraman Dharma Wasitha, Wantilan Capung Mas, Banjar Batan Ancak,
                      Desa Mas, Kecamatan Ubud, Kabupaten Gianyar, Provinsi Bali, Indonesia - 80571
                    </p>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-medium italic">
                      SK Kemenkumham RI No. AHU-0000052.AH.01.07.Tahun 2020 | Website: perkumpulan-dharmopadesa-pusat-nusantara.cloud
                    </p>
                  </div>
                </div>

                {/* Double lines bottom border effect */}
                <div className="border-b border-slate-800 -mt-5 mb-4"></div>

                {/* 2. PDF Title & Number */}
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-sm md:text-base text-slate-800 tracking-wider uppercase">
                    SURAT KETERANGAN VERIFIKASI DIGITAL
                  </h4>
                  <p className="text-xs md:text-sm text-slate-500 font-semibold">
                    Nomor: {docData.nomorSurat}
                  </p>
                </div>

                {/* 3. Detailed Document Metadata */}
                <div className="space-y-4 pt-2">
                  <h5 className="font-extrabold text-xs md:text-sm text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-1.5">
                    Detail Dokumen:
                  </h5>
                  
                  <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100 text-xs md:text-sm space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Nomor Surat</span>
                      <span className="sm:col-span-2 font-black text-slate-800 flex gap-1.5">
                        <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.nomorSurat}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Keterangan</span>
                      <span className="sm:col-span-2 font-bold text-slate-700 leading-relaxed flex gap-1.5">
                        <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.keteranganSurat}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Tanggal Terbit</span>
                      <span className="sm:col-span-2 font-semibold text-slate-700 flex gap-1.5 items-center">
                        <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {formatDate(docData.tanggal)}
                      </span>
                    </div>

                    {docData.namaPejabat2 && docData.namaPejabat2.trim() !== '' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Pejabat Penandatangan 1</span>
                          <span className="sm:col-span-2 font-black text-slate-800 flex gap-1.5">
                            <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.namaPejabat}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Jabatan 1</span>
                          <span className="sm:col-span-2 font-semibold text-slate-600 flex gap-1.5">
                            <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.jabatan}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Pejabat Penandatangan 2</span>
                          <span className="sm:col-span-2 font-black text-slate-800 flex gap-1.5">
                            <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.namaPejabat2}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Jabatan 2</span>
                          <span className="sm:col-span-2 font-semibold text-slate-600 flex gap-1.5">
                            <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.jabatan2}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Pejabat Penandatangan</span>
                          <span className="sm:col-span-2 font-black text-slate-800 flex gap-1.5">
                            <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.namaPejabat}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start py-0.5 border-t border-slate-200/50 pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] md:text-xs">Jabatan</span>
                          <span className="sm:col-span-2 font-semibold text-slate-600 flex gap-1.5">
                            <span className="hidden sm:inline text-slate-400 font-sans font-normal">:</span> {docData.jabatan}
                          </span>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Official Seal / Note */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 text-center">
              Dokumen ini ditandatangani secara elektronik menggunakan verifikasi QR-Code terenkripsi sistem. Informasi di atas adalah mutlak benar dan sesuai dengan data resmi terverifikasi secara elektronik di dalam server PDPN.
            </div>
          </div>
        ) : (
          /* DANGER CASE - INVALID / FORGED DOCUMENT */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-lg">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                <ShieldAlert size={40} className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-red-800 tracking-tight">DOKUMEN TIDAK VALID / PALSU!</h2>
              <p className="text-red-700 text-sm mt-2 font-medium">
                Peringatan! Token verifikasi <span className="font-mono font-bold bg-red-100 px-2 py-0.5 rounded text-red-900">"{token}"</span> tidak ditemukan di dalam database PDPN resmi.
              </p>

              <div className="mt-6 border-t border-red-200/50 pt-6 text-left space-y-3">
                <h4 className="font-bold text-red-900 flex items-center gap-1.5 text-sm">
                  <AlertTriangle size={16} /> Mengapa ini terjadi?
                </h4>
                <ul className="list-disc ml-5 text-xs text-red-700 space-y-1.5">
                  <li>Surat atau QR-code ini dibuat di luar sistem Vidya resmi (Upaya pemalsuan).</li>
                  <li>Token dalam URL verifikasi telah diedit atau diubah secara sengaja.</li>
                  <li>Dokumen telah dihapus dari sistem oleh Administrator.</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-md"
              >
                <ArrowLeft size={16} /> Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 py-6 border-t border-slate-800 text-center text-xs">
        <p>&copy; 2026 Perkumpulan Dharmopadesa Pusat Nusantara (PDPN)</p>
        <p className="mt-1 opacity-70">Administrasi Pesraman &bull; Terlindungi Secara Digital</p>
      </footer>
    </div>
  );
}
