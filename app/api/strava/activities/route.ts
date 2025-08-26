import { NextRequest, NextResponse } from 'next/server';
import { getActivities } from '@/lib/strava';

export async function GET(request: NextRequest) {
  console.log('=== Activities API Route Called ===');
  
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  
  console.log('Request URL:', request.url);
  console.log('Has access token:', !!accessToken);
  console.log('Token length:', accessToken?.length || 0);
  
  if (!accessToken) {
    console.error('❌ No access token provided in request');
    return NextResponse.json(
      { error: 'Access token is required' },
      { status: 401 }
    );
  }

  try {
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '30');
    
    console.log('📡 Making Strava API call...');
    console.log('- Token (first 10 chars):', accessToken.substring(0, 10) + '...');
    console.log('- Page:', page);
    console.log('- Per page:', perPage);
    
    const activities = await getActivities(accessToken, page, perPage);
    console.log(`✅ Successfully fetched ${activities.length} activities`);
    
    return NextResponse.json(activities);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ STRAVA API ERROR:');
    console.error('- Message:', errorMessage);
    console.error('- Error object:', error);
    
    // Check for specific error patterns
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      console.error('🔐 Token appears to be invalid or expired');
      return NextResponse.json(
        { error: 'Authentication failed. Please reconnect your Strava account.' },
        { status: 401 }
      );
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      console.error('🚫 Access forbidden - check scopes');
      return NextResponse.json(
        { error: 'Access forbidden. Check your Strava permissions.' },
        { status: 403 }
      );
    }
    
    console.error('💥 Unknown error occurred');
    return NextResponse.json(
      { 
        error: 'Failed to fetch activities from Strava', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}