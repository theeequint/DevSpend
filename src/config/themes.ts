// ============================================================
// DevSpend — Dynamic Multi-Theme Chameleon Engine Registry
// 15 Curated Developer, FinOps & Editorial Themes
// ============================================================

export type ThemeCategory = 'dark-minimal' | 'vibrant-neon' | 'light-editorial';

export type ThemeId =
  | 'obsidian-linear'
  | 'midnight-cyberpunk'
  | 'emerald-matrix'
  | 'tokyo-night'
  | 'dracula-pro'
  | 'catppuccin-mocha'
  | 'nord-arctic'
  | 'crimson-velvet'
  | 'solarized-gold'
  | 'synthwave-84'
  | 'cobalt-ocean'
  | 'monokai-spectrum'
  | 'vercel-daylight'
  | 'solarized-paper'
  | 'arctic-frost-light';

export interface ThemeColors {
  canvas: string;
  heroGradient: string;
  surface1: string;
  surface2: string;
  glass: string;
  borderSubtle: string;
  borderFocus: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGradient: string;
  accentGlow: string;
  statusSuccess: string;
  statusWarning: string;
  statusDanger: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  category: ThemeCategory;
  isDark: boolean;
  colors: ThemeColors;
  chartColors: string[];
  swatches: {
    canvas: string;
    surface: string;
    accent: string;
    text: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  // ── 1. Obsidian Linear (Default Dark) ─────────────────────────
  {
    id: 'obsidian-linear',
    name: 'Obsidian Linear',
    tagline: 'Deep carbon canvas with crisp indigo-violet gradients',
    category: 'dark-minimal',
    isDark: true,
    colors: {
      canvas: '#09090B',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent 70%)',
      surface1: '#121215',
      surface2: '#18181C',
      glass: 'rgba(18, 18, 21, 0.75)',
      borderSubtle: 'rgba(63, 63, 70, 0.5)',
      borderFocus: '#6366F1',
      textPrimary: '#F4F4F5',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      accentPrimary: '#6366F1',
      accentSecondary: '#8B5CF6',
      accentGradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      accentGlow: 'rgba(99, 102, 241, 0.35)',
      statusSuccess: '#10B981',
      statusWarning: '#F59E0B',
      statusDanger: '#F43F5E',
    },
    chartColors: ['#6366F1', '#8B5CF6', '#10B981', '#38BDF8', '#F59E0B'],
    swatches: {
      canvas: '#09090B',
      surface: '#121215',
      accent: '#6366F1',
      text: '#F4F4F5',
    },
  },

  // ── 2. Midnight Cyberpunk ────────────────────────────────────
  {
    id: 'midnight-cyberpunk',
    name: 'Cyberpunk Neon',
    tagline: 'Void navy canvas with electric magenta and cyan highlights',
    category: 'vibrant-neon',
    isDark: true,
    colors: {
      canvas: '#070710',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(236, 72, 153, 0.2), rgba(6, 182, 212, 0.12) 60%, transparent 80%)',
      surface1: '#0D0E1A',
      surface2: '#151728',
      glass: 'rgba(13, 14, 26, 0.8)',
      borderSubtle: 'rgba(6, 182, 212, 0.28)',
      borderFocus: '#06B6D4',
      textPrimary: '#E0F2FE',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      accentPrimary: '#EC4899',
      accentSecondary: '#06B6D4',
      accentGradient: 'linear-gradient(135deg, #EC4899, #06B6D4)',
      accentGlow: 'rgba(236, 72, 153, 0.45)',
      statusSuccess: '#00F5D4',
      statusWarning: '#FEE440',
      statusDanger: '#FF0054',
    },
    chartColors: ['#EC4899', '#06B6D4', '#00F5D4', '#A855F7', '#FEE440'],
    swatches: {
      canvas: '#070710',
      surface: '#0D0E1A',
      accent: '#EC4899',
      text: '#E0F2FE',
    },
  },

  // ── 3. Emerald Matrix ────────────────────────────────────────
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    tagline: 'Bloomberg/Matrix phosphor terminal with mint monospace accents',
    category: 'dark-minimal',
    isDark: true,
    colors: {
      canvas: '#040D08',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.22), transparent 70%)',
      surface1: '#08170F',
      surface2: '#0E2419',
      glass: 'rgba(8, 23, 15, 0.8)',
      borderSubtle: 'rgba(16, 185, 129, 0.28)',
      borderFocus: '#10B981',
      textPrimary: '#ECFDF5',
      textSecondary: '#6EE7B7',
      textMuted: '#34D399',
      accentPrimary: '#10B981',
      accentSecondary: '#84CC16',
      accentGradient: 'linear-gradient(135deg, #10B981, #84CC16)',
      accentGlow: 'rgba(16, 185, 129, 0.4)',
      statusSuccess: '#10B981',
      statusWarning: '#EAB308',
      statusDanger: '#EF4444',
    },
    chartColors: ['#10B981', '#84CC16', '#06B6D4', '#14B8A6', '#A3E635'],
    swatches: {
      canvas: '#040D08',
      surface: '#08170F',
      accent: '#10B981',
      text: '#ECFDF5',
    },
  },

  // ── 4. Tokyo Night Storm ─────────────────────────────────────
  {
    id: 'tokyo-night',
    name: 'Tokyo Night Storm',
    tagline: 'Iconic VS Code storm blue canvas with calming lavender accents',
    category: 'dark-minimal',
    isDark: true,
    colors: {
      canvas: '#1A1B26',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(122, 162, 247, 0.18), transparent 70%)',
      surface1: '#24283B',
      surface2: '#2F354F',
      glass: 'rgba(36, 40, 59, 0.8)',
      borderSubtle: 'rgba(122, 162, 247, 0.22)',
      borderFocus: '#7AA2F7',
      textPrimary: '#C0CAF5',
      textSecondary: '#9AA5CE',
      textMuted: '#565F89',
      accentPrimary: '#7AA2F7',
      accentSecondary: '#BB9AF7',
      accentGradient: 'linear-gradient(135deg, #7AA2F7, #BB9AF7)',
      accentGlow: 'rgba(122, 162, 247, 0.35)',
      statusSuccess: '#9ECE6A',
      statusWarning: '#E0AF68',
      statusDanger: '#F7768E',
    },
    chartColors: ['#7AA2F7', '#BB9AF7', '#7DCFFF', '#9ECE6A', '#E0AF68'],
    swatches: {
      canvas: '#1A1B26',
      surface: '#24283B',
      accent: '#7AA2F7',
      text: '#C0CAF5',
    },
  },

  // ── 5. Dracula Pro ───────────────────────────────────────────
  {
    id: 'dracula-pro',
    name: 'Dracula Vampire',
    tagline: 'Gothic purple-slate canvas with neon pink and lilac highlights',
    category: 'vibrant-neon',
    isDark: true,
    colors: {
      canvas: '#282A36',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(189, 147, 249, 0.22), transparent 70%)',
      surface1: '#1E1F29',
      surface2: '#343746',
      glass: 'rgba(30, 31, 41, 0.8)',
      borderSubtle: 'rgba(98, 114, 164, 0.35)',
      borderFocus: '#BD93F9',
      textPrimary: '#F8F8F2',
      textSecondary: '#BFBFB2',
      textMuted: '#6272A4',
      accentPrimary: '#FF79C6',
      accentSecondary: '#BD93F9',
      accentGradient: 'linear-gradient(135deg, #FF79C6, #BD93F9)',
      accentGlow: 'rgba(255, 121, 198, 0.38)',
      statusSuccess: '#50FA7B',
      statusWarning: '#F1FA8C',
      statusDanger: '#FF5555',
    },
    chartColors: ['#BD93F9', '#FF79C6', '#8BE9FD', '#50FA7B', '#F1FA8C'],
    swatches: {
      canvas: '#282A36',
      surface: '#1E1F29',
      accent: '#FF79C6',
      text: '#F8F8F2',
    },
  },

  // ── 6. Catppuccin Mocha ──────────────────────────────────────
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    tagline: 'Warm cozy dark canvas with pastel mauve and peach accents',
    category: 'dark-minimal',
    isDark: true,
    colors: {
      canvas: '#1E1E2E',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(203, 166, 247, 0.18), transparent 70%)',
      surface1: '#181825',
      surface2: '#313244',
      glass: 'rgba(24, 24, 37, 0.8)',
      borderSubtle: 'rgba(88, 91, 112, 0.4)',
      borderFocus: '#CBA6F7',
      textPrimary: '#CDD6F4',
      textSecondary: '#BAC2DE',
      textMuted: '#7F849C',
      accentPrimary: '#CBA6F7',
      accentSecondary: '#FAB387',
      accentGradient: 'linear-gradient(135deg, #CBA6F7, #FAB387)',
      accentGlow: 'rgba(203, 166, 247, 0.35)',
      statusSuccess: '#A6E3A1',
      statusWarning: '#F9E2AF',
      statusDanger: '#F38BA8',
    },
    chartColors: ['#CBA6F7', '#FAB387', '#89B4FA', '#A6E3A1', '#F9E2AF'],
    swatches: {
      canvas: '#1E1E2E',
      surface: '#181825',
      accent: '#CBA6F7',
      text: '#CDD6F4',
    },
  },

  // ── 7. Nord Polar Frost ──────────────────────────────────────
  {
    id: 'nord-arctic',
    name: 'Nord Polar Frost',
    tagline: 'Arctic slate canvas with glacier frost and aurora blues',
    category: 'dark-minimal',
    isDark: true,
    colors: {
      canvas: '#2E3440',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(136, 192, 208, 0.2), transparent 70%)',
      surface1: '#3B4252',
      surface2: '#434C5E',
      glass: 'rgba(59, 66, 82, 0.8)',
      borderSubtle: 'rgba(76, 86, 106, 0.5)',
      borderFocus: '#88C0D0',
      textPrimary: '#ECEFF4',
      textSecondary: '#E5E9F0',
      textMuted: '#D8DEE9',
      accentPrimary: '#88C0D0',
      accentSecondary: '#5E81AC',
      accentGradient: 'linear-gradient(135deg, #88C0D0, #5E81AC)',
      accentGlow: 'rgba(136, 192, 208, 0.35)',
      statusSuccess: '#A3BE8C',
      statusWarning: '#EBCB8B',
      statusDanger: '#BF616A',
    },
    chartColors: ['#88C0D0', '#81A1C1', '#5E81AC', '#A3BE8C', '#EBCB8B'],
    swatches: {
      canvas: '#2E3440',
      surface: '#3B4252',
      accent: '#88C0D0',
      text: '#ECEFF4',
    },
  },

  // ── 8. Crimson Velvet ────────────────────────────────────────
  {
    id: 'crimson-velvet',
    name: 'Crimson Sith',
    tagline: 'Blood-obsidian canvas with fiery crimson and amber-orange glow',
    category: 'vibrant-neon',
    isDark: true,
    colors: {
      canvas: '#0F0507',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(244, 63, 94, 0.25), transparent 70%)',
      surface1: '#1A0A0E',
      surface2: '#261016',
      glass: 'rgba(26, 10, 14, 0.85)',
      borderSubtle: 'rgba(244, 63, 94, 0.28)',
      borderFocus: '#F43F5E',
      textPrimary: '#FFE4E6',
      textSecondary: '#FDA4AF',
      textMuted: '#9F1239',
      accentPrimary: '#F43F5E',
      accentSecondary: '#F97316',
      accentGradient: 'linear-gradient(135deg, #F43F5E, #F97316)',
      accentGlow: 'rgba(244, 63, 94, 0.45)',
      statusSuccess: '#10B981',
      statusWarning: '#FB923C',
      statusDanger: '#E11D48',
    },
    chartColors: ['#F43F5E', '#F97316', '#FB7185', '#E11D48', '#FDA4AF'],
    swatches: {
      canvas: '#0F0507',
      surface: '#1A0A0E',
      accent: '#F43F5E',
      text: '#FFE4E6',
    },
  },

  // ── 9. Wall Street Sovereign Gold ────────────────────────────
  {
    id: 'solarized-gold',
    name: 'Sovereign Gold',
    tagline: 'Luxury charcoal canvas with champagne gold and amber bullion',
    category: 'vibrant-neon',
    isDark: true,
    colors: {
      canvas: '#0C0B08',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(234, 179, 8, 0.22), transparent 70%)',
      surface1: '#171510',
      surface2: '#242118',
      glass: 'rgba(23, 21, 16, 0.8)',
      borderSubtle: 'rgba(234, 179, 8, 0.28)',
      borderFocus: '#EAB308',
      textPrimary: '#FEF9C3',
      textSecondary: '#FDE047',
      textMuted: '#A16207',
      accentPrimary: '#EAB308',
      accentSecondary: '#F59E0B',
      accentGradient: 'linear-gradient(135deg, #EAB308, #F59E0B)',
      accentGlow: 'rgba(234, 179, 8, 0.4)',
      statusSuccess: '#22C55E',
      statusWarning: '#FBBF24',
      statusDanger: '#EF4444',
    },
    chartColors: ['#EAB308', '#F59E0B', '#FACC15', '#CA8A04', '#FEF08A'],
    swatches: {
      canvas: '#0C0B08',
      surface: '#171510',
      accent: '#EAB308',
      text: '#FEF9C3',
    },
  },

  // ── 10. Synthwave Sunset ─────────────────────────────────────
  {
    id: 'synthwave-84',
    name: 'Synthwave Sunset',
    tagline: 'Retro deep violet canvas with sunset coral and electric purple',
    category: 'vibrant-neon',
    isDark: true,
    colors: {
      canvas: '#191124',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 110, 127, 0.25), rgba(168, 85, 247, 0.16) 60%, transparent 80%)',
      surface1: '#231733',
      surface2: '#312147',
      glass: 'rgba(35, 23, 51, 0.8)',
      borderSubtle: 'rgba(255, 110, 127, 0.28)',
      borderFocus: '#FF6E7F',
      textPrimary: '#FCE7F3',
      textSecondary: '#F472B6',
      textMuted: '#9D4EDD',
      accentPrimary: '#FF6E7F',
      accentSecondary: '#A855F7',
      accentGradient: 'linear-gradient(135deg, #FF6E7F, #A855F7)',
      accentGlow: 'rgba(255, 110, 127, 0.45)',
      statusSuccess: '#00F5D4',
      statusWarning: '#FFE600',
      statusDanger: '#FF007F',
    },
    chartColors: ['#FF6E7F', '#A855F7', '#00F5D4', '#F472B6', '#FFE600'],
    swatches: {
      canvas: '#191124',
      surface: '#231733',
      accent: '#FF6E7F',
      text: '#FCE7F3',
    },
  },

  // ── 11. Cobalt Ocean Abyss ───────────────────────────────────
  {
    id: 'cobalt-ocean',
    name: 'Cobalt Ocean',
    tagline: 'Abyssal deep navy canvas with bioluminescent aqua and teal',
    category: 'dark-minimal',
    isDark: true,
    colors: {
      canvas: '#06101E',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 165, 233, 0.22), transparent 70%)',
      surface1: '#0D1B2E',
      surface2: '#152A47',
      glass: 'rgba(13, 27, 46, 0.8)',
      borderSubtle: 'rgba(14, 165, 233, 0.26)',
      borderFocus: '#0EA5E9',
      textPrimary: '#E0F2FE',
      textSecondary: '#7DD3FC',
      textMuted: '#0369A1',
      accentPrimary: '#0EA5E9',
      accentSecondary: '#14B8A6',
      accentGradient: 'linear-gradient(135deg, #0EA5E9, #14B8A6)',
      accentGlow: 'rgba(14, 165, 233, 0.38)',
      statusSuccess: '#10B981',
      statusWarning: '#F59E0B',
      statusDanger: '#EF4444',
    },
    chartColors: ['#0EA5E9', '#14B8A6', '#38BDF8', '#2DD4BF', '#0284C7'],
    swatches: {
      canvas: '#06101E',
      surface: '#0D1B2E',
      accent: '#0EA5E9',
      text: '#E0F2FE',
    },
  },

  // ── 12. Monokai Pro Spectrum ─────────────────────────────────
  {
    id: 'monokai-spectrum',
    name: 'Monokai Spectrum',
    tagline: 'Warm charcoal canvas with bright coral pink and golden yellow',
    category: 'vibrant-neon',
    isDark: true,
    colors: {
      canvas: '#221F22',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 216, 102, 0.2), transparent 70%)',
      surface1: '#2D2A2E',
      surface2: '#3E3B40',
      glass: 'rgba(45, 42, 46, 0.8)',
      borderSubtle: 'rgba(147, 146, 147, 0.32)',
      borderFocus: '#FFD866',
      textPrimary: '#FCFCFA',
      textSecondary: '#C1C0C0',
      textMuted: '#727072',
      accentPrimary: '#FFD866',
      accentSecondary: '#FF6188',
      accentGradient: 'linear-gradient(135deg, #FFD866, #FF6188)',
      accentGlow: 'rgba(255, 216, 102, 0.38)',
      statusSuccess: '#A9DC76',
      statusWarning: '#FC9867',
      statusDanger: '#FF6188',
    },
    chartColors: ['#FF6188', '#FFD866', '#78DCE8', '#A9DC76', '#AB9DF2'],
    swatches: {
      canvas: '#221F22',
      surface: '#2D2A2E',
      accent: '#FFD866',
      text: '#FCFCFA',
    },
  },

  // ── 13. Vercel Daylight (Light) ──────────────────────────────
  {
    id: 'vercel-daylight',
    name: 'Vercel Daylight',
    tagline: 'Pure alabaster light canvas with sharp high-contrast typography',
    category: 'light-editorial',
    isDark: false,
    colors: {
      canvas: '#FAFAFA',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 0, 0, 0.05), transparent 70%)',
      surface1: '#FFFFFF',
      surface2: '#F4F4F5',
      glass: 'rgba(255, 255, 255, 0.85)',
      borderSubtle: '#E4E4E7',
      borderFocus: '#18181B',
      textPrimary: '#09090B',
      textSecondary: '#52525B',
      textMuted: '#71717A',
      accentPrimary: '#18181B',
      accentSecondary: '#3F3F46',
      accentGradient: 'linear-gradient(135deg, #18181B, #3F3F46)',
      accentGlow: 'rgba(0, 0, 0, 0.15)',
      statusSuccess: '#059669',
      statusWarning: '#D97706',
      statusDanger: '#DC2626',
    },
    chartColors: ['#18181B', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
    swatches: {
      canvas: '#FAFAFA',
      surface: '#FFFFFF',
      accent: '#18181B',
      text: '#09090B',
    },
  },

  // ── 14. Solarized Paper (Light) ──────────────────────────────
  {
    id: 'solarized-paper',
    name: 'Editorial Parchment',
    tagline: 'Warm cream canvas with bronze-ochre and deep ink text (zero eye strain)',
    category: 'light-editorial',
    isDark: false,
    colors: {
      canvas: '#FDF6E3',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(181, 137, 0, 0.12), transparent 70%)',
      surface1: '#EEE8D5',
      surface2: '#E0D8C3',
      glass: 'rgba(238, 232, 213, 0.85)',
      borderSubtle: 'rgba(101, 123, 131, 0.28)',
      borderFocus: '#B58900',
      textPrimary: '#073642',
      textSecondary: '#586E75',
      textMuted: '#839496',
      accentPrimary: '#B58900',
      accentSecondary: '#CB4B16',
      accentGradient: 'linear-gradient(135deg, #B58900, #CB4B16)',
      accentGlow: 'rgba(181, 137, 0, 0.28)',
      statusSuccess: '#859900',
      statusWarning: '#B58900',
      statusDanger: '#DC322F',
    },
    chartColors: ['#B58900', '#CB4B16', '#268BD2', '#859900', '#6C71C4'],
    swatches: {
      canvas: '#FDF6E3',
      surface: '#EEE8D5',
      accent: '#B58900',
      text: '#073642',
    },
  },

  // ── 15. Arctic Frost Light ───────────────────────────────────
  {
    id: 'arctic-frost-light',
    name: 'Nordic Ice Glass',
    tagline: 'Cool ice-blue light canvas with royal cobalt and deep slate text',
    category: 'light-editorial',
    isDark: false,
    colors: {
      canvas: '#F0F4F8',
      heroGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.1), transparent 70%)',
      surface1: '#FFFFFF',
      surface2: '#E2E8F0',
      glass: 'rgba(255, 255, 255, 0.85)',
      borderSubtle: '#CBD5E1',
      borderFocus: '#2563EB',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      accentPrimary: '#2563EB',
      accentSecondary: '#4F46E5',
      accentGradient: 'linear-gradient(135deg, #2563EB, #4F46E5)',
      accentGlow: 'rgba(37, 99, 235, 0.25)',
      statusSuccess: '#059669',
      statusWarning: '#D97706',
      statusDanger: '#DC2626',
    },
    chartColors: ['#2563EB', '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B'],
    swatches: {
      canvas: '#F0F4F8',
      surface: '#FFFFFF',
      accent: '#2563EB',
      text: '#0F172A',
    },
  },
];

export const THEMES_MAP: Record<ThemeId, ThemeDefinition> = THEMES.reduce(
  (acc, theme) => {
    acc[theme.id] = theme;
    return acc;
  },
  {} as Record<ThemeId, ThemeDefinition>
);

export const DEFAULT_THEME_ID: ThemeId = 'obsidian-linear';

/**
 * Apply theme CSS variables and data-theme attribute directly to document.documentElement
 */
export function applyThemeToDOM(
  themeId: ThemeId,
  gradientIntensity: 'subtle' | 'vibrant' | 'off' = 'subtle',
  cardGlow: 'subtle' | 'vibrant' | 'none' = 'subtle'
): void {
  const theme = THEMES_MAP[themeId] || THEMES_MAP[DEFAULT_THEME_ID];
  const root = document.documentElement;

  root.setAttribute('data-theme', theme.id);

  // Dynamically synchronize mobile browser status bar theme color
  try {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.canvas);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = theme.colors.canvas;
      document.head.appendChild(meta);
    }
  } catch {}

  if (theme.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Adjust hero gradient based on intensity
  let heroGradient = theme.colors.heroGradient;
  if (gradientIntensity === 'off') {
    heroGradient = 'none';
  } else if (gradientIntensity === 'vibrant') {
    heroGradient = heroGradient.replace(/0\.\d+/g, (match) => {
      const num = parseFloat(match);
      return Math.min(0.65, num * 1.8).toFixed(2);
    });
  }

  // Adjust card glow
  let accentGlow = theme.colors.accentGlow;
  if (cardGlow === 'none') {
    accentGlow = 'none';
  } else if (cardGlow === 'vibrant') {
    accentGlow = accentGlow.replace(/0\.\d+/g, (match) => {
      const num = parseFloat(match);
      return Math.min(0.75, num * 1.6).toFixed(2);
    });
  }

  // Set CSS Variables
  root.style.setProperty('--bg-canvas', theme.colors.canvas);
  root.style.setProperty('--bg-hero-gradient', heroGradient);
  root.style.setProperty('--bg-surface-1', theme.colors.surface1);
  root.style.setProperty('--bg-surface-2', theme.colors.surface2);
  root.style.setProperty('--bg-glass', theme.colors.glass);
  root.style.setProperty('--border-subtle', theme.colors.borderSubtle);
  root.style.setProperty('--border-focus', theme.colors.borderFocus);
  root.style.setProperty('--text-primary', theme.colors.textPrimary);
  root.style.setProperty('--text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--text-muted', theme.colors.textMuted);
  root.style.setProperty('--accent-primary', theme.colors.accentPrimary);
  root.style.setProperty('--accent-secondary', theme.colors.accentSecondary);
  root.style.setProperty('--accent-gradient', theme.colors.accentGradient);
  root.style.setProperty('--accent-glow', accentGlow);
  root.style.setProperty('--status-success', theme.colors.statusSuccess);
  root.style.setProperty('--status-warning', theme.colors.statusWarning);
  root.style.setProperty('--status-danger', theme.colors.statusDanger);

  // Set Chart colors
  theme.chartColors.forEach((color, idx) => {
    root.style.setProperty(`--chart-${idx + 1}`, color);
  });
}
