'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RideObject } from '@/lib/types/ride';

interface AnimatedRouteRendererProps {
  ride: RideObject;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

export function AnimatedRouteRenderer({ 
  ride, 
  isAnimating, 
  onAnimationComplete 
}: AnimatedRouteRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [milestones, setMilestones] = useState<{ point: number; label: string }[]>([]);
  const [storyText, setStoryText] = useState('');
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current || !isAnimating) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const generateStoryTextInner = () => {
      const { metrics, context } = ride;
      const distance = `${metrics.distance.toFixed(1)} ${metrics.distanceUnit}`;
      const elevation = `${metrics.elevationGain.toLocaleString()} ${metrics.elevationUnit}`;
      
      let story = '';
      
      if (context.time?.dayPeriod === 'dawn') {
        story = `Dawn patrol • ${distance} • ${elevation} climb`;
      } else if (context.type === 'mountain') {
        story = `Mountain adventure • ${distance} • ${elevation} ascent`;
      } else if (context.type === 'urban') {
        story = `City exploration • ${distance} through the streets`;
      } else {
        story = `${distance} journey • ${elevation} elevation gained`;
      }
      
      setStoryText(story);
    };

    const detectMilestonesInner = () => {
      const { coordinates } = ride;
      if (coordinates.length < 10) return;

      const milestones: { point: number; label: string }[] = [];
      
      // Find highest point (summit)
      let maxElevationIndex = 0;
      let maxElevation = coordinates[0].elevation || 0;
      
      coordinates.forEach((coord, i) => {
        if (coord.elevation && coord.elevation > maxElevation) {
          maxElevation = coord.elevation;
          maxElevationIndex = i;
        }
      });
      
      if (maxElevationIndex > 0 && maxElevationIndex < coordinates.length - 1) {
        milestones.push({ 
          point: maxElevationIndex, 
          label: 'Summit' 
        });
      }
      
      setMilestones(milestones);
    };

    const animateRouteInner = (ctx: CanvasRenderingContext2D) => {
      const { coordinates, style } = ride;
      const duration = 3000; // 3 seconds for full animation
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(elapsed / duration, 1);
        setProgress(currentProgress);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw animated route
        drawAnimatedRoute(ctx, coordinates, currentProgress, style.colorScheme.route);
        
        // Draw milestones
        drawMilestones(ctx, currentProgress);
        
        if (currentProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          onAnimationComplete?.();
        }
      };
      
      animate();
    };

    // Generate story text
    generateStoryTextInner();
    
    // Find milestones in the route
    detectMilestonesInner();

    // Start route animation
    animateRouteInner(ctx);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, ride, onAnimationComplete]);

  const drawMilestones = (ctx: CanvasRenderingContext2D, progress: number) => {
    const { coordinates } = ride;
    const padding = 50;
    const width = canvasRef.current!.width - 2 * padding;
    const height = canvasRef.current!.height - 2 * padding;
    
    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    milestones.forEach(milestone => {
      const milestoneProgress = milestone.point / coordinates.length;
      if (milestoneProgress <= progress) {
        const coord = coordinates[milestone.point];
        const x = padding + ((coord.lng - minLng) / (maxLng - minLng)) * width;
        const y = padding + ((maxLat - coord.lat) / (maxLat - minLat)) * height;
        
        // Draw milestone marker
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        // Star shape for milestone
        drawStar(ctx, x, y, 5, 10, 5);
        
        // Label
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(milestone.label, x, y - 15);
      }
    });
  };

  const drawAnimatedRoute = (
    ctx: CanvasRenderingContext2D,
    coordinates: RideObject['coordinates'],
    progress: number,
    color: string
  ) => {
    if (coordinates.length < 2) return;
    
    const pointsToDraw = Math.floor(coordinates.length * progress);
    if (pointsToDraw < 2) return;
    
    // Calculate bounds
    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const padding = 50;
    const width = canvasRef.current!.width - 2 * padding;
    const height = canvasRef.current!.height - 2 * padding;
    
    // Draw route path
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.9;
    
    ctx.beginPath();
    
    for (let i = 0; i < pointsToDraw; i++) {
      const coord = coordinates[i];
      const x = padding + ((coord.lng - minLng) / (maxLng - minLng)) * width;
      const y = padding + ((maxLat - coord.lat) / (maxLat - minLat)) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw animated endpoint
    if (pointsToDraw > 0) {
      const lastCoord = coordinates[pointsToDraw - 1];
      const x = padding + ((lastCoord.lng - minLng) / (maxLng - minLng)) * width;
      const y = padding + ((maxLat - lastCoord.lat) / (maxLat - minLat)) * height;
      
      // Pulsing dot at current position
      const pulseSize = 8 + Math.sin(Date.now() * 0.005) * 3;
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Trail effect
      for (let j = 1; j <= 3; j++) {
        const trailIndex = Math.max(0, pointsToDraw - j * 5);
        if (trailIndex > 0) {
          const trailCoord = coordinates[trailIndex];
          const trailX = padding + ((trailCoord.lng - minLng) / (maxLng - minLng)) * width;
          const trailY = padding + ((maxLat - trailCoord.lat) / (maxLat - minLat)) * height;
          
          ctx.globalAlpha = 0.3 / j;
          ctx.beginPath();
          ctx.arc(trailX, trailY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D, 
    cx: number, 
    cy: number, 
    spikes: number, 
    outerRadius: number, 
    innerRadius: number
  ) => {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-auto rounded-lg shadow-lg"
      />
      
      {/* Story text animation */}
      <AnimatePresence>
        {storyText && isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg"
          >
            <p className="text-lg font-medium">{storyText}</p>
            <div className="mt-2">
              <div className="h-1 bg-gray-700 rounded">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Milestone notifications */}
      <AnimatePresence>
        {milestones.map(milestone => {
          const milestoneProgress = milestone.point / ride.coordinates.length;
          const showMilestone = isAnimating && 
                               progress >= milestoneProgress && 
                               progress < milestoneProgress + 0.05;
          
          return showMilestone ? (
            <motion.div
              key={milestone.point}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold shadow-lg"
            >
              🏔️ {milestone.label} Reached!
            </motion.div>
          ) : null;
        })}
      </AnimatePresence>
    </div>
  );
}