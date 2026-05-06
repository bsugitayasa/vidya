import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap
} from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function AdminLayout() {
  const { token, user } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const [expandedMenus, setExpandedMenus] = useState([]); // Default collapse all

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-400' },
    { path: '/admin/sisya', icon: Users, label: 'Data Sisya', color: 'text-amber-400' },
    { path: '/admin/absensi', icon: ClipboardList, label: 'Absensi', color: 'text-violet-400' },
    {
      path: '/admin/kelulusan',
      icon: GraduationCap,
      label: 'Kelulusan',
      color: 'text-yellow-400',
      subItems: [
        { path: '/admin/kelulusan/syarat', label: 'Syarat Kelulusan' },
        { path: '/admin/kelulusan/absensi', label: 'Absensi Hari H' },
        { path: '/admin/kelulusan/presentasi', label: 'Presentasi Layar' },
      ]
    },
    {
      path: '/admin/laporan',
      icon: FileText,
      label: 'Laporan',
      color: 'text-emerald-400',
      subItems: [
        { path: '/admin/laporan/pendaftaran', label: 'Pendaftaran' },
        { path: '/admin/laporan/punia-range', label: 'Detail Punia' },
        { path: '/admin/laporan/punia-bulanan', label: 'Rekap Bulanan' },
        { path: '/admin/laporan/absensi', label: 'Rekap Absensi' },
      ]
    },
    {
      path: '/admin/pengaturan',
      icon: Settings,
      label: 'Pengaturan',
      color: 'text-rose-400',
      subItems: [
        { path: '/admin/pengaturan', label: 'Umum & Rekening', restricted: true },
        { path: '/admin/pengaturan/tarif', label: 'Tarif Program' },
        { path: '/admin/pengaturan/sertifikat', label: 'Format Sertifikat' },
      ]
    },
  ];

  // Filter menu items based on role
  const filteredMenuItems = menuItems.map(item => {
    if (item.subItems) {
      return {
        ...item,
        subItems: item.subItems.filter(sub => {
          if (sub.restricted && user?.role !== 'SUPER_ADMIN') return false;
          return true;
        })
      };
    }
    return item;
  });

  const toggleExpand = (path) => {
    setExpandedMenus(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  return (
    <div className="flex min-h-screen bg-bg font-sans">
      {/* Sidebar */}
      <aside
        className={`${isMinimized ? 'w-20' : 'w-64'
          } bg-secondary text-white flex flex-col transition-all duration-300 ease-in-out relative shadow-xl`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute -right-3 top-20 bg-primary text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform z-10"
        >
          {isMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo Section */}
        <div className={`p-4 flex items-center gap-3 border-b border-primary/30 ${isMinimized ? 'justify-center' : ''}`}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: isMinimized ? '32px' : '48px',
              height: isMinimized ? '32px' : '48px',
              minWidth: isMinimized ? '32px' : '48px'
            }}
            className="object-contain transition-all duration-300 flex-shrink-0"
          />
          {!isMinimized && (
            <div className="overflow-hidden whitespace-nowrap">
              <h2 className="font-bold font-heading text-lg tracking-tight">PDPN - VIDYA</h2>
              <p className="text-[10px] opacity-70">Sistem Akademik & Keuangan</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isParentActive = location.pathname.startsWith(item.path);
            const isExpanded = expandedMenus.includes(item.path) || (isParentActive && !isMinimized);

            if (item.subItems) {
              return (
                <div key={item.path} className="space-y-1">
                  <button
                    onClick={() => toggleExpand(item.path)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${isParentActive
                      ? 'bg-primary/20 text-white font-semibold'
                      : 'hover:bg-primary/20 text-white/80 hover:text-white'
                      } ${isMinimized ? 'justify-center' : ''}`}
                  >
                    <Icon size={20} className={isParentActive ? 'text-primary' : item.color} />
                    {!isMinimized && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </>
                    )}
                  </button>

                  {isExpanded && !isMinimized && (
                    <div className="ml-9 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            className={`block p-2 rounded-md text-sm transition-all ${isSubActive
                              ? 'text-white bg-primary font-medium'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                              }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${location.pathname === item.path
                  ? 'bg-primary text-white shadow-lg font-semibold'
                  : 'hover:bg-primary/20 text-white/80 hover:text-white'
                  } ${isMinimized ? 'justify-center' : ''}`}
                title={isMinimized ? item.label : ''}
              >
                <Icon size={20} className={location.pathname === item.path ? 'text-white' : item.color} />
                {!isMinimized && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-primary/30">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-100 hover:text-white transition-all ${isMinimized ? 'justify-center' : ''
              }`}
            title={isMinimized ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!isMinimized && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
