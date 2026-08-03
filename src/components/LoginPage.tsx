// src/components/LoginPage.tsx
// Premium dark enterprise login page with glassmorphism

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from './LogoIcon';
import { Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Branding */}
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
          <p className="text-zinc-500 text-sm">Enterprise AI Implementation Operating System</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-zinc-500 text-sm mb-6">Sign in to your enterprise workspace</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0" />
                <span className="text-zinc-500 text-xs">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
                Forgot password?
              </Link>
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
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800/60">
            <p className="text-zinc-500 text-xs text-center">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Request access
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-zinc-600 text-xs">
          <ShieldCheck size={14} />
          <span>SOC 2 Type II · AES-256 Encrypted · SSO Ready</span>
        </div>
      </motion.div>
    </div>
  );
};
