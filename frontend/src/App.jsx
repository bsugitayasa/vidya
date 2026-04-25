import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Registrasi from './pages/public/Registrasi';
import SuksesRegistrasi from './pages/public/SuksesRegistrasi';
import CekStatus from './pages/public/CekStatus';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import SisyaList from './pages/admin/SisyaList';
import SisyaDetail from './pages/admin/SisyaDetail';
import Pengaturan from './pages/admin/Pengaturan';
import Laporan from './pages/admin/Laporan';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Navigate to="/daftar" replace />} />
            <Route path="daftar" element={<Registrasi />} />
            <Route path="daftar/sukses" element={<SuksesRegistrasi />} />
            <Route path="cek-status" element={<CekStatus />} />
          </Route>

          {/* Admin Auth Route */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="sisya" element={<SisyaList />} />
            <Route path="sisya/:id" element={<SisyaDetail />} />
            <Route path="laporan" element={<Laporan />} />
            <Route path="pengaturan" element={<Pengaturan />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
