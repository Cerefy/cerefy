import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from './LogoIcon';
import { MsIcon } from './kinetic/primitives';

export const LoginPage: React.FC = () => {
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/workspace');
    } catch {
      // Error is captured by context
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body overflow-hidden relative">
      {/* Atmospheric Background Layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-orb bg-primary top-[-200px] left-[-100px]" />
        <div className="gradient-orb bg-secondary bottom-[-200px] right-[-100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
        />
      </div>

      {/* Main Content Shell */}
      <main className="min-h-screen flex items-center justify-center px-4 md:px-0 relative">
        <div className="w-full max-w-[1200px] grid md:grid-cols-2 bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-outline-variant/30 relative">
          {/* Left Side: Visual / Context */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-surface-container-low relative overflow-hidden">
            <div className="z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <LogoIcon className="w-6 h-6 text-on-surface" />
                </div>
                <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">Cerefy</span>
              </div>
              <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface leading-tight mb-6">
                Unified Intelligence for the Enterprise.
              </h1>
              <p className="text-on-surface-variant text-lg max-w-md">
                Experience the next generation of decision-making with our secure, autonomous agent architecture.
              </p>
            </div>

            {/* Abstract Technical Texture */}
            <div className="relative mt-12 flex-grow flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-lg" />
              <div className="glass-panel w-full h-[300px] rounded-lg p-6 shadow-sm border border-outline-variant/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                    Live Security Feed
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-3/4 bg-surface-container-highest rounded animate-pulse" />
                  <div className="h-2 w-1/2 bg-surface-container-highest rounded animate-pulse" />
                  <div className="h-2 w-5/6 bg-surface-container-highest rounded animate-pulse" />
                  <div className="pt-4 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded bg-surface-container-high/50" />
                    <div className="h-16 rounded bg-surface-container-high/50" />
                    <div className="h-16 rounded bg-surface-container-high/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="z-10 flex items-center gap-4 mt-8">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-dim flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">person</span>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-dim flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">person</span>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-dim flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">person</span>
                </div>
              </div>
              <p className="font-label text-xs text-on-surface-variant">Trusted by 500+ Fortune Entities</p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <div className="md:hidden flex justify-center mb-8">
              <LogoIcon className="w-12 h-12 text-on-surface" />
            </div>
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-on-surface mb-2">Access Secure Terminal</h2>
              <p className="text-on-surface-variant">Enter your credentials to manage enterprise memory.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-error-container border border-error/20 px-4 py-3">
                <p className="text-on-error-container text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="font-label text-sm font-medium text-on-surface-variant ml-1" htmlFor="email">
                  Work Email
                </label>
                <div className="relative group">
                  <MsIcon
                    name="mail"
                    size={20}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                  />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline-variant/60"
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError();
                    }}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label text-sm font-medium text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs font-medium text-primary hover:underline transition-all">
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <MsIcon
                    name="lock"
                    size={20}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
                  />
                  <input
                    className="w-full pl-10 pr-12 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <MsIcon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-on-surface text-surface-container-lowest font-semibold rounded-lg hover:bg-on-surface/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-on-surface/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }} aria-hidden="true">progress_activity</span>
                  ) : (
                    <>
                      Sign In
                      <MsIcon name="arrow_forward" size={20} />
                    </>
                  )}
                </button>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/40" />
                  <span className="flex-shrink mx-4 text-xs font-label text-outline-variant uppercase tracking-widest">
                    or
                  </span>
                  <div className="flex-grow border-t border-outline-variant/40" />
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="w-full py-3.5 bg-surface-container border border-outline-variant/60 text-on-surface font-medium rounded-lg hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <MsIcon name="id_card" className="text-primary" size={20} />
                  Create Enterprise Account
                </button>
              </div>
            </form>

            {/* Security Indicators Footer */}
            <div className="mt-12 pt-8 border-t border-outline-variant/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
                  <MsIcon name="verified_user" fill size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface">Enterprise-grade encryption active</p>
                  <p className="text-[10px] text-on-surface-variant font-label">AES-256 Bit Security Protocols Enabled</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/30">
                  <MsIcon name="security" fill size={14} className="text-primary" />
                  <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter font-semibold">
                    Protected by Cerefy Shield
                  </span>
                </div>
                <div className="flex gap-4">
                  <a className="text-[10px] font-label text-outline hover:text-primary transition-colors" href="#">
                    Privacy Policy
                  </a>
                  <a className="text-[10px] font-label text-outline hover:text-primary transition-colors" href="#">
                    Terms
                  </a>
                </div>
              </div>
              <p className="text-center text-xs text-on-surface-variant pt-2">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-semibold hover:underline transition-all">
                  Request access
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};