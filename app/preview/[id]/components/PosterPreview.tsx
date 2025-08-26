'use client';

import { useRef, useCallback, useEffect, RefObject } from 'react';
import { PosterState } from '../hooks/usePosterState';
import PosterSVG from './PosterSVG';

interface PosterPreviewProps {
  posterState: PosterState;
  svgRef: RefObject<SVGSVGElement | null>;
}

export function PosterPreview({ posterState, svgRef }: PosterPreviewProps) {
  if (!posterState.coordinates.length) {
    return (
      <div className="flex-1 bg-white overflow-auto">
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center">
              <div className="bg-gray-50 rounded-2xl p-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Data</h3>
                <p className="text-gray-500">Upload a GPX file or connect your Strava account to see your poster preview.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-100 overflow-auto">
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-[500px]">
            <div className="bg-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 p-8">
              <div 
                className="w-full bg-white"
                style={{ 
                  aspectRatio: '2/3',
                  position: 'relative' as const
                }}
              >
                <PosterSVG
                  ref={svgRef}
                  track={posterState.coordinates}
                  title={posterState.title || 'Your Activity'}
                  subtitle={posterState.subtitle || 'Strava Activity'}
                  theme={posterState.theme}
                  posterStyle={posterState.posterStyle}
                  posterRatio="2:3"
                />
              </div>
            </div>
            
            {/* Poster Details */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Size: {posterState.selectedSize.toUpperCase()} • Style: {posterState.posterStyle === 'classic' ? 'Classic' : 'Art Print'} • Theme: {posterState.theme === 'light' ? 'Classic' : posterState.theme === 'dark' ? 'Dark' : 'Satellite'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
