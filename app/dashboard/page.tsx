'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActivities } from '@/lib/strava';
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
        const data = await getActivities(accessToken!);
        setActivities(data);
      } catch (err) {
        setError('Failed to fetch activities');
        console.error(err);
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
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Your Activities</h1>
        
        <div className="grid gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{activity.name}</h2>
                <p className="text-gray-600">
                  {activity.type} • {(activity.distance / 1000).toFixed(2)} km • {Math.floor(activity.moving_time / 60)} min
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(activity.start_date).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/preview/${activity.id}?access_token=${searchParams.get('access_token')}`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Preview
              </Link>
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