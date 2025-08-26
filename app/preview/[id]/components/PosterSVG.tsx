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
  // Professional poster layout with proper proportions
  const W = 5400; // 18 inches × 300 DPI
  const H = 7200; // 24 inches × 300 DPI
  
  // Better margin system - responsive to poster size
  const EDGE_MARGIN = W * 0.08; // 8% margins
  const CONTENT_WIDTH = W - 2 * EDGE_MARGIN;
  
  // Golden ratio inspired layout sections
  const HEADER_HEIGHT = H * 0.15; // 15% for title area
  const ROUTE_HEIGHT = H * 0.65;  // 65% for main route display
  const FOOTER_HEIGHT = H * 0.2;  // 20% for metrics
  
  // Route area - properly centered with breathing room
  const routeRect = {
    x: EDGE_MARGIN,
    y: HEADER_HEIGHT,
    w: CONTENT_WIDTH,
    h: ROUTE_HEIGHT
  };

  // Route projection with proper scaling
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

  // Better padding for visual balance
  const routePadding = 0.15; // More generous padding
  let xs = track.map(p => lng2x(p[0]));
  let ys = track.map(p => lat2y(p[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = (maxX - minX) || 1;
  const spanY = (maxY - minY) || 1;

  const scale = (1 - 2 * routePadding) / Math.max(spanX, spanY);
  xs = xs.map(x => (x - minX - spanX / 2) * scale + 0.5);
  ys = ys.map(y => (y - minY - spanY / 2) * scale + 0.5);

  // Route path
  const path = xs.length > 0 ? xs.map((_, i) => {
    const x = routeRect.x + xs[i] * routeRect.w;
    const y = routeRect.y + ys[i] * routeRect.h;
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') : '';

  // Typography with proper hierarchy
  const TITLE_Y = HEADER_HEIGHT * 0.6;
  const SUBTITLE_Y = HEADER_HEIGHT * 0.85;
  
  // Metrics positioned in footer area
  const METRICS_Y = H - FOOTER_HEIGHT * 0.65;
  const LABELS_Y = H - FOOTER_HEIGHT * 0.25;
  
  // Better column spacing
  const COL_1_X = W * 0.25;
  const COL_2_X = W * 0.5;  
  const COL_3_X = W * 0.75;

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
      
      {/* Route area background - subtle grey box */}
      <rect 
        x={routeRect.x} 
        y={routeRect.y} 
        width={routeRect.w} 
        height={routeRect.h} 
        fill={theme === 'dark' ? '#1a1b1e' : '#f8f9fa'}
      />
      
      {/* Route Trace - Better line weight */}
      <path 
        d={path} 
        fill="none" 
        stroke={routeColor} 
        strokeWidth="16" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Title - Large and readable */}
      <text 
        x={W/2} 
        y={TITLE_Y} 
        textAnchor="middle" 
        fontFamily="Times New Roman, Georgia, serif" 
        fontSize="280"
        fontWeight="400"
        fill={fg}
        letterSpacing="2"
      >
        {title}
      </text>
      
      {/* Subtitle - Clear hierarchy */}
      <text 
        x={W/2} 
        y={SUBTITLE_Y} 
        textAnchor="middle" 
        fontFamily="Helvetica Neue, Inter, Arial, sans-serif" 
        fontSize="120"
        fill={fg}
        opacity="0.7"
        letterSpacing="3"
      >
        {subtitle}
      </text>

      {/* Stats Row - Three columns */}
      <g>
        {/* Distance */}
        <g>
          <text 
            x={COL_1_X} 
            y={METRICS_Y} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="180"
            fontWeight="600"
            fill={fg}
          >
            {distance}
          </text>
          <text 
            x={COL_1_X} 
            y={LABELS_Y} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="80"
            fill={fg}
            opacity="0.6"
            letterSpacing="3"
          >
            DISTANCE
          </text>
        </g>
        
        {/* Elevation */}
        <g>
          <text 
            x={COL_2_X} 
            y={METRICS_Y} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="180"
            fontWeight="600"
            fill={fg}
          >
            {elevation}
          </text>
          <text 
            x={COL_2_X} 
            y={LABELS_Y} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="80"
            fill={fg}
            opacity="0.6"
            letterSpacing="3"
          >
            ELEVATION
          </text>
        </g>
        
        {/* Time */}
        <g>
          <text 
            x={COL_3_X} 
            y={METRICS_Y} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="180"
            fontWeight="600"
            fill={fg}
          >
            {time}
          </text>
          <text 
            x={COL_3_X} 
            y={LABELS_Y} 
            textAnchor="middle" 
            fontFamily="Helvetica Neue, Arial, sans-serif" 
            fontSize="80"
            fill={fg}
            opacity="0.6"
            letterSpacing="3"
          >
            TIME
          </text>
        </g>
      </g>
    </svg>
  );
});

PosterSVG.displayName = 'PosterSVG';

export default PosterSVG;
