// ============================================================
// DevSpend — Top-Right 15-Theme Studio Switcher & Popover
// Floating Chameleon Engine Controller with Instant Hover Preview
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Sun,
  Moon,
  Zap,
  Flame,
  RotateCw,
  X,
} from 'lucide-react';
import {
  THEMES,
  ThemeCategory,
  ThemeId,
  applyThemeToDOM,
} from '../../config/themes';
import { useActiveTheme } from '../../hooks/useActiveTheme';
import PortalDropdown from '../ui/PortalDropdown';

interface TopRightThemeSwitcherProps {
  className?: string;
  buttonVariant?: 'header' | 'compact' | 'floating';
}

export const TopRightThemeSwitcher: React.FC<TopRightThemeSwitcherProps> = ({
  className = '',
}) => {
  const {
    activeTheme,
    activeThemeId,
    setTheme,
    gradientIntensity,
    setGradientIntensity,
    cardGlow,
    setCardGlow,
  } = useActiveTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ThemeCategory>('all');
  const [previewedThemeId, setPreviewedThemeId] = useState<ThemeId | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Category counts
  const darkCount = THEMES.filter((t) => t.category === 'dark-minimal').length;
  const neonCount = THEMES.filter((t) => t.category === 'vibrant-neon').length;
  const lightCount = THEMES.filter((t) => t.category === 'light-editorial').length;

  const filteredThemes = THEMES.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  // Clean close handler that reverts any un-applied hover preview
  const handleClose = useCallback(() => {
    if (previewedThemeId) {
      applyThemeToDOM(activeThemeId, gradientIntensity, cardGlow);
      setPreviewedThemeId(null);
    }
    setIsOpen(false);
  }, [previewedThemeId, activeThemeId, gradientIntensity, cardGlow]);

  // Cycle to next theme sequentially
  const handleCycleNextTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.id === activeThemeId);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];
    setPreviewedThemeId(null);
    setTheme(nextTheme.id);
  };

  // Keyboard shortcut listener: Shift + T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form inputs
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live hover preview handler
  const handleThemeHover = (themeId: ThemeId) => {
    if (themeId !== activeThemeId) {
      setPreviewedThemeId(themeId);
      applyThemeToDOM(themeId, gradientIntensity, cardGlow);
    }
  };

  const handleThemeHoverLeave = () => {
    if (previewedThemeId) {
      setPreviewedThemeId(null);
      applyThemeToDOM(activeThemeId, gradientIntensity, cardGlow);
    }
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    setPreviewedThemeId(null);
    setTheme(themeId);
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {/* ── Top-Right Trigger Button ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className="group flex items-center gap-1.5 h-8 lg:h-9 px-2 lg:px-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/70 hover:border-zinc-600 text-xs font-medium text-zinc-200 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
        title="Open 15-Theme Chameleon Studio (Shift+T)"
        style={{
          boxShadow: isOpen ? `0 0 14px ${activeTheme.colors.accentGlow}` : undefined,
          borderColor: isOpen ? activeTheme.colors.accentPrimary : undefined,
        }}
      >
        {/* Dynamic Sparkles / Palette icon */}
        <span
          className="p-1 rounded-lg transition-transform group-hover:rotate-12"
          style={{
            backgroundColor: `${activeTheme.colors.accentPrimary}25`,
            color: activeTheme.colors.accentPrimary,
          }}
        >
          <Palette size={13} />
        </span>

        {/* Mini 2-Dot Swatch (Canvas + Accent) */}
        <div className="flex items-center -space-x-1 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
            style={{ backgroundColor: activeTheme.colors.canvas }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
            style={{ backgroundColor: activeTheme.colors.accentPrimary }}
          />
        </div>

        {/* Current Theme Name */}
        <span className="font-semibold tracking-tight truncate max-w-[100px] hidden 2xl:inline text-zinc-100">
          {activeTheme.name}
        </span>

        {/* Keyboard shortcut pill */}
        <kbd className="hidden 2xl:inline font-mono text-[9px] px-1 py-0.5 rounded bg-zinc-800/90 text-zinc-400 border border-zinc-700/80">
          ⇧T
        </kbd>
      </button>

      {/* ── Portal-Mounted 15-Theme Studio Popover / Mobile Bottom Sheet ── */}
      <PortalDropdown
        isOpen={isOpen}
        onClose={handleClose}
        triggerRef={triggerRef}
        align="right"
        offsetY={8}
        mobileBottomSheet
        backdropClassName="bg-black/40 backdrop-blur-[2px]"
        className="w-full sm:w-[480px] sm:max-w-[calc(100vw-16px)] rounded-t-3xl sm:rounded-2xl bg-[#121215]/98 backdrop-blur-2xl border border-zinc-700/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-top-2 duration-200 pb-[env(safe-area-inset-bottom)] sm:pb-0"
        style={{
          borderColor: activeTheme.colors.accentPrimary,
          boxShadow: `0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 25px ${activeTheme.colors.accentGlow}`,
        }}
      >
        <div className="w-12 h-1.5 rounded-full bg-zinc-600/50 mx-auto my-2.5 sm:hidden shrink-0" />

        {/* ── Header ── */}
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: activeTheme.colors.accentPrimary }}
            >
              <Sparkles size={14} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 font-sans">
                <span>Theme Studio</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  15 Themes
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                Hover to preview instant live re-coloring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 1-Click Cycle Button */}
            <button
              type="button"
              onClick={handleCycleNextTheme}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[10px] font-medium text-zinc-300 transition-colors cursor-pointer"
              title="Cycle to next theme"
            >
              <RotateCw size={11} className="text-emerald-400" />
              <span>Cycle</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Category Filter Tabs ── */}
        <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0">
          <div className="flex items-center gap-1 p-0.5 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium text-center transition-all ${
                selectedCategory === 'all'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All (15)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('dark-minimal')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium text-center transition-all flex items-center justify-center gap-1 ${
                selectedCategory === 'dark-minimal'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Moon size={11} className="text-indigo-400" />
              <span>Dark ({darkCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('vibrant-neon')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium text-center transition-all flex items-center justify-center gap-1 ${
                selectedCategory === 'vibrant-neon'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap size={11} className="text-pink-400" />
              <span>Neon ({neonCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('light-editorial')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium text-center transition-all flex items-center justify-center gap-1 ${
                selectedCategory === 'light-editorial'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sun size={11} className="text-amber-400" />
              <span>Light ({lightCount})</span>
            </button>
          </div>
        </div>

        {/* ── 15-Theme Interactive Swatch Grid (Scrollable) ── */}
        <div className="p-3 overflow-y-auto max-h-[360px] space-y-2 flex-1 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredThemes.map((theme) => {
              const isActive = theme.id === activeThemeId;
              const isPreview = theme.id === previewedThemeId;

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  onMouseEnter={() => handleThemeHover(theme.id)}
                  onMouseLeave={handleThemeHoverLeave}
                  className={`relative p-2.5 rounded-xl border cursor-pointer transition-all duration-150 text-left flex flex-col justify-between ${
                    isActive
                      ? 'ring-2 shadow-md'
                      : isPreview
                      ? 'ring-1 scale-[1.01]'
                      : 'hover:border-zinc-600 hover:scale-[1.01]'
                  }`}
                  style={{
                    backgroundColor: theme.colors.surface1,
                    borderColor: isActive
                      ? theme.colors.accentPrimary
                      : isPreview
                      ? theme.colors.accentSecondary
                      : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isActive
                      ? `0 0 14px ${theme.colors.accentGlow}`
                      : undefined,
                  }}
                >
                  {/* Top Accent Gradient Bar */}
                  <div
                    className="h-1 w-full rounded-full mb-2"
                    style={{ background: theme.colors.accentGradient }}
                  />

                  {/* Theme Name, Tagline & Active Checkmark */}
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="truncate">
                      <h4
                        className="text-xs font-bold font-mono tracking-tight truncate"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        {theme.name}
                      </h4>
                      <p
                        className="text-[10px] leading-tight truncate"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {theme.tagline}
                      </p>
                    </div>

                    {isActive && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: theme.colors.accentPrimary }}
                      >
                        <Check size={10} className="stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* 4 Color Swatches + Dark/Light Pill */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner"
                        style={{ backgroundColor: theme.swatches.canvas }}
                        title={`Canvas: ${theme.swatches.canvas}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner"
                        style={{ backgroundColor: theme.swatches.surface }}
                        title={`Surface: ${theme.swatches.surface}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner"
                        style={{ backgroundColor: theme.swatches.accent }}
                        title={`Accent: ${theme.swatches.accent}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner"
                        style={{ backgroundColor: theme.swatches.text }}
                        title={`Text: ${theme.swatches.text}`}
                      />
                    </div>

                    <span
                      className="text-[9px] font-mono px-1 py-0.2 rounded border uppercase font-semibold"
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
        </div>

        {/* ── Popover Footer: Gradient & Glow Toggles ── */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1">
              <Sparkles size={12} className="text-violet-400" />
              Mesh Gradient:
            </span>
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 font-mono text-[10px]">
              {(['subtle', 'vibrant', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGradientIntensity(mode)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                    gradientIntensity === mode
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1">
              <Flame size={12} className="text-pink-400" />
              Card Halo Glow:
            </span>
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 font-mono text-[10px]">
              {(['subtle', 'vibrant', 'none'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCardGlow(mode)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                    cardGlow === mode
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PortalDropdown>
    </div>
  );
};

export default TopRightThemeSwitcher;
