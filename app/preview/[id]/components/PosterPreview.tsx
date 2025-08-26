'use client';

import { RefObject } from 'react';
import { PosterState } from '../hooks/usePosterState';
import PosterSVG from './PosterSVG';

interface PosterPreviewProps {
  posterState: PosterState;
  svgRef: RefObject<SVGSVGElement | null>;
}

export function PosterPreview({ posterState, svgRef }: PosterPreviewProps) {
  if (!posterState.coordinates.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-lg">
          {/* Premium Empty State */}
          <div className="relative">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
              <svg className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0V7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Create</h3>
            <p className="text-white/70 text-lg leading-relaxed">
              Upload your GPX file or connect your Strava account to transform your ride into a beautiful poster.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Premium Poster Display */}
      <div className="relative">
        {/* Main Poster Frame */}
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' }}>
          {/* Inner Frame */}
          <div className="relative bg-gray-50 rounded-xl p-6 shadow-inner">
            <div 
              className="w-full bg-white rounded-lg overflow-hidden shadow-lg"
              style={{ 
                aspectRatio: '2/3',
                width: '400px',
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
          
          {/* Premium Label */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
            PREMIUM
          </div>
        </div>
        
        {/* Floating Details Card */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-xl border border-white/20">
          <div className="text-center">
            <div className="flex items-center space-x-4 text-sm font-medium text-gray-700">
              <span className="px-3 py-1 bg-gray-100 rounded-full">{posterState.selectedSize.toUpperCase()}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                {posterState.posterStyle === 'classic' ? 'Classic' : 'Art Print'}
              </span>
              <span className="px-3 py-1 bg-gray-100 rounded-full capitalize">
                {posterState.theme === 'light' ? 'Classic' : posterState.theme}
              </span>
            </div>
          </div>
        </div>
        
        {/* Ambient Glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/20 blur-3xl transform scale-125"></div>
      </div>
    </div>
  );
}
