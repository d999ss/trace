import { RideObject } from '@/lib/types/ride';

export interface ExportOptions {
  format: 'PDF' | 'PNG' | 'SVG' | 'TIFF';
  quality: 'screen' | 'print' | 'professional';
  colorSpace: 'RGB' | 'CMYK';
  dpi: 72 | 150 | 300 | 600;
  bleed: number; // in mm
  dimensions: {
    width: number;
    height: number;
    unit: 'px' | 'in' | 'cm' | 'mm';
  };
  cropMarks: boolean;
  colorBars: boolean;
  registrationMarks: boolean;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  metadata: {
    dimensions: { width: number; height: number; unit: string };
    fileSize: number;
    colorSpace: string;
    dpi: number;
    format: string;
  };
}

class HighResolutionExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ride: RideObject;

  constructor(ride: RideObject) {
    this.ride = ride;
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { 
      alpha: true,
      colorSpace: 'display-p3'
    });
    
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
  }

  async export(options: ExportOptions): Promise<ExportResult> {
    // Calculate canvas dimensions based on DPI and size
    const { width, height } = this.calculateDimensions(options);
    
    // Set up canvas for high-resolution rendering
    this.setupCanvas(width, height, options);
    
    // Render the poster at high resolution
    await this.renderHighResPoster(options);
    
    // Add print marks if requested
    if (options.cropMarks || options.colorBars || options.registrationMarks) {
      this.addPrintMarks(options);
    }
    
    // Convert to requested format
    const blob = await this.convertToFormat(options);
    
    // Generate filename
    const filename = this.generateFilename(options);
    
    return {
      blob,
      filename,
      metadata: {
        dimensions: { width, height, unit: 'px' },
        fileSize: blob.size,
        colorSpace: options.colorSpace,
        dpi: options.dpi,
        format: options.format
      }
    };
  }

  private calculateDimensions(options: ExportOptions): { width: number; height: number } {
    let width: number, height: number;
    
    // Convert to pixels based on unit
    switch (options.dimensions.unit) {
      case 'in':
        width = options.dimensions.width * options.dpi;
        height = options.dimensions.height * options.dpi;
        break;
      case 'cm':
        width = (options.dimensions.width / 2.54) * options.dpi;
        height = (options.dimensions.height / 2.54) * options.dpi;
        break;
      case 'mm':
        width = (options.dimensions.width / 25.4) * options.dpi;
        height = (options.dimensions.height / 25.4) * options.dpi;
        break;
      default:
        width = options.dimensions.width;
        height = options.dimensions.height;
    }
    
    // Add bleed area
    if (options.bleed > 0) {
      const bleedPixels = (options.bleed / 25.4) * options.dpi * 2; // Convert mm to pixels
      width += bleedPixels;
      height += bleedPixels;
    }
    
    return { width, height };
  }

  private setupCanvas(width: number, height: number, options: ExportOptions) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Enable high-quality rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Set up color management
    if (options.colorSpace === 'CMYK') {
      // Note: True CMYK conversion requires server-side processing
      // This is a simulation for preview purposes
      this.ctx.globalCompositeOperation = 'multiply';
    }
  }

  private async renderHighResPoster(options: ExportOptions) {
    const { style, coordinates, customizations, metrics } = this.ride;
    const { colorScheme, typography } = style;
    
    // Calculate scaling factor
    const scale = options.dpi / 72; // Base DPI is 72
    
    // Fill background
    this.ctx.fillStyle = colorScheme.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply bleed-safe area
    const bleedPixels = options.bleed > 0 ? (options.bleed / 25.4) * options.dpi : 0;
    this.ctx.save();
    this.ctx.translate(bleedPixels, bleedPixels);
    
    // Scale all drawing operations
    const baseWidth = this.canvas.width - (bleedPixels * 2);
    const baseHeight = this.canvas.height - (bleedPixels * 2);
    
    // Render route with high precision
    this.renderHighResRoute(coordinates, colorScheme.route, baseWidth, baseHeight, scale);
    
    // Render typography with proper scaling
    this.renderHighResTypography(customizations, typography, colorScheme, baseWidth, baseHeight, scale);
    
    // Render metrics if enabled
    if (customizations.showMetrics) {
      this.renderHighResMetrics(metrics, style, baseWidth, baseHeight, scale);
    }
    
    this.ctx.restore();
  }

  private renderHighResRoute(
    coordinates: RideObject['coordinates'],
    color: string,
    width: number,
    height: number,
    scale: number
  ) {
    if (coordinates.length < 2) return;

    // Calculate bounds with high precision
    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // High-res padding
    const padding = 200 * scale;
    const routeWidth = width - 2 * padding;
    const routeHeight = height * 0.6; // 60% of poster for route
    const offsetY = height * 0.2; // Start at 20% from top

    // Set up high-quality line rendering
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 4 * scale;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Enable anti-aliasing
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 2 * scale;
    this.ctx.globalAlpha = 0.9;

    // Draw route with Bezier curves for smoothness
    this.ctx.beginPath();
    
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      const x = padding + ((coord.lng - minLng) / (maxLng - minLng)) * routeWidth;
      const y = offsetY + ((maxLat - coord.lat) / (maxLat - minLat)) * routeHeight;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else if (i < coordinates.length - 1) {
        // Use quadratic curves for smoother lines
        const nextCoord = coordinates[i + 1];
        const nextX = padding + ((nextCoord.lng - minLng) / (maxLng - minLng)) * routeWidth;
        const nextY = offsetY + ((maxLat - nextCoord.lat) / (maxLat - minLat)) * routeHeight;
        
        const cpX = (x + nextX) / 2;
        const cpY = (y + nextY) / 2;
        
        this.ctx.quadraticCurveTo(x, y, cpX, cpY);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  private renderHighResTypography(
    customizations: RideObject['customizations'],
    typography: RideObject['style']['typography'],
    colorScheme: RideObject['style']['colorScheme'],
    width: number,
    height: number,
    scale: number
  ) {
    // Title
    this.ctx.fillStyle = colorScheme.foreground;
    this.ctx.font = `bold ${120 * scale}px ${typography.titleFont}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Enable text rendering optimizations
    this.ctx.textRendering = 'optimizeLegibility';
    
    this.ctx.fillText(customizations.title, width / 2, height * 0.1);
    
    // Subtitle
    this.ctx.font = `${48 * scale}px ${typography.subtitleFont}`;
    this.ctx.fillStyle = colorScheme.secondary;
    this.ctx.fillText(customizations.subtitle, width / 2, height * 0.15);
  }

  private renderHighResMetrics(
    metrics: RideObject['metrics'],
    style: RideObject['style'],
    width: number,
    height: number,
    scale: number
  ) {
    const metricsY = height * 0.9;
    const fontSize = 72 * scale;
    const labelSize = 32 * scale;
    
    // Distance
    this.ctx.font = `bold ${fontSize}px ${style.typography.metricsFont}`;
    this.ctx.fillStyle = style.colorScheme.foreground;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${metrics.distance.toFixed(1)} ${metrics.distanceUnit}`,
      width * 0.25,
      metricsY
    );
    
    this.ctx.font = `${labelSize}px ${style.typography.metricsFont}`;
    this.ctx.fillStyle = style.colorScheme.secondary;
    this.ctx.fillText('DISTANCE', width * 0.25, metricsY + (50 * scale));
    
    // Elevation
    this.ctx.font = `bold ${fontSize}px ${style.typography.metricsFont}`;
    this.ctx.fillStyle = style.colorScheme.foreground;
    this.ctx.fillText(
      `+${metrics.elevationGain.toLocaleString()} ${metrics.elevationUnit}`,
      width * 0.5,
      metricsY
    );
    
    this.ctx.font = `${labelSize}px ${style.typography.metricsFont}`;
    this.ctx.fillStyle = style.colorScheme.secondary;
    this.ctx.fillText('ELEVATION', width * 0.5, metricsY + (50 * scale));
    
    // Time
    const hours = Math.floor(metrics.duration / 3600);
    const minutes = Math.floor((metrics.duration % 3600) / 60);
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    this.ctx.font = `bold ${fontSize}px ${style.typography.metricsFont}`;
    this.ctx.fillStyle = style.colorScheme.foreground;
    this.ctx.fillText(timeString, width * 0.75, metricsY);
    
    this.ctx.font = `${labelSize}px ${style.typography.metricsFont}`;
    this.ctx.fillStyle = style.colorScheme.secondary;
    this.ctx.fillText('TIME', width * 0.75, metricsY + (50 * scale));
  }

  private addPrintMarks(options: ExportOptions) {
    const bleedPixels = (options.bleed / 25.4) * options.dpi;
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    
    if (options.cropMarks) {
      // Add crop marks at corners
      const markLength = 20;
      const markOffset = 10;
      
      // Top-left
      this.ctx.beginPath();
      this.ctx.moveTo(bleedPixels - markOffset - markLength, bleedPixels);
      this.ctx.lineTo(bleedPixels - markOffset, bleedPixels);
      this.ctx.moveTo(bleedPixels, bleedPixels - markOffset - markLength);
      this.ctx.lineTo(bleedPixels, bleedPixels - markOffset);
      this.ctx.stroke();
      
      // Add other corners...
    }
    
    if (options.colorBars) {
      // Add CMYK color bars for print calibration
      const barWidth = 20;
      const barHeight = 100;
      const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'];
      
      colors.forEach((color, i) => {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          this.canvas.width - bleedPixels - 100 + (i * barWidth),
          bleedPixels + 20,
          barWidth,
          barHeight
        );
      });
    }
  }

  private async convertToFormat(options: ExportOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      switch (options.format) {
        case 'PNG':
          this.canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
            'image/png',
            1.0
          );
          break;
        case 'PDF':
          // For PDF, we'd need a library like jsPDF
          // This is a placeholder
          this.canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('PDF export requires server-side processing')),
            'image/png',
            1.0
          );
          break;
        case 'SVG':
          // Convert canvas to SVG would require serialization
          // This is a placeholder
          const svgBlob = new Blob(['<svg><!-- SVG content --></svg>'], { type: 'image/svg+xml' });
          resolve(svgBlob);
          break;
        default:
          this.canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
            'image/png',
            1.0
          );
      }
    });
  }

  private generateFilename(options: ExportOptions): string {
    const date = new Date().toISOString().split('T')[0];
    const quality = options.quality;
    const format = options.format.toLowerCase();
    return `printmyride-${this.ride.name.replace(/\s+/g, '-').toLowerCase()}-${date}-${quality}-${options.dpi}dpi.${format}`;
  }
}

// Export presets for common print sizes
export const printPresets = {
  'A4': { width: 210, height: 297, unit: 'mm' as const },
  'A3': { width: 297, height: 420, unit: 'mm' as const },
  'A2': { width: 420, height: 594, unit: 'mm' as const },
  'Letter': { width: 8.5, height: 11, unit: 'in' as const },
  'Tabloid': { width: 11, height: 17, unit: 'in' as const },
  '18x24': { width: 18, height: 24, unit: 'in' as const },
  '24x36': { width: 24, height: 36, unit: 'in' as const },
  'Square-12': { width: 12, height: 12, unit: 'in' as const },
  'Square-20': { width: 20, height: 20, unit: 'in' as const }
};

// Export quality presets
export const qualityPresets = {
  screen: {
    dpi: 72,
    colorSpace: 'RGB' as const,
    format: 'PNG' as const
  },
  print: {
    dpi: 300,
    colorSpace: 'RGB' as const,
    format: 'PNG' as const
  },
  professional: {
    dpi: 600,
    colorSpace: 'CMYK' as const,
    format: 'PDF' as const,
    bleed: 3,
    cropMarks: true,
    colorBars: true
  }
};

export default HighResolutionExporter;