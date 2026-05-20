import React, { useState, useEffect } from 'react';
import {
  UserCog, Plus, Search, Loader2, Trash2, KeyRound,
  AlertTriangle, X, Eye, EyeOff, Shield, ShieldCheck,
  ChevronLeft, ChevronRight, Mail, User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';

import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function ManajemenUser() {
  const { user: currentUser } = useAuthStore();

  // Guard: only SUPER_ADMIN
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Shield size={48} className="text-red-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-700">Akses Ditolak</h2>
          <p className="text-sm text-slate-500">Halaman ini hanya dapat diakses oleh Super Admin.</p>
        </div>
      </div>
    );
  }

  // Form state
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // List state
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToReset, setUserToReset] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/user-management', {
        params: { page, limit: 10, search }
      });
      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Gagal memuat data user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchUsers();
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formNama || !formEmail || !formPassword) {
      toast.warning('Semua field wajib diisi!');
      return;
    }
    if (formPassword.length < 6) {
      toast.warning('Password minimal 6 karakter!');
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post('/user-management', {
        nama: formNama,
        email: formEmail,
        password: formPassword,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setFormNama('');
        setFormEmail('');
        setFormPassword('');
        setPage(1);
        fetchUsers();
      }
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat user baru');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await api.delete(`/user-management/${userToDelete.id}`);
      if (response.data.success) {
        toast.success(response.data.message);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const handleConfirmReset = async () => {
    if (!userToReset || !resetNewPassword) return;
    if (resetNewPassword.length < 6) {
      toast.warning('Password baru minimal 6 karakter!');
      return;
    }
    setIsResetting(true);
    try {
      const response = await api.patch(`/user-management/${userToReset.id}/reset-password`, {
        newPassword: resetNewPassword,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setUserToReset(null);
        setResetNewPassword('');
        setShowResetPassword(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Gagal mereset password');
    } finally {
      setIsResetting(false);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          <ShieldCheck size={11} /> Super Admin
        </span>
      );
    }
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          <Shield size={11} /> Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <UserCog className="text-pink-500 w-9 h-9" /> Manajemen User
        </h1>
        <p className="text-slate-500 mt-1">Registrasi akun ADMIN baru, kelola, dan reset password user sistem.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* LEFT: CREATE FORM */}
        <div className="xl:col-span-2">
          <Card className="shadow-md border-slate-100">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Plus size={18} className="text-pink-500" /> Registrasi User ADMIN Baru
              </CardTitle>
              <CardDescription>Buat akun ADMIN baru untuk mengakses panel administrasi.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        placeholder="Contoh: Ida Bagus Anom"
                        value={formNama}
                        onChange={(e) => setFormNama(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        type="email"
                        placeholder="Contoh: ibanom@pdpn.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                    <div className="flex items-center h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                      <Shield size={15} className="mr-2 text-blue-500" /> ADMIN
                      <span className="text-[10px] text-slate-400 ml-2">(tidak dapat diubah)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    className="font-bold px-6 py-5 rounded-xl shadow-lg bg-pink-600 hover:bg-pink-700 text-white"
                    disabled={isCreating}
                  >
                    {isCreating ? <Loader2 className="animate-spin mr-2" size={18} /> : <Plus className="mr-2" size={18} />}
                    Daftarkan User ADMIN
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: INFO PANEL */}
        <div className="xl:col-span-1">
          <div className="bg-gradient-to-br from-pink-50 via-white to-violet-50 border border-pink-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-pink-600" />
              </div>
              <h3 className="font-bold text-slate-800">Panduan Role</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-white/80 rounded-xl border border-slate-100">
                <div className="font-bold text-amber-700 mb-1 flex items-center gap-1">
                  <ShieldCheck size={12} /> SUPER_ADMIN
                </div>
                <p>Akses penuh ke seluruh sistem, termasuk manajemen user, verifikasi dokumen (CRUD), dan konfigurasi sensitif.</p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-100">
                <div className="font-bold text-blue-700 mb-1 flex items-center gap-1">
                  <Shield size={12} /> ADMIN
                </div>
                <p>Akses operasional: data sisya, absensi, laporan, dan monitoring verifikasi dokumen (read-only).</p>
              </div>
            </div>
            <div className="pt-3 border-t border-pink-100">
              <p className="text-[11px] text-slate-400 italic">
                * Akun SUPER_ADMIN hanya dapat dibuat melalui database seed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* USER LIST TABLE */}
      <Card className="shadow-md border-slate-100">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCog size={18} className="text-pink-500" /> Daftar User Terdaftar
          </CardTitle>
          <CardDescription>Kelola semua akun user yang memiliki akses ke sistem administrasi.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Cari nama atau email..."
                className="pl-10 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
            </div>
            <Button
              variant="secondary"
              className="font-bold shrink-0 rounded-xl px-5"
              onClick={() => { setPage(1); fetchUsers(); }}
            >
              Cari
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Nama</th>
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Terdaftar</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <Loader2 className="animate-spin text-pink-500 mx-auto mb-2" size={24} />
                      <span className="text-slate-400 text-xs">Memuat data user...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada user ditemukan.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{u.nama}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">{u.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => { setUserToReset(u); setResetNewPassword(''); setShowResetPassword(false); }}
                            className="p-1.5 hover:bg-amber-50 text-amber-600 hover:text-amber-700 rounded-lg border border-slate-100 hover:border-amber-200 transition"
                            title="Reset Password"
                          >
                            <KeyRound size={14} />
                          </button>
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg border border-slate-100 hover:border-red-200 transition"
                              title="Hapus User"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
              <span className="text-xs text-slate-500">
                Halaman <strong className="font-semibold text-slate-700">{page}</strong> dari <strong className="font-semibold text-slate-700">{totalPages}</strong>
              </span>
              <div className="inline-flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 border-slate-200 hover:bg-slate-50"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft size={16} className="mr-1" /> Sebelum
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 border-slate-200 hover:bg-slate-50"
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Berikut <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: DELETE CONFIRMATION */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-4 text-red-600 bg-red-50 p-4 rounded-xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base uppercase tracking-wide">Hapus User</h3>
                <p className="text-[10px] text-red-700/80 font-bold uppercase tracking-wider">Tindakan Permanen</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 text-xs leading-relaxed">
                Anda akan menghapus akun <span className="font-bold text-slate-900">"{userToDelete.nama}"</span> ({userToDelete.email}) secara permanen dari sistem.
              </p>
              <p className="text-red-600 text-[11px] font-semibold leading-relaxed">
                * User yang dihapus tidak akan bisa login lagi ke sistem administrasi.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 font-bold border-slate-200 rounded-xl"
                onClick={() => setUserToDelete(null)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-100"
                onClick={handleConfirmDelete}
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {userToReset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-100 overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-4 text-amber-600 bg-amber-50 p-4 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base uppercase tracking-wide">Reset Password</h3>
                <p className="text-[10px] text-amber-700/80 font-bold uppercase tracking-wider">{userToReset.nama}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500">
                <div><span className="font-bold text-slate-700">Email:</span> {userToReset.email}</div>
                <div><span className="font-bold text-slate-700">Role:</span> {userToReset.role}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 font-bold border-slate-200 rounded-xl"
                onClick={() => { setUserToReset(null); setResetNewPassword(''); }}
              >
                Batal
              </Button>
              <Button
                className="flex-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-100"
                onClick={handleConfirmReset}
                disabled={isResetting || !resetNewPassword}
              >
                {isResetting ? <Loader2 className="animate-spin mr-2" size={16} /> : <KeyRound className="mr-2" size={16} />}
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
