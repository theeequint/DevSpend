// ============================================================
// DevSpend — GitHub Shard Sync & Token Config Popover/Modal
// Direct repository synchronization for PublicUsersData/
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Database,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  ShieldCheck,
  Save,
  Server,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  getGitHubToken,
  setGitHubToken,
  getShardManifest,
} from '../../services/userShardService';

interface GitHubSyncModalProps {
  open: boolean;
  onClose: () => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({ open, onClose }) => {
  const { shardSyncStatus, syncShards } = useAuthStore();

  const [githubToken, setGithubTokenState] = useState(getGitHubToken());
  const [showToken, setShowToken] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [activeShardName, setActiveShardName] = useState('users_shard_001.json');
  const [totalUsersCount, setTotalUsersCount] = useState(1);

  useEffect(() => {
    if (open) {
      setGithubTokenState(getGitHubToken());
      getShardManifest()
        .then((m) => {
          setActiveShardName(m.activeWriteShard);
          setTotalUsersCount(m.totalRegisteredUsers);
        })
        .catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    setGitHubToken(githubToken.trim());
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="w-12 h-1.5 rounded-full bg-zinc-600/50 mx-auto my-2.5 sm:hidden shrink-0" />
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                GitHub Sharded Database Pipeline
              </h3>
              <p className="text-[11px] text-zinc-400">
                Multi-tenant storage partitioned at 200 users per shard file.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Shard Stats Matrix */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                Sync Status
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    shardSyncStatus === 'syncing'
                      ? 'bg-amber-400 animate-pulse'
                      : shardSyncStatus === 'synced'
                      ? 'bg-emerald-400'
                      : 'bg-zinc-400'
                  }`}
                />
                <span className="text-xs font-bold text-zinc-100 uppercase">
                  {shardSyncStatus}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                Active Write Shard
              </span>
              <span className="text-xs font-bold text-emerald-400 block mt-1 truncate">
                {activeShardName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                Total Users
              </span>
              <span className="text-xs font-bold text-zinc-200 block mt-1">
                {totalUsersCount} / 200 ceiling
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono">
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                Repository
              </span>
              <span className="text-xs font-bold text-zinc-300 block mt-1 truncate">
                theeequint/DevSpend
              </span>
            </div>
          </div>

          {/* Sync Trigger Action */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-300 font-medium">Trigger Bi-directional Sync</span>
            <button
              type="button"
              onClick={() => syncShards()}
              disabled={shardSyncStatus === 'syncing'}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw
                size={12}
                className={shardSyncStatus === 'syncing' ? 'animate-spin text-amber-400' : 'text-emerald-400'}
              />
              <span>{shardSyncStatus === 'syncing' ? 'Syncing...' : 'Force Sync Now'}</span>
            </button>
          </div>

          {/* PAT Token Form */}
          <form onSubmit={handleSaveToken} className="pt-3 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-zinc-300 font-medium">
                GitHub Token (Auto-commit credentials)
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Scope: repo</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => setGithubTokenState(e.target.value)}
                  placeholder="ghp_..."
                  className="input pr-10 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary text-xs py-1.5 px-3 shrink-0 cursor-pointer flex items-center gap-1"
              >
                {tokenSaved ? (
                  <>
                    <Check size={13} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Allows the application to push updated user shards into <code className="text-zinc-400">PublicUsersData/</code> directly.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubSyncModal;
