'use client';

import { PosterState } from '../hooks/usePosterState';
import { exportSVGToPNG } from '../utils/export';
import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ShoppingCart } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold mb-2">Ready to Export</h3>
        <p className="text-sm text-muted-foreground">Download your poster in high resolution or order a premium print.</p>
      </div>
      
      <div className="space-y-3">
        <Button
          onClick={handleRenderPrint}
          className="w-full"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download High-Res PNG
        </Button>
        
        <Button
          onClick={handleBuyPrint}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Order Premium Print
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        <p>High-resolution exports perfect for printing up to poster size</p>
      </div>
    </div>
  );
}
