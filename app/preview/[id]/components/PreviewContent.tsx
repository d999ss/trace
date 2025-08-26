'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { decodePolyline } from '@/lib/strava';
import { Header } from './Header';
import { PosterPreview } from './PosterPreview';
import { ControlsSidebar } from './ControlsSidebar';
import { usePosterState } from '../hooks/usePosterState';
import { Card, CardContent } from '@/components/ui/card';

// Sample coordinates - Cursive uppercase S shape
const SAMPLE_COORDINATES: [number, number][] = [
  // Top curve of S (starting from top right)
  [-122.4500, 37.8200],
  [-122.4480, 37.8195],
  [-122.4460, 37.8185],
  [-122.4445, 37.8170],
  [-122.4435, 37.8150],
  [-122.4430, 37.8125],
  [-122.4430, 37.8100],
  [-122.4435, 37.8075],
  [-122.4445, 37.8055],
  [-122.4460, 37.8040],
  [-122.4480, 37.8030],
  [-122.4500, 37.8025],
  [-122.4520, 37.8025],
  [-122.4540, 37.8030],
  [-122.4555, 37.8040],
  [-122.4565, 37.8055],
  [-122.4570, 37.8075],
  [-122.4570, 37.8100],
  
  // First middle curve (going left)
  [-122.4565, 37.8120],
  [-122.4555, 37.8135],
  [-122.4540, 37.8145],
  [-122.4520, 37.8150],
  [-122.4500, 37.8150],
  [-122.4480, 37.8145],
  [-122.4465, 37.8135],
  [-122.4455, 37.8120],
  [-122.4450, 37.8100],
  [-122.4450, 37.8080],
  [-122.4455, 37.8065],
  [-122.4465, 37.8055],
  [-122.4480, 37.8050],
  [-122.4500, 37.8050],
  
  // Center transition
  [-122.4520, 37.8050],
  [-122.4535, 37.8055],
  [-122.4545, 37.8065],
  [-122.4550, 37.8080],
  [-122.4550, 37.8100],
  [-122.4545, 37.8115],
  [-122.4535, 37.8125],
  [-122.4520, 37.8130],
  [-122.4500, 37.8130],
  [-122.4480, 37.8125],
  [-122.4465, 37.8115],
  [-122.4455, 37.8100],
  
  // Second middle curve (going right)
  [-122.4455, 37.8080],
  [-122.4465, 37.8065],
  [-122.4480, 37.8055],
  [-122.4500, 37.8050],
  [-122.4520, 37.8050],
  [-122.4540, 37.8055],
  [-122.4555, 37.8065],
  [-122.4565, 37.8080],
  [-122.4570, 37.8100],
  [-122.4570, 37.8120],
  [-122.4565, 37.8135],
  [-122.4555, 37.8145],
  [-122.4540, 37.8150],
  [-122.4520, 37.8150],
  
  // Bottom curve of S (ending at bottom left)
  [-122.4500, 37.8150],
  [-122.4480, 37.8155],
  [-122.4460, 37.8165],
  [-122.4445, 37.8180],
  [-122.4435, 37.8200],
  [-122.4430, 37.8225],
  [-122.4430, 37.8250],
  [-122.4435, 37.8275],
  [-122.4445, 37.8295],
  [-122.4460, 37.8310],
  [-122.4480, 37.8320],
  [-122.4500, 37.8325],
  [-122.4520, 37.8325],
  [-122.4540, 37.8320],
  [-122.4555, 37.8310],
  [-122.4565, 37.8295],
  [-122.4570, 37.8275],
  [-122.4570, 37.8250],
  [-122.4565, 37.8230],
  [-122.4555, 37.8215],
  [-122.4540, 37.8205],
  [-122.4520, 37.8200],
  [-122.4500, 37.8200], // Close the S
];

export function PreviewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<{name?: string; map?: {summary_polyline?: string}} | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  const posterState = usePosterState();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const activityId = params.id as string;
    
    // Check if we're in test mode (using placeholder values or sample ID)
    const isTestMode = accessToken === '[your-token]' || activityId === '[activity-id]' || activityId === 'sample';
    
    if (isTestMode) {
      // Use sample data for testing
      console.log('Sample mode detected, using sample data');
      setActivity({ name: 'Serpentine Ridge Trail' });
      posterState.setCoordinates(SAMPLE_COORDINATES);
      posterState.setTitle('Serpentine Ridge Trail');
      posterState.setSubtitle('Alex Rivera • 08:15:22 • 5:34 split');
      posterState.setTheme('light');
      posterState.setPosterStyle('art-print');
      setLoading(false);
      return;
    }
    
    if (!accessToken) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    async function fetchActivity() {
      try {
        console.log('Fetching activity:', activityId);
        const response = await fetch(`/api/strava/activities/${activityId}?access_token=${accessToken}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Activity data received:', data);
        setActivity(data);
        
        if (data.map?.summary_polyline) {
          console.log('Found polyline, decoding coordinates...');
          const coords = decodePolyline(data.map.summary_polyline);
          console.log('Decoded coordinates:', coords.length, coords);
          posterState.setCoordinates(coords);
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
  }, [params.id, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header activityName={activity?.name} />
        <div className="h-[calc(100vh-40px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your activity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header activityName={activity?.name} />
        <div className="h-[calc(100vh-40px)] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Activity</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const routeLoaded = posterState.coordinates.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header activityName={activity?.name} />
      
      {/* Main Interface - Clean shadcn/ui Style */}
      <div className="flex h-[calc(100vh-60px)]">
        
        {/* Sidebar - Left */}
        <div className="w-80 border-r bg-muted/40 p-6">
          <ControlsSidebar 
            posterState={posterState} 
            svgRef={svgRef} 
            routeData={{
              distance: '8.85 mi',
              duration: '48 min',
              elevation: '+1,247 ft',
              points: posterState.coordinates.length
            }}
          />
        </div>
        
        {/* Main Content - Poster Preview */}
        <div className="flex-1 p-6 bg-background">
          <div className="h-full flex items-center justify-center">
            <PosterPreview posterState={posterState} svgRef={svgRef} />
          </div>
        </div>
        
      </div>
      
    </div>
  );
}
