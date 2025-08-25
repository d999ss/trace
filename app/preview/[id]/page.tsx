'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getActivity, decodePolyline } from '@/lib/strava';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Theme = 'light' | 'dark' | 'accent';

export default function Preview() {
  const params = useParams();
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
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
        const data = await getActivity(accessToken!, activityId);
        setActivity(data);
        
        if (data.map?.summary_polyline) {
          const coords = decodePolyline(data.map.summary_polyline);
          setCoordinates(coords);
        }
      } catch (err) {
        setError('Failed to fetch activity');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [params.id, searchParams]);

  useEffect(() => {
    if (!mapContainer.current || !coordinates.length) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const mapStyle = theme === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11'
      : theme === 'accent'
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/light-v11';

    if (map.current) {
      map.current.setStyle(mapStyle);
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord as [number, number]));

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      bounds: bounds,
      fitBoundsOptions: { padding: 50 },
      interactive: false
    });

    map.current.on('load', () => {
      map.current!.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      map.current!.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': theme === 'dark' ? '#ffffff' : '#000000',
          'line-width': 3
        }
      });
    });

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
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-1/3 p-8 bg-white shadow-lg">
        <h1 className="text-2xl font-bold mb-4">{activity?.name}</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="space-x-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('accent')}
                className={`px-4 py-2 rounded ${theme === 'accent' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Accent
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter title..."
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium mb-2">
              Subtitle
            </label>
            <input
              id="subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter subtitle..."
            />
          </div>

          <button
            onClick={handleRenderPrint}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition font-medium"
          >
            Render print file
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
    </div>
  );
}