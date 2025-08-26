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
  // Print-ready canvas: 18x24 inch @ 300 DPI
  const W = 5400; // 18 inches × 300 DPI
  const H = 7200; // 24 inches × 300 DPI
  
  // 10% margins on all sides
  const MARGIN = 540; // 10% of 5400px
  const CONTENT_W = 4320; // Usable content width (5400 - 540*2)
  const CONTENT_H = 6120; // Usable content height (7200 - 540*2)
  
  // Route trace positioning - top 70% of content area
  const ROUTE_MAX_W = Math.round(CONTENT_W * 0.8); // 80% of usable width = 3456px
  const ROUTE_MAX_H = Math.round(CONTENT_H * 0.65); // 65% of usable height = 3978px
  const ROUTE_TOP = MARGIN; // 540px from canvas top
  const ROUTE_LEFT = MARGIN + (CONTENT_W - ROUTE_MAX_W) / 2; // Centered horizontally
  
  const routeRect = { 
    x: ROUTE_LEFT, 
    y: ROUTE_TOP, 
    w: ROUTE_MAX_W, 
    h: ROUTE_MAX_H 
  };

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

  // fit route inside routeRect with padding
  const pad = 0.05; // Smaller padding for tighter fit
  let xs = track.map(p => lng2x(p[0]));
  let ys = track.map(p => lat2y(p[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = (maxX - minX) || 1;
  const spanY = (maxY - minY) || 1;

  // uniform scale to fit within route bounding box
  const scale = (1 - 2*pad) / Math.max(spanX, spanY);
  xs = xs.map(x => (x - minX - spanX/2) * scale + 0.5);
  ys = ys.map(y => (y - minY - spanY/2) * scale + 0.5);

  // convert to poster coordinates within routeRect
  const toPX = (i:number)=> {
    if (i >= xs.length || i >= ys.length) {
      return [W/2, H/2] as const;
    }
    return [
      routeRect.x + xs[i]*routeRect.w,
      routeRect.y + ys[i]*routeRect.h
    ] as const;
  };

  // generate path
  const path = xs.length > 0 ? xs.map((_,i)=>{
    const [x,y]=toPX(i);
    return `${i? 'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') : '';

  // Typography positioning per spec  
  const TITLE_Y = routeRect.y + routeRect.h + 600; // More space below route
  const SUBTITLE_Y = TITLE_Y + 200; // More space below title
  const MICRO_DATA_Y = H - MARGIN - 600; // More space from bottom
  
  // Column layout for micro data
  const COL_WIDTH = CONTENT_W / 3; // 1440px each
  const COL_1_X = MARGIN + COL_WIDTH / 2;
  const COL_2_X = MARGIN + CONTENT_W / 2;
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
      
      {/* Route Trace - Much thicker stroke */}
      <path 
        d={path} 
        fill="none" 
        stroke={routeColor} 
        strokeWidth="24" 
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
