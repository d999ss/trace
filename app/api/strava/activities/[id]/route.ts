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
    const activity = await getActivity(accessToken, id);
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity from Strava' },
      { status: 500 }
    );
  }
}