import { RideStyle } from '@/lib/types/ride';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  preview: string;
  style: RideStyle;
  tags: string[];
}

export const themePresets: ThemePreset[] = [
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Clean, modern design with plenty of white space',
    preview: '/themes/minimal.jpg',
    style: {
      theme: 'minimal',
      posterStyle: 'studio',
      colorScheme: {
        primary: '#000000',
        secondary: '#999999',
        accent: '#0066FF',
        background: '#FFFFFF',
        foreground: '#000000',
        route: '#000000'
      },
      typography: {
        titleFont: 'Helvetica Neue, sans-serif',
        subtitleFont: 'Helvetica Neue Light, sans-serif',
        metricsFont: 'SF Mono, monospace'
      },
      layout: {
        ratio: '2:3',
        orientation: 'portrait',
        margins: 120,
        padding: 80
      }
    },
    tags: ['modern', 'clean', 'professional']
  },
  {
    id: 'mountain',
    name: 'Mountain Trail',
    description: 'Earth tones perfect for trail and mountain rides',
    preview: '/themes/mountain.jpg',
    style: {
      theme: 'mountain',
      posterStyle: 'art-print',
      colorScheme: {
        primary: '#8B4513',
        secondary: '#D2691E',
        accent: '#FF8C00',
        background: '#FFF8DC',
        foreground: '#4B2F20',
        route: '#D2691E'
      },
      typography: {
        titleFont: 'Playfair Display, serif',
        subtitleFont: 'Lato, sans-serif',
        metricsFont: 'Roboto Mono, monospace'
      },
      layout: {
        ratio: '3:4',
        orientation: 'portrait',
        margins: 100,
        padding: 60
      }
    },
    tags: ['outdoor', 'natural', 'adventure']
  },
  {
    id: 'urban',
    name: 'Urban Explorer',
    description: 'Bold monochrome with neon accents for city rides',
    preview: '/themes/urban.jpg',
    style: {
      theme: 'urban',
      posterStyle: 'gallery',
      colorScheme: {
        primary: '#000000',
        secondary: '#333333',
        accent: '#00FF41',
        background: '#F5F5F5',
        foreground: '#000000',
        route: '#00FF41'
      },
      typography: {
        titleFont: 'Inter Black, sans-serif',
        subtitleFont: 'Inter, sans-serif',
        metricsFont: 'JetBrains Mono, monospace'
      },
      layout: {
        ratio: '2:3',
        orientation: 'portrait',
        margins: 80,
        padding: 40
      }
    },
    tags: ['city', 'modern', 'bold']
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Vibrant colors inspired by night rides',
    preview: '/themes/neon.jpg',
    style: {
      theme: 'neon',
      posterStyle: 'art-print',
      colorScheme: {
        primary: '#FF006E',
        secondary: '#FB5607',
        accent: '#FFBE0B',
        background: '#0A0E27',
        foreground: '#FFFFFF',
        route: '#00F5FF'
      },
      typography: {
        titleFont: 'Bebas Neue, sans-serif',
        subtitleFont: 'Montserrat, sans-serif',
        metricsFont: 'Orbitron, monospace'
      },
      layout: {
        ratio: '2:3',
        orientation: 'portrait',
        margins: 100,
        padding: 60
      }
    },
    tags: ['vibrant', 'night', 'electric']
  },
  {
    id: 'retro',
    name: 'Vintage Classic',
    description: 'Timeless design inspired by vintage cycling posters',
    preview: '/themes/retro.jpg',
    style: {
      theme: 'retro',
      posterStyle: 'classic',
      colorScheme: {
        primary: '#2F4858',
        secondary: '#86A873',
        accent: '#F28B50',
        background: '#F5E6D3',
        foreground: '#2F4858',
        route: '#F28B50'
      },
      typography: {
        titleFont: 'Baskerville, serif',
        subtitleFont: 'Futura, sans-serif',
        metricsFont: 'Courier New, monospace'
      },
      layout: {
        ratio: '3:4',
        orientation: 'portrait',
        margins: 120,
        padding: 80
      }
    },
    tags: ['vintage', 'classic', 'timeless']
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Raw, bold aesthetic with heavy typography',
    preview: '/themes/brutalist.jpg',
    style: {
      theme: 'brutalist',
      posterStyle: 'studio',
      colorScheme: {
        primary: '#000000',
        secondary: '#FF0000',
        accent: '#FFFF00',
        background: '#CCCCCC',
        foreground: '#000000',
        route: '#FF0000'
      },
      typography: {
        titleFont: 'Impact, sans-serif',
        subtitleFont: 'Arial Black, sans-serif',
        metricsFont: 'Consolas, monospace'
      },
      layout: {
        ratio: '2:3',
        orientation: 'portrait',
        margins: 60,
        padding: 30
      }
    },
    tags: ['bold', 'raw', 'industrial']
  },
  {
    id: 'ocean',
    name: 'Coastal Ride',
    description: 'Cool blues and aqua tones for seaside routes',
    preview: '/themes/ocean.jpg',
    style: {
      theme: 'accent',
      posterStyle: 'art-print',
      colorScheme: {
        primary: '#006994',
        secondary: '#247BA0',
        accent: '#70C1B3',
        background: '#F3FFFD',
        foreground: '#1A535C',
        route: '#247BA0'
      },
      typography: {
        titleFont: 'Raleway, sans-serif',
        subtitleFont: 'Open Sans, sans-serif',
        metricsFont: 'Source Code Pro, monospace'
      },
      layout: {
        ratio: '2:3',
        orientation: 'portrait',
        margins: 100,
        padding: 70
      }
    },
    tags: ['ocean', 'coastal', 'serene']
  },
  {
    id: 'sunset',
    name: 'Golden Hour',
    description: 'Warm gradients perfect for sunset and sunrise rides',
    preview: '/themes/sunset.jpg',
    style: {
      theme: 'accent',
      posterStyle: 'gallery',
      colorScheme: {
        primary: '#FF6B6B',
        secondary: '#FFE66D',
        accent: '#4ECDC4',
        background: '#FFF5F5',
        foreground: '#2A363B',
        route: '#FF6B6B'
      },
      typography: {
        titleFont: 'Merriweather, serif',
        subtitleFont: 'Lora, serif',
        metricsFont: 'IBM Plex Mono, monospace'
      },
      layout: {
        ratio: '3:4',
        orientation: 'portrait',
        margins: 110,
        padding: 75
      }
    },
    tags: ['warm', 'sunset', 'golden']
  }
];

// Theme application function with smooth transitions
export function applyTheme(currentStyle: RideStyle, preset: ThemePreset): RideStyle {
  return {
    ...currentStyle,
    ...preset.style,
    // Preserve user customizations if they exist
    typography: {
      ...preset.style.typography,
      ...(currentStyle.typography || {})
    },
    layout: {
      ...preset.style.layout,
      ...(currentStyle.layout || {})
    }
  };
}

// Generate theme variations
export function generateThemeVariation(
  baseTheme: ThemePreset,
  variation: 'light' | 'dark' | 'high-contrast'
): RideStyle {
  const style = { ...baseTheme.style };
  
  switch (variation) {
    case 'light':
      // Lighten colors
      style.colorScheme = {
        ...style.colorScheme,
        background: '#FFFFFF',
        foreground: adjustBrightness(style.colorScheme.foreground, -30),
        secondary: adjustBrightness(style.colorScheme.secondary, -20)
      };
      break;
    case 'dark':
      // Darken colors
      style.colorScheme = {
        ...style.colorScheme,
        background: '#0A0A0A',
        foreground: '#FFFFFF',
        secondary: adjustBrightness(style.colorScheme.secondary, 30)
      };
      break;
    case 'high-contrast':
      // Maximum contrast
      style.colorScheme = {
        ...style.colorScheme,
        background: '#FFFFFF',
        foreground: '#000000',
        route: style.colorScheme.accent
      };
      break;
  }
  
  return style;
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

// Auto-select theme based on ride characteristics
export function autoSelectTheme(
  rideType: string,
  timeOfDay: string
): ThemePreset {
  // Logic to auto-select best theme
  if (rideType === 'mountain' || rideType === 'trail') {
    return themePresets.find(t => t.id === 'mountain')!;
  }
  
  if (rideType === 'urban' || rideType === 'road') {
    if (timeOfDay === 'night') {
      return themePresets.find(t => t.id === 'neon')!;
    }
    return themePresets.find(t => t.id === 'urban')!;
  }
  
  if (timeOfDay === 'dawn' || timeOfDay === 'evening') {
    return themePresets.find(t => t.id === 'sunset')!;
  }
  
  // Default
  return themePresets.find(t => t.id === 'minimal')!;
}