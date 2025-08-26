/**
 * PrintMyRide Premium Design System
 * Elegant, gallery-inspired design language
 */

export const colors = {
  // Brand colors
  brand: {
    primary: '#0A0E27',    // Deep gallery blue
    secondary: '#FF6B35',  // Vibrant accent orange
    tertiary: '#4ECDC4',   // Teal highlight
    quaternary: '#F7FFF7', // Off-white
  },

  // Neutral palette
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Ride type colors
  rideTypes: {
    mountain: '#8B7355',
    urban: '#1A1A1A',
    trail: '#68A225',
    road: '#0066FF',
    gravel: '#D4A574',
  },
};

export const typography = {
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
  },

  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
  },

  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },

  lineHeights: {
    tight: 1.1,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.7,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
};

export const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

export const transitions = {
  duration: {
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  timing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideInUp: {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInDown: {
    from: { transform: 'translateY(-20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  bounce: {
    '0%, 100%': {
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
};

export const components = {
  button: {
    base: `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
    `,
    variants: {
      primary: `
        bg-brand-primary text-white
        hover:bg-opacity-90
        focus:ring-brand-primary
      `,
      secondary: `
        bg-brand-secondary text-white
        hover:bg-opacity-90
        focus:ring-brand-secondary
      `,
      outline: `
        border-2 border-current
        hover:bg-neutral-50
        focus:ring-current
      `,
      ghost: `
        hover:bg-neutral-100
        focus:ring-neutral-400
      `,
    },
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    },
  },

  card: {
    base: `
      bg-white rounded-xl shadow-md
      overflow-hidden
      transition-all duration-300
    `,
    hover: `
      hover:shadow-xl
      hover:transform hover:-translate-y-1
    `,
  },

  input: {
    base: `
      w-full px-4 py-2
      border border-neutral-300 rounded-lg
      focus:ring-2 focus:ring-brand-primary focus:border-transparent
      transition-all duration-200
    `,
    error: `
      border-red-500
      focus:ring-red-500
    `,
  },
};

// CSS-in-JS utilities
export const cssVar = (name: string): string => `var(--${name})`;

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Generate CSS custom properties
export const generateCSSVariables = (): string => {
  let css = ':root {\n';
  
  // Colors
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        css += `  --color-${category}-${key}: ${value};\n`;
      });
    }
  });
  
  // Typography
  Object.entries(typography.fonts).forEach(([key, value]) => {
    css += `  --font-${key}: ${value};\n`;
  });
  
  Object.entries(typography.sizes).forEach(([key, value]) => {
    css += `  --text-${key}: ${value};\n`;
  });
  
  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`;
  });
  
  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    css += `  --shadow-${key}: ${value};\n`;
  });
  
  css += '}\n';
  
  return css;
};

// Responsive utilities
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  '3xl': `@media (min-width: ${breakpoints['3xl']})`,
};

// Motion preferences
export const motionSafe = '@media (prefers-reduced-motion: no-preference)';
export const motionReduce = '@media (prefers-reduced-motion: reduce)';

// Dark mode utilities
export const darkMode = '@media (prefers-color-scheme: dark)';
export const lightMode = '@media (prefers-color-scheme: light)';

const designSystem = {
  colors,
  typography,
  spacing,
  breakpoints,
  shadows,
  borderRadius,
  transitions,
  animations,
  components,
  cssVar,
  hexToRgba,
  generateCSSVariables,
  media,
  motionSafe,
  motionReduce,
  darkMode,
  lightMode,
};

export default designSystem;