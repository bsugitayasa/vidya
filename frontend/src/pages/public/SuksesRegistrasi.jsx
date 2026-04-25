import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Copy, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function SuksesRegistrasi() {
  const location = useLocation();
  const state = location.state;

  if (!state || !state.nomorPendaftaran) {
    return <Navigate to="/daftar" replace />;
  }

  const { nomorPendaftaran, namaLengkap } = state;

  const handleCopy = () => {
    navigator.clipboard.writeText(nomorPendaftaran);
    alert('Nomor pendaftaran disalin!');
  };

  return (
    <div className="max-w-3xl mx-auto my-12 animate-in fade-in zoom-in duration-500 font-sans">
      <Card className="border-t-8 border-t-green-500 shadow-xl overflow-hidden">
        <div className="bg-green-50/50 pt-10 pb-6 flex flex-col items-center border-b border-muted/20">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-green-500 w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold font-heading text-text text-center">Pendaftaran Berhasil!</h2>
          <p className="text-muted mt-2 text-center max-w-md">
            Om Swastyastu, <span className="font-semibold text-text">{namaLengkap}</span>. Terima kasih telah mendaftar di <span className="font-semibold text-text">VIDYA</span> - Visualisasi Data dan Sisya Administrasi Pesraman.
          </p>
        </div>

        <CardContent className="p-8">
          <div className="bg-surface border border-primary/30 rounded-lg p-6 mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <p className="text-sm text-muted font-medium mb-1 uppercase tracking-wider">Nomor Pendaftaran Anda</p>
            <div className="flex items-center justify-center space-x-3 mt-2">
              <span className="text-4xl font-bold text-primary font-mono tracking-widest">{nomorPendaftaran}</span>
              <button
                onClick={handleCopy}
                className="p-2 bg-bg hover:bg-primary/10 text-muted hover:text-primary rounded-md transition-colors"
                title="Salin nomor"
              >
                <Copy size={20} />
              </button>
            </div>
            <p className="text-xs text-red-500 mt-4 font-medium flex items-center justify-center">
              <AlertCircle size={14} className="mr-1" />
              Simpan nomor ini baik-baik! Nomor ini digunakan untuk mengecek status pendaftaran Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">Langkah Selanjutnya</h3>
              <ol className="list-decimal pl-5 space-y-3 text-sm">
                <li>Bagi yang belum melampirkan bukti transfer, silakan lakukan transfer ke rekening Yayasan.</li>
                <li>Simpan bukti transfer dalam format JPG/PNG/PDF.</li>
                <li>Admin akan memverifikasi data dan dokumen Anda dalam waktu 1x24 jam kerja.</li>
                <li>Hubungi admin via WhatsApp jika ada kendala.</li>
              </ol>
            </div>

            <div className="bg-bg p-5 rounded-md border border-muted/20 flex flex-col justify-center items-center text-center space-y-4">
              <FileText className="text-primary/50 w-12 h-12" />
              <div>
                <h4 className="font-bold">Cek Status Pendaftaran</h4>
                <p className="text-xs text-muted mt-1 mb-3">Anda dapat mengecek status verifikasi menggunakan Nomor Pendaftaran.</p>
              </div>
              <Link to="/cek-status" state={{ nomorPendaftaran }}>
                <Button variant="outline" className="w-full">
                  Cek Status Sekarang
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link to="/">
              <Button className="font-bold px-8">Kembali ke Beranda</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
