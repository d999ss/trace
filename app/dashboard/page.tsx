'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActivities } from '@/lib/strava';
import Link from 'next/link';
import { Page, Card, Text, Button, Loading, Note, Spacer } from '@geist-ui/core';

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
      <Page>
        <Page.Content>
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Loading>Loading activities...</Loading>
          </div>
        </Page.Content>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Page.Content>
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Note type="error">{error}</Note>
          </div>
        </Page.Content>
      </Page>
    );
  }

  return (
    <Page>
      <Page.Content>
        <Text h1>Your Activities</Text>
        <Spacer h={2} />
        
        <div style={{ display: 'grid', gap: '16px' }}>
          {activities.map((activity) => (
            <Card key={activity.id}>
              <Card.Content>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text h4 margin={0}>{activity.name}</Text>
                    <Text p margin="8px 0 4px 0">
                      {activity.type} • {(activity.distance / 1000).toFixed(2)} km • {Math.floor(activity.moving_time / 60)} min
                    </Text>
                    <Text small type="secondary">
                      {new Date(activity.start_date).toLocaleDateString()}
                    </Text>
                  </div>
                  <Link href={`/preview/${activity.id}?access_token=${searchParams.get('access_token')}`}>
                    <Button>Preview</Button>
                  </Link>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </Page.Content>
    </Page>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}