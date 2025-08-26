'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RideObject, RideStyle } from '@/lib/types/ride';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumPosterEditorProps {
  ride: RideObject;
  onUpdate: (updates: Partial<RideObject>) => void;
  onExport: () => void;
}

export function PremiumPosterEditor({ ride, onUpdate, onExport }: PremiumPosterEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewMode, setPreviewMode] = useState<'poster' | 'framed' | 'wall'>('poster');

  // Real-time canvas rendering
  useEffect(() => {
    const renderPosterInner = (ctx: CanvasRenderingContext2D, rideData: RideObject) => {
      const { style, coordinates, customizations, metrics } = rideData;
      const { colorScheme, typography } = style;

      // Clear canvas
      ctx.fillStyle = colorScheme.background;
      ctx.fillRect(0, 0, 1800, 2400);

      // Render route with smooth animation
      if (coordinates.length > 0) {
        renderRoute(ctx, coordinates, colorScheme.route);
      }

      // Render title
      ctx.fillStyle = colorScheme.foreground;
      ctx.font = `bold 120px ${typography.titleFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(customizations.title, 900, 300);

      // Render subtitle
      ctx.font = `48px ${typography.subtitleFont}`;
      ctx.fillStyle = colorScheme.secondary;
      ctx.fillText(customizations.subtitle, 900, 380);

      // Render metrics if enabled
      if (customizations.showMetrics) {
        renderMetrics(ctx, metrics, style);
      }
    };

    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high quality
    const scale = window.devicePixelRatio || 1;
    canvas.width = 1800 * scale;
    canvas.height = 2400 * scale;
    ctx.scale(scale, scale);

    renderPosterInner(ctx, ride);
  }, [ride]);


  const renderRoute = (
    ctx: CanvasRenderingContext2D, 
    coordinates: RideObject['coordinates'], 
    color: string
  ) => {
    if (coordinates.length < 2) return;

    // Calculate bounds
    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Map coordinates to canvas space
    const padding = 200;
    const width = 1800 - 2 * padding;
    const height = 1400; // Route area height
    const offsetY = 500; // Start below title

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    coordinates.forEach((coord, i) => {
      const x = padding + ((coord.lng - minLng) / (maxLng - minLng)) * width;
      const y = offsetY + ((maxLat - coord.lat) / (maxLat - minLat)) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Add start/end markers
    const startX = padding + ((coordinates[0].lng - minLng) / (maxLng - minLng)) * width;
    const startY = offsetY + ((maxLat - coordinates[0].lat) / (maxLat - minLat)) * height;
    const endX = padding + ((coordinates[coordinates.length - 1].lng - minLng) / (maxLng - minLng)) * width;
    const endY = offsetY + ((maxLat - coordinates[coordinates.length - 1].lat) / (maxLat - minLat)) * height;

    // Start marker
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(startX, startY, 12, 0, Math.PI * 2);
    ctx.fill();

    // End marker
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(endX, endY, 12, 0, Math.PI * 2);
    ctx.fill();
  };

  const renderMetrics = (
    ctx: CanvasRenderingContext2D,
    metrics: RideObject['metrics'],
    style: RideStyle
  ) => {
    const metricsY = 2100;

    ctx.font = `bold 72px ${style.typography.metricsFont}`;
    ctx.fillStyle = style.colorScheme.foreground;
    ctx.textAlign = 'center';

    // Distance
    ctx.fillText(
      `${metrics.distance.toFixed(1)} ${metrics.distanceUnit}`,
      300,
      metricsY
    );
    ctx.font = `32px ${style.typography.metricsFont}`;
    ctx.fillStyle = style.colorScheme.secondary;
    ctx.fillText('DISTANCE', 300, metricsY + 50);

    // Elevation
    ctx.font = `bold 72px ${style.typography.metricsFont}`;
    ctx.fillStyle = style.colorScheme.foreground;
    ctx.fillText(
      `+${metrics.elevationGain.toLocaleString()} ${metrics.elevationUnit}`,
      900,
      metricsY
    );
    ctx.font = `32px ${style.typography.metricsFont}`;
    ctx.fillStyle = style.colorScheme.secondary;
    ctx.fillText('ELEVATION', 900, metricsY + 50);

    // Time
    const hours = Math.floor(metrics.duration / 3600);
    const minutes = Math.floor((metrics.duration % 3600) / 60);
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    ctx.font = `bold 72px ${style.typography.metricsFont}`;
    ctx.fillStyle = style.colorScheme.foreground;
    ctx.fillText(timeString, 1500, metricsY);
    ctx.font = `32px ${style.typography.metricsFont}`;
    ctx.fillStyle = style.colorScheme.secondary;
    ctx.fillText('TIME', 1500, metricsY + 50);
  };

  const handleStyleChange = useCallback((newStyle: Partial<RideStyle>) => {
    onUpdate({
      style: {
        ...ride.style,
        ...newStyle
      }
    });
  }, [ride.style, onUpdate]);

  const handleTextChange = useCallback((field: 'title' | 'subtitle', value: string) => {
    onUpdate({
      customizations: {
        ...ride.customizations,
        [field]: value
      }
    });
  }, [ride.customizations, onUpdate]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <motion.div
          className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Canvas Container */}
          <div className="relative" style={{ width: '600px', height: '800px' }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ width: '600px', height: '800px' }}
            />
            
            {/* Rendering indicator */}
            <AnimatePresence>
              {isRendering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div className="bg-white rounded-lg p-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700">Rendering your poster...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview Mode Selector */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={() => setPreviewMode('poster')}
              className={`px-4 py-2 rounded ${previewMode === 'poster' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              Poster
            </button>
            <button
              onClick={() => setPreviewMode('framed')}
              className={`px-4 py-2 rounded ml-2 ${previewMode === 'framed' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              Framed
            </button>
            <button
              onClick={() => setPreviewMode('wall')}
              className={`px-4 py-2 rounded ml-2 ${previewMode === 'wall' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              On Wall
            </button>
          </div>
        </motion.div>
      </div>

      {/* Minimal Side Controls */}
      <div className="w-96 bg-white shadow-xl p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Customize Your Poster</h2>

        {/* Style Controls */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Style</h3>
          <div className="grid grid-cols-2 gap-3">
            {['minimal', 'mountain', 'urban', 'neon', 'retro', 'brutalist'].map((theme) => (
              <button
                key={theme}
                onClick={() => handleStyleChange({ theme: theme as RideStyle['theme'] })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  ride.style.theme === theme
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="text-sm font-medium capitalize">{theme}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Text Controls */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Text</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={ride.customizations.title}
                onChange={(e) => handleTextChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={ride.customizations.subtitle}
                onChange={(e) => handleTextChange('subtitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Metrics Toggle */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Display Options</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={ride.customizations.showMetrics}
              onChange={(e) => onUpdate({
                customizations: {
                  ...ride.customizations,
                  showMetrics: e.target.checked
                }
              })}
              className="mr-3 h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">Show ride metrics</span>
          </label>
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Export High Resolution
        </button>
      </div>
    </div>
  );
}