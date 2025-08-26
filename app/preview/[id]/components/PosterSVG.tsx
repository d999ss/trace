import * as React from 'react';

type Point = [number, number]; // [lng, lat] in WGS84 (from Strava)
type Props = {
  track: Point[];         // decoded polyline or already-parsed [lng,lat]
  title: string;
  subtitle?: string;
  theme?: 'light'|'dark'|'accent';
  posterRatio?: '2:3'|'3:4'|'18:24';
  posterStyle?: 'classic'|'art-print';
  distance?: string;
  elevation?: string;
  time?: string;
};

const PosterSVG = React.forwardRef<SVGSVGElement, Props>(({
  track,
  title,
  subtitle = 'Strava Activity',
  theme = 'dark',
  distance = '8.85 mi',
  elevation = '+1,247 ft',
  time = '1:23:45',
}, ref) => {
  // Simple working version - print ready canvas
  const W = 5400; // 18 inches × 300 DPI
  const H = 7200; // 24 inches × 300 DPI
  const MARGIN = 540; // 10% margin

  // Route area - centered and large
  const routeTop = MARGIN;
  const routeHeight = Math.round(H * 0.6); // 60% of canvas
  const routeWidth = W - 2 * MARGIN;
  const routeRect = { 
    x: MARGIN, 
    y: routeTop, 
    w: routeWidth, 
    h: routeHeight 
  };

  // Simple mercator projection
  const lngs = track.map(p => p[0]);
  const lats = track.map(p => p[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);

  const lng2x = (lng: number) => (lng - minLng) / (maxLng - minLng || 1);
  const lat2y = (lat: number) => {
    const φ = (lat * Math.PI) / 180;
    const t = Math.log(Math.tan(Math.PI / 4 + φ / 2));
    const tMin = Math.log(Math.tan(Math.PI / 4 + (minLat * Math.PI / 180) / 2));
    const tMax = Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI / 180) / 2));
    return (tMax - t) / ((tMax - tMin) || 1);
  };

  // Fit to route rectangle with padding
  const pad = 0.1;
  let xs = track.map(p => lng2x(p[0]));
  let ys = track.map(p => lat2y(p[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = (maxX - minX) || 1;
  const spanY = (maxY - minY) || 1;

  const scale = (1 - 2 * pad) / Math.max(spanX, spanY);
  xs = xs.map(x => (x - minX - spanX / 2) * scale + 0.5);
  ys = ys.map(y => (y - minY - spanY / 2) * scale + 0.5);

  // Convert to SVG coordinates
  const path = xs.length > 0 ? xs.map((_, i) => {
    const x = routeRect.x + xs[i] * routeRect.w;
    const y = routeRect.y + ys[i] * routeRect.h;
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') : '';

  // Typography positioning
  const TITLE_Y = routeTop + routeHeight + 600;
  const SUBTITLE_Y = TITLE_Y + 200;
  const MICRO_DATA_Y = H - MARGIN - 180;
  
  // Column layout for micro data
  const SAFE_W = W - 2 * MARGIN;
  const COL_WIDTH = SAFE_W / 3;
  const COL_1_X = MARGIN + COL_WIDTH / 2;
  const COL_2_X = MARGIN + SAFE_W / 2;  
  const COL_3_X = MARGIN + COL_WIDTH * 2.5;

  // theme colors
  let bg, fg, routeColor;
  if (theme === 'dark') {
    bg = '#0E0F12';
    fg = '#F2F3F5';
    routeColor = '#60a5fa';
  } else if (theme === 'accent') {
    bg = '#FFFFFF';
    fg = '#0E0F12';
    routeColor = '#f97316';
  } else {
    bg = '#FFFFFF';
    fg = '#0E0F12';
    routeColor = '#3b82f6';
  }

  const svgStyle = {
    display: 'block',
    background: bg,
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
    top: 0,
    left: 0
  };

  // Print-ready poster following exact blueprint specification
  return (
    <svg 
      ref={ref}
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`} 
      xmlns="http://www.w3.org/2000/svg" 
      style={svgStyle}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Clean white background */}
      <rect width={W} height={H} fill={bg}/>
      
      {/* Route Trace - Simple thick line */}
      <path 
        d={path} 
        fill="none" 
        stroke={routeColor} 
        strokeWidth="32" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Title Block - Much larger serif font */}
      <text 
        x={W/2} 
        y={TITLE_Y} 
        textAnchor="middle" 
        fontFamily="Times New Roman, Georgia, serif" 
        fontSize="320"
        fontWeight="400"
        fill={fg}
      >
        {title.toUpperCase()}
      </text>
      
      {/* Subtitle - Larger sans-serif */}
      <text 
        x={W/2} 
        y={SUBTITLE_Y} 
        textAnchor="middle" 
        fontFamily="Helvetica Neue, Inter, Arial, sans-serif" 
        fontSize="120"
        fill={fg}
        opacity="0.8"
        letterSpacing="3"
      >
        {subtitle}
      </text>

      {/* Micro Data Row - Bottom 10% */}
      <g>
        {/* Column 1: Distance with Sparkline */}
        <g>
          <rect 
            x={COL_1_X - 300} 
            y={MICRO_DATA_Y - 100} 
            width="600" 
            height="200" 
            fill="none" 
            stroke={fg} 
            strokeWidth="3" 
            opacity="0.7"
          />
          <text 
            x={COL_1_X} 
            y={MICRO_DATA_Y + 100} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="90"
            fontWeight="600"
            fill={fg}
          >
            {distance}
          </text>
        </g>
        
        {/* Column 2: Elevation with Sparkline */}
        <g>
          <rect 
            x={COL_2_X - 300} 
            y={MICRO_DATA_Y - 100} 
            width="600" 
            height="200" 
            fill="none" 
            stroke={fg} 
            strokeWidth="3" 
            opacity="0.7"
          />
          <text 
            x={COL_2_X} 
            y={MICRO_DATA_Y + 100} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="90"
            fontWeight="600"
            fill={fg}
          >
            {elevation}
          </text>
        </g>
        
        {/* Column 3: Time with Sparkline */}
        <g>
          <rect 
            x={COL_3_X - 300} 
            y={MICRO_DATA_Y - 100} 
            width="600" 
            height="200" 
            fill="none" 
            stroke={fg} 
            strokeWidth="3" 
            opacity="0.7"
          />
          <text 
            x={COL_3_X} 
            y={MICRO_DATA_Y + 100} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="90"
            fontWeight="600"
            fill={fg}
          >
            {time}
          </text>
        </g>
      </g>
    </svg>
  );
});

PosterSVG.displayName = 'PosterSVG';

export default PosterSVG;
