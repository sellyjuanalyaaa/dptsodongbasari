import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) navigate('/admin/dashboard');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.');
      } else {
        const data = err.response?.data;
        const firstErr = data?.errors ? Object.values(data.errors)[0] : null;
        const msg = Array.isArray(firstErr) ? firstErr[0] : firstErr;
        setError(msg || data?.message || 'Email atau password salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16 pb-12"
      style={{ background: 'linear-gradient(135deg, #f96c00 0%, #d95a00 40%, #b84800 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/3"></div>
      </div>

      <div className="relative w-full max-w-sm mx-4 mt-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-kabupaten-pemalang.png" alt="Logo Kabupaten Pemalang" className="w-20 h-20 mx-auto object-contain drop-shadow-2xl mb-4" />
          <h1 className="text-white text-xl font-bold">Admin Panel</h1>
          <p className="text-orange-100 text-sm mt-1">DPT Online · Desa Sodong Basari</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-gray-800 font-bold text-lg mb-1">Selamat Datang!</h2>
          <p className="text-gray-500 text-sm mb-6">Masuk ke panel admin untuk mengelola data pemilih.</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              <span>!</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-28 text-sm outline-none transition-all focus:border-orange-400"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600">
                  {showPass ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Masuk...</>
              ) : 'Masuk >'}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-xs text-gray-400 hover:text-orange-500 transition-colors">
              ← Kembali ke Halaman Publik
            </a>
          </div>
        </div>

        <p className="text-center text-orange-200 text-xs mt-6">
          © 2026 Panitia Pilkades Sodong Basari
        </p>
      </div>
    </div>
  );
}
