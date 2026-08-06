import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  db,
} from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import { LogoIcon } from './LogoIcon';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Github,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface FirebaseAuthModalProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({ onSuccess, onClose }) => {
  const { activeTenantId, activeRole } = useAgentStore();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'demo'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const syncUserProfile = async (uid: string, userEmail: string, name: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          uid,
          email: userEmail || 'enterprise.user@cerefy.ai',
          displayName: name || 'Enterprise User',
          role: activeRole || 'TENANT_ADMIN',
          tenantId: activeTenantId || 'tenant_cerefy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('Firestore User Sync Warning:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user.uid, result.user.email || '', result.user.displayName || 'Google User');
        setSuccessMsg('Successfully authenticated with Google OAuth');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          navigate('/workspace/command-center');
        }, 600);
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (authMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        await syncUserProfile(cred.user.uid, cred.user.email || email, displayName || 'Enterprise Member');
        setSuccessMsg('Account created! Welcome to Cerefy AI.');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(
          cred.user.uid,
          cred.user.email || email,
          cred.user.displayName || displayName || 'Enterprise Member'
        );
        setSuccessMsg('Authenticated successfully!');
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        navigate('/workspace/command-center');
      }, 600);
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAnonymousAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cred = await signInAnonymously(auth);
      await syncUserProfile(cred.user.uid, 'demo@cerefy.ai', 'Enterprise Demo Executive');
      setSuccessMsg('Signed in with Demo Anonymous Session!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        navigate('/workspace/command-center');
      }, 600);
    } catch (err: any) {
      console.error('Demo Auth Error:', err);
      setErrorMsg(err.message || 'Failed to initialize demo session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 selection:bg-indigo-500/30 font-sans text-gray-900">
      <div className="bg-white border border-gray-200 rounded-3xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-2xl relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>
        )}

        {/* Left Side (Dark Hero Enterprise Branding) - 5 cols */}
        <div className="md:col-span-5 bg-[#080E38] p-8 text-white flex flex-col justify-between space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                <LogoIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white font-sans tracking-tight">Cerefy</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white leading-snug">
                Unified Intelligence for the Enterprise
              </h2>
              <p className="text-xs text-indigo-200 leading-relaxed font-sans">
                Access your organization's multi-agent orchestrator, vector RAG memory, and real-time operational telemetry.
              </p>
            </div>

            <div className="space-y-2.5 font-sans text-xs text-indigo-100">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Multi-Agent Autonomous Orchestration</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>SOC2 Type II &amp; EU GDPR Sovereign Guardrails</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Distributed Vector &amp; Graph Memory RAG</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-900/60 flex items-center gap-2 text-[10px] font-mono text-indigo-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Postgres RLS Row Security Enforced</span>
          </div>
        </div>

        {/* Right Side (Auth Form) - 7 cols */}
        <div className="md:col-span-7 p-8 space-y-6 bg-white flex flex-col justify-between">
          <div className="space-y-5">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl font-sans text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  authMode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('demo')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  authMode === 'demo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Demo Pass
              </button>
            </div>

            {/* Error / Success Messages */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-sans text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-sans text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* OAuth Buttons Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.1 0-5.74-2.09-6.68-4.92H1.31v3.15C3.32 21.36 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.57H1.31C.48 8.23 0 10.06 0 12s.48 3.77 1.31 5.43l4.01-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.32 2.64 1.31 6.57l4.01 3.15c.94-2.83 3.58-4.97 6.68-4.97z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Github className="h-4 w-4 text-gray-900" />
                <span>GitHub</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span>OR CONTINUE WITH EMAIL</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            {authMode === 'demo' ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                  <Sparkles className="h-4 w-4" /> Instant Demo Session
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Log in directly as an authenticated tenant administrator with simulated enterprise permissions.
                </p>
                <button
                  type="button"
                  onClick={handleDemoAnonymousAuth}
                  disabled={loading}
                  className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
                >
                  <span>Launch Demo Session</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-3 font-sans text-xs">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-gray-600 mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Montaser Executive"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="executive@cerefy.ai"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="accent-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-gray-500 cursor-pointer">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !agreedTerms}
                  className="w-full py-3 bg-[#18181b] hover:bg-[#27272a] text-white font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
