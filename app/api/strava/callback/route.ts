import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/strava';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=auth_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    console.log('Attempting token exchange with code:', code);
    const tokenData = await exchangeCodeForToken(code);
    console.log('Token exchange successful');
    
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('access_token', tokenData.access_token);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Token exchange failed:', error);
    return NextResponse.redirect(new URL(`/?error=token_exchange_failed&details=${encodeURIComponent(String(error))}`, request.url));
  }
}