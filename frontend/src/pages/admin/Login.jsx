import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';

export default function Login() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@yayasan.com');
  const [password, setPassword] = useState('admin123'); // Password dari seed database
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        setAuth(user, token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan. Tidak dapat terhubung ke server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg font-sans p-4">
      <Card className="w-full max-w-sm border-t-4 border-t-primary shadow-lg">
        <div className="bg-primary/5 pt-8 pb-4 text-center border-b border-muted/20">
          <h2 className="text-2xl font-bold font-heading text-primary">Login Admin</h2>
          <p className="text-sm text-muted mt-1">Sistem Informasi Akademik</p>
        </div>
        <CardContent className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full font-bold mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
