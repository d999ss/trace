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
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0V7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No route loaded</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload your GPX file or connect your Strava account to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      {/* Clean Poster Display */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div 
          className="bg-white rounded overflow-hidden"
          style={{ 
            aspectRatio: '2/3',
            width: '400px'
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
      
      {/* Simple Status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="px-2 py-1 bg-secondary rounded-sm font-medium">
          {posterState.selectedSize.toUpperCase()}
        </span>
        <span>•</span>
        <span>{posterState.posterStyle === 'classic' ? 'Classic' : 'Art Print'}</span>
        <span>•</span>
        <span className="capitalize">
          {posterState.theme === 'light' ? 'Light' : posterState.theme}
        </span>
      </div>
    </div>
  );
}
