// src/components/RegisterPage.tsx
// Premium dark enterprise registration page

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from './LogoIcon';
import { Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, Building2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError();
    setLocalError(null);
  };

  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (pwd.length < 10) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score >= 2) return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    return { label: 'Good', color: 'bg-cyan-500', width: '75%' };
  };

  const strength = passwordStrength(form.password);

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
      await register(form.email, form.password, form.firstName, form.lastName, form.organizationName || undefined);
      navigate('/workspace');
    } catch {
      // Error handled by context
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <LogoIcon />
            <span className="text-2xl font-bold text-white tracking-tight">Cerefy</span>
          </motion.div>
          <p className="text-zinc-500 text-sm">Create your enterprise workspace</p>
        </div>

        {/* Register Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-xl font-semibold text-white mb-1">Get started</h2>
          <p className="text-zinc-500 text-sm mb-6">Set up your AI-powered enterprise workspace</p>

          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4"
            >
              <p className="text-red-400 text-sm">{displayError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                  placeholder="John"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                  placeholder="Smith"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1"><Building2 size={12} /> Organization</span>
              </label>
              <input
                type="text"
                value={form.organizationName}
                onChange={(e) => updateField('organizationName', e.target.value)}
                placeholder="Acme Corporation (optional)"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 pr-12 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: strength.width }}
                      className={`h-full ${strength.color} rounded-full`}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-medium py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Workspace <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800/60">
            <p className="text-zinc-500 text-xs text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-zinc-600 text-xs">
          <ShieldCheck size={14} />
          <span>SOC 2 Type II · GDPR Compliant · Enterprise SSO Ready</span>
        </div>
      </motion.div>
    </div>
  );
};
