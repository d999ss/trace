import Link from 'next/link';
import { Page, Text, Spacer } from '@geist-ui/core';

export default function Home() {
  return (
    <Page>
      <Page.Content>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Text h1>Trace Prints</Text>
          <Spacer h={1} />
          <Text p>Transform your Strava activities into beautiful prints</Text>
          <Spacer h={2} />
          <Link href="/api/strava/auth">
            <button style={{ 
              padding: '12px 24px', 
              border: '1px solid #eaeaea', 
              borderRadius: '5px', 
              background: '#0070f3', 
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Connect with Strava
            </button>
          </Link>
        </div>
      </Page.Content>
    </Page>
  );
}
