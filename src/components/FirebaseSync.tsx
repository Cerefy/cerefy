import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import {
  auth,
  signOut,
  onAuthStateChanged,
  db,
} from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LogIn, LogOut, Shield } from 'lucide-react';
import { FirebaseAuthModal } from './FirebaseAuthModal';

export const FirebaseSync: React.FC = () => {
  const { currentUser, setCurrentUser, authLoading, setAuthLoading, activeTenantId, activeRole } = useAgentStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    console.log('FirebaseSync: initializing auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('FirebaseSync: auth state changed', user);
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email || 'user@example.com',
              displayName: user.displayName || 'Enterprise User',
              role: activeRole || 'TENANT_ADMIN',
              tenantId: activeTenantId || 'tenant_acme',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            console.log('FirebaseSync: created new user profile');
          }
        } catch (err) {
          console.warn('Firebase profile sync error:', err);
        }
      }
    });
    // Fallback timeout in case auth listener does not fire
    const timeoutId = setTimeout(() => {
      console.warn('FirebaseSync: auth listener timeout, proceeding without user');
      setAuthLoading(false);
    }, 5000);
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [setCurrentUser, setAuthLoading, activeTenantId, activeRole]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full font-mono text-xs text-zinc-400">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
        <span>Firebase Auth...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 font-mono text-xs">
        {currentUser ? (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full pl-3 pr-1 py-1">
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowAuthModal(true)}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold max-w-[120px] truncate" title={currentUser.email || ''}>
                {currentUser.displayName || currentUser.email || 'Authenticated'}
              </span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                Firebase
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Sign Out of Firebase"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all shadow-md cursor-pointer text-xs"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In / Demo</span>
          </button>
        )}
      </div>

      {showAuthModal && <FirebaseAuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};

