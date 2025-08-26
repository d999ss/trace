'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { decodePolyline } from '@/lib/strava';
import { Header } from './Header';
import { PosterPreview } from './PosterPreview';
import { ControlsSidebar } from './ControlsSidebar';
import { usePosterState } from '../hooks/usePosterState';

// Sample coordinates for testing (a simple route around San Francisco)
const SAMPLE_COORDINATES: [number, number][] = [
  [-122.4194, 37.7749], // San Francisco
  [-122.4184, 37.7759],
  [-122.4174, 37.7769],
  [-122.4164, 37.7779],
  [-122.4154, 37.7789],
  [-122.4144, 37.7799],
  [-122.4134, 37.7809],
  [-122.4124, 37.7819],
  [-122.4114, 37.7829],
  [-122.4104, 37.7839],
  [-122.4094, 37.7849],
  [-122.4084, 37.7859],
  [-122.4074, 37.7869],
  [-122.4064, 37.7879],
  [-122.4054, 37.7889],
  [-122.4044, 37.7899],
  [-122.4034, 37.7909],
  [-122.4024, 37.7919],
  [-122.4014, 37.7929],
  [-122.4004, 37.7939],
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
    
    // Check if we're in test mode (using placeholder values)
    const isTestMode = accessToken === '[your-token]' || activityId === '[activity-id]';
    
    if (isTestMode) {
      // Use sample data for testing
      console.log('Test mode detected, using sample data');
      setActivity({ name: 'Sample Activity - Golden Gate Bridge Loop' });
      posterState.setCoordinates(SAMPLE_COORDINATES);
      posterState.setTitle('Golden Gate Bridge Loop');
      posterState.setSubtitle('Sunday Morning Ride');
      posterState.setTheme('dark');
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
