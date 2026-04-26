import { Outlet, NavLink, Link } from 'react-router-dom';
import { UserPlus, Search, FileUp, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Pendaftaran', path: '/daftar', icon: UserPlus },
    { name: 'Cek Status', path: '/cek-status', icon: Search },
    { name: 'Lengkapi Berkas', path: '/lengkapi-berkas', icon: FileUp },
  ];

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      {/* Premium Header - Matching Admin Panel */}
      <nav className="sticky top-0 z-50 bg-secondary shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <img src="/logo.png" alt="Logo PDPN" className="w-12 h-12 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight text-white leading-none">PDPN - VIDYA</span>
                  <p className="text-white/60 text-[10px] mt-1.5 uppercase tracking-[0.15em] font-black">
                    Visualisasi Data dan Sisya Administrasi Pesraman
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <item.icon size={18} />
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 border-t border-white/5 bg-secondary' : 'max-h-0'}`}>
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : 'text-white/70 hover:bg-white/5'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-white/40'} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-primary/5 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-text/80 font-bold text-sm tracking-tight">
            &copy; 2026 Perkumpulan Dharmopadesa Pusat Nusantara
          </p>
          <p className="text-muted text-[10px] mt-2 uppercase tracking-[0.3em] font-black opacity-60">
            Aplikasi Administrasi Pesraman
          </p>
        </div>
      </footer>
    </div>
  );
}
