import { Navigate, Outlet, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function AdminLayout() {
  const { token, logout } = useAuthStore();

  // Basic protected route
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-bg font-sans">
      <aside className="w-64 bg-secondary text-white flex flex-col">
        <div className="p-4 text-xl font-bold font-heading border-b border-primary">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className="block p-2 rounded hover:bg-primary transition-colors">Dashboard</Link>
          <Link to="/admin/sisya" className="block p-2 rounded hover:bg-primary transition-colors">Data Sisya</Link>
          <Link to="/admin/laporan" className="block p-2 rounded hover:bg-primary transition-colors">Laporan</Link>
          <Link to="/admin/pengaturan" className="block p-2 rounded hover:bg-primary transition-colors">Pengaturan</Link>
        </nav>
        <div className="p-4 border-t border-primary">
          <button onClick={logout} className="w-full bg-primary hover:bg-accent text-white p-2 rounded transition-colors">
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
