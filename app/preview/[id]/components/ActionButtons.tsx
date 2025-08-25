'use client';

import { PosterState, PosterActions } from '../hooks/usePosterState';
import { usePosterRenderer } from '../hooks/usePosterRenderer';

interface ActionButtonsProps {
  posterState: PosterState & PosterActions;
}

export function ActionButtons({ posterState }: ActionButtonsProps) {
  const { renderHighResPoster } = usePosterRenderer();

  const handleRenderPrint = async () => {
    if (!posterState.coordinates.length) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set poster dimensions
    const getSizeDimensions = (size: string) => {
      switch (size) {
        case 'digital': return { width: 2400, height: 3600 }; // 2:3 ratio
        case 'small': return { width: 2400, height: 3600 }; // 2:3 ratio
        case 'medium': return { width: 3000, height: 4500 }; // 2:3 ratio
        case 'large': return { width: 3600, height: 5400 }; // 2:3 ratio
        default: return { width: 3000, height: 4500 }; // medium default
      }
    };
    
    const { width: posterWidth, height: posterHeight } = getSizeDimensions(posterState.selectedSize);
    canvas.width = posterWidth;
    canvas.height = posterHeight;

    renderHighResPoster(ctx, posterWidth, posterHeight, posterState);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trace-prints-${posterState.selectedSize}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  const handleBuyPrint = () => {
    // This would integrate with a print service
    alert('Print ordering coming soon! For now, use "Save Digital Poster" to download your high-resolution file.');
  };

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-white border-t border-gray-200 p-6">
      <div className="space-y-3">
        <button
          onClick={handleRenderPrint}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Save Digital Poster
        </button>
        <button
          onClick={handleBuyPrint}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg text-lg font-semibold transition-colors"
        >
          Get It Printed
        </button>
      </div>
    </div>
  );
}
