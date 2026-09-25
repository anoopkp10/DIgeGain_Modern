import React, { useState } from 'react';
import { Logo } from '../ui/Logo.tsx';
import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (user: string) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToSite }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.token) {
        try {
          localStorage.setItem('digegain_admin_token', data.token);
        } catch {}
      }

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#040812]">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <button
              onClick={onBackToSite}
              className="focus:outline-none cursor-pointer group inline-flex items-center"
              title="Return to Home Page"
              aria-label="Return to Home Page"
            >
              <Logo size="lg" variant="full" clickable={false} />
            </button>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#0EA5E9]">
            <Lock className="w-3 h-3" />
            <span>SECURE ADMINISTRATIVE ACCESS</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl border border-white/15 shadow-2xl shadow-black/80 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060D1A] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060D1A] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-lg hover:shadow-[#0284C7]/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="p-3 rounded-xl bg-[#060D1A]/80 border border-white/5 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Default Credentials:</span>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('Digegain@2026!');
                }}
                className="text-[#0EA5E9] hover:underline font-bold text-[11px]"
              >
                Auto-fill
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Username: <strong className="text-white">admin</strong></span>
              <span>Password: <strong className="text-white">Digegain@2026!</strong></span>
            </div>
          </div>

          <div className="pt-1 text-center text-xs text-slate-500 font-mono">
            Protected by JOSE session authentication
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={onBackToSite}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to DIGEGAIN Website</span>
          </button>
        </div>
      </div>
    </div>
  );
};
