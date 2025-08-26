import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    stravaClientId: !!process.env.STRAVA_CLIENT_ID,
    stravaClientSecret: !!process.env.STRAVA_CLIENT_SECRET,
    stravaRedirectUri: process.env.STRAVA_REDIRECT_URI,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };
  
  console.log('Config check:', config);
  
  return NextResponse.json(config);
}