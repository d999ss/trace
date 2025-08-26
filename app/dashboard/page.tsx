'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Activity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  type: string;
  start_date: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    
    if (!accessToken) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    async function fetchActivities() {
      try {
        const response = await fetch(`/api/strava/activities?access_token=${accessToken}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          
          if (response.status === 401) {
            setError('Authentication failed. Please reconnect your Strava account.');
          } else {
            setError(errorData.error || `Failed to fetch activities (Status: ${response.status})`);
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to connect to the server. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            {error.includes('Authentication') && (
              <Link 
                href="/"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Reconnect to Strava
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Activities</h1>
        
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{activity.name}</h2>
                  <p className="text-gray-600 mt-1">
                    {activity.type} • {(activity.distance / 1000).toFixed(2)} km • {Math.floor(activity.moving_time / 60)} min
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(activity.start_date).toLocaleDateString()}
                  </p>
                </div>
                <Link 
                  href={`/preview/${activity.id}?access_token=${searchParams.get('access_token')}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Preview
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}