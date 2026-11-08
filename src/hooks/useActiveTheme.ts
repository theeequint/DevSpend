// ============================================================
// DevSpend — useActiveTheme Hook
// Dynamic Theme Binding for UI & Recharts Data Visualizations
// ============================================================

import { useMemo } from 'react';
import { useSpendStore } from '../store/useSpendStore';
import {
  THEMES,
  THEMES_MAP,
  DEFAULT_THEME_ID,
  ThemeDefinition,
  ThemeId,
  applyThemeToDOM,
} from '../config/themes';

export function useActiveTheme() {
  const { settings, updateSettings } = useSpendStore();

  const activeThemeId = (settings.activeTheme as ThemeId) || DEFAULT_THEME_ID;
  const activeTheme: ThemeDefinition = useMemo(
    () => THEMES_MAP[activeThemeId] || THEMES_MAP[DEFAULT_THEME_ID],
    [activeThemeId]
  );

  const gradientIntensity = settings.gradientIntensity || 'subtle';
  const cardGlow = settings.cardGlow || 'subtle';

  const setTheme = (themeId: ThemeId) => {
    const targetTheme = THEMES_MAP[themeId] || THEMES_MAP[DEFAULT_THEME_ID];
    updateSettings({
      activeTheme: themeId,
      darkMode: targetTheme.isDark,
    });
    try {
      localStorage.setItem('devspend_active_theme', themeId);
    } catch {
      //
    }
    applyThemeToDOM(themeId, gradientIntensity, cardGlow);
  };

  const setGradientIntensity = (intensity: 'subtle' | 'vibrant' | 'off') => {
    updateSettings({ gradientIntensity: intensity });
    applyThemeToDOM(activeThemeId, intensity, cardGlow);
  };

  const setCardGlow = (glow: 'subtle' | 'vibrant' | 'none') => {
    updateSettings({ cardGlow: glow });
    applyThemeToDOM(activeThemeId, gradientIntensity, glow);
  };

  return {
    activeTheme,
    activeThemeId,
    chartColors: activeTheme.chartColors,
    isDark: activeTheme.isDark,
    allThemes: THEMES,
    setTheme,
    gradientIntensity,
    setGradientIntensity,
    cardGlow,
    setCardGlow,
  };
}

export default useActiveTheme;
