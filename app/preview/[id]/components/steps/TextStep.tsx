'use client';

import { PosterState, PosterActions } from '../../hooks/usePosterState';

interface TextStepProps {
  posterState: PosterState & PosterActions;
}

export function TextStep({ posterState }: TextStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-normal text-white mb-2">Poster Title</label>
        <input
          type="text"
          value={posterState.title}
          onChange={(e) => posterState.setTitle(e.target.value)}
          placeholder="e.g., Morning Run, Epic Ride"
          className="w-full px-3 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs"
        />
      </div>
      
      <div>
        <label className="block text-xs font-normal text-white mb-2">Subtitle (Optional)</label>
        <input
          type="text"
          value={posterState.subtitle}
          onChange={(e) => posterState.setSubtitle(e.target.value)}
          placeholder="e.g., January 15, 2024"
          className="w-full px-3 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-xs"
        />
      </div>
      
      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={() => posterState.setCurrentStep(2)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-normal py-3 px-4 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => posterState.setCurrentStep(4)}
          className="flex-1 bg-gray-700 hover:bg-gray-700 text-white text-xs font-normal py-3 px-4 transition-colors"
        >
          Continue to Size
        </button>
      </div>
    </div>
  );
}
