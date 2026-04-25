import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold font-heading">PDPN - VIDYA Visualisasi Data dan Sisya Administrasi Pesraman</h1>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
      <footer className="bg-secondary text-white p-4 mt-8 text-center text-sm">
        &copy; 2026 Perkumpulan Dharmopadesa Pusat Nusantara. All rights reserved.
      </footer>
    </div>
  );
}
