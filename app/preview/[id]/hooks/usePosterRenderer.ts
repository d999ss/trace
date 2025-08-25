import { useCallback } from 'react';
import { PosterState } from './usePosterState';
import { renderClassicPoster, renderArtPrintPoster } from '../utils/posterRenderers';

export function usePosterRenderer() {
  const renderPoster = useCallback((
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    scaleFactor: number, 
    posterState: PosterState
  ) => {
    if (posterState.posterStyle === 'art-print') {
      renderArtPrintPoster(ctx, width, height, scaleFactor, posterState);
    } else {
      renderClassicPoster(ctx, width, height, scaleFactor, posterState);
    }
  }, []);

  const renderHighResPoster = useCallback((
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    posterState: PosterState
  ) => {
    if (posterState.posterStyle === 'art-print') {
      renderArtPrintPoster(ctx, width, height, 1.0, posterState);
    } else {
      renderClassicPoster(ctx, width, height, 1.0, posterState);
    }
  }, []);

  return {
    renderPoster,
    renderHighResPoster,
  };
}
