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
  posterRatio = '2:3',
  posterStyle = 'classic',
  distance = '8.85 mi',
  elevation = '+1,247 ft',
  time = '1:23:45',
}, ref) => {
  // poster size in px for preview/export
  const W = 2000;
  const H = posterRatio === '2:3' ? Math.round(W * 3 / 2)
          : posterRatio === '3:4' ? Math.round(W * 4 / 3)
          : Math.round(W * 24 / 18);

  // layout margins - tighter for better use of space
  const M = Math.round(W * 0.06);
  // Route takes up 65% of poster height, centered vertically with slight offset up
  const artHeight = Math.round(H * 0.65);
  const artTop = Math.round(H * 0.12); // Start 12% from top for visual balance
  const artRect = { x: M, y: artTop, w: W - 2*M, h: artHeight };

  // project lng/lat -> normalized XY coordinates
  const lngs = track.map(p => p[0]);
  const lats = track.map(p => p[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);

  // mercator projection helpers
  const lng2x = (lng:number)=> (lng - minLng) / (maxLng - minLng || 1);
  const lat2y = (lat:number)=> {
    const φ = (lat*Math.PI)/180;
    const t = Math.log(Math.tan(Math.PI/4 + φ/2));
    const tMin = Math.log(Math.tan(Math.PI/4 + (minLat*Math.PI/180)/2));
    const tMax = Math.log(Math.tan(Math.PI/4 + (maxLat*Math.PI/180)/2));
    return (tMax - t) / ((tMax - tMin) || 1);
  };

  // fit route inside artRect with padding
  const pad = 0.06;
  let xs = track.map(p => lng2x(p[0]));
  let ys = track.map(p => lat2y(p[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = (maxX - minX) || 1;
  const spanY = (maxY - minY) || 1;

  // uniform scale to fit
  const scale = (1 - 2*pad) / Math.max(spanX, spanY);
  xs = xs.map(x => (x - minX - spanX/2) * scale + 0.5);
  ys = ys.map(y => (y - minY - spanY/2) * scale + 0.5);

  // convert to poster coordinates
  const toPX = (i:number)=> {
    if (i >= xs.length || i >= ys.length) {
      return [W/2, H/2] as const;
    }
    return [
      artRect.x + xs[i]*artRect.w,
      artRect.y + ys[i]*artRect.h
    ] as const;
  };

  // generate path
  const path = xs.length > 0 ? xs.map((_,i)=>{
    const [x,y]=toPX(i);
    return `${i? 'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') : '';

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

  if (posterStyle === 'art-print') {
    // Art Print style - Apple-like minimal design with perfect balance
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
        {/* Clean background */}
        <rect width={W} height={H} fill={bg}/>
        
        {/* Subtle gradient overlay for depth */}
        <defs>
          <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme === 'dark' ? '#000' : '#fff'} stopOpacity="0"/>
            <stop offset="100%" stopColor={theme === 'dark' ? '#000' : '#fff'} stopOpacity="0.03"/>
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#fadeGradient)"/>

        {/* Main Route - Thick and Bold */}
        <path 
          d={path} 
          fill="none" 
          stroke={routeColor} 
          strokeWidth={theme === 'dark' ? 12 : 10} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          opacity="0.9"
        />
        
        {/* Route glow effect for depth */}
        <path 
          d={path} 
          fill="none" 
          stroke={routeColor} 
          strokeWidth={theme === 'dark' ? 24 : 20} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          opacity="0.15"
        />

        {/* Title - Large and Bold */}
        <text 
          x={W/2} 
          y={artRect.y + artRect.h + M*2} 
          textAnchor="middle" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" 
          fontSize={theme === 'dark' ? '72' : '68'}
          fontWeight="600"
          fill={fg}
          letterSpacing="-1"
        >
          {title.toUpperCase()}
        </text>
        
        {/* Subtitle - Clean and Refined */}
        <text 
          x={W/2} 
          y={artRect.y + artRect.h + M*2 + 100} 
          textAnchor="middle" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" 
          fontSize="32" 
          fill={fg}
          opacity="0.6"
        >
          {subtitle}
        </text>

        {/* Stats Section - Centered and Balanced */}
        <g transform={`translate(${W/2}, ${H - M*4})`}>
          {/* Stats Container */}
          <rect 
            x={-300} 
            y={-40} 
            width={600} 
            height={80} 
            fill={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
            rx="12"
          />
          
          {/* Distance */}
          <text 
            x="-180" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="36" 
            fontWeight="500"
            fill={fg}
          >
            {distance}
          </text>
          <text 
            x="-180" 
            y="25" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="18" 
            fill={fg}
            opacity="0.5"
          >
            DISTANCE
          </text>
          
          {/* Elevation */}
          <text 
            x="0" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="36" 
            fontWeight="500"
            fill={fg}
          >
            {elevation}
          </text>
          <text 
            x="0" 
            y="25" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="18" 
            fill={fg}
            opacity="0.5"
          >
            ELEVATION
          </text>
          
          {/* Time */}
          <text 
            x="180" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="36" 
            fontWeight="500"
            fill={fg}
          >
            {time}
          </text>
          <text 
            x="180" 
            y="25" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="18" 
            fill={fg}
            opacity="0.5"
          >
            TIME
          </text>
        </g>
      </svg>
    );
  } else {
    // Classic style - clean modern layout with large route
    const titleY = Math.round(H * 0.08);
    const subtitleY = Math.round(H * 0.11);
    
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
        {/* Clean background */}
        <rect width={W} height={H} fill={bg}/>
        
        {/* Title - Top Center */}
        <text 
          x={W/2} 
          y={titleY} 
          textAnchor="middle" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" 
          fontSize="56" 
          fontWeight="600" 
          fill={fg}
        >
          {title.toUpperCase()}
        </text>

        {/* Subtitle */}
        <text 
          x={W/2} 
          y={subtitleY} 
          textAnchor="middle" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
          fontSize="28" 
          fill={fg}
          opacity="0.6"
        >
          {subtitle}
        </text>
        
        {/* Main Route - Bold and Centered */}
        <path 
          d={path} 
          fill="none" 
          stroke={routeColor} 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Route shadow for depth */}
        <path 
          d={path} 
          fill="none" 
          stroke={theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'} 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          transform="translate(2, 4)"
        />
        
        {/* Stats at bottom - Clean horizontal layout */}
        <g transform={`translate(${W/2}, ${H - M*2.5})`}>
          {/* Distance */}
          <text 
            x="-300" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="32" 
            fontWeight="500"
            fill={fg}
          >
            {distance}
          </text>
          <text 
            x="-300" 
            y="30" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="16" 
            fill={fg}
            opacity="0.5"
          >
            DISTANCE
          </text>
          
          {/* Elevation */}
          <text 
            x="0" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="32" 
            fontWeight="500"
            fill={fg}
          >
            {elevation}
          </text>
          <text 
            x="0" 
            y="30" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="16" 
            fill={fg}
            opacity="0.5"
          >
            ELEVATION
          </text>
          
          {/* Time */}
          <text 
            x="300" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="32" 
            fontWeight="500"
            fill={fg}
          >
            {time}
          </text>
          <text 
            x="300" 
            y="30" 
            textAnchor="middle" 
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" 
            fontSize="16" 
            fill={fg}
            opacity="0.5"
          >
            TIME
          </text>
        </g>
      </svg>
    );
  }
});

PosterSVG.displayName = 'PosterSVG';

export default PosterSVG;
