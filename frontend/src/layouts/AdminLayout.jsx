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
  ClipboardList 
} from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function AdminLayout() {
  const { token, logout } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-400' },
    { path: '/admin/sisya', icon: Users, label: 'Data Sisya', color: 'text-amber-400' },
    { path: '/admin/laporan', icon: FileText, label: 'Laporan', color: 'text-emerald-400' },
    { path: '/admin/absensi', icon: ClipboardList, label: 'Absensi', color: 'text-violet-400' },
    { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan', color: 'text-rose-400' },
  ];

  return (
    <div className="flex min-h-screen bg-bg font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          isMinimized ? 'w-20' : 'w-64'
        } bg-secondary text-white flex flex-col transition-all duration-300 ease-in-out relative shadow-xl`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute -right-3 top-20 bg-primary text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
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
              <h2 className="font-bold font-heading text-lg">PDPN - VIDYA</h2>
              <p className="text-[10px] opacity-70">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'hover:bg-primary/20 text-white/80 hover:text-white'
                } ${isMinimized ? 'justify-center' : ''}`}
                title={isMinimized ? item.label : ''}
              >
                <Icon size={20} className={isActive ? 'text-white' : item.color} />
                {!isMinimized && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-primary/30">
          <button 
            onClick={logout} 
            className={`w-full flex items-center gap-3 p-3 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-100 hover:text-white transition-all ${
              isMinimized ? 'justify-center' : ''
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
