import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Registrasi from './pages/public/Registrasi';
import SuksesRegistrasi from './pages/public/SuksesRegistrasi';
import CekStatus from './pages/public/CekStatus';
import LengkapiBerkas from './pages/public/LengkapiBerkas';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import SisyaList from './pages/admin/SisyaList';
import SisyaDetail from './pages/admin/SisyaDetail';
import Pengaturan from './pages/admin/Pengaturan';
import Laporan from './pages/admin/Laporan';
import LaporanPuniaRange from './pages/admin/LaporanPuniaRange';
import LaporanPuniaBulanan from './pages/admin/LaporanPuniaBulanan';
import LaporanAbsensi from './pages/admin/LaporanAbsensi';
import MataKuliahList from './pages/admin/absensi/MataKuliahList';
import MataKuliahDetail from './pages/admin/absensi/MataKuliahDetail';
import SesiAbsensi from './pages/admin/absensi/SesiAbsensi';
import RekapAbsensiSisya from './pages/admin/absensi/RekapAbsensiSisya';
import RekapMataKuliah from './pages/admin/absensi/RekapMataKuliah';
import SyaratKelulusan from './pages/admin/kelulusan/SyaratKelulusan';
import AbsensiKelulusan from './pages/admin/kelulusan/AbsensiKelulusan';
import PresentasiKelulusan from './pages/admin/kelulusan/PresentasiKelulusan';
import SertifikatConfig from './pages/admin/SertifikatConfig';
import TarifConfig from './pages/admin/TarifConfig';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
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
          </Route>

          {/* Presentasi Fullscreen without Sidebar */}
          <Route path="/admin/kelulusan/presentasi" element={<PresentasiKelulusan />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
