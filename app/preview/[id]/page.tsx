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
  
  const [activity, setActivity] = useState<{name?: string; map?: {summary_polyline?: string}} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [activeTab, setActiveTab] = useState<'routes' | 'style' | 'text' | 'size'>('routes');
  const [selectedSize, setSelectedSize] = useState('20x24');

  // Function to render poster in real-time
  const renderPosterPreview = useCallback(() => {
    if (!coordinates.length) return;
    
    const canvas = document.getElementById('posterCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for preview (larger for better visibility)
    const previewWidth = 600;
    const previewHeight = 400;
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Calculate scale factor for preview
    const scaleFactor = previewWidth / (2400 * (selectedSize === '16x20' ? 1 : selectedSize === '20x24' ? 1.25 : 1.5));

    // Fill background
    ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : theme === 'accent' ? '#f8f9fa' : '#ffffff';
    ctx.fillRect(0, 0, previewWidth, previewHeight);

    // Add title
    if (title) {
      ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
      ctx.font = `bold ${Math.floor(72 * scaleFactor)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, previewWidth / 2, Math.floor(120 * scaleFactor));
    }

    // Add subtitle
    if (subtitle) {
      ctx.fillStyle = theme === 'dark' ? '#cccccc' : '#666666';
      ctx.font = `${Math.floor(36 * scaleFactor)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(subtitle, previewWidth / 2, Math.floor(180 * scaleFactor));
    }

    // Add activity name
    ctx.fillStyle = theme === 'dark' ? '#888888' : '#333333';
    ctx.font = `${Math.floor(24 * scaleFactor)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(activity?.name || 'Strava Activity', previewWidth / 2, Math.floor(220 * scaleFactor));

    // Add activity statistics
    const statsY = Math.floor(260 * scaleFactor);
    ctx.fillStyle = theme === 'dark' ? '#666666' : '#999999';
    ctx.font = `${Math.floor(18 * scaleFactor)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    
    const distance = '8.85 mi';
    const duration = '1:23:45';
    const avgSpeed = '6.4 mph';
    
    ctx.fillText(`${distance} • ${duration} • ${avgSpeed}`, previewWidth / 2, statsY);

    // Add map area background
    const mapAreaX = Math.floor(100 * scaleFactor);
    const mapAreaY = Math.floor(320 * scaleFactor);
    const mapAreaWidth = previewWidth - Math.floor(200 * scaleFactor);
    const mapAreaHeight = previewHeight - Math.floor(500 * scaleFactor);

    // Draw map background with theme-appropriate color
    ctx.fillStyle = theme === 'dark' ? '#2a2a2a' : theme === 'accent' ? '#e8f4f8' : '#f0f0f0';
    ctx.fillRect(mapAreaX, mapAreaY, mapAreaWidth, mapAreaHeight);

    // Add subtle map grid pattern
    ctx.strokeStyle = theme === 'dark' ? '#444444' : theme === 'accent' ? '#d0e8f0' : '#e0e0e0';
    ctx.lineWidth = 1;
    const gridSize = Math.floor(20 * scaleFactor);
    for (let x = mapAreaX; x < mapAreaX + mapAreaWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, mapAreaY);
      ctx.lineTo(x, mapAreaY + mapAreaHeight);
      ctx.stroke();
    }
    for (let y = mapAreaY; y < mapAreaY + mapAreaHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(mapAreaX, y);
      ctx.lineTo(mapAreaX + mapAreaWidth, y);
      ctx.stroke();
    }

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
      const latPadding = (maxLat - minLat) * 0.1;
      const lngPadding = (maxLng - minLng) * 0.1;
      minLat -= latPadding;
      maxLat += latPadding;
      minLng -= lngPadding;
      maxLng += lngPadding;

      // Function to convert GPS coordinates to canvas coordinates
      const gpsToCanvas = (lat: number, lng: number) => {
        const x = mapAreaX + ((lng - minLng) / (maxLng - minLng)) * mapAreaWidth;
        const y = mapAreaY + ((maxLat - lat) / (maxLat - minLat)) * mapAreaHeight;
        return { x, y };
      };

      // Draw the actual route path
      ctx.strokeStyle = theme === 'dark' ? '#00ff88' : theme === 'accent' ? '#0066cc' : '#ff6b35';
      ctx.lineWidth = Math.max(3, Math.floor(6 * scaleFactor));
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

      // Add start and end markers
      const start = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
      const end = gpsToCanvas(coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]);
      
      // Start marker (green circle)
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(start.x, start.y, Math.floor(8 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
      
      // End marker (red circle)
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(end.x, end.y, Math.floor(8 * scaleFactor), 0, 2 * Math.PI);
      ctx.fill();
    }

    // Add route points indicator
    ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
    ctx.font = `${Math.floor(16 * scaleFactor)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${coordinates.length} GPS points`, previewWidth / 2, mapAreaY + mapAreaHeight + Math.floor(40 * scaleFactor));

    // Add footer
    ctx.fillStyle = theme === 'dark' ? '#666666' : '#999999';
    ctx.font = `${Math.floor(16 * scaleFactor)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${selectedSize.toUpperCase()} • Trace Prints`, previewWidth / 2, previewHeight - Math.floor(50 * scaleFactor));
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
    const tileLayer = theme === 'dark' 
      ? L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '©OpenStreetMap contributors'
        })
      : theme === 'accent'
      ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '©Esri'
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '©OpenStreetMap contributors'
        });

    tileLayer.addTo(map.current);

    // Add error handling for tile loading
    tileLayer.on('tileerror', (e) => {
      console.error('Map tile loading error:', e);
    });

    // Create polyline from coordinates
    const polyline = L.polyline(coordinates.map(coord => [coord[1], coord[0]]), {
      color: theme === 'dark' ? '#ffffff' : '#000000',
      weight: 3,
      opacity: 0.8
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

      // Set poster dimensions based on selected size
      const sizeMultiplier = selectedSize === '16x20' ? 1 : selectedSize === '20x24' ? 1.25 : 1.5;
      const posterWidth = 2400 * sizeMultiplier;
      const posterHeight = 1350 * sizeMultiplier;
      canvas.width = posterWidth;
      canvas.height = posterHeight;

      // Fill background
      ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : theme === 'accent' ? '#f8f9fa' : '#ffffff';
      ctx.fillRect(0, 0, posterWidth, posterHeight);

      // Add title
      if (title) {
        ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
        ctx.font = `bold ${72 * sizeMultiplier}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(title, posterWidth / 2, 120 * sizeMultiplier);
      }

      // Add subtitle
      if (subtitle) {
        ctx.fillStyle = theme === 'dark' ? '#cccccc' : '#666666';
        ctx.font = `${36 * sizeMultiplier}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(subtitle, posterWidth / 2, 180 * sizeMultiplier);
      }

      // Add activity name
      ctx.fillStyle = theme === 'dark' ? '#888888' : '#333333';
      ctx.font = `${24 * sizeMultiplier}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(activity?.name || 'Strava Activity', posterWidth / 2, 220 * sizeMultiplier);

      // Add activity statistics
      const statsY = 260 * sizeMultiplier;
      ctx.fillStyle = theme === 'dark' ? '#666666' : '#999999';
      ctx.font = `${18 * sizeMultiplier}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      
      // Calculate some mock stats (in real app, get these from Strava API)
      const distance = '8.85 mi';
      const duration = '1:23:45';
      const avgSpeed = '6.4 mph';
      
      ctx.fillText(`${distance} • ${duration} • ${avgSpeed}`, posterWidth / 2, statsY);

      // Add map area background
      const mapAreaX = 100 * sizeMultiplier;
      const mapAreaY = 320 * sizeMultiplier;
      const mapAreaWidth = posterWidth - (200 * sizeMultiplier);
      const mapAreaHeight = posterHeight - (500 * sizeMultiplier);

      ctx.fillStyle = theme === 'dark' ? '#2a2a2a' : theme === 'accent' ? '#e8f4f8' : '#f0f0f0';
      ctx.fillRect(mapAreaX, mapAreaY, mapAreaWidth, mapAreaHeight);

      // Add subtle map grid pattern
      ctx.strokeStyle = theme === 'dark' ? '#444444' : theme === 'accent' ? '#d0e8f0' : '#e0e0e0';
      ctx.lineWidth = 2 * sizeMultiplier;
      const gridSize = 50 * sizeMultiplier;
      for (let x = mapAreaX; x < mapAreaX + mapAreaWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, mapAreaY);
        ctx.lineTo(x, mapAreaY + mapAreaHeight);
        ctx.stroke();
      }
      for (let y = mapAreaY; y < mapAreaY + mapAreaHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(mapAreaX, y);
        ctx.lineTo(mapAreaX + mapAreaWidth, y);
        ctx.stroke();
      }

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
        const latPadding = (maxLat - minLat) * 0.1;
        const lngPadding = (maxLng - minLng) * 0.1;
        minLat -= latPadding;
        maxLat += latPadding;
        minLng -= lngPadding;
        maxLng += lngPadding;

        // Function to convert GPS coordinates to canvas coordinates
        const gpsToCanvas = (lat: number, lng: number) => {
          const x = mapAreaX + ((lng - minLng) / (maxLng - minLng)) * mapAreaWidth;
          const y = mapAreaY + ((maxLat - lat) / (maxLat - minLat)) * mapAreaHeight;
          return { x, y };
        };

        // Draw the actual route path
        ctx.strokeStyle = theme === 'dark' ? '#00ff88' : theme === 'accent' ? '#0066cc' : '#ff6b35';
        ctx.lineWidth = 8 * sizeMultiplier;
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

        // Add start and end markers
        const start = gpsToCanvas(coordinates[0][0], coordinates[0][1]);
        const end = gpsToCanvas(coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]);
        
        // Start marker (green circle)
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 20 * sizeMultiplier, 0, 2 * Math.PI);
        ctx.fill();
        
        // End marker (red circle)
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(end.x, end.y, 20 * sizeMultiplier, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Add route points indicator
      ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
      ctx.font = `${16 * sizeMultiplier}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${coordinates.length} GPS points`, posterWidth / 2, mapAreaY + mapAreaHeight + (40 * sizeMultiplier));

      // Add footer with size and branding
      ctx.fillStyle = theme === 'dark' ? '#666666' : '#999999';
      ctx.font = `${16 * sizeMultiplier}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${selectedSize.toUpperCase()} • Generated by Trace Prints`, posterWidth / 2, posterHeight - (50 * sizeMultiplier));

      // Create preview image
      const previewUrl = canvas.toDataURL('image/png');
      // setPosterPreview(previewUrl); // Removed
      // setShowPreview(true); // Removed

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
      <div className="w-1/3 p-8 bg-white shadow-lg overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{activity?.name}</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'routes'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Routes
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'style'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setActiveTab('size')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'size'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Size
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Activity</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">{activity?.name}</div>
                <div className="text-xs text-blue-700 mt-1">Route points: {coordinates.length}</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Activity Statistics</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">8.85</div>
                  <div className="text-xs text-gray-600">miles</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">1:23</div>
                  <div className="text-xs text-gray-600">duration</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">6.4</div>
                  <div className="text-xs text-gray-600">mph avg</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Map Style</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === 'light' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-medium">Classic</div>
                  <div className="text-xs text-gray-500">Clean & Simple</div>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-medium">Modern</div>
                  <div className="text-xs text-gray-500">Dark & Sleek</div>
                </button>
                <button
                  onClick={() => setTheme('accent')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === 'accent' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-medium">Satellite</div>
                  <div className="text-xs text-gray-500">Aerial View</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Customize Your Print</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Enter a memorable title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    placeholder="Add a personal message..."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'size' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Print Size</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedSize('16x20')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSize === '16x20'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">16&quot; x 20&quot;</div>
                  <div className="text-sm text-gray-600">Perfect for smaller spaces</div>
                  <div className="text-sm font-medium text-blue-600 mt-1">$19</div>
                </button>
                
                <button
                  onClick={() => setSelectedSize('20x24')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSize === '20x24'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">20&quot; x 24&quot;</div>
                  <div className="text-sm text-gray-600">Most popular size</div>
                  <div className="text-sm font-medium text-blue-600 mt-1">$25</div>
                </button>
                
                <button
                  onClick={() => setSelectedSize('24x36')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSize === '24x36'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">24&quot; x 36&quot;</div>
                  <div className="text-sm text-gray-600">Statement piece</div>
                  <div className="text-sm font-medium text-blue-600 mt-1">$35</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Always Visible */}
        <div className="border-t pt-6 mt-6">
          <div className="space-y-3">
            <button
              onClick={handleRenderPrint}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download High-Resolution Poster
            </button>
            
            <button
              onClick={handleBuyPrint}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Order Print - ${selectedSize === '16x20' ? '19' : selectedSize === '20x24' ? '25' : '35'}
            </button>
          </div>
          
          {/* Poster Preview Section */}
          {/* Removed Poster Preview Section */}
        </div>
      </div>

      <div className="flex-1 relative bg-gray-100">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading your route...</div>
            </div>
          </div>
        ) : coordinates.length > 0 ? (
          <div className="absolute inset-0 flex flex-col">
            {/* Poster as the main focus */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Custom Poster</h2>
                  <p className="text-gray-600">Live preview - customize on the left, see results here</p>
                </div>
                
                {/* Poster Canvas - Large and prominent */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <canvas 
                    id="posterCanvas"
                    className="w-full h-auto border border-gray-200 rounded shadow-lg"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
                
                {/* Poster Details */}
                <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">Size</div>
                    <div>{selectedSize === '16x20' ? '16" x 20"' : selectedSize === '20x24' ? '20" x 24"' : '24" x 36"'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">Theme</div>
                    <div>{theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">GPS Points</div>
                    <div>{coordinates.length}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Small map at the bottom for reference */}
            <div className="h-48 bg-white border-t border-gray-200">
              <div className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Route Reference</div>
                <div className="h-32 relative">
                  <div ref={mapContainer} className="absolute inset-0 rounded border border-gray-200" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
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
        
        {/* Map Controls Overlay - moved to bottom map */}
        {coordinates.length > 0 && (
          <div className="absolute bottom-52 right-4 bg-white rounded-lg shadow-lg p-2">
            <div className="text-xs text-gray-600 mb-2">Map Style: {theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
            <div className="text-xs text-gray-500">Route points: {coordinates.length}</div>
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