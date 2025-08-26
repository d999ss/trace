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
  // Canvas
  const W = 5400, H = 7200;
  const M = Math.round(W * 0.10);           // 10% margin = 540
  const SAFE_W = W - M*2, SAFE_H = H - M*2;

  // ART BOX: top region for the map (leave room below for type)
  const ART_TOP = M;                         // start at top safe margin
  const ART_BOTTOM = H - M - Math.round(SAFE_H * 0.22); // reserve ~22% for title/stats
  const ART_H = ART_BOTTOM - ART_TOP;
  const ART_W = SAFE_W;
  const ART_CX = M + ART_W / 2;
  const ART_CY = ART_TOP + ART_H / 2;

  // Route padding inside art box
  const PAD = 0.06;                          // 6% inner pad

  // project to Web Mercator (lng/lat to mercator space)
  const pts = track.map(([lng, lat]) => {
    const φ = lat * Math.PI/180;
    const x = lng;
    const y = Math.log(Math.tan(Math.PI/4 + φ/2)); // mercator y
    return [x, y];
  });

  // mean-center
  const mx = pts.reduce((a,p)=>a+p[0],0)/pts.length;
  const my = pts.reduce((a,p)=>a+p[1],0)/pts.length;
  const centered = pts.map(([x,y]) => [x-mx, y-my]);

  // PCA angle (largest variance) for optimal rotation
  const sxx = centered.reduce((a,[x])=>a+x*x,0);
  const syy = centered.reduce((a,[,y])=>a+y*y,0);
  const sxy = centered.reduce((a,[x,y])=>a+x*y,0);
  const theta = 0.5 * Math.atan2(2*sxy, (sxx - syy));  // rotation radians

  const cos = Math.cos(theta), sin = Math.sin(theta);
  const rotated = centered.map(([x,y]) => [x*cos - y*sin, x*sin + y*cos]);

  // Aspect-fit scale into the ART BOX with inner padding
  const xs = rotated.map(p=>p[0]);
  const ys = rotated.map(p=>p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const boxW = ART_W * (1 - PAD*2);
  const boxH = ART_H * (1 - PAD*2);
  const scale = Math.min(boxW / spanX, boxH / spanY);

  // map to poster coords, centered in ART box
  const toPX = (i: number) => {
    const x = (xs[i] - (minX + spanX/2)) * scale + ART_CX;
    const y = (ys[i] - (minY + spanY/2)) * scale + ART_CY;
    // SVG y grows down; mercator y grows up → flip
    return [x, y * -1 + 2*ART_CY] as const;
  };

  // Simple Douglas-Peucker simplification for GPS cleanup
  const simplify = (points: [number, number][], tolerance: number): [number, number][] => {
    if (points.length <= 2) return points;
    
    const sqDistance = (p1: [number, number], p2: [number, number]) => {
      const dx = p1[0] - p2[0];
      const dy = p1[1] - p2[1];
      return dx * dx + dy * dy;
    };

    const getSqSegDistance = (p: [number, number], p1: [number, number], p2: [number, number]) => {
      let dx = p2[0] - p1[0];
      let dy = p2[1] - p1[1];
      if (dx !== 0 || dy !== 0) {
        const t = ((p[0] - p1[0]) * dx + (p[1] - p1[1]) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
          dx = p[0] - p2[0];
          dy = p[1] - p2[1];
        } else if (t > 0) {
          dx = p[0] - (p1[0] + dx * t);
          dy = p[1] - (p1[1] + dy * t);
        } else {
          dx = p[0] - p1[0];
          dy = p[1] - p1[1];
        }
      }
      return dx * dx + dy * dy;
    };

    const simplifyDp = (points: [number, number][], first: number, last: number, sqTolerance: number, simplified: [number, number][]) => {
      let maxSqDistance = sqTolerance;
      let index = 0;

      for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDistance(points[i], points[first], points[last]);
        if (sqDist > maxSqDistance) {
          index = i;
          maxSqDistance = sqDist;
        }
      }

      if (maxSqDistance > sqTolerance) {
        if (index - first > 1) simplifyDp(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDp(points, index, last, sqTolerance, simplified);
      }
    };

    const last = points.length - 1;
    const simplified: [number, number][] = [points[0]];
    simplifyDp(points, 0, last, tolerance * tolerance, simplified);
    simplified.push(points[last]);
    return simplified;
  };

  const pxPts = xs.map((_, i) => toPX(i));
  const simplified = simplify(pxPts, 2); // ~2 px tolerance at 300dpi

  // Generate smooth path
  const path = simplified.length > 0 ? 
    `M${simplified[0][0].toFixed(1)},${simplified[0][1].toFixed(1)} ` +
    simplified.slice(1).map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    : '';

  // Typography positioning with proper spacing from ART_BOTTOM
  const TITLE_Y = ART_BOTTOM + Math.round(SAFE_H * 0.035);   // ~3.5% gap
  const SUBTITLE_Y = TITLE_Y + 200;                          // 200px below title  
  const MICRO_DATA_Y = H - M - 180;                          // sit within bottom margin
  
  // Column layout for micro data
  const COL_WIDTH = SAFE_W / 3; // Use SAFE_W instead of CONTENT_W
  const COL_1_X = M + COL_WIDTH / 2;
  const COL_2_X = M + SAFE_W / 2;  
  const COL_3_X = M + COL_WIDTH * 2.5;

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
      
      {/* Route Trace - Halo effect for print readability */}
      <path 
        d={path} 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="48" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d={path} 
        fill="none" 
        stroke={routeColor} 
        strokeWidth="28" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Start/Finish markers */}
      {simplified.length >= 2 && (
        <>
          {/* Start marker - circle */}
          <circle 
            cx={simplified[0][0]} 
            cy={simplified[0][1]} 
            r="18" 
            fill="#ffffff" 
          />
          <circle 
            cx={simplified[0][0]} 
            cy={simplified[0][1]} 
            r="10" 
            fill={routeColor} 
          />
          
          {/* Finish marker - square */}
          <rect 
            x={simplified[simplified.length-1][0] - 18} 
            y={simplified[simplified.length-1][1] - 18} 
            width="36" 
            height="36" 
            rx="18" 
            fill="#ffffff" 
          />
          <rect 
            x={simplified[simplified.length-1][0] - 12} 
            y={simplified[simplified.length-1][1] - 12} 
            width="24" 
            height="24" 
            rx="12" 
            fill={routeColor} 
          />
        </>
      )}
      
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
