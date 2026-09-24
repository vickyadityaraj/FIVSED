'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle,
  KeyRound,
  Shield
} from 'lucide-react';
import { FivsedLogo } from '@/components/ui/FivsedLogo';
import { useAuth } from '@/lib/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login, isDemoMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Failed to authenticate. Please verify your credentials.');
      }
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070b14] relative overflow-hidden">
      {/* Background Cyber Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center">
            <FivsedLogo size="lg" showText={false} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
              FIVSED
            </h1>
            <p className="text-xs sm:text-sm text-cyan-400 font-semibold mt-0.5">
              Firmware Integrity Verification & Security Event Detection
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              STM32 Security Authority Remote Monitoring SOC
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="soc-card p-6 sm:p-8 bg-[#0c1424]/95 border-slate-700/80 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Operator Authentication</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 font-semibold">
              TLS ENCRYPTED
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Security Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@fivsed.local"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions have been logged to the security console administrator.');
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 rounded-lg bg-slate-950/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 absolute right-2 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember this terminal session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with Supabase...</span>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice Footer */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>FIVSED Embedded Security Monitoring Node</p>
          <p className="text-slate-400">
            STM32 = Security Authority • ESP32 = Controller/Uploader • Raspberry Pi = Main System
          </p>
        </div>
      </div>
    </div>
  );
}
