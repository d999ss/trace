import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Trace Prints</h1>
        <p className="text-lg text-gray-600 mb-8">
          Transform your Strava activities into beautiful prints
        </p>
        
        <div className="space-y-4">
          <a 
            href="/api/strava/auth"
            className="block bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Connect with Strava
          </a>
          
          <Link 
            href="/preview/sample"
            className="block bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            View Sample Poster
          </Link>
        </div>
      </div>
    </div>
  );
}
