'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PosterState } from '../hooks/usePosterState';
import { usePosterRenderer } from '../hooks/usePosterRenderer';

interface PosterPreviewProps {
  posterState: PosterState;
}

export function PosterPreview({ posterState }: PosterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { renderPoster } = usePosterRenderer();

  const renderPreview = useCallback(() => {
    if (!canvasRef.current || !posterState.coordinates.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for preview (portrait orientation - 2:3 ratio)
    const displayWidth = 400;
    const displayHeight = 600;
    
    // Use high-resolution canvas to prevent pixelation
    const canvasScale = 2; // Retina/HD scaling
    const previewWidth = displayWidth * canvasScale;
    const previewHeight = displayHeight * canvasScale;
    
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    
    // Scale the canvas CSS to maintain display size
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    renderPoster(ctx, previewWidth, previewHeight, 1.0, posterState);
  }, [posterState, renderPoster]);

  // Render poster preview whenever relevant state changes
  useEffect(() => {
    if (posterState.coordinates.length > 0) {
      renderPreview();
    }
  }, [posterState.coordinates, posterState.title, posterState.subtitle, posterState.theme, posterState.selectedSize, posterState.posterStyle, renderPreview]);

  if (!posterState.coordinates.length) {
    return (
      <div className="flex-1 bg-white overflow-auto">
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No GPS Data Available</h3>
            <p className="text-gray-600">This activity doesn&apos;t have GPS coordinates to display on the poster.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <canvas 
                ref={canvasRef}
                className="w-full h-auto rounded-2xl"
                style={{ 
                  maxHeight: '700px',
                  aspectRatio: '2/3' // Ensure portrait orientation is maintained
                }}
              />
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
