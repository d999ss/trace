export interface Coordinate {
  lat: number;
  lng: number;
  elevation?: number;
  timestamp?: Date;
}

export interface RideMetrics {
  distance: number;
  distanceUnit: 'mi' | 'km';
  duration: number; // seconds
  elevationGain: number;
  elevationUnit: 'ft' | 'm';
  averageSpeed: number;
  maxSpeed: number;
  averageCadence?: number;
  averagePower?: number;
  calories?: number;
}

export interface RideStyle {
  theme: 'light' | 'dark' | 'accent' | 'mountain' | 'urban' | 'minimal' | 'retro' | 'brutalist' | 'neon';
  posterStyle: 'classic' | 'art-print' | 'studio' | 'gallery';
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    route: string;
  };
  typography: {
    titleFont: string;
    subtitleFont: string;
    metricsFont: string;
  };
  layout: {
    ratio: '2:3' | '3:4' | '1:1' | '16:20';
    orientation: 'portrait' | 'landscape';
    margins: number;
    padding: number;
  };
}

export interface ProductMetadata {
  sku: string;
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  sizes: Array<{
    id: string;
    label: string;
    dimensions: { width: number; height: number; unit: string };
    price: { amount: number; currency: string };
  }>;
  finishes: Array<{
    id: string;
    label: string;
    description: string;
    priceMultiplier: number;
  }>;
  frames: Array<{
    id: string;
    label: string;
    color: string;
    material: string;
    price: { amount: number; currency: string };
  }>;
}

export interface FulfillmentDetails {
  printProvider: 'printful' | 'printify' | 'custom';
  printSpecs: {
    dpi: number;
    colorSpace: 'RGB' | 'CMYK';
    bleed: number;
    format: 'PDF' | 'PNG' | 'SVG';
  };
  shippingOptions: Array<{
    id: string;
    label: string;
    estimatedDays: number;
    price: { amount: number; currency: string };
  }>;
  productionTime: number; // days
}

export interface MarketingHooks {
  headline: string;
  story: string;
  achievement: string;
  milestones: Array<{
    type: 'summit' | 'sprint' | 'checkpoint' | 'pr';
    label: string;
    coordinate: Coordinate;
    icon?: string;
  }>;
  hashtags: string[];
  socialShareText: string;
}

export interface RideContext {
  type: 'mountain' | 'urban' | 'trail' | 'road' | 'gravel';
  weather?: {
    condition: string;
    temperature: number;
    wind?: { speed: number; direction: string };
  };
  time: {
    startTime: Date;
    endTime: Date;
    dayPeriod: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  };
  location: {
    city?: string;
    state?: string;
    country: string;
    region?: string;
  };
}

export interface RideObject {
  id: string;
  userId: string;
  sourceId?: string; // Strava activity ID, GPX file hash, etc.
  
  // Core ride data
  name: string;
  coordinates: Coordinate[];
  metrics: RideMetrics;
  context: RideContext;
  
  // Design & presentation
  style: RideStyle;
  customizations: {
    title: string;
    subtitle: string;
    showMetrics: boolean;
    showElevationProfile: boolean;
    showMilestones: boolean;
  };
  
  // Commerce
  product: ProductMetadata;
  fulfillment: FulfillmentDetails;
  
  // Marketing & social
  marketing: MarketingHooks;
  
  // System metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  visibility: 'private' | 'unlisted' | 'public';
  
  // Cached renders
  renders?: {
    thumbnail?: string;
    preview?: string;
    highRes?: string;
    socialShare?: string;
  };
}

// Smart defaults generator based on ride context
export function generateSmartDefaults(context: RideContext): Partial<RideStyle> {
  const defaults: Partial<RideStyle> = {};
  
  switch (context.type) {
    case 'mountain':
      defaults.theme = 'mountain';
      defaults.colorScheme = {
        primary: '#8B7355',
        secondary: '#D4A574',
        accent: '#FF6B35',
        background: '#F5F2ED',
        foreground: '#2C1810',
        route: '#FF6B35'
      };
      break;
    case 'urban':
      defaults.theme = 'urban';
      defaults.colorScheme = {
        primary: '#1A1A1A',
        secondary: '#4A4A4A',
        accent: '#00FF41',
        background: '#FFFFFF',
        foreground: '#000000',
        route: '#00FF41'
      };
      break;
    case 'trail':
      defaults.theme = 'minimal';
      defaults.colorScheme = {
        primary: '#2D5016',
        secondary: '#68A225',
        accent: '#8FBC8F',
        background: '#FAFAF8',
        foreground: '#1B3409',
        route: '#68A225'
      };
      break;
    default:
      defaults.theme = 'light';
      defaults.colorScheme = {
        primary: '#000000',
        secondary: '#666666',
        accent: '#0066FF',
        background: '#FFFFFF',
        foreground: '#000000',
        route: '#0066FF'
      };
  }
  
  // Time-based adjustments
  if (context.time?.dayPeriod === 'dawn' || context.time?.dayPeriod === 'evening') {
    defaults.colorScheme = {
      ...defaults.colorScheme!,
      accent: '#FF6B9D',
      route: '#FF6B9D'
    };
  } else if (context.time?.dayPeriod === 'night') {
    defaults.theme = 'dark';
    defaults.colorScheme = {
      primary: '#FFFFFF',
      secondary: '#B8B8B8',
      accent: '#4ECDC4',
      background: '#0A0E27',
      foreground: '#FFFFFF',
      route: '#4ECDC4'
    };
  }
  
  return defaults;
}

// Generate marketing story from ride data
export function generateRideStory(ride: RideObject): string {
  const { metrics, context } = ride;
  const distance = `${metrics.distance.toFixed(1)} ${metrics.distanceUnit}`;
  const elevation = `${metrics.elevationGain.toLocaleString()} ${metrics.elevationUnit} climb`;
  const time = new Date(metrics.duration * 1000).toISOString().substr(11, 8);
  
  let story = `${distance} • ${elevation} • ${time}`;
  
  if (context.time?.dayPeriod === 'dawn') {
    story += ' • Dawn patrol';
  } else if (context.time?.dayPeriod === 'night') {
    story += ' • Night ride';
  }
  
  if (context.weather?.condition) {
    story += ` • ${context.weather.condition}`;
  }
  
  return story;
}

// Generate product SKU
export function generateProductSKU(ride: RideObject): string {
  const date = new Date(ride.createdAt).toISOString().split('T')[0].replace(/-/g, '');
  const type = ride.context.type.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PMR-${type}-${date}-${random}`;
}