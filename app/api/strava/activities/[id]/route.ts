import { NextRequest, NextResponse } from 'next/server';
import { getActivity } from '@/lib/strava';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Access token is required' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    console.log('Fetching activity from Strava with ID:', id, 'token:', accessToken.substring(0, 10) + '...');
    
    const activity = await getActivity(accessToken, id);
    console.log('Successfully fetched activity:', activity.name);
    
    return NextResponse.json(activity);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const { id } = await params;
    
    console.error('Error fetching activity from Strava:', {
      message: errorMessage,
      activityId: id,
      error: error
    });
    
    // If it's a 401 from Strava, the token might be expired
    if (errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'Authentication failed. Please reconnect your Strava account.' },
        { status: 401 }
      );
    }
    
    // If it's a 404, the activity doesn't exist or isn't accessible
    if (errorMessage.includes('404')) {
      return NextResponse.json(
        { error: 'Activity not found. It may be private or deleted.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch activity from Strava', details: errorMessage },
      { status: 500 }
    );
  }
}