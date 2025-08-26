'use client';

import { PosterState, PosterActions } from '../../hooks/usePosterState';

interface StyleStepProps {
  posterState: PosterState & PosterActions;
}

export function StyleStep({ posterState }: StyleStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-normal text-white mb-2">Poster Style</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="posterStyle"
              value="classic"
              checked={posterState.posterStyle === 'classic'}
              onChange={(e) => posterState.setPosterStyle(e.target.value as 'classic' | 'art-print')}
              className="text-gray-300 focus:ring-gray-500"
            />
            <span className="text-xs font-normal text-gray-300">Classic</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="posterStyle"
              value="art-print"
              checked={posterState.posterStyle === 'art-print'}
              onChange={(e) => posterState.setPosterStyle(e.target.value as 'classic' | 'art-print')}
              className="text-gray-300 focus:ring-gray-500"
            />
            <span className="text-xs font-normal text-gray-300">Art Print</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-normal text-white mb-2">Map Style</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={posterState.theme === 'light'}
              onChange={(e) => posterState.setTheme(e.target.value as 'light' | 'dark' | 'accent')}
              className="text-gray-300 focus:ring-gray-500"
            />
            <span className="text-xs font-normal text-gray-300">Classic</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={posterState.theme === 'dark'}
              onChange={(e) => posterState.setTheme(e.target.value as 'light' | 'dark' | 'accent')}
              className="text-gray-300 focus:ring-gray-500"
            />
            <span className="text-xs font-normal text-gray-300">Dark</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value="accent"
              checked={posterState.theme === 'accent'}
              onChange={(e) => posterState.setTheme(e.target.value as 'light' | 'dark' | 'accent')}
              className="text-gray-300 focus:ring-gray-500"
            />
            <span className="text-xs font-normal text-gray-300">Satellite</span>
          </label>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={() => posterState.setCurrentStep(1)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-normal py-3 px-4 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => posterState.setCurrentStep(3)}
          className="flex-1 bg-gray-700 hover:bg-gray-700 text-white text-xs font-normal py-3 px-4 transition-colors"
        >
          Continue to Text
        </button>
      </div>
    </div>
  );
}
