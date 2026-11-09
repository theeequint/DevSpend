// ============================================================
// DevSpend — Cryptographic Authentication Gateway
// Strict Username + Password ONLY • GitHub-Backed Shards
// Linear / Vercel obsidian aesthetic, zero client-side bypasses
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Play,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { checkPasswordStrength } from '../../utils/security';
import TopRightThemeSwitcher from '../layout/TopRightThemeSwitcher';
import AndroidApkDownloadButton from '../layout/AndroidApkDownloadButton';

export const AuthGateway: React.FC = () => {
  const {
    login,
    register,
    loginDemo,
    authError,
    clearError,
    lockoutSeconds,
    setLockoutSeconds,
    shardSyncStatus,
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await login(username, password);
      } else {
        if (!passwordsMatch) {
          useAuthStore.setState({ authError: 'Passwords do not match. Please re-enter.' });
          return;
        }
        await register(username, password, confirmPassword);
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
      {/* Pinned Top-Right Theme Studio Switcher & Android APK Download */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <AndroidApkDownloadButton />
        <TopRightThemeSwitcher />
      </div>
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur-md mb-4 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono tracking-tight text-zinc-300">
            DevSpend Intelligence v2.1
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {shardSyncStatus === 'synced' ? 'GitHub Shards Online' : 'Local Fallback'}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 mb-2">
          Financial Clarity for Developers
        </h1>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          Unit economics, cloud burn monitoring, and AI-driven cost reduction with GitHub-backed user isolation.
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

        {/* Lockout countdown banner */}
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
              className="text-rose-400 hover:text-rose-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Credentials Form (Username + Password ONLY) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">
              Username {mode === 'register' && '(3–24 chars, lowercase)'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={mode === 'signin' ? 'Enter your username' : 'e.g. dev_alex'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password Input */}
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
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

          {/* Confirm Password Input (Registration Mode Only) */}
          {mode === 'register' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-zinc-400">Confirm Password</label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[10px] font-mono flex items-center gap-1 ${
                      passwordsMatch ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Passwords match
                      </>
                    ) : (
                      'Passwords do not match'
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-9 pr-10 py-2.5 bg-zinc-950/70 border rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors font-mono ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500/70 focus:border-emerald-500'
                        : 'border-rose-500/70 focus:border-rose-500'
                      : 'border-zinc-800 focus:border-emerald-500'
                  }`}
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              lockoutSeconds > 0 ||
              (mode === 'register' && (!passwordStrength.isValid || !passwordsMatch))
            }
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? mode === 'signin'
                  ? 'Verifying with Shard Database...'
                  : 'Registering & Appending Shard...'
                : mode === 'signin'
                ? 'Sign In with Password'
                : 'Create Account & Commit to Shard'}
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
            className="w-full py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                  Launch Pre-Populated Demo Sandbox
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Instant Access • User demo_dev • NexusAI & HyperNote
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Instant
            </span>
          </button>
        </div>
      </div>

      {/* Sharded Database Architecture Trust Footnote */}
      <div className="mt-8 text-center text-xs text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 text-emerald-400/90">
          <Database className="w-3.5 h-3.5" />
          <span>GitHub-Backed Sharded DB (`PublicUsersData/`)</span>
        </div>
        <span className="hidden sm:inline">•</span>
        <span>Max 200 Users/Shard</span>
        <span className="hidden sm:inline">•</span>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-zinc-400" />
          <span>PBKDF2 100k + HMAC-SHA256</span>
        </div>
      </div>
    </div>
  );
};
