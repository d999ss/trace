'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { decodePolyline } from '@/lib/strava';
import { Header } from './Header';
import { PosterPreview } from './PosterPreview';
import { ControlsSidebar } from './ControlsSidebar';
import { usePosterState } from '../hooks/usePosterState';

// Sample coordinates for testing (realistic Golden Gate Bridge loop)
const SAMPLE_COORDINATES: [number, number][] = [
  [-122.4783, 37.8199], // Crissy Field start
  [-122.4794, 37.8156], 
  [-122.4812, 37.8102], 
  [-122.4835, 37.8045], 
  [-122.4854, 37.7982],
  [-122.4869, 37.7915], // Heading toward bridge
  [-122.4882, 37.7847],
  [-122.4892, 37.7779], 
  [-122.4899, 37.7712],
  [-122.4904, 37.7645],
  [-122.4907, 37.7578], // Mid bridge
  [-122.4909, 37.7511],
  [-122.4910, 37.7444], 
  [-122.4909, 37.7377],
  [-122.4907, 37.7310], 
  [-122.4903, 37.7244], // Marin side
  [-122.4897, 37.7178],
  [-122.4889, 37.7113],
  [-122.4879, 37.7049],
  [-122.4867, 37.6986],
  [-122.4853, 37.6924], // Turning around
  [-122.4837, 37.6863],
  [-122.4819, 37.6804],
  [-122.4799, 37.6746],
  [-122.4777, 37.6690], // Return path
  [-122.4754, 37.6635],
  [-122.4729, 37.6582],
  [-122.4703, 37.6530],
  [-122.4676, 37.6480],
  [-122.4647, 37.6432], // Curving back
  [-122.4617, 37.6385],
  [-122.4586, 37.6340],
  [-122.4554, 37.6297],
  [-122.4521, 37.6256],
  [-122.4487, 37.6216], // Loop back toward SF
  [-122.4452, 37.6178],
  [-122.4416, 37.6142],
  [-122.4379, 37.6107],
  [-122.4341, 37.6074],
  [-122.4302, 37.6043], // Final stretch
  [-122.4262, 37.6014],
  [-122.4221, 37.5986],
  [-122.4179, 37.5960],
  [-122.4136, 37.5935],
  [-122.4092, 37.5912], // Back to start area
  [-122.4047, 37.5891],
  [-122.4001, 37.5871],
  [-122.3954, 37.5853],
  [-122.3906, 37.5836],
  [-122.3857, 37.5821], // Final approach
  [-122.4783, 37.8199], // Back to start
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
      setActivity({ name: 'Morning Loop Around Golden Gate' });
      posterState.setCoordinates(SAMPLE_COORDINATES);
      posterState.setTitle('Morning Loop Around Golden Gate');
      posterState.setSubtitle('John Smith • 08:32:15 • 4:16 split');
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
