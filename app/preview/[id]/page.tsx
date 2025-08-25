'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
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

      // Set poster dimensions (16:9 ratio, high resolution for printing)
      const posterWidth = 2400; // 24 inches at 100 DPI
      const posterHeight = 1350; // 13.5 inches at 100 DPI
      canvas.width = posterWidth;
      canvas.height = posterHeight;

      // Fill background
      ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : theme === 'accent' ? '#f8f9fa' : '#ffffff';
      ctx.fillRect(0, 0, posterWidth, posterHeight);

      // Add title
      if (title) {
        ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
        ctx.font = 'bold 72px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, posterWidth / 2, 120);
      }

      // Add subtitle
      if (subtitle) {
        ctx.fillStyle = theme === 'dark' ? '#cccccc' : '#666666';
        ctx.font = '36px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(subtitle, posterWidth / 2, 180);
      }

      // Add activity name
      ctx.fillStyle = theme === 'dark' ? '#888888' : '#333333';
      ctx.font = '24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activity?.name || 'Strava Activity', posterWidth / 2, 220);

      // Add map area background
      const mapAreaX = 100;
      const mapAreaY = 280;
      const mapAreaWidth = posterWidth - 200;
      const mapAreaHeight = posterHeight - 400;

      ctx.fillStyle = theme === 'dark' ? '#2a2a2a' : '#f0f0f0';
      ctx.fillRect(mapAreaX, mapAreaY, mapAreaWidth, mapAreaHeight);

      // Add map placeholder text
      ctx.fillStyle = theme === 'dark' ? '#666666' : '#999999';
      ctx.font = '18px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Map will be rendered here', posterWidth / 2, posterHeight / 2);

      // Add footer
      ctx.fillStyle = theme === 'dark' ? '#666666' : '#999999';
      ctx.font = '16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generated by Trace Prints', posterWidth / 2, posterHeight - 50);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `trace-poster-${params.id}.png`;
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
        
        <div className="space-y-6">
          {/* Map Style Selection */}
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

          {/* Customization Options */}
          <div className="border-t pt-6">
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

          {/* Print Options */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Print Options</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleRenderPrint}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Poster
              </button>
              
              <button
                onClick={handleBuyPrint}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Print - $25
              </button>
            </div>
          </div>

          {/* Activity Info */}
          {activity && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Activity Details</h3>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Route points: {coordinates.length}</div>
                <div>Map style: {theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
                {title && <div>Custom title: {title}</div>}
                {subtitle && <div>Custom subtitle: {subtitle}</div>}
              </div>
            </div>
          )}
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
          <div ref={mapContainer} className="absolute inset-0" />
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
        
        {/* Map Controls Overlay */}
        {coordinates.length > 0 && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
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