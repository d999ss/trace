import { NextRequest, NextResponse } from 'next/server';
import { getActivities } from '@/lib/strava';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  
  if (!accessToken) {
    console.error('No access token provided in request');
    return NextResponse.json(
      { error: 'Access token is required' },
      { status: 401 }
    );
  }

  try {
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '30');
    
    console.log('Fetching activities from Strava with token:', accessToken.substring(0, 10) + '...');
    const activities = await getActivities(accessToken, page, perPage);
    console.log(`Successfully fetched ${activities.length} activities`);
    
    return NextResponse.json(activities);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching activities from Strava:', {
      message: errorMessage,
      error: error
    });
    
    // If it's a 401 from Strava, the token might be expired
    if (errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'Authentication failed. Please reconnect your Strava account.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch activities from Strava', details: errorMessage },
      { status: 500 }
    );
  }
}