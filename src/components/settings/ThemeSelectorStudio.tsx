// ============================================================
// DevSpend — Appearance & Dynamic Theme Studio Component
// Interactive 15-Theme Chameleon Matrix with Live Swatches & Preview
// ============================================================

import React, { useState } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Sun,
  Moon,
  Layers,
  Sliders,
  Eye,
  Zap,
  Flame,
  Droplet,
  Compass,
} from 'lucide-react';
import {
  THEMES,
  ThemeCategory,
  ThemeDefinition,
  ThemeId,
  applyThemeToDOM,
} from '../../config/themes';
import { useActiveTheme } from '../../hooks/useActiveTheme';

export const ThemeSelectorStudio: React.FC = () => {
  const {
    activeTheme,
    activeThemeId,
    setTheme,
    gradientIntensity,
    setGradientIntensity,
    cardGlow,
    setCardGlow,
  } = useActiveTheme();

  const [selectedCategory, setSelectedCategory] = useState<'all' | ThemeCategory>('all');
  const [hoverPreviewEnabled, setHoverPreviewEnabled] = useState(false);
  const [previewedThemeId, setPreviewedThemeId] = useState<ThemeId | null>(null);

  // Category counts
  const darkCount = THEMES.filter((t) => t.category === 'dark-minimal').length;
  const neonCount = THEMES.filter((t) => t.category === 'vibrant-neon').length;
  const lightCount = THEMES.filter((t) => t.category === 'light-editorial').length;

  const filteredThemes = THEMES.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleMouseEnter = (theme: ThemeDefinition) => {
    if (hoverPreviewEnabled && theme.id !== activeThemeId) {
      setPreviewedThemeId(theme.id);
      applyThemeToDOM(theme.id, gradientIntensity, cardGlow);
    }
  };

  const handleMouseLeave = () => {
    if (hoverPreviewEnabled && previewedThemeId) {
      setPreviewedThemeId(null);
      applyThemeToDOM(activeThemeId, gradientIntensity, cardGlow);
    }
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    setPreviewedThemeId(null);
    setTheme(themeId);
  };

  return (
    <div className="card p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Palette size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-zinc-100">
                Appearance & Chameleon Theme Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">
                15 Dynamic Themes
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instantaneous real-time re-coloring of canvases, surfaces, typography, glows, and Recharts palettes.
            </p>
          </div>
        </div>

        {/* Live Active Theme Pill */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">Active:</span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: activeTheme.colors.accentPrimary }}
            />
            <span className="font-semibold text-zinc-200">{activeTheme.name}</span>
          </div>
        </div>
      </div>

      {/* ── Category Filter Pills & Live Hover Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Themes ({THEMES.length})
          </button>
          <button
            onClick={() => setSelectedCategory('dark-minimal')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              selectedCategory === 'dark-minimal'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Moon size={12} className="text-indigo-400" />
            Dark Minimal ({darkCount})
          </button>
          <button
            onClick={() => setSelectedCategory('vibrant-neon')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              selectedCategory === 'vibrant-neon'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap size={12} className="text-pink-400" />
            Vibrant & Neon ({neonCount})
          </button>
          <button
            onClick={() => setSelectedCategory('light-editorial')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              selectedCategory === 'light-editorial'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sun size={12} className="text-amber-400" />
            Light & Editorial ({lightCount})
          </button>
        </div>

        {/* Live Hover Preview Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          <input
            type="checkbox"
            checked={hoverPreviewEnabled}
            onChange={(e) => setHoverPreviewEnabled(e.target.checked)}
            className="rounded bg-zinc-950 border-zinc-800 text-violet-500 focus:ring-0 cursor-pointer"
          />
          <Eye size={13} />
          <span>Live Hover Preview</span>
        </label>
      </div>

      {/* ── 15-Theme Interactive Mini-Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {filteredThemes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          const isPreview = theme.id === previewedThemeId;

          return (
            <div
              key={theme.id}
              onClick={() => handleSelectTheme(theme.id)}
              onMouseEnter={() => handleMouseEnter(theme)}
              onMouseLeave={handleMouseLeave}
              className={`group relative rounded-xl p-3.5 cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-lg'
                  : isPreview
                  ? 'border-cyan-400 ring-1 ring-cyan-400/30 scale-[1.02]'
                  : 'border-zinc-800/80 hover:border-zinc-700 hover:scale-[1.01]'
              }`}
              style={{
                backgroundColor: theme.colors.surface1,
                boxShadow: isActive ? `0 0 18px ${theme.colors.accentGlow}` : undefined,
              }}
            >
              {/* Top Accent Gradient Bar */}
              <div
                className="h-1.5 w-full rounded-full mb-3"
                style={{ background: theme.colors.accentGradient }}
              />

              {/* Theme Name & Badge */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xs font-bold font-mono tracking-tight"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {theme.name}
                  </h3>
                  {isActive && (
                    <span
                      className="p-1 rounded-full text-white shadow-sm"
                      style={{ backgroundColor: theme.colors.accentPrimary }}
                      title="Currently Active"
                    >
                      <Check size={11} className="stroke-[3]" />
                    </span>
                  )}
                </div>
                <p
                  className="text-[11px] leading-tight line-clamp-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {theme.tagline}
                </p>
              </div>

              {/* 4 Color Swatches (Canvas, Surface, Accent, Text) */}
              <div className="mt-3.5 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: theme.swatches.canvas }}
                    title={`Canvas: ${theme.swatches.canvas}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: theme.swatches.surface }}
                    title={`Surface: ${theme.swatches.surface}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: theme.swatches.accent }}
                    title={`Accent: ${theme.swatches.accent}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: theme.swatches.text }}
                    title={`Text: ${theme.swatches.text}`}
                  />
                </div>

                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase"
                  style={{
                    backgroundColor: theme.colors.surface2,
                    color: theme.colors.textMuted,
                    borderColor: theme.colors.borderSubtle,
                  }}
                >
                  {theme.isDark ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Accent & UI Density Controls (Gradient Intensity & Glow) ── */}
      <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gradient Intensity */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-400" />
              Backdrop Mesh Gradient
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Radial top-center ambient lighting matching the theme accent.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
            {(['subtle', 'vibrant', 'off'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setGradientIntensity(mode)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                  gradientIntensity === mode
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Card Border Glow */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Flame size={14} className="text-pink-400" />
              Card Border Glow
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Soft thematic halo glow on cards, buttons, and hovered KPIs.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
            {(['subtle', 'vibrant', 'none'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCardGlow(mode)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                  cardGlow === mode
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectorStudio;
