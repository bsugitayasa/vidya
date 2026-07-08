import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages (Lazy Loaded)
const Registrasi = lazy(() => import('./pages/public/Registrasi'));
const SuksesRegistrasi = lazy(() => import('./pages/public/SuksesRegistrasi'));
const CekStatus = lazy(() => import('./pages/public/CekStatus'));
const LengkapiBerkas = lazy(() => import('./pages/public/LengkapiBerkas'));
const VerifikasiDokumenPublic = lazy(() => import('./pages/public/VerifikasiDokumenPublic'));

// Admin Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const SisyaList = lazy(() => import('./pages/admin/SisyaList'));
const SisyaDetail = lazy(() => import('./pages/admin/SisyaDetail'));
const Pengaturan = lazy(() => import('./pages/admin/Pengaturan'));
const Laporan = lazy(() => import('./pages/admin/Laporan'));
const LaporanPuniaRange = lazy(() => import('./pages/admin/LaporanPuniaRange'));
const LaporanPuniaBulanan = lazy(() => import('./pages/admin/LaporanPuniaBulanan'));
const LaporanAbsensi = lazy(() => import('./pages/admin/LaporanAbsensi'));
const LaporanProgramAjahan = lazy(() => import('./pages/admin/LaporanProgramAjahan'));
const MataKuliahList = lazy(() => import('./pages/admin/absensi/MataKuliahList'));
const MataKuliahDetail = lazy(() => import('./pages/admin/absensi/MataKuliahDetail'));
const SesiAbsensi = lazy(() => import('./pages/admin/absensi/SesiAbsensi'));
const RekapAbsensiSisya = lazy(() => import('./pages/admin/absensi/RekapAbsensiSisya'));
const RekapMataKuliah = lazy(() => import('./pages/admin/absensi/RekapMataKuliah'));
const SyaratKelulusan = lazy(() => import('./pages/admin/kelulusan/SyaratKelulusan'));
const AbsensiKelulusan = lazy(() => import('./pages/admin/kelulusan/AbsensiKelulusan'));
const PresentasiKelulusan = lazy(() => import('./pages/admin/kelulusan/PresentasiKelulusan'));
const SertifikatConfig = lazy(() => import('./pages/admin/SertifikatConfig'));
const TarifConfig = lazy(() => import('./pages/admin/TarifConfig'));
const VerifikasiDokumenAdmin = lazy(() => import('./pages/admin/VerifikasiDokumenAdmin'));
const ManajemenUser = lazy(() => import('./pages/admin/ManajemenUser'));

const queryClient = new QueryClient();

// Premium Brand-aligned Loading Fallback
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8 text-center animate-in fade-in duration-300">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Halaman...</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Navigate to="/daftar" replace />} />
              <Route path="daftar" element={<Registrasi />} />
              <Route path="daftar/sukses" element={<SuksesRegistrasi />} />
              <Route path="cek-status" element={<CekStatus />} />
              <Route path="lengkapi-berkas" element={<LengkapiBerkas />} />
            </Route>

            {/* Admin Auth Route */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sisya" element={<SisyaList />} />
              <Route path="sisya/:id" element={<SisyaDetail />} />
              <Route path="laporan" element={<Navigate to="/admin/laporan/pendaftaran" replace />} />
              <Route path="laporan/pendaftaran" element={<Laporan />} />
              <Route path="laporan/punia-range" element={<LaporanPuniaRange />} />
              <Route path="laporan/punia-bulanan" element={<LaporanPuniaBulanan />} />
              <Route path="laporan/absensi" element={<LaporanAbsensi />} />
              <Route path="laporan/program-ajahan" element={<LaporanProgramAjahan />} />
              <Route path="absensi" element={<MataKuliahList />} />
              <Route path="absensi/sesi/:sesiId" element={<SesiAbsensi />} />
              <Route path="absensi/rekap/:sisyaId" element={<RekapAbsensiSisya />} />
              <Route path="absensi/:mkId/rekap" element={<RekapMataKuliah />} />
              <Route path="absensi/:mkId" element={<MataKuliahDetail />} />
              <Route path="pengaturan" element={<Pengaturan />} />
              <Route path="pengaturan/sertifikat" element={<SertifikatConfig />} />
              <Route path="pengaturan/tarif" element={<TarifConfig />} />
              <Route path="kelulusan/syarat" element={<SyaratKelulusan />} />
              <Route path="kelulusan/absensi" element={<AbsensiKelulusan />} />
              <Route path="verifikasi-dokumen" element={<VerifikasiDokumenAdmin />} />
              <Route path="manajemen-user" element={<ManajemenUser />} />
            </Route>

            {/* Standalone Public Verification Scan Page */}
            <Route path="/verify/:token" element={<VerifikasiDokumenPublic />} />

            {/* Presentasi Fullscreen without Sidebar */}
            <Route path="/admin/kelulusan/presentasi" element={<PresentasiKelulusan />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export default App;
