// ============================================================
// DevSpend — AI Engine & Free API Key Configuration Modal
// Integrated into AI FinOps Auditor header
// ============================================================

import React, { useState } from 'react';
import {
  Cpu,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  X,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useSpendStore } from '../../store/useSpendStore';
import { testApiConnection } from '../../services/aiService';
import { AiProvider } from '../../types';

interface ConfigureAiModalProps {
  open: boolean;
  onClose: () => void;
}

export const ConfigureAiModal: React.FC<ConfigureAiModalProps> = ({ open, onClose }) => {
  const { settings, updateSettings } = useSpendStore();

  const [provider, setProvider] = useState<AiProvider>(settings.activeProvider);
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [groqKey, setGroqKey] = useState(settings.groqApiKey || '');
  const [openrouterKey, setOpenrouterKey] = useState(settings.openrouterApiKey || '');

  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  if (!open) return null;

  const handleTestKey = async () => {
    const keyToTest =
      provider === 'gemini' ? geminiKey : provider === 'groq' ? groqKey : openrouterKey;

    if (!keyToTest) {
      setTestStatus({ testing: false, success: false, message: 'Please enter an API key first.' });
      return;
    }

    setTestStatus({ testing: true });
    const result = await testApiConnection(provider, keyToTest);
    setTestStatus({ testing: false, success: result.success, message: result.message });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      activeProvider: provider,
      geminiApiKey: geminiKey.trim(),
      groqApiKey: groqKey.trim(),
      openrouterApiKey: openrouterKey.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[75vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="w-12 h-1.5 rounded-full bg-zinc-600/50 mx-auto my-2.5 sm:hidden shrink-0" />
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Cpu size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Configure AI FinOps Engine & API Keys
              </h3>
              <p className="text-[11px] text-zinc-400">
                Stored purely in local browser storage. Never sent to any telemetry server.
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

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Provider Selection Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Select AI Inference Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'deterministic',
                  name: 'Deterministic (Offline)',
                  desc: 'Zero API keys needed, heuristic rule engine',
                },
                {
                  id: 'gemini',
                  name: 'Google Gemini',
                  desc: 'gemini-2.0-flash (Free Tier available)',
                },
                {
                  id: 'groq',
                  name: 'Groq Cloud',
                  desc: 'llama-3.3-70b-versatile ultra-fast inference',
                },
                {
                  id: 'openrouter',
                  name: 'OpenRouter',
                  desc: 'Multi-model API gateway with free endpoints',
                },
              ].map((prov) => (
                <label
                  key={prov.id}
                  onClick={() => {
                    setProvider(prov.id as AiProvider);
                    setTestStatus({ testing: false });
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    provider === prov.id
                      ? 'border-violet-500/80 bg-violet-500/10 text-zinc-100 ring-1 ring-violet-500/30'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="aiProvider"
                      checked={provider === prov.id}
                      onChange={() => {}}
                      className="accent-violet-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold">{prov.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1 pl-5">
                    {prov.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Key Input Section */}
          {provider !== 'deterministic' && (
            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-200 font-medium">
                  {provider === 'gemini'
                    ? 'Google Gemini API Key'
                    : provider === 'groq'
                    ? 'Groq Cloud API Key'
                    : 'OpenRouter API Key'}
                </label>
                <a
                  href={
                    provider === 'gemini'
                      ? 'https://aistudio.google.com/app/apikey'
                      : provider === 'groq'
                      ? 'https://console.groq.com/keys'
                      : 'https://openrouter.ai/keys'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400 hover:underline text-[11px] flex items-center gap-1 font-mono"
                >
                  <span>Get Free Key</span>
                  <ExternalLink size={10} />
                </a>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={
                      provider === 'gemini'
                        ? geminiKey
                        : provider === 'groq'
                        ? groqKey
                        : openrouterKey
                    }
                    onChange={(e) => {
                      if (provider === 'gemini') setGeminiKey(e.target.value);
                      else if (provider === 'groq') setGroqKey(e.target.value);
                      else setOpenrouterKey(e.target.value);
                    }}
                    placeholder={provider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                    className="input pr-10 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testStatus.testing}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 transition-colors shrink-0 cursor-pointer"
                >
                  {testStatus.testing ? 'Testing...' : 'Test Key'}
                </button>
              </div>

              {/* Test feedback */}
              {testStatus.message && (
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    testStatus.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testStatus.success ? (
                    <Check size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-1.5 px-4 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check size={13} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save AI Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigureAiModal;
