import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Logo PDPN" 
            width="42"
            height="42"
            className="object-contain bg-white rounded-full p-1 shadow-sm flex-shrink-0" 
            style={{ width: '42px', height: '42px', minWidth: '42px' }}
          />
          <h1 className="text-xl md:text-2xl font-bold font-heading leading-tight">
            PDPN - VIDYA
            <span className="block text-sm font-normal opacity-90">Visualisasi Data dan Sisya Administrasi Pesraman</span>
          </h1>
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
