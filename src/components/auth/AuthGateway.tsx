// ============================================================
// DevSpend — Cryptographic Authentication Gateway
// Linear / Vercel obsidian aesthetic, zero client-side bypasses
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { checkPasswordStrength } from '../../utils/security';
import { OAuthModal } from './OAuthModal';

export const AuthGateway: React.FC = () => {
  const {
    login,
    register,
    loginDemo,
    openOAuthModal,
    authError,
    clearError,
    lockoutSeconds,
    setLockoutSeconds,
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live countdown timer for brute force cooldown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(Math.max(0, lockoutSeconds - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds, setLockoutSeconds]);

  const passwordStrength = checkPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await login(identifier, password);
      } else {
        await register(username, email, password);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLaunch = async () => {
    setIsSubmitting(true);
    try {
      await loginDemo();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur-md mb-4 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono tracking-tight text-zinc-300">
            DevSpend Intelligence v2.0
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 mb-2">
          Financial Clarity for Developers
        </h1>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          Multi-tenant unit economics, cloud burn monitoring, and AI-driven cost reduction.
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 backdrop-blur-xl">
        {/* Sign In vs Register Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/70 mb-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              clearError();
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              clearError();
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Lockout banner */}
        {lockoutSeconds > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <div>
              <p className="font-medium">Security Cooldown Active</p>
              <p className="text-[11px] opacity-90">
                Too many failed attempts. Try again in{' '}
                <span className="font-mono font-bold text-amber-200">{lockoutSeconds}s</span>.
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {authError && (
          <div className="mb-4 p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-rose-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Social OAuth Buttons */}
        <div className="space-y-2.5 mb-6">
          <button
            type="button"
            onClick={() => openOAuthModal('google')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => openOAuthModal('github')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-all shadow-sm"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative px-3 bg-[#121215] text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            or with credentials
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signin' ? (
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. alex or alex@domain.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Username (3-24 characters, lowercase)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. dev_sarah"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Developer Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="sarah@indiehq.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-zinc-400">Password</label>
              {mode === 'register' && (
                <span
                  className={`text-[10px] font-mono font-medium ${
                    passwordStrength.score >= 4
                      ? 'text-emerald-400'
                      : passwordStrength.score >= 3
                      ? 'text-amber-400'
                      : 'text-zinc-500'
                  }`}
                >
                  {passwordStrength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={
                  mode === 'register'
                    ? 'Min 10 chars, uppercase, digit, symbol'
                    : 'Enter your password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Interactive Strength Bar & Checklist for Registration */}
            {mode === 'register' && password.length > 0 && (
              <div className="mt-2.5 space-y-2">
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-full flex-1 transition-all duration-300 ${
                        passwordStrength.score >= lvl
                          ? passwordStrength.score >= 4
                            ? 'bg-emerald-500'
                            : passwordStrength.score >= 3
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.checks.length ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-zinc-600" />
                    )}
                    <span>10+ Characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.checks.uppercase ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-zinc-600" />
                    )}
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.checks.number ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-zinc-600" />
                    )}
                    <span>Number (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.checks.special ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-zinc-600" />
                    )}
                    <span>Special (!@#$)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              lockoutSeconds > 0 ||
              (mode === 'register' && !passwordStrength.isValid)
            }
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Verifying...'
                : mode === 'signin'
                ? 'Sign In to Dashboard'
                : 'Create DevSpend Account'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Demo Sandbox Button */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={handleDemoLaunch}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                  Launch Demo Sandbox
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Pre-populated with NexusAI & HyperNote
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              1-Click
            </span>
          </button>
        </div>
      </div>

      {/* Security Trust Footnote */}
      <div className="mt-8 text-center text-xs text-zinc-500 font-mono flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-emerald-500/70" />
        <span>PBKDF2 100k rounds • HMAC-SHA256 Token Signatures • Client-side Zero Leakage</span>
      </div>

      {/* OAuth Verified Profile Selector Modal */}
      <OAuthModal />
    </div>
  );
};
