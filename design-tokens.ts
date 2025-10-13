/**
 * Design Tokens - Lyrics Show
 * Centralized design system for consistent visual language
 */

export const designTokens = {
  // Color System
  colors: {
    // Primary Brand
    primary: {
      DEFAULT: '#E6007A',
      50: '#FFE5F3',
      100: '#FFB8E0',
      200: '#FF8ACD',
      300: '#FF5CBA',
      400: '#FF2EA7',
      500: '#E6007A',
      600: '#B80062',
      700: '#8A004A',
      800: '#5C0031',
      900: '#2E0019',
    },

    // Purple Scale
    purple: {
      DEFAULT: '#8B5CF6',
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
      950: '#2E1065',
    },

    // Background Scale
    background: {
      main: '#0F0F17',
      elevated: '#161622',
      surface: '#1E1E2E',
      hover: '#252535',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },

    // Text Scale
    text: {
      primary: '#FFFFFF',
      secondary: '#E2E8F0',
      muted: '#94A3B8',
      disabled: '#64748B',
      placeholder: '#475569',
    },

    // Status Colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // Semantic Colors
    border: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      heavy: 'rgba(139, 92, 246, 0.3)',
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      primary: '"DM Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      heading: '"Plus Jakarta Sans", "DM Sans", sans-serif',
      mono: '"Fira Code", "Roboto Mono", monospace',
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
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },

    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },

  // Spacing Scale (rem-based)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    DEFAULT: '0.5rem', // 8px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

    // Custom glows
    glow: {
      magenta: '0 0 20px rgba(230, 0, 122, 0.5), 0 0 40px rgba(230, 0, 122, 0.3)',
      purple: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
    },
  },

  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },

    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },

  // Glassmorphism Presets
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      blur: '12px',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      blur: '16px',
    },
    heavy: {
      background: 'rgba(0, 0, 0, 0.2)',
      border: 'rgba(139, 92, 246, 0.3)',
      blur: '20px',
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
