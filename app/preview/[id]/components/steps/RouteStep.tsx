'use client';

import { PosterState, PosterActions } from '../../hooks/usePosterState';

interface RouteStepProps {
  posterState: PosterState & PosterActions;
}

export function RouteStep({ posterState }: RouteStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Current Activity</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Activity Loaded</div>
              <div className="text-sm text-gray-500">{posterState.coordinates.length} GPS points</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={() => posterState.setCurrentStep(2)}
          disabled={!posterState.coordinates.length}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Continue to Style
        </button>
      </div>
    </div>
  );
}
