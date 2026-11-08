// ============================================================
// DevSpend — Cryptographic Auth Guard
// Enforces HMAC-verified session token prior to view rendering
// ============================================================

import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthGateway } from './AuthGateway';
import { ShieldCheck } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isInitializing, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-ping opacity-25" />
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase">
              Verifying Session Integrity
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGateway />;
  }

  return <>{children}</>;
};
