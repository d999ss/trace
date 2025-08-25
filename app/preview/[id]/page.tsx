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
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [selectedSize, setSelectedSize] = useState('medium');

  // Function to render poster in real-time
  const renderPosterPreview = useCallback(() => {
    if (!coordinates.length) return;
    
    const canvas = document.getElementById('posterCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for preview (portrait orientation)
    const previewWidth = 400;
    const previewHeight = 600;
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Calculate scale factor for preview based on new size options
    const getSizeDimensions = (size: string) => {
      switch (size) {
        case 'digital': return { width: 2400, height: 3600 }; // 2:3 ratio
        case 'small': return { width: 2400, height: 3600 }; // 2:3 ratio
        case 'medium': return { width: 3000, height: 4500 }; // 2:3 ratio
        case 'large': return { width: 3600, height: 5400 }; // 2:3 ratio
        default: return { width: 3000, height: 4500 }; // medium default
      }
    };
    
    const { width: posterWidth } = getSizeDimensions(selectedSize);
    const scaleFactor = previewWidth / posterWidth;

    // Fill background with pure white for Apple-like framing
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, previewWidth, previewHeight);

    // TOP SECTION: Title & Subtitle (Apple-like hierarchy)
    const topMargin = Math.floor(80 * scaleFactor);
    const titleY = topMargin;
    const subtitleY = titleY + Math.floor(60 * scaleFactor);

    // Title: Bold, all caps, instantly recognizable
    if (title) {
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${Math.floor(48 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title.toUpperCase(), previewWidth / 2, titleY);
    }

    // Subtitle: Lighter, smaller, secondary information
    if (subtitle) {
      ctx.fillStyle = '#666666';
      ctx.font = `${Math.floor(24 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(subtitle, previewWidth / 2, subtitleY);
    }

    // MIDDLE SECTION: Hero Map Block (floating, not touching edges)
    const mapBlockTop = subtitle ? subtitleY + Math.floor(40 * scaleFactor) : titleY + Math.floor(40 * scaleFactor);
    const mapBlockHeight = Math.floor(280 * scaleFactor);
    const mapBlockMargin = Math.floor(60 * scaleFactor);
    const mapBlockWidth = previewWidth - (mapBlockMargin * 2);
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
      ctx.lineWidth = Math.max(4, Math.floor(8 * scaleFactor));
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
      ctx.arc(start.x, start.y, Math.floor(6 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
      
      // End marker (subtle circle)
      ctx.beginPath();
      ctx.arc(end.x, end.y, Math.floor(6 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
    }

    // BOTTOM SECTION: Stats Bar (Apple-like status bar)
    const statsBarTop = mapBlockY + mapBlockHeight + Math.floor(40 * scaleFactor);
    const statsBarHeight = Math.floor(80 * scaleFactor);
    const statsBarY = statsBarTop;
    
    // Calculate stats (mock data for now)
    const distance = '8.85 mi';
    const elevation = '+1,247 ft';
    const duration = '1:23:45';
    
    // Stats container background (subtle, not competing)
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, statsBarY, previewWidth, statsBarHeight);
    
    // Draw stats with tiny icons and proper hierarchy
    const statSpacing = previewWidth / 3;
    const iconSize = Math.floor(16 * scaleFactor);
    const statTextSize = Math.floor(20 * scaleFactor);
    const statLabelSize = Math.floor(12 * scaleFactor);
    
    // Distance stat
    const distanceX = statSpacing * 0.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(distance, distanceX, statsBarY + Math.floor(25 * scaleFactor));
    
    // Distance icon (simple line icon)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(distanceX - Math.floor(15 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.lineTo(distanceX + Math.floor(15 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.stroke();
    
    // Distance label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DISTANCE', distanceX, statsBarY + Math.floor(70 * scaleFactor));
    
    // Elevation stat
    const elevationX = statSpacing * 1.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(elevation, elevationX, statsBarY + Math.floor(25 * scaleFactor));
    
    // Elevation icon (mountain peak)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(elevationX - Math.floor(15 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.lineTo(elevationX, statsBarY + Math.floor(45 * scaleFactor));
    ctx.lineTo(elevationX + Math.floor(15 * scaleFactor), statsBarY + Math.floor(55 * scaleFactor));
    ctx.stroke();
    
    // Elevation label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ELEVATION', elevationX, statsBarY + Math.floor(70 * scaleFactor));
    
    // Duration stat
    const durationX = statSpacing * 2.5;
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(duration, durationX, statsBarY + Math.floor(25 * scaleFactor));
    
    // Duration icon (clock)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(durationX, statsBarY + Math.floor(50 * scaleFactor), Math.floor(8 * scaleFactor), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(durationX, statsBarY + Math.floor(50 * scaleFactor));
    ctx.lineTo(durationX + Math.floor(6 * scaleFactor), statsBarY + Math.floor(50 * scaleFactor));
    ctx.stroke();
    
    // Duration label
    ctx.fillStyle = '#666666';
    ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DURATION', durationX, statsBarY + Math.floor(70 * scaleFactor));

    // FOOTER: Branding (subtle, not competing)
    const footerY = previewHeight - Math.floor(40 * scaleFactor);
    ctx.fillStyle = '#999999';
    ctx.font = `${Math.floor(14 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${selectedSize.toUpperCase()} • TRACE PRINTS`, previewWidth / 2, footerY);
  }, [coordinates, title, subtitle, theme, selectedSize, activity]);

  // Render poster preview whenever relevant state changes
  useEffect(() => {
    renderPosterPreview();
  }, [renderPosterPreview]);

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
    let tileLayer;
    if (theme === 'dark') {
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap contributors'
      });
    } else if (theme === 'accent') {
      // Satellite view - use Esri satellite tiles
      tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '©Esri',
        maxZoom: 19
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

  const handleRenderPrint = async () => {
    try {
      // Create a canvas for the poster
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set poster dimensions based on selected size (portrait orientation)
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

      // Fill background with pure white for Apple-like framing
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, posterWidth, posterHeight);

      // TOP SECTION: Title & Subtitle (Apple-like hierarchy)
      const topMargin = 120 * (posterWidth / 3000);
      const titleY = topMargin;
      const subtitleY = titleY + (60 * (posterWidth / 3000));

      // Title: Bold, all caps, instantly recognizable
      if (title) {
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${72 * (posterWidth / 3000)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(title.toUpperCase(), posterWidth / 2, titleY);
      }

      // Subtitle: Lighter, smaller, secondary information
      if (subtitle) {
        ctx.fillStyle = '#666666';
        ctx.font = `${36 * (posterWidth / 3000)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(subtitle, posterWidth / 2, subtitleY);
      }

      // MIDDLE SECTION: Hero Map Block (floating, not touching edges)
      const mapBlockTop = subtitle ? subtitleY + (40 * (posterWidth / 3000)) : titleY + (40 * (posterWidth / 3000));
      const mapBlockHeight = 400 * (posterWidth / 3000);
      const mapBlockMargin = 100 * (posterWidth / 3000);
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
        ctx.lineWidth = 12 * (posterWidth / 3000);
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
        ctx.arc(start.x, start.y, 20 * (posterWidth / 3000), 0, 2 * Math.PI);
        ctx.fill();
        
        // End marker (subtle circle)
        ctx.beginPath();
        ctx.arc(end.x, end.y, 20 * (posterWidth / 3000), 0, 2 * Math.PI);
        ctx.fill();
      }

      // BOTTOM SECTION: Stats Bar (Apple-like status bar)
      const statsBarTop = mapBlockY + mapBlockHeight + (60 * (posterWidth / 3000));
      const statsBarHeight = 120 * (posterWidth / 3000);
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
      const statTextSize = 30 * (posterWidth / 3000);
      const statLabelSize = 18 * (posterWidth / 3000);
      
      // Distance stat
      const distanceX = statSpacing * 0.5;
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(distance, distanceX, statsBarY + (40 * (posterWidth / 3000)));
      
      // Distance icon (simple line icon)
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 3 * (posterWidth / 3000);
      ctx.beginPath();
      ctx.moveTo(distanceX - (25 * (posterWidth / 3000)), statsBarY + (80 * (posterWidth / 3000)));
      ctx.lineTo(distanceX + (25 * (posterWidth / 3000)), statsBarY + (80 * (posterWidth / 3000)));
      ctx.stroke();
      
      // Distance label
      ctx.fillStyle = '#666666';
      ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('DISTANCE', distanceX, statsBarY + (105 * (posterWidth / 3000)));
      
      // Elevation stat
      const elevationX = statSpacing * 1.5;
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(elevation, elevationX, statsBarY + (40 * (posterWidth / 3000)));
      
      // Elevation icon (mountain peak)
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 3 * (posterWidth / 3000);
      ctx.beginPath();
      ctx.moveTo(elevationX - (25 * (posterWidth / 3000)), statsBarY + (80 * (posterWidth / 3000)));
      ctx.lineTo(elevationX, statsBarY + (65 * (posterWidth / 3000)));
      ctx.lineTo(elevationX + (25 * (posterWidth / 3000)), statsBarY + (80 * (posterWidth / 3000)));
      ctx.stroke();
      
      // Elevation label
      ctx.fillStyle = '#666666';
      ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ELEVATION', elevationX, statsBarY + (105 * (posterWidth / 3000)));
      
      // Duration stat
      const durationX = statSpacing * 2.5;
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${statTextSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(duration, durationX, statsBarY + (40 * (posterWidth / 3000)));
      
      // Duration icon (clock)
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 3 * (posterWidth / 3000);
      ctx.beginPath();
      ctx.arc(durationX, statsBarY + (75 * (posterWidth / 3000)), 15 * (posterWidth / 3000), 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(durationX, statsBarY + (75 * (posterWidth / 3000)));
      ctx.lineTo(durationX + (10 * (posterWidth / 3000)), statsBarY + (75 * (posterWidth / 3000)));
      ctx.stroke();
      
      // Duration label
      ctx.fillStyle = '#666666';
      ctx.font = `${statLabelSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('DURATION', durationX, statsBarY + (105 * (posterWidth / 3000)));

      // FOOTER: Branding (subtle, not competing)
      const footerY = posterHeight - (60 * (posterWidth / 3000));
      ctx.fillStyle = '#999999';
      ctx.font = `${20 * (posterWidth / 3000)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${selectedSize.toUpperCase()} • TRACE PRINTS`, posterWidth / 2, footerY);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `trace-poster-${selectedSize}-${params.id}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Failed to generate poster:', err);
      alert('Failed to generate poster. Please try again.');
    }
  };

  const handleBuyPrint = async () => {
    try {
      if (!process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || !process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
        alert('Shopify is not configured yet. Please use the render button to download your print file.');
        return;
      }

      // Create checkout with the print product
      // For now, we'll use a placeholder product ID - this should be replaced with actual product ID
      const PRINT_PRODUCT_VARIANT_ID = 'YOUR_PRODUCT_VARIANT_ID';
      
      const checkout = await createCheckout(PRINT_PRODUCT_VARIANT_ID, 1);
      
      // Add custom attributes for the design
      await updateCheckoutAttributes(checkout.id, [
        { key: 'activity_id', value: params.id as string },
        { key: 'theme', value: theme },
        { key: 'title', value: title },
        { key: 'subtitle', value: subtitle },
        { key: 'coordinates', value: JSON.stringify(coordinates) }
      ]);

      // Redirect to Shopify checkout
      window.location.href = checkout.webUrl;
    } catch (err) {
      console.error('Failed to create checkout:', err);
      alert('Failed to create checkout. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Apple-style stepper */}
      <div className="w-96 bg-white border-r border-gray-100 flex flex-col">
        {/* Header with stepper */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Create Your Poster</h1>
          
          {/* Stepper Navigation */}
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
                <div className="text-sm text-gray-500">Choose your theme</div>
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
                <div className="text-sm text-gray-500">Add your message</div>
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
                <div className="text-sm text-gray-500">Pick your format</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Content - Only show relevant controls */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Step 1: Route Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Activity Card - Clean and tucked away */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{activity?.name || 'Loading...'}</div>
                    <div className="text-sm text-gray-500">Strava Activity</div>
                  </div>
                </div>
                
                {/* Stats in clean grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">8.85</div>
                    <div className="text-xs text-gray-500">miles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">1:23</div>
                    <div className="text-xs text-gray-500">duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">6.4</div>
                    <div className="text-xs text-gray-500">mph avg</div>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!coordinates.length}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Continue to Style
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Style Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Style</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Classic</div>
                    <div className="text-sm text-gray-600">Clean & Simple</div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Modern</div>
                    <div className="text-sm text-gray-600">Dark & Sleek</div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('accent')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      theme === 'accent' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Satellite</div>
                    <div className="text-sm text-gray-600">Aerial View</div>
                  </button>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex space-x-3">
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

          {/* Step 3: Text Customization */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Your Message</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="Enter a memorable title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                    <input
                      type="text"
                      placeholder="Add a personal message..."
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex space-x-3">
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Size</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedSize('digital')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedSize === 'digital'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Digital</div>
                    <div className="text-sm text-gray-600">High-res digital files only</div>
                    <div className="text-sm font-medium text-blue-600 mt-1">$20</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSize('small')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedSize === 'small'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Small</div>
                    <div className="text-sm text-gray-600">20×30cm / 8×12&quot;</div>
                    <div className="text-sm font-medium text-blue-600 mt-1">$35</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSize('medium')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedSize === 'medium'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Medium</div>
                    <div className="text-sm text-gray-600">30×45cm / 12×18&quot;</div>
                    <div className="text-sm font-medium text-blue-600 mt-1">$55</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSize('large')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedSize === 'large'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Large</div>
                    <div className="text-sm text-gray-600">40×60cm / 16×24&quot;</div>
                    <div className="text-sm font-medium text-blue-600 mt-1">$65</div>
                  </button>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex space-x-3">
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

        {/* Fixed Bottom Bar - Primary Actions */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="space-y-3">
            <button
              onClick={handleRenderPrint}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Save Digital Poster
            </button>
            
            <button
              onClick={handleBuyPrint}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Get It Printed - ${selectedSize === 'digital' ? '20' : selectedSize === 'small' ? '35' : selectedSize === 'medium' ? '55' : '65'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Poster Preview */}
      <div className="flex-1 bg-white">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading your route...</div>
            </div>
          </div>
        ) : coordinates.length > 0 ? (
          <div className="h-full flex flex-col">
            {/* Poster as the main focus - edge-to-edge white */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Custom Poster</h2>
                  <p className="text-gray-600">Live preview - customize on the left, see results here</p>
                </div>
                
                {/* Poster Canvas - Large and prominent with hover effects */}
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <canvas 
                    id="posterCanvas"
                    className="w-full h-auto rounded-2xl"
                    style={{ maxHeight: '700px' }}
                  />
                </div>
                
                {/* Poster Details - Clean and minimal */}
                <div className="mt-8 grid grid-cols-3 gap-6 text-center">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="font-medium text-gray-900">Size</div>
                    <div className="text-sm text-gray-600">{selectedSize === 'digital' ? 'Digital' : selectedSize === 'small' ? 'Small' : selectedSize === 'medium' ? 'Medium' : 'Large'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="font-medium text-gray-900">Theme</div>
                    <div className="text-sm text-gray-600">{theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="font-medium text-gray-900">Route</div>
                    <div className="text-sm text-gray-600">{coordinates.length} points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <div className="text-lg font-medium text-gray-900 mb-2">No GPS Data Available</div>
              <div className="text-gray-600 mb-4">This activity doesn&apos;t have GPS coordinates to display on the map.</div>
              <div className="text-sm text-gray-500">Try selecting a different activity with GPS tracking enabled.</div>
            </div>
          </div>
        )}
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