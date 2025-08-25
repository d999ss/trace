import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clientId: process.env.STRAVA_CLIENT_ID ? 'SET' : 'MISSING',
    redirectUri: process.env.STRAVA_REDIRECT_URI ? 'SET' : 'MISSING',
    clientSecret: process.env.STRAVA_CLIENT_SECRET ? 'SET' : 'MISSING',
    redirectUriValue: process.env.STRAVA_REDIRECT_URI
  });
}