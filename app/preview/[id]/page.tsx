'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getActivity, decodePolyline } from '@/lib/strava';
import { Input, Text, Loading, Note } from '@geist-ui/core';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Theme = 'light' | 'dark' | 'accent';

function PreviewContent() {
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Loading>Loading activity...</Loading>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Note type="error">{error}</Note>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-1/3 p-8 bg-white shadow-lg">
        <Text h2 style={{ marginBottom: '24px' }}>{activity?.name}</Text>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <Text h5>Theme</Text>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setTheme('light')}
                style={{ 
                  padding: '6px 12px',
                  border: '1px solid #eaeaea',
                  borderRadius: '4px',
                  background: theme === 'light' ? '#0070f3' : 'white',
                  color: theme === 'light' ? 'white' : 'black',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                style={{ 
                  padding: '6px 12px',
                  border: '1px solid #eaeaea',
                  borderRadius: '4px',
                  background: theme === 'dark' ? '#0070f3' : 'white',
                  color: theme === 'dark' ? 'white' : 'black',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('accent')}
                style={{ 
                  padding: '6px 12px',
                  border: '1px solid #eaeaea',
                  borderRadius: '4px',
                  background: theme === 'accent' ? '#0070f3' : 'white',
                  color: theme === 'accent' ? 'white' : 'black',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Accent
              </button>
            </div>
          </div>

          <div>
            <Text h5>Title</Text>
            <Input
              placeholder="Enter title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              width="100%"
            />
          </div>

          <div>
            <Text h5>Subtitle</Text>
            <Input
              placeholder="Enter subtitle..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              width="100%"
            />
          </div>

          <button
            onClick={handleRenderPrint}
            style={{ 
              width: '100%',
              padding: '12px 24px',
              border: '1px solid #eaeaea',
              borderRadius: '5px',
              background: '#0070f3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
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

export default function Preview() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}