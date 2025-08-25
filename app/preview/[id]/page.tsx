'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getActivity, decodePolyline } from '@/lib/strava';
import { createCheckout, updateCheckoutAttributes } from '@/lib/shopify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type Theme = 'light' | 'dark' | 'accent';

function PreviewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<{name?: string; map?: {summary_polyline?: string}} | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [theme, setTheme] = useState<'light' | 'dark' | 'accent'>('light');
  const [selectedSize, setSelectedSize] = useState<'digital' | 'small' | 'medium' | 'large'>('medium');
  const [posterStyle, setPosterStyle] = useState<'classic' | 'art-print'>('classic');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  // Function to render poster in real-time
  const renderPosterPreview = useCallback(() => {
    console.log('renderPosterPreview called with:', { coordinates: coordinates.length, posterStyle, theme });
    
    if (!coordinates.length) {
      console.log('No coordinates available, skipping poster render');
      return;
    }
    
    const canvas = document.getElementById('posterCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.log('Canvas element not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Could not get 2D context');
      return;
    }

    console.log('Rendering poster preview with dimensions:', { displayWidth: 400, displayHeight: 600 });

    // Set canvas dimensions for preview (portrait orientation - 2:3 ratio)
    const displayWidth = 400;
    const displayHeight = 600; // 2:3 ratio to match poster dimensions
    
    // Use high-resolution canvas to prevent pixelation
    const canvasScale = 2; // Retina/HD scaling
    const previewWidth = displayWidth * canvasScale;
    const previewHeight = displayHeight * canvasScale;
    
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    
    // Scale the canvas CSS to maintain display size
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Use a proper scale factor for preview to ensure good proportions
    const scaleFactor = 1.0; // This gives us full-size proportions for the preview

    if (posterStyle === 'art-print') {
      console.log('Rendering Art Print style');
      renderArtPrintPreview(ctx, previewWidth, previewHeight, scaleFactor);
    } else {
      console.log('Rendering Classic style');
      renderClassicPreview(ctx, previewWidth, previewHeight, scaleFactor);
    }
    
    console.log('Poster preview render complete');
  }, [coordinates, title, subtitle, theme, selectedSize, activity, posterStyle]);

  // Function to render classic poster preview
  const renderClassicPreview = (ctx: CanvasRenderingContext2D, previewWidth: number, previewHeight: number, scaleFactor: number) => {
    // Create beautiful gradient background that fills the entire poster
    const gradient = ctx.createLinearGradient(0, 0, 0, previewHeight);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, previewWidth, previewHeight);

    // TOP SECTION: Beautiful title area with subtle background - NO SHADOW, full width
    const topSectionHeight = Math.floor(100 * scaleFactor);
    const topGradient = ctx.createLinearGradient(0, 0, 0, topSectionHeight);
    topGradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
    topGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, previewWidth, topSectionHeight);

    // Title: Beautiful, modern typography
    const titleY = Math.floor(30 * scaleFactor);
    const displayTitle = title || 'YOUR ACTIVITY';
    
    // Title shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.font = `bold ${Math.floor(48 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(displayTitle.toUpperCase(), previewWidth / 2 + 2, titleY + 2);
    
    // Main title
    ctx.fillStyle = '#1e293b';
    ctx.fillText(displayTitle.toUpperCase(), previewWidth / 2, titleY);

    // Subtitle: Elegant secondary text
    const subtitleY = titleY + Math.floor(60 * scaleFactor);
    const displaySubtitle = subtitle || 'Strava Activity';
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.floor(24 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(displaySubtitle, previewWidth / 2, subtitleY);

    // MIDDLE SECTION: Hero Map Block - FULL WIDTH, NO SHADOW, NO ROUNDED CORNERS
    const mapBlockTop = subtitleY + Math.floor(30 * scaleFactor);
    const mapBlockHeight = Math.floor(380 * scaleFactor);
    const mapBlockX = 0; // Start from left edge
    const mapBlockY = mapBlockTop;
    const mapBlockWidth = previewWidth; // Full width

    // Map background with theme-appropriate colors - NO SHADOW, NO ROUNDED CORNERS
    let mapBackgroundColor, mapGradient;
    if (theme === 'dark') {
      mapBackgroundColor = '#0f172a';
      mapGradient = ctx.createLinearGradient(mapBlockX, mapBlockY, mapBlockX, mapBlockY + mapBlockHeight);
      mapGradient.addColorStop(0, '#1e293b');
      mapGradient.addColorStop(1, '#0f172a');
    } else if (theme === 'accent') {
      mapBackgroundColor = '#eff6ff';
      mapGradient = ctx.createLinearGradient(mapBlockX, mapBlockY, mapBlockX, mapBlockY + mapBlockHeight);
      mapGradient.addColorStop(0, '#f0f9ff');
      mapGradient.addColorStop(1, '#e0f2fe');
    } else {
      mapBackgroundColor = '#f8fafc';
      mapGradient = ctx.createLinearGradient(mapBlockX, mapBlockY, mapBlockX, mapBlockY + mapBlockHeight);
      mapGradient.addColorStop(0, '#ffffff');
      mapGradient.addColorStop(1, '#f1f5f9');
    }
    
    // Draw map container - NO SHADOW, NO ROUNDED CORNERS, FULL WIDTH
    ctx.fillStyle = mapGradient;
    ctx.fillRect(mapBlockX, mapBlockY, mapBlockWidth, mapBlockHeight);

    // Draw enhanced map tiles for terrain
    drawEnhancedMapTiles(ctx, mapBlockX, mapBlockY, mapBlockWidth, mapBlockHeight, theme);

    // Draw the GPS route with beautiful styling
    if (coordinates.length > 1) {
      // Calculate bounds of the route
      let minLat = coordinates[0][0], maxLat = coordinates[0][0];
      let minLng = coordinates[0][1], maxLng = coordinates[0][1];
      
      coordinates.forEach(coord => {
        minLat = Math.min(minLat, coord[0]);
        maxLat = Math.max(maxLat, coord[0]);
        minLng = Math.min(minLng, coord[1]);
        maxLng = Math.max(maxLng, coord[1]);
      });

      // Add padding to bounds
      const latPadding = (maxLat - minLat) * 0.15;
      const lngPadding = (maxLng - minLng) * 0.15;
      minLat -= latPadding;
      maxLat += latPadding;
      minLng -= lngPadding;
      maxLng += lngPadding;

      // Function to convert GPS coordinates to canvas coordinates within map block
      const gpsToCanvas = (lat: number, lng: number) => {
        const x = mapBlockX + ((lng - minLng) / (maxLng - minLng)) * mapBlockWidth;
        const y = mapBlockY + ((maxLat - lat) / (maxLat - minLat)) * mapBlockHeight;
        return { x, y };
      };

      // Draw the route with beautiful styling
      let routeColor, routeGradient;
      if (theme === 'dark') {
        routeColor = '#60a5fa';
        routeGradient = ctx.createLinearGradient(0, 0, 0, previewHeight);
        routeGradient.addColorStop(0, '#60a5fa');
        routeGradient.addColorStop(1, '#3b82f6');
      } else if (theme === 'accent') {
        routeColor = '#f97316';
        routeGradient = ctx.createLinearGradient(0, 0, 0, previewHeight);
        routeGradient.addColorStop(0, '#f97316');
        routeGradient.addColorStop(1, '#ea580c');
      } else {
        routeColor = '#3b82f6';
        routeGradient = ctx.createLinearGradient(0, 0, 0, previewHeight);
        routeGradient.addColorStop(0, '#3b82f6');
        routeGradient.addColorStop(1, '#2563eb');
      }
      
      // Route glow effect
      ctx.shadowColor = routeColor;
      ctx.shadowBlur = Math.floor(15 * scaleFactor);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.strokeStyle = routeGradient;
      ctx.lineWidth = Math.max(8, Math.floor(12 * scaleFactor));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      const startPoint = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      ctx.moveTo(startPoint.x, startPoint.y);
      
      // Draw each segment of the route
      for (let i = 1; i < coordinates.length; i++) {
        const point = gpsToCanvas(coordinates[i][0], coordinates[i][1]);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Add beautiful start and end markers
      const start = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      const end = gpsToCanvas(coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]);
      
      // Start marker (green with glow)
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = Math.floor(10 * scaleFactor);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(start.x, start.y, Math.floor(10 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
      
      // End marker (red with glow)
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = Math.floor(10 * scaleFactor);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(end.x, end.y, Math.floor(10 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    // BOTTOM SECTION: Beautiful stats bar - FULL WIDTH, NO SHADOW
    const statsBarTop = mapBlockY + mapBlockHeight;
    const statsBarHeight = Math.floor(80 * scaleFactor);
    const statsBarY = statsBarTop;
    
    // Stats container with beautiful background - NO SHADOW, NO ROUNDED CORNERS
    const statsGradient = ctx.createLinearGradient(0, statsBarY, 0, statsBarY + statsBarHeight);
    statsGradient.addColorStop(0, '#f8fafc');
    statsGradient.addColorStop(1, '#e2e8f0');
    
    ctx.fillStyle = statsGradient;
    ctx.fillRect(0, statsBarY, previewWidth, statsBarHeight);
    
    // Calculate stats (mock data for now)
    const distance = '8.85 mi';
    const elevation = '+1,247 ft';
    const duration = '1:23:45';
    
    // Draw stats with beautiful styling
    const statSpacing = previewWidth / 3;
    const statTextSize = Math.floor(22 * scaleFactor);
    const statLabelSize = Math.floor(12 * scaleFactor);
    
    // Distance stat
    const distanceX = statSpacing * 0.5;
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(distance, distanceX, statsBarY + Math.floor(25 * scaleFactor));
    
    // Distance icon (beautiful line icon)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(distanceX - Math.floor(18 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.lineTo(distanceX + Math.floor(18 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.stroke();
    
    // Distance label
    ctx.fillStyle = '#64748b';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DISTANCE', distanceX, statsBarY + Math.floor(70 * scaleFactor));
    
    // Elevation stat
    const elevationX = statSpacing * 1.5;
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(elevation, elevationX, statsBarY + Math.floor(25 * scaleFactor));
    
    // Elevation icon (beautiful mountain peak)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(elevationX - Math.floor(18 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.lineTo(elevationX, statsBarY + Math.floor(45 * scaleFactor));
    ctx.lineTo(elevationX + Math.floor(18 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.stroke();
    
    // Elevation label
    ctx.fillStyle = '#64748b';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ELEVATION', elevationX, statsBarY + Math.floor(70 * scaleFactor));
    
    // Duration stat
    const durationX = statSpacing * 2.5;
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(duration, durationX, statsBarY + Math.floor(25 * scaleFactor));
    
    // Duration icon (beautiful clock)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(durationX, statsBarY + Math.floor(50 * scaleFactor), Math.floor(10 * scaleFactor), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(durationX, statsBarY + Math.floor(50 * scaleFactor));
    ctx.lineTo(durationX + Math.floor(6 * scaleFactor), statsBarY + Math.floor(50 * scaleFactor));
    ctx.stroke();
    
    // Duration label
    ctx.fillStyle = '#64748b';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DURATION', durationX, statsBarY + Math.floor(70 * scaleFactor));

    // FOOTER: Beautiful branding
    const footerY = previewHeight - Math.floor(30 * scaleFactor);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.floor(14 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${selectedSize.toUpperCase()} • TRACE PRINTS`, previewWidth / 2, footerY);
  };

  // Function to render art print poster preview
  const renderArtPrintPreview = (ctx: CanvasRenderingContext2D, previewWidth: number, previewHeight: number, scaleFactor: number) => {
    // Pure white background for minimalist aesthetic
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, previewWidth, previewHeight);

    // ROUTE SECTION: Upper two-thirds with minimal margins - FULL WIDTH
    const routeMargin = Math.floor(20 * scaleFactor); // Reduced margins for more content
    const routeWidth = previewWidth - (routeMargin * 2);
    const routeHeight = Math.floor(420 * scaleFactor); // Increased height to fill more space
    const routeX = routeMargin;
    const routeY = Math.floor(20 * scaleFactor); // Reduced top margin

    // Route background with very light gray
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(routeX, routeY, routeWidth, routeHeight);

    // Draw enhanced terrain tiles for the route area
    drawEnhancedMapTiles(ctx, routeX, routeY, routeWidth, routeHeight, 'light');

    // Draw the GPS route with thin, neutral styling
    if (coordinates.length > 1) {
      // Calculate bounds of the route
      let minLat = coordinates[0][0], maxLat = coordinates[0][0];
      let minLng = coordinates[0][1], maxLng = coordinates[0][1];
      
      coordinates.forEach(coord => {
        minLat = Math.min(minLat, coord[0]);
        maxLat = Math.max(maxLat, coord[0]);
        minLng = Math.min(minLng, coord[1]);
        maxLng = Math.max(maxLng, coord[1]);
      });

      // Add padding to bounds
      const latPadding = (maxLat - minLat) * 0.15;
      const lngPadding = (maxLng - minLng) * 0.15;
      minLat -= latPadding;
      maxLat += latPadding;
      minLng -= lngPadding;
      maxLng += lngPadding;

      // Function to convert GPS coordinates to canvas coordinates within route area
      const gpsToCanvas = (lat: number, lng: number) => {
        const x = routeX + ((lng - minLng) / (maxLng - minLng)) * routeWidth;
        const y = routeY + ((maxLat - lat) / (maxLat - minLat)) * routeHeight;
        return { x, y };
      };

      // Thin, neutral route line
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = Math.max(2, Math.floor(3 * scaleFactor));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      const startPoint = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      ctx.moveTo(startPoint.x, startPoint.y);
      
      // Draw each segment of the route
      for (let i = 1; i < coordinates.length; i++) {
        const point = gpsToCanvas(coordinates[i][0], coordinates[i][1]);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();

      // Add subtle start and end markers
      const start = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      const end = gpsToCanvas(coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]);
      
      // Start marker (subtle)
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(start.x, start.y, Math.floor(4 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
      
      // End marker (subtle)
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(end.x, end.y, Math.floor(4 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
    }

    // TITLE SECTION: Bottom third, centered
    const titleY = routeY + routeHeight + Math.floor(30 * scaleFactor); // Reduced spacing
    const displayTitle = title || 'YOUR ACTIVITY';
    
    // Title in serif typeface, sentence case
    ctx.fillStyle = '#2a2a2a';
    ctx.font = `${Math.floor(42 * scaleFactor)}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(displayTitle, previewWidth / 2, titleY);

    // Subtitle
    const subtitleY = titleY + Math.floor(50 * scaleFactor);
    const displaySubtitle = subtitle || 'Strava Activity';
    ctx.fillStyle = '#6b7280';
    ctx.font = `${Math.floor(24 * scaleFactor)}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(displaySubtitle, previewWidth / 2, subtitleY);

    // FOOTER ROW: Stats with micro charts
    const footerY = previewHeight - Math.floor(60 * scaleFactor);
    const statSpacing = previewWidth / 3;
    const statTextSize = Math.floor(20 * scaleFactor);
    const statLabelSize = Math.floor(12 * scaleFactor);
    
    // Distance stat
    const distanceX = statSpacing * 0.5;
    ctx.fillStyle = '#2a2a2a';
    ctx.font = `${statTextSize}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('8.85 mi', distanceX, footerY);
    
    // Distance micro chart (simple line)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(distanceX - Math.floor(15 * scaleFactor), footerY + Math.floor(25 * scaleFactor));
    ctx.lineTo(distanceX + Math.floor(15 * scaleFactor), footerY + Math.floor(25 * scaleFactor));
    ctx.stroke();
    
    // Distance label
    ctx.fillStyle = '#6b7280';
    ctx.font = `${statLabelSize}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DISTANCE', distanceX, footerY + Math.floor(40 * scaleFactor));
    
    // Elevation stat
    const elevationX = statSpacing * 1.5;
    ctx.fillStyle = '#2a2a2a';
    ctx.font = `${statTextSize}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('+1,247 ft', elevationX, footerY);
    
    // Elevation micro chart (mountain shape)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(elevationX - Math.floor(15 * scaleFactor), footerY + Math.floor(25 * scaleFactor));
    ctx.lineTo(elevationX, footerY + Math.floor(20 * scaleFactor));
    ctx.lineTo(elevationX + Math.floor(15 * scaleFactor), footerY + Math.floor(25 * scaleFactor));
    ctx.stroke();
    
    // Elevation label
    ctx.fillStyle = '#6b7280';
    ctx.font = `${statLabelSize}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ELEVATION', elevationX, footerY + Math.floor(40 * scaleFactor));
    
    // Duration stat
    const durationX = statSpacing * 2.5;
    ctx.fillStyle = '#2a2a2a';
    ctx.font = `${statTextSize}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('1:23:45', durationX, footerY);
    
    // Duration micro chart (clock shape)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(durationX, footerY + Math.floor(22 * scaleFactor), Math.floor(8 * scaleFactor), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(durationX, footerY + Math.floor(22 * scaleFactor));
    ctx.lineTo(durationX + Math.floor(5 * scaleFactor), footerY + Math.floor(22 * scaleFactor));
    ctx.stroke();
    
    // Duration label
    ctx.fillStyle = '#6b7280';
    ctx.font = `${statLabelSize}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DURATION', durationX, footerY + Math.floor(40 * scaleFactor));

    // Branding at very bottom
    const brandY = previewHeight - Math.floor(20 * scaleFactor);
    ctx.fillStyle = '#9ca3af';
    ctx.font = `${Math.floor(12 * scaleFactor)}px "Times New Roman", Times, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${selectedSize.toUpperCase()} • TRACE PRINTS`, previewWidth / 2, brandY);
  };

  // Function to render classic poster for download
  const renderClassicPoster = (ctx: CanvasRenderingContext2D, posterWidth: number, posterHeight: number, selectedSize: string) => {
    const sizeMultiplier = (posterWidth / 3000);
    
    // Fill background with pure white for Apple-like framing
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // TOP SECTION: Title & Subtitle (Apple-like hierarchy)
    const topMargin = 120 * sizeMultiplier;
    const titleY = topMargin;
    const subtitleY = titleY + (60 * sizeMultiplier);

    // Title: Bold, all caps, instantly recognizable
    if (title) {
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${72 * sizeMultiplier}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title.toUpperCase(), posterWidth / 2, titleY);
    }

    // Subtitle: Lighter, smaller, secondary information
    if (subtitle) {
      ctx.fillStyle = '#666666';
      ctx.font = `${36 * sizeMultiplier}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(subtitle, posterWidth / 2, subtitleY);
    }

    // MIDDLE SECTION: Hero Map Block (floating, not touching edges)
    const mapBlockTop = subtitle ? subtitleY + (40 * sizeMultiplier) : titleY + (40 * sizeMultiplier);
    const mapBlockHeight = 400 * sizeMultiplier;
    const mapBlockMargin = 100 * sizeMultiplier;
    const mapBlockWidth = posterWidth - (mapBlockMargin * 2);
    const mapBlockX = mapBlockMargin;
    const mapBlockY = mapBlockTop;

    // Map background block with strong single color (user-chosen theme)
    let mapBackgroundColor;
    if (theme === 'dark') {
      mapBackgroundColor = '#1a1a1a'; // Deep black
    } else if (theme === 'accent') {
      mapBackgroundColor = '#f0f8ff'; // Light blue for satellite
    } else {
      mapBackgroundColor = '#f8f9fa'; // Light gray for classic
    }
    
    ctx.fillStyle = mapBackgroundColor;
    ctx.fillRect(mapBlockX, mapBlockY, mapBlockWidth, mapBlockHeight);

    // Draw the actual GPS route from coordinates
    if (coordinates.length > 1) {
      // Calculate bounds of the route
      let minLat = coordinates[0][0], maxLat = coordinates[0][0];
      let minLng = coordinates[0][1], maxLng = coordinates[0][1];
      
      coordinates.forEach(coord => {
        minLat = Math.min(minLat, coord[0]);
        maxLat = Math.max(maxLat, coord[0]);
        minLng = Math.min(minLng, coord[1]);
        maxLng = Math.max(maxLng, coord[1]);
      });

      // Add padding to bounds
      const latPadding = (maxLat - minLat) * 0.15;
      const lngPadding = (maxLng - minLng) * 0.15;
      minLat -= latPadding;
      maxLat += latPadding;
      minLng -= lngPadding;
      maxLng += lngPadding;

      // Function to convert GPS coordinates to canvas coordinates within map block
      const gpsToCanvas = (lat: number, lng: number) => {
        const x = mapBlockX + ((lng - minLng) / (maxLng - minLng)) * mapBlockWidth;
        const y = mapBlockY + ((maxLat - lat) / (maxLat - minLat)) * mapBlockHeight;
        return { x, y };
      };

      // Draw the route path with high contrast
      let routeColor;
      if (theme === 'dark') {
        routeColor = '#ffffff'; // White on black
      } else if (theme === 'accent') {
        routeColor = '#ff6b35'; // Orange on light blue
      } else {
        routeColor = '#007AFF'; // Blue on light gray
      }
      
      ctx.strokeStyle = routeColor;
      ctx.lineWidth = 12 * sizeMultiplier;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      const startPoint = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      ctx.moveTo(startPoint.x, startPoint.y);
      
      // Draw each segment of the route
      for (let i = 1; i < coordinates.length; i++) {
        const point = gpsToCanvas(coordinates[i][0], coordinates[i][1]);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();

      // Add start and end markers (subtle, not competing)
      const start = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      const end = gpsToCanvas(coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]);
      
      // Start marker (subtle circle)
      ctx.fillStyle = routeColor;
      ctx.beginPath();
      ctx.arc(start.x, start.y, 20 * sizeMultiplier, 0, 2 * Math.PI);
      ctx.fill();
      
      // End marker (subtle circle)
      ctx.beginPath();
      ctx.arc(end.x, end.y, 20 * sizeMultiplier, 0, 2 * Math.PI);
      ctx.fill();
    }

    // BOTTOM SECTION: Stats Bar (Apple-like status bar)
    const statsBarTop = mapBlockY + mapBlockHeight + (60 * sizeMultiplier);
    const statsBarHeight = 120 * sizeMultiplier;
    const statsBarY = statsBarTop;
    
    // Calculate stats (mock data for now)
    const distance = '8.85 mi';
    const elevation = '+1,247 ft';
    const duration = '1:23:45';
    
    // Stats container background (subtle, not competing)
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, statsBarY, posterWidth, statsBarHeight);
    
    // Draw stats with tiny icons and proper hierarchy
    const statSpacing = posterWidth / 3;
    const statTextSize = 30 * sizeMultiplier;
    const statLabelSize = 18 * sizeMultiplier;
    
    // Distance stat
    const distanceX = statSpacing * 0.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(distance, distanceX, statsBarY + (40 * sizeMultiplier));
    
    // Distance icon (simple line icon)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 3 * sizeMultiplier;
    ctx.beginPath();
    ctx.moveTo(distanceX - (25 * sizeMultiplier), statsBarY + (80 * sizeMultiplier));
    ctx.lineTo(distanceX + (25 * sizeMultiplier), statsBarY + (80 * sizeMultiplier));
    ctx.stroke();
    
    // Distance label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DISTANCE', distanceX, statsBarY + (105 * sizeMultiplier));
    
    // Elevation stat
    const elevationX = statSpacing * 1.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(elevation, elevationX, statsBarY + (40 * sizeMultiplier));
    
    // Elevation icon (mountain peak)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 3 * sizeMultiplier;
    ctx.beginPath();
    ctx.moveTo(elevationX - (25 * sizeMultiplier), statsBarY + (80 * sizeMultiplier));
    ctx.lineTo(elevationX, statsBarY + (65 * sizeMultiplier));
    ctx.lineTo(elevationX + (25 * sizeMultiplier), statsBarY + (80 * sizeMultiplier));
    ctx.stroke();
    
    // Elevation label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ELEVATION', elevationX, statsBarY + (105 * sizeMultiplier));
    
    // Duration stat
    const durationX = statSpacing * 2.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(duration, durationX, statsBarY + (40 * sizeMultiplier));
    
    // Duration icon (clock)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 3 * sizeMultiplier;
    ctx.beginPath();
    ctx.arc(durationX, statsBarY + (75 * sizeMultiplier), 15 * sizeMultiplier, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(durationX, statsBarY + (75 * sizeMultiplier));
    ctx.lineTo(durationX + (10 * sizeMultiplier), statsBarY + (75 * sizeMultiplier));
    ctx.stroke();
    
    // Duration label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DURATION', durationX, statsBarY + (105 * sizeMultiplier));

    // FOOTER: Branding (subtle, not competing)
    const footerY = posterHeight - (60 * sizeMultiplier);
    ctx.fillStyle = '#999999';
    ctx.font = `${20 * sizeMultiplier}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${selectedSize.toUpperCase()} • TRACE PRINTS`, posterWidth / 2, footerY);
  };

  // Function to render art print poster for download
  const renderArtPrintPoster = (ctx: CanvasRenderingContext2D, posterWidth: number, posterHeight: number, selectedSize: string) => {
    const sizeMultiplier = (posterWidth / 3000);
    
    // Fill background with pure white for art print framing
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // ROUTE SECTION: Upper two-thirds, very wide margins, centered
    const routeTop = 120 * sizeMultiplier;
    const routeHeight = (posterHeight * 0.65) - routeTop;
    const routeMargin = 150 * sizeMultiplier; // Very wide margins
    const routeWidth = posterWidth - (routeMargin * 2);
    const routeX = routeMargin;
    const routeY = routeTop;

    // Very light gray background for route area
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(routeX, routeY, routeWidth, routeHeight);
    
    // Draw subtle map tiles for terrain context
    drawMapTiles(ctx, routeX, routeY, routeWidth, routeHeight, 'light');

    // Draw the GPS route with thin, neutral stroke
    if (coordinates.length > 1) {
      // Calculate bounds of the route
      let minLat = coordinates[0][0], maxLat = coordinates[0][0];
      let minLng = coordinates[0][1], maxLng = coordinates[0][1];
      
      coordinates.forEach(coord => {
        minLat = Math.min(minLat, coord[0]);
        maxLat = Math.max(maxLat, coord[0]);
        minLng = Math.min(minLng, coord[1]);
        maxLng = Math.max(maxLng, coord[1]);
      });

      // Add padding to bounds for breathing room
      const latPadding = (maxLat - minLat) * 0.2;
      const lngPadding = (maxLng - minLng) * 0.2;
      minLat -= latPadding;
      maxLat += latPadding;
      minLng -= lngPadding;
      maxLng += lngPadding;

      // Function to convert GPS coordinates to canvas coordinates within route area
      const gpsToCanvas = (lat: number, lng: number) => {
        const x = routeX + ((lng - minLng) / (maxLng - minLng)) * routeWidth;
        const y = routeY + ((maxLat - lat) / (maxLat - minLat)) * routeHeight;
        return { x, y };
      };

      // Draw the route with very thin, neutral stroke
      ctx.strokeStyle = '#2a2a2a'; // Very dark gray, almost black
      ctx.lineWidth = 3 * sizeMultiplier; // Thin stroke
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      const startPoint = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      ctx.moveTo(startPoint.x, startPoint.y);
      
      // Draw each segment of the route
      for (let i = 1; i < coordinates.length; i++) {
        const point = gpsToCanvas(coordinates[i][0], coordinates[i][1]);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();

      // Add start/finish labels in small, delicate italic type
      const start = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      const end = gpsToCanvas(coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]);
      
      // Start label
      ctx.fillStyle = '#666666';
      ctx.font = `italic ${18 * sizeMultiplier}px "Times New Roman", Times, serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('start', start.x + (12 * sizeMultiplier), start.y);
      
      // Finish label
      ctx.fillText('finish', end.x + (12 * sizeMultiplier), end.y);
    }

    // TITLE SECTION: Centered at bottom, serif typography
    const titleAreaTop = routeY + routeHeight + (90 * sizeMultiplier);
    const titleY = titleAreaTop + (45 * sizeMultiplier);
    const subtitleY = titleY + (60 * sizeMultiplier);

    // Primary title in serif, sentence case
    if (title) {
      ctx.fillStyle = '#000000';
      ctx.font = `${54 * sizeMultiplier}px "Times New Roman", Times, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, posterWidth / 2, titleY);
    }

    // Secondary line in lighter serif or sans-serif
    if (subtitle) {
      ctx.fillStyle = '#666666';
      ctx.font = `${30 * sizeMultiplier}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(subtitle, posterWidth / 2, subtitleY);
    }

    // FOOTER SECTION: Stats row with micro-visuals
    const footerTop = titleAreaTop + (180 * sizeMultiplier);
    const footerHeight = 120 * sizeMultiplier;
    const footerY = footerTop;

    // Optional subtle separator line
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2 * sizeMultiplier;
    ctx.beginPath();
    ctx.moveTo(routeMargin, footerTop - (30 * sizeMultiplier));
    ctx.lineTo(posterWidth - routeMargin, footerTop - (30 * sizeMultiplier));
    ctx.stroke();

    // Stats container
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, footerY, posterWidth, footerHeight);

    // Calculate stats (mock data for now)
    const distance = '8.85 mi';
    const pace = '6:42/mi';
    const elevation = '+1,247 ft';

    // Stats row: evenly spaced, all on one line
    const statSpacing = posterWidth / 3;
    const statTextSize = 27 * sizeMultiplier;
    const statLabelSize = 15 * sizeMultiplier;

    // Distance stat with micro chart
    const distanceX = statSpacing * 0.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(distance, distanceX, footerY + (40 * sizeMultiplier));

    // Distance micro chart (simple line)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2 * sizeMultiplier;
    ctx.beginPath();
    ctx.moveTo(distanceX - (30 * sizeMultiplier), footerY + (75 * sizeMultiplier));
    ctx.lineTo(distanceX, footerY + (68 * sizeMultiplier));
    ctx.lineTo(distanceX + (30 * sizeMultiplier), footerY + (75 * sizeMultiplier));
    ctx.stroke();

    // Distance label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DISTANCE', distanceX, footerY + (98 * sizeMultiplier));

    // Pace stat with micro chart
    const paceX = statSpacing * 1.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(pace, paceX, footerY + (40 * sizeMultiplier));

    // Pace micro chart (pace line)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2 * sizeMultiplier;
    ctx.beginPath();
    ctx.moveTo(paceX - (30 * sizeMultiplier), footerY + (75 * sizeMultiplier));
    ctx.lineTo(paceX - (15 * sizeMultiplier), footerY + (72 * sizeMultiplier));
    ctx.lineTo(paceX, footerY + (78 * sizeMultiplier));
    ctx.lineTo(paceX + (15 * sizeMultiplier), footerY + (70 * sizeMultiplier));
    ctx.lineTo(paceX + (30 * sizeMultiplier), footerY + (75 * sizeMultiplier));
    ctx.stroke();

    // Pace label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('PACE', paceX, footerY + (98 * sizeMultiplier));

    // Elevation stat with micro chart
    const elevationX = statSpacing * 2.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(elevation, elevationX, footerY + (40 * sizeMultiplier));

    // Elevation micro chart (elevation profile)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2 * sizeMultiplier;
    ctx.beginPath();
    ctx.moveTo(elevationX - (30 * sizeMultiplier), footerY + (75 * sizeMultiplier));
    ctx.lineTo(elevationX - (22 * sizeMultiplier), footerY + (68 * sizeMultiplier));
    ctx.lineTo(elevationX - (15 * sizeMultiplier), footerY + (72 * sizeMultiplier));
    ctx.lineTo(elevationX - (8 * sizeMultiplier), footerY + (63 * sizeMultiplier));
    ctx.lineTo(elevationX, footerY + (70 * sizeMultiplier));
    ctx.lineTo(elevationX + (8 * sizeMultiplier), footerY + (66 * sizeMultiplier));
    ctx.lineTo(elevationX + (15 * sizeMultiplier), footerY + (73 * sizeMultiplier));
    ctx.lineTo(elevationX + (22 * sizeMultiplier), footerY + (69 * sizeMultiplier));
    ctx.lineTo(elevationX + (30 * sizeMultiplier), footerY + (75 * sizeMultiplier));
    ctx.stroke();

    // Elevation label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ELEVATION', elevationX, footerY + (98 * sizeMultiplier));

    // Branding (very subtle)
    const brandY = posterHeight - (45 * sizeMultiplier);
    ctx.fillStyle = '#cccccc';
    ctx.font = `${18 * sizeMultiplier}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${selectedSize.toUpperCase()} • TRACE PRINTS`, posterWidth / 2, brandY);
  };

  // Function to draw map tiles for terrain
  const drawMapTiles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, theme: string) => {
    const tileSize = 32; // Size of each map tile
    
    // Draw grid pattern for map tiles
    ctx.strokeStyle = theme === 'dark' ? '#444444' : theme === 'accent' ? '#d0e8f0' : '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let tileX = x; tileX <= x + width; tileX += tileSize) {
      ctx.beginPath();
      ctx.moveTo(tileX, y);
      ctx.lineTo(tileX, y + height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let tileY = y; tileY <= y + height; tileY += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, tileY);
      ctx.lineTo(x + width, tileY);
      ctx.stroke();
    }
    
    // Add some terrain variation
    if (theme === 'accent') {
      // Satellite theme - add some "aerial" texture
      ctx.fillStyle = '#f0f8ff';
      for (let tileX = x; tileX < x + width; tileX += tileSize * 2) {
        for (let tileY = y; tileY < y + height; tileY += tileSize * 2) {
          if (Math.random() > 0.7) {
            ctx.fillStyle = `rgba(200, 220, 240, 0.3)`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    } else if (theme === 'dark') {
      // Dark theme - add some subtle variation
      ctx.fillStyle = '#2a2a2a';
      for (let tileX = x; tileX < x + width; tileX += tileSize * 3) {
        for (let tileY = y; tileY < y + height; tileY += tileSize * 3) {
          if (Math.random() > 0.8) {
            ctx.fillStyle = `rgba(100, 100, 100, 0.2)`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    } else {
      // Light theme - add some subtle variation
      ctx.fillStyle = '#f8f9fa';
      for (let tileX = x; tileX < x + width; tileX += tileSize * 3) {
        for (let tileY = y; tileY < y + height; tileY += tileSize * 3) {
          if (Math.random() > 0.8) {
            ctx.fillStyle = `rgba(200, 200, 200, 0.3)`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    }
  };

  // Function to draw enhanced map tiles for terrain
  const drawEnhancedMapTiles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, theme: string) => {
    const tileSize = 12; // Even smaller tiles for more detail
    
    // Base terrain colors based on theme
    let baseColor, gridColor, featureColor;
    if (theme === 'dark') {
      baseColor = '#0f172a';
      gridColor = 'rgba(148, 163, 184, 0.15)';
      featureColor = 'rgba(148, 163, 184, 0.25)';
    } else if (theme === 'accent') {
      // Satellite theme - use realistic aerial colors
      baseColor = '#e8f4f8'; // Light blue-gray base for aerial view
      gridColor = 'rgba(59, 130, 246, 0.05)'; // Very subtle blue grid
      featureColor = 'rgba(59, 130, 246, 0.1)'; // Subtle blue features
    } else {
      baseColor = '#f8fafc';
      gridColor = 'rgba(148, 163, 184, 0.1)';
      featureColor = 'rgba(148, 163, 184, 0.15)';
    }
    
    // Fill base terrain
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, width, height);
    
    // Draw very subtle grid for map reference (barely visible)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.3;
    
    // Draw vertical lines
    for (let tileX = x; tileX <= x + width; tileX += tileSize) {
      ctx.beginPath();
      ctx.moveTo(tileX, y);
      ctx.lineTo(tileX, y + height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let tileY = y; tileY <= y + height; tileY += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, tileY);
      ctx.lineTo(x + width, tileY);
      ctx.stroke();
    }
    
    // Add realistic terrain features with higher density
    if (theme === 'accent') {
      // Satellite theme - create realistic aerial terrain appearance
      for (let tileX = x; tileX < x + width; tileX += tileSize) {
        for (let tileY = y; tileY < y + height; tileY += tileSize) {
          const rand = Math.random();
          
          if (rand > 0.7) {
            // Dense forest areas - dark green clusters
            ctx.fillStyle = 'rgba(21, 128, 61, 0.7)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.55) {
            // Grass/meadow areas - light green patches
            ctx.fillStyle = 'rgba(134, 239, 172, 0.6)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.4) {
            // Water features - blue with varying opacity
            ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + Math.random() * 0.3})`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.25) {
            // Rock/mountain areas - gray-brown variations
            ctx.fillStyle = `rgba(148, 163, 184, ${0.4 + Math.random() * 0.3})`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.15) {
            // Urban/developed areas - light gray
            ctx.fillStyle = 'rgba(245, 245, 244, 0.5)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.1) {
            // Agricultural areas - tan/brown
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
      
      // Add aerial texture overlay for more realism
      for (let tileX = x; tileX < x + width; tileX += tileSize * 2) {
        for (let tileY = y; tileY < y + height; tileY += tileSize * 2) {
          if (Math.random() > 0.8) {
            // Add subtle aerial texture variations
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.1})`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    } else if (theme === 'dark') {
      // Dark theme - add subtle terrain variation
      for (let tileX = x; tileX < x + width; tileX += tileSize) {
        for (let tileY = y; tileY < y + height; tileY += tileSize) {
          const rand = Math.random();
          
          if (rand > 0.7) {
            // Subtle elevation changes
            ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.6) {
            // Darker areas
            ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.5) {
            // Very subtle variations
            ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    } else {
      // Light theme - add natural terrain features
      for (let tileX = x; tileX < x + width; tileX += tileSize) {
        for (let tileY = y; tileY < y + height; tileY += tileSize) {
          const rand = Math.random();
          
          if (rand > 0.8) {
            // Trees - more visible
            ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.65) {
            // Grass - more prominent
            ctx.fillStyle = 'rgba(134, 239, 172, 0.3)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.5) {
            // Water - more visible
            ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.35) {
            // Paths/trails - subtle but visible
            ctx.fillStyle = 'rgba(245, 245, 244, 0.4)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.25) {
            // Very subtle elevation changes
            ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    }
  };

  // Helper function for rounded rectangles (browser compatibility)
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Render poster preview whenever relevant state changes
  useEffect(() => {
    if (coordinates.length > 0) {
      renderPosterPreview();
    }
  }, [coordinates, title, subtitle, theme, selectedSize, posterStyle]);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const activityId = params.id as string;
    
    if (!accessToken) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    async function fetchActivity() {
      try {
        console.log('Fetching activity:', activityId);
        const data = await getActivity(accessToken!, activityId);
        console.log('Activity data received:', data);
        setActivity(data);
        
        if (data.map?.summary_polyline) {
          console.log('Found polyline, decoding coordinates...');
          const coords = decodePolyline(data.map.summary_polyline);
          console.log('Decoded coordinates:', coords.length, coords);
          setCoordinates(coords);
        } else {
          console.warn('No polyline data found in activity:', data);
          setError('This activity has no GPS data to display');
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
        setError('Failed to fetch activity');
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [params.id, searchParams]);

  useEffect(() => {
    if (!mapContainer.current || !coordinates.length) {
      console.log('Map initialization skipped:', { 
        hasContainer: !!mapContainer.current, 
        coordinatesLength: coordinates.length,
        coordinates: coordinates 
      });
      return;
    }

    console.log('Initializing Leaflet map with:', { 
      coordinates: coordinates.length, 
      theme
    });

    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    // Create map
    map.current = L.map(mapContainer.current, {
      center: [coordinates[0][1], coordinates[0][0]], // Leaflet expects [lat, lng]
      zoom: 13, // Initial zoom level
      zoomControl: false
    });

    // Add tile layer based on theme
    let tileLayer: L.TileLayer;
    if (theme === 'dark') {
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap contributors'
      });
    } else if (theme === 'accent') {
      // Satellite view - try multiple satellite providers with fallbacks
      console.log('Attempting to load satellite imagery...');
      
      // Try Google Satellite first (most reliable)
      tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '©Google',
        maxZoom: 20
      });
      
      // Add error handling for satellite tiles
      tileLayer.on('tileerror', (e) => {
        console.error('Google satellite tile error:', e);
        
        if (map.current) {
          // Remove the failed layer
          map.current.removeLayer(tileLayer);
          
          // Try Esri World Imagery as first fallback
          console.log('Trying Esri World Imagery as fallback...');
          const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '©Esri',
            maxZoom: 19
          });
          
          esriLayer.addTo(map.current);
          
          // If Esri also fails, try Bing Aerial
          esriLayer.on('tileerror', (e2) => {
            console.error('Esri satellite tile error:', e2);
            
            if (map.current) {
              map.current.removeLayer(esriLayer);
              
              console.log('Trying Bing Aerial as final fallback...');
              const bingLayer = L.tileLayer('https://ecn.t3.tiles.virtualearth.net/tiles/a{q}.jpeg?g=1', {
                attribution: '©Bing Maps',
                maxZoom: 19,
                subdomains: ['0', '1', '2', '3']
              });
              
              bingLayer.addTo(map.current);
              
              // If all satellite providers fail, use OpenStreetMap with warning
              bingLayer.on('tileerror', (e3) => {
                console.error('All satellite providers failed, using OpenStreetMap fallback');
                
                if (map.current) {
                  map.current.removeLayer(bingLayer);
                  
                  const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '©OpenStreetMap contributors (satellite fallback)'
                  });
                  fallbackLayer.addTo(map.current);
                  
                  // Show user notification that satellite view failed
                  console.warn('Satellite view unavailable - showing map view instead');
                }
              });
            }
          });
        }
      });
    } else {
      // Light theme - use OpenStreetMap
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap contributors'
      });
    }

    tileLayer.addTo(map.current);

    // Add error handling for tile loading with fallback
    tileLayer.on('tileerror', (e) => {
      console.error('Map tile loading error:', e);
      // If satellite fails, fall back to OpenStreetMap
      if (theme === 'accent' && map.current) {
        console.log('Falling back to OpenStreetMap due to satellite tile error');
        const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '©OpenStreetMap contributors (fallback)'
        });
        fallbackLayer.addTo(map.current);
      }
    });

    // Create polyline from coordinates
    const polyline = L.polyline(coordinates.map(coord => [coord[1], coord[0]]), {
      color: theme === 'dark' ? '#ffffff' : theme === 'accent' ? '#ffff00' : '#000000', // Yellow for satellite, white for dark, black for light
      weight: 4, // Slightly thicker for better visibility
      opacity: 0.9
    });

    polyline.addTo(map.current);

    // Fit map to polyline bounds
    const bounds = polyline.getBounds();
    map.current.fitBounds(bounds, { padding: [20, 20] });

    // Add zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [coordinates, theme]);

  // Handle print generation
  const handleRenderPrint = async () => {
    if (!coordinates.length) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set poster dimensions
    const getSizeDimensions = (size: string) => {
      switch (size) {
        case 'digital': return { width: 2400, height: 3600 }; // 2:3 ratio
        case 'small': return { width: 2400, height: 3600 }; // 2:3 ratio
        case 'medium': return { width: 3000, height: 4500 }; // 2:3 ratio
        case 'large': return { width: 3600, height: 5400 }; // 2:3 ratio
        default: return { width: 3000, height: 4500 }; // medium default
      }
    };
    
    const { width: posterWidth, height: posterHeight } = getSizeDimensions(selectedSize);
    canvas.width = posterWidth;
    canvas.height = posterHeight;

    if (posterStyle === 'art-print') {
      renderArtPrintPoster(ctx, posterWidth, posterHeight, selectedSize);
    } else {
      renderClassicPoster(ctx, posterWidth, posterHeight, selectedSize);
    }

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trace-prints-${selectedSize}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  // Handle buy print (placeholder for now)
  const handleBuyPrint = () => {
    // This would integrate with a print service
    alert('Print ordering coming soon! For now, use "Save Digital Poster" to download your high-resolution file.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Trace Prints</h1>
          </div>
          <div className="text-sm text-gray-500">
            {activity?.name || 'Loading activity...'}
          </div>
        </div>
      </div>

      {/* Main Content - Right Sidebar Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left: Poster Preview (Main Content) */}
        <div className="flex-1 bg-white overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your activity...</p>
              </div>
            </div>
          ) : coordinates.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-2xl w-full">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <canvas 
                      id="posterCanvas"
                      className="w-full h-auto rounded-2xl"
                      style={{ 
                        maxHeight: '700px',
                        aspectRatio: '2/3' // Ensure portrait orientation is maintained
                      }}
                    />
                  </div>
                  
                  {/* Poster Details */}
                  <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Size: {selectedSize.toUpperCase()} • Style: {posterStyle === 'classic' ? 'Classic' : 'Art Print'} • Theme: {theme === 'light' ? 'Classic' : theme === 'dark' ? 'Dark' : 'Satellite'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No GPS Data Available</h3>
                <p className="text-gray-600">This activity doesn&apos;t have GPS coordinates to display on the poster.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            {/* Stepper Navigation */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customize Your Poster</h2>
                <div className="text-sm text-gray-500">Step {currentStep} of 4</div>
              </div>
              
              <div className="space-y-3">
                <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  currentStep === 1 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div>
                    <div className={`font-medium ${currentStep === 1 ? 'text-blue-900' : 'text-gray-700'}`}>Route</div>
                    <div className="text-sm text-gray-500">Select your activity</div>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  currentStep === 2 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <div>
                    <div className={`font-medium ${currentStep === 2 ? 'text-blue-900' : 'text-gray-700'}`}>Style</div>
                    <div className="text-sm text-gray-500">Choose poster style & map theme</div>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  currentStep === 3 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <div>
                    <div className={`font-medium ${currentStep === 3 ? 'text-blue-900' : 'text-gray-700'}`}>Text</div>
                    <div className="text-sm text-gray-500">Add title & subtitle</div>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  currentStep === 4 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    4
                  </div>
                  <div>
                    <div className={`font-medium ${currentStep === 4 ? 'text-blue-900' : 'text-gray-700'}`}>Size</div>
                    <div className="text-sm text-gray-500">Select print size</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {/* Step 1: Route Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Current Activity</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{activity?.name || 'Loading...'}</div>
                          <div className="text-sm text-gray-500">{coordinates.length} GPS points</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={!coordinates.length}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Continue to Style
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Style Selection */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poster Style</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="posterStyle"
                          value="classic"
                          checked={posterStyle === 'classic'}
                          onChange={(e) => setPosterStyle(e.target.value as 'classic' | 'art-print')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Classic</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="posterStyle"
                          value="art-print"
                          checked={posterStyle === 'art-print'}
                          onChange={(e) => setPosterStyle(e.target.value as 'classic' | 'art-print')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Art Print</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Map Style</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={theme === 'light'}
                          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'accent')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Classic</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={theme === 'dark'}
                          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'accent')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Dark</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value="accent"
                          checked={theme === 'accent'}
                          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'accent')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Satellite</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Continue to Text
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Text Input */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poster Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Morning Run, Epic Ride"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (Optional)</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g., January 15, 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Continue to Size
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Size Selection */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Print Size</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="selectedSize"
                          value="digital"
                          checked={selectedSize === 'digital'}
                          onChange={(e) => setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Digital</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="selectedSize"
                          value="small"
                          checked={selectedSize === 'small'}
                          onChange={(e) => setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Small</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="selectedSize"
                          value="medium"
                          checked={selectedSize === 'medium'}
                          onChange={(e) => setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Medium</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="selectedSize"
                          value="large"
                          checked={selectedSize === 'large'}
                          onChange={(e) => setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Large</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Fixed at Bottom */}
            <div className="fixed bottom-0 right-0 w-96 bg-white border-t border-gray-200 p-6">
              <div className="space-y-3">
                <button
                  onClick={handleRenderPrint}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Save Digital Poster
                </button>
                <button
                  onClick={handleBuyPrint}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg text-lg font-semibold transition-colors"
                >
                  Get It Printed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Preview() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}