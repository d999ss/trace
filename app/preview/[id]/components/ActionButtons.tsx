'use client';

import { PosterState } from '../hooks/usePosterState';
import { exportSVGToPNG, exportSVGToBlob } from '../utils/export';
import { RefObject } from 'react';

interface ActionButtonsProps {
  posterState: PosterState;
  svgRef: RefObject<SVGSVGElement | null>;
  showExportButtons?: boolean;
}

export function ActionButtons({ posterState, svgRef, showExportButtons = false }: ActionButtonsProps) {
  const handleRenderPrint = async () => {
    if (!posterState.coordinates.length || !svgRef.current) {
      alert('Poster SVG not found. Please try refreshing the page.');
      return;
    }

    try {
      // Export to PNG
      const blob = await exportSVGToPNG(svgRef.current, 2); // 2x scale for high quality
      
      // Download the PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trace-prints-${posterState.selectedSize}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };


  const handleBuyPrint = () => {
    // This would integrate with a print service
    alert('Print ordering coming soon! For now, use "Save Digital Poster" to download your high-resolution file.');
  };

  if (!showExportButtons) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-black border-t border-gray-800 p-6 shadow-lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-white mb-2">Export Options</h3>
          <p className="text-xs text-gray-300">Download your poster in high resolution for printing or digital use.</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleRenderPrint}
            className="w-full bg-gray-800 text-white py-3 px-4 text-xs font-normal hover:bg-gray-700 transition-colors"
          >
            Save Digital Poster (PNG)
          </button>
          
          <button
            onClick={handleBuyPrint}
            className="w-full bg-gray-800 text-white py-3 px-4 text-xs font-normal hover:bg-gray-700 transition-colors"
          >
            Order Print
          </button>
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          <p>PNG: High-resolution image for digital use</p>
        </div>
      </div>
    </div>
  );
}
