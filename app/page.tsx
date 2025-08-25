import Link from 'next/link';
import { Page, Text, Button, Spacer } from '@geist-ui/core';

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
            <Button>
              Connect with Strava
            </Button>
          </Link>
        </div>
      </Page.Content>
    </Page>
  );
}
