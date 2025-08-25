import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Trace Prints</h1>
        <p className="text-gray-600 mb-8">Transform your Strava activities into beautiful prints</p>
        <Link
          href="/api/strava/auth"
          className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition font-medium inline-block"
        >
          Connect with Strava
        </Link>
      </div>
    </div>
  );
}
