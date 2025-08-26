'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { decodePolyline } from '@/lib/strava';
import { Header } from './Header';
import { PosterPreview } from './PosterPreview';
import { ControlsSidebar } from './ControlsSidebar';
import { usePosterState } from '../hooks/usePosterState';

// Sample coordinates for testing (interesting mountain trail with elevation and curves)
const SAMPLE_COORDINATES: [number, number][] = [
  // Start - Base of trail
  [-122.4194, 37.8547],
  [-122.4201, 37.8541],
  [-122.4209, 37.8534],
  [-122.4218, 37.8526],
  [-122.4228, 37.8517],
  [-122.4239, 37.8507],
  [-122.4251, 37.8496],
  
  // First switchback section
  [-122.4264, 37.8484],
  [-122.4278, 37.8471],
  [-122.4293, 37.8457],
  [-122.4309, 37.8442],
  [-122.4326, 37.8426],
  [-122.4344, 37.8409],
  [-122.4363, 37.8391],
  [-122.4383, 37.8372],
  
  // Hairpin turn north
  [-122.4404, 37.8352],
  [-122.4426, 37.8331],
  [-122.4449, 37.8309],
  [-122.4473, 37.8286],
  [-122.4498, 37.8262],
  [-122.4524, 37.8237],
  [-122.4551, 37.8211],
  
  // Ridge section - heading west
  [-122.4579, 37.8184],
  [-122.4608, 37.8156],
  [-122.4638, 37.8127],
  [-122.4669, 37.8097],
  [-122.4701, 37.8066],
  [-122.4734, 37.8034],
  [-122.4768, 37.8001],
  [-122.4803, 37.7967],
  
  // Summit area - big curves
  [-122.4839, 37.7932],
  [-122.4876, 37.7896],
  [-122.4914, 37.7859],
  [-122.4953, 37.7821],
  [-122.4993, 37.7782],
  [-122.5034, 37.7742],
  [-122.5076, 37.7701],
  [-122.5119, 37.7659],
  
  // Peak and turn around
  [-122.5163, 37.7616],
  [-122.5208, 37.7572],
  [-122.5254, 37.7527],
  [-122.5301, 37.7481],
  [-122.5349, 37.7434],
  [-122.5398, 37.7386],
  
  // Start descent - different path back
  [-122.5448, 37.7337],
  [-122.5499, 37.7287],
  [-122.5551, 37.7236],
  [-122.5604, 37.7184],
  [-122.5658, 37.7131],
  [-122.5713, 37.7077],
  [-122.5769, 37.7022],
  
  // Descent switchbacks
  [-122.5826, 37.6966],
  [-122.5884, 37.6909],
  [-122.5943, 37.6851],
  [-122.6003, 37.6792],
  [-122.6064, 37.6732],
  [-122.6126, 37.6671],
  [-122.6189, 37.6609],
  
  // Final descent curves
  [-122.6253, 37.6546],
  [-122.6318, 37.6482],
  [-122.6384, 37.6417],
  [-122.6451, 37.6351],
  [-122.6519, 37.6284],
  [-122.6588, 37.6216],
  [-122.6658, 37.6147],
  
  // Return to base
  [-122.6729, 37.6077],
  [-122.6801, 37.6006],
  [-122.6874, 37.5934],
  [-122.6948, 37.5861],
  [-122.7023, 37.5787],
  [-122.7099, 37.5712],
  [-122.7176, 37.5636],
  [-122.7254, 37.5559],
  
  // Final approach back to start area
  [-122.7333, 37.5481],
  [-122.7413, 37.5402],
  [-122.7494, 37.5322],
  [-122.7576, 37.5241],
  [-122.7659, 37.5159],
  [-122.7743, 37.5076],
  [-122.7828, 37.4992],
  
  // Close the loop back toward start
  [-122.4194, 37.8547],
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
      setActivity({ name: 'Mount Tam Epic Trail Run' });
      posterState.setCoordinates(SAMPLE_COORDINATES);
      posterState.setTitle('Mount Tam Epic Trail Run');
      posterState.setSubtitle('Sarah Johnson • 07:24:30 • 6:42 split');
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
  }, [params.id, searchParams, posterState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header activityName={activity?.name} />
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activityName={activity?.name} />
      
      <div className="flex h-[calc(100vh-80px)]">
        <PosterPreview posterState={posterState} svgRef={svgRef} />
        <ControlsSidebar posterState={posterState} svgRef={svgRef} />
      </div>
    </div>
  );
}
