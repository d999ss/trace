'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getActivity, decodePolyline } from '@/lib/strava';
import { createCheckout, updateCheckoutAttributes } from '@/lib/shopify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
      zoomControl: false,
      attributionControl: false
    });

    // Add tile layer based on theme
    const tileLayer = theme === 'dark' 
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '©OpenStreetMap, ©CartoDB'
        })
      : theme === 'accent'
      ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '©Esri'
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '©OpenStreetMap contributors'
        });

    tileLayer.addTo(map.current);

    // Create polyline from coordinates
    const polyline = L.polyline(coordinates, {
      color: theme === 'dark' ? '#ffffff' : '#000000',
      weight: 3,
      opacity: 0.8
    });

    polyline.addTo(map.current);

    // Fit map to polyline bounds
    map.current.fitBounds(polyline.getBounds(), { padding: [20, 20] });

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
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coords: coordinates,
          theme,
          title,
          subtitle
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trace-${params.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to render print:', err);
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
      <div className="w-1/3 p-8 bg-white shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{activity?.name}</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 text-xs rounded ${
                  theme === 'light' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 text-xs rounded ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('accent')}
                className={`px-3 py-1.5 text-xs rounded ${
                  theme === 'accent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Accent
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              placeholder="Enter title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <input
              type="text"
              placeholder="Enter subtitle..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRenderPrint}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Download SVG
            </button>
            
            <button
              onClick={handleBuyPrint}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Buy Print ($25)
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {coordinates.length > 0 ? (
          <div ref={mapContainer} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium mb-2">No GPS Data Available</div>
              <div className="text-sm">This activity doesn't have GPS coordinates to display on the map.</div>
              <div className="text-xs mt-2">Check the browser console for debugging information.</div>
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