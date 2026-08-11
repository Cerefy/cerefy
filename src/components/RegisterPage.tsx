import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from './LogoIcon';
import { MsIcon } from './kinetic/primitives';

export const RegisterPage: React.FC = () => {
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError();
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    try {
      await register(
        form.email,
        form.password,
        form.firstName,
        form.lastName,
        form.organizationName || undefined,
      );
      navigate('/workspace');
    } catch {
      // Error handled by context
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left panel — brand storytelling */}
        <div className="relative bg-on-surface flex flex-col justify-between p-8 md:p-16 md:w-1/2 lg:w-[45%] overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-primary/20 blur-[60px]" />
            <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[60px]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                <LogoIcon className="w-6 h-6 text-on-surface" />
              </div>
              <span className="text-surface-container-lowest font-headline font-bold text-xl tracking-tighter">
                Cerefy
              </span>
            </div>
            <h1 className="text-surface-container-lowest font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1]">
              Join the Intelligence Revolution
            </h1>
            <p className="text-surface-variant opacity-80 mt-6 max-w-md text-lg leading-relaxed">
              Deploy autonomous agents that operate across your entire enterprise — memory, decisions, and execution
              in one sovereign OS.
            </p>
          </div>
          <div className="relative z-10">
            <div className="border-t border-surface-variant/20 pt-6">
              <span className="font-label text-xs uppercase tracking-widest text-surface-variant/70 font-semibold">
                Enterprise Ready
              </span>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/10 border border-surface/20 font-label text-xs text-surface-container-lowest">
                  <MsIcon name="verified" fill size={16} /> SOC2 Type II
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/10 border border-surface/20 font-label text-xs text-surface-container-lowest">
                  <MsIcon name="lock" fill size={16} /> E2E Encryption
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 bg-surface flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md space-y-6 relative z-10">
            <div className="text-center md:text-left">
              <h2 className="text-on-surface font-headline font-semibold text-3xl tracking-tight">
                Create your account
              </h2>
              <p className="text-on-surface-variant mt-2">Get started with a 14-day free trial.</p>
            </div>

            {displayError && (
              <div className="rounded-lg bg-error-container border border-error/20 px-4 py-3">
                <p className="text-on-error-container text-sm">{displayError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    required
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Jane"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    required
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="org">
                  Organization
                </label>
                <input
                  id="org"
                  type="text"
                  value={form.organizationName}
                  onChange={(e) => updateField('organizationName', e.target.value)}
                  placeholder="Acme Corporation (optional)"
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="email">
                  Work Email
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <p className="text-[11px] text-on-surface-variant/70">Use your corporate email for immediate verification.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 pr-12 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                  <span
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <MsIcon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="confirm">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  required
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <label className="flex items-start gap-3 mt-2 cursor-pointer">
                <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="text-xs leading-tight text-on-surface-variant">
                  I agree to the{' '}
                  <a href="#" className="underline text-on-surface font-medium underline-offset-2">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="underline text-on-surface font-medium underline-offset-2">Privacy Policy</a>.
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-on-surface text-surface-container-lowest py-4 rounded-lg font-semibold tracking-wide hover:bg-on-surface/90 active:scale-[0.99] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating account...' : 'Create Enterprise Account'}
              </button>
            </form>

            <p className="text-sm text-on-surface-variant text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>

            <div className="flex justify-center items-center gap-8 pt-6 border-t border-outline-variant/20 opacity-60">
              <span className="flex items-center gap-1.5 text-[10px] font-label uppercase tracking-tighter text-on-surface-variant">
                <MsIcon name="shield" size={14} /> AES-256
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-label uppercase tracking-tighter text-on-surface-variant">
                <MsIcon name="cloud_done" size={14} /> SOC 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};