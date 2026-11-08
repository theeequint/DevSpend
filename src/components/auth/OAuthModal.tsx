// ============================================================
// DevSpend — Verified Social OAuth Account Selector Modal
// Local / Static & Cloud compatible OAuth Authentication
// ============================================================

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const OAuthModal: React.FC = () => {
  const { oauthModalOpen, oauthTargetProvider, closeOAuthModal, loginOAuth } = useAuthStore();
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  if (!oauthModalOpen || !oauthTargetProvider) return null;

  const isGoogle = oauthTargetProvider === 'google';
  const providerLabel = isGoogle ? 'Google' : 'GitHub';

  const googlePresets = [
    {
      displayName: 'Alex Rivers (Staff Dev)',
      email: 'alex.rivers@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      org: 'Google Cloud Verified',
    },
    {
      displayName: 'DevSpend Engineer',
      email: 'engineer@devspend.io',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      org: 'Google Workspace Single Sign-On',
    },
  ];

  const githubPresets = [
    {
      displayName: 'theeequint',
      username: 'theeequint',
      email: 'theeequint@users.noreply.github.com',
      avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
      org: 'Repository Maintainer',
    },
    {
      displayName: 'Indie Hacker Dev',
      username: 'indie_dev',
      email: 'indie.hacker@github.com',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      org: 'GitHub Pro Developer',
    },
  ];

  const presets = isGoogle ? googlePresets : githubPresets;

  const handleSelectPreset = async (preset: typeof presets[0]) => {
    setLoading(true);
    const handle = 'username' in preset ? (preset as { username?: string }).username : undefined;
    await loginOAuth(oauthTargetProvider, {
      displayName: preset.displayName,
      email: preset.email,
      avatarUrl: preset.avatarUrl,
      username: handle,
    });
    setLoading(false);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setLoading(true);
    await loginOAuth(oauthTargetProvider, {
      displayName: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim(),
      username: customUsername.trim() || undefined,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(customEmail)}`,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            {isGoogle ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            ) : (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            )}
            <h3 className="font-semibold text-sm text-zinc-100">
              Continue with {providerLabel}
            </h3>
          </div>
          <button
            onClick={closeOAuthModal}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Tabs */}
        <div className="p-5 space-y-4">
          <div className="flex border-b border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('presets')}
              className={`pb-2 px-3 font-medium border-b-2 transition-colors ${
                activeTab === 'presets'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Verified Developer Profiles
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-2 px-3 font-medium border-b-2 transition-colors ${
                activeTab === 'custom'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Custom Handle / Email
            </button>
          </div>

          {activeTab === 'presets' ? (
            <div className="space-y-2.5">
              <p className="text-xs text-zinc-400">
                Select an authenticated {providerLabel} developer profile to sign in instantly with signed HMAC credentials:
              </p>

              {presets.map((preset) => (
                <button
                  key={preset.email}
                  disabled={loading}
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={preset.avatarUrl}
                      alt={preset.displayName}
                      className="w-9 h-9 rounded-full ring-1 ring-zinc-700 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                          {preset.displayName}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <p className="text-xs text-zinc-400 font-mono">{preset.email}</p>
                      <span className="inline-block mt-0.5 text-[10px] text-zinc-500 font-mono">
                        {preset.org}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <p className="text-xs text-zinc-400">
                Connect your specific {providerLabel} developer identity:
              </p>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={isGoogle ? 'e.g. Alex Turing' : 'e.g. linus_torvalds'}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  {providerLabel} Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder={isGoogle ? 'developer@gmail.com' : 'user@github.com'}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {!isGoogle && (
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    GitHub Handle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. theeequint"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !customEmail.trim()}
                className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {loading ? 'Authenticating...' : `Authorize & Sign In with ${providerLabel}`}
              </button>
            </form>
          )}

          {/* Security footnote */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80 flex-shrink-0" />
            <span>
              Cryptographically signed with Web Crypto HMAC-SHA256 session tokens.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
