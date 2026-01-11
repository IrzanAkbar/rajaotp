/**
 * RajaOTP Design System
 * Centralized design tokens and utilities for consistent branding
 */

// Color Palette
export const colors = {
  primary: {
    black: '#000000',
    white: '#ffffff',
  },
  accent: {
    gold: '#fbbf24',
    goldDark: '#d97706',
    goldLight: '#fcd34d',
  },
  neutral: {
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate700: '#334155',
    slate600: '#475569',
    slate400: '#94a3b8',
    slate300: '#cbd5e1',
  },
  semantic: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
} as const;

// Typography
export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

// Spacing Scale
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

// Border Radius
export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  goldGlow: '0 20px 40px rgba(251, 191, 36, 0.3)',
} as const;

// Animation Timings
export const animation = {
  duration: {
    fast: '150ms',
    base: '300ms',
    slow: '500ms',
    slower: '700ms',
  },
  easing: {
    linear: 'linear',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Component-specific styles
export const components = {
  button: {
    primary: 'px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors',
    secondary: 'px-8 py-3 bg-slate-800 text-yellow-400 font-bold rounded-lg border border-yellow-600/30 transition-colors hover:bg-slate-700',
  },
  card: {
    base: 'bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-yellow-600/50 transition-colors',
    elevated: 'bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all',
  },
  input: {
    base: 'w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500',
  },
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
} as const;

/**
 * Utility functions for common design patterns
 */
export const designUtils = {
  /**
   * Merge Tailwind classes with fallback
   */
  cn: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  },

  /**
   * Get responsive spacing based on screen size
   */
  getResponsiveSpacing: (mobile: string, tablet: string, desktop: string) => ({
    mobile,
    tablet,
    desktop,
  }),

  /**
   * Generate color with opacity
   */
  colorWithOpacity: (color: string, opacity: number) => {
    // For Tailwind: use /opacity notation
    const opacityPercent = Math.round(opacity * 100);
    return `${color}/${opacityPercent}`;
  },
};
