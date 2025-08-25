import * as React from 'react';

type Point = [number, number]; // [lng, lat] in WGS84 (from Strava)
type Props = {
  track: Point[];         // decoded polyline or already-parsed [lng,lat]
  title: string;
  subtitle?: string;
  theme?: 'light'|'dark'|'accent';
  posterRatio?: '2:3'|'3:4'|'18:24'; // pick your set
  posterStyle?: 'classic'|'art-print';
};

const PosterSVG = React.forwardRef<SVGSVGElement, Props>(({
  track,
  title,
  subtitle = 'Strava Activity',
  theme = 'dark',
  posterRatio = '2:3',
  posterStyle = 'classic',
}, ref) => {
  // poster size in px for preview/export; can swap to mm/pt for PDF later
  const W = 2000;
  const H = posterRatio === '2:3' ? Math.round(W * 3 / 2)
          : posterRatio === '3:4' ? Math.round(W * 4 / 3)
          : Math.round(W * 24 / 18);

  // layout: top banner for map art
  const M = Math.round(W * 0.08);            // outer margin
  const artTop = M;
  const artHeight = Math.round(H * 0.32);    // your "Art Print" band
  const artRect = { x: M, y: artTop, w: W - 2*M, h: artHeight };

  // project lng/lat -> normalized XY in artRect (simple mercator)
  // Coordinates from Strava are [lng, lat] format
  const lngs = track.map(p => p[0]);
  const lats = track.map(p => p[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);

  // mercator helpers
  const lng2x = (lng:number)=> (lng - minLng) / (maxLng - minLng || 1);
  const lat2y = (lat:number)=> {
    const φ = (lat*Math.PI)/180;
    const t = Math.log(Math.tan(Math.PI/4 + φ/2));
    const tMin = Math.log(Math.tan(Math.PI/4 + (minLat*Math.PI/180)/2));
    const tMax = Math.log(Math.tan(Math.PI/4 + (maxLat*Math.PI/180)/2));
    return (tMax - t) / ((tMax - tMin) || 1); // invert so N is up
  };

  // fit route inside artRect with padding
  const pad = 0.06; // 6%
  let xs = track.map(p => lng2x(p[0])); // p[0] is lng
  let ys = track.map(p => lat2y(p[1])); // p[1] is lat
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = (maxX - minX) || 1;
  const spanY = (maxY - minY) || 1;

  // uniform scale to fit
  const scale = (1 - 2*pad) / Math.max(spanX, spanY);
  xs = xs.map(x => (x - minX - spanX/2) * scale + 0.5);
  ys = ys.map(y => (y - minY - spanY/2) * scale + 0.5);

  // to poster px
  const toPX = (i:number)=> ([
    artRect.x + xs[i]*artRect.w,
    artRect.y + ys[i]*artRect.h
  ] as const);

  const path = xs.map((_,i)=>{
    const [x,y]=toPX(i);
    return `${i? 'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Theme colors
  let bg, fg, accent, routeColor;
  if (theme === 'dark') {
    bg = '#0E0F12';
    fg = '#F2F3F5';
    accent = '#7EE0C1';
    routeColor = '#60a5fa';
  } else if (theme === 'accent') {
    bg = '#FFFFFF';
    fg = '#0E0F12';
    accent = '#f97316';
    routeColor = '#f97316';
  } else {
    bg = '#FFFFFF';
    fg = '#0E0F12';
    accent = '#222';
    routeColor = '#3b82f6';
  }

  const svgStyle = {
    display: 'block',
    background: bg,
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const
  };

  if (posterStyle === 'art-print') {
    // Art Print style - minimal, centered route with clean typography
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
        {/* Art band background with subtle grid */}
        <defs>
          <pattern id="tinyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill={theme==='dark' ? '#121419' : '#F7F9FB'}/>
            <path d="M 20 0 L 0 0 0 20" stroke={theme==='dark' ? '#1C2028' : '#E3E7ED'} strokeWidth="1"/>
          </pattern>
        </defs>
        <rect x={artRect.x} y={artRect.y} width={artRect.w} height={artRect.h} fill="url(#tinyGrid)"/>

        {/* Route */}
        <path d={path} fill="none" stroke={routeColor} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"/>

        {/* Title */}
        <text x={W/2} y={artRect.y + artRect.h + M*1.2} textAnchor="middle" fontFamily="Georgia, serif" fontSize={Math.round(W*0.035)} fill={fg}>
          {title}
        </text>
        <text x={W/2} y={artRect.y + artRect.h + M*1.2 + Math.round(W*0.02)} textAnchor="middle" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize={Math.round(W*0.015)} fill={fg} opacity="0.65">
          {subtitle}
        </text>

        {/* Footer metrics placeholder */}
        <g transform={`translate(${M}, ${H - M*0.8})`} fill={fg} fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize={Math.round(W*0.012)} opacity="0.7">
          <text>8.85 mi</text>
          <text x={W/2 - M*1.0} textAnchor="middle">+1,247 ft</text>
          <text x={W - 2*M} textAnchor="end">1:23:45</text>
        </g>
      </svg>
    );
  } else {
    // Classic style - more traditional poster layout
    const topSectionHeight = Math.round(H * 0.15);
    const mapBlockHeight = Math.round(H * 0.5);
    const statsBarHeight = Math.round(H * 0.1);
    
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
        {/* Top section with gradient */}
        <defs>
          <linearGradient id="topGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme === 'dark' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.05)'}/>
            <stop offset="100%" stopColor={theme === 'dark' ? 'rgba(59, 130, 246, 0.02)' : 'rgba(59, 130, 246, 0.02)'}/>
          </linearGradient>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme === 'dark' ? '#1e293b' : '#ffffff'}/>
            <stop offset="100%" stopColor={theme === 'dark' ? '#0f172a' : '#f1f5f9'}/>
          </linearGradient>
          <linearGradient id="statsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc"/>
            <stop offset="100%" stopColor="#e2e8f0"/>
          </linearGradient>
        </defs>

        {/* Top section background */}
        <rect x="0" y="0" width={W} height={topSectionHeight} fill="url(#topGradient)"/>

        {/* Title */}
        <text x={W/2} y={Math.round(H*0.08)} textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" fontSize={Math.round(W*0.04)} fontWeight="bold" fill={fg}>
          {title.toUpperCase()}
        </text>

        {/* Subtitle */}
        <text x={W/2} y={Math.round(H*0.12)} textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" fontSize={Math.round(W*0.02)} fill={fg} opacity="0.7">
          {subtitle}
        </text>

        {/* Map section */}
        <rect x="0" y={topSectionHeight} width={W} height={mapBlockHeight} fill="url(#mapGradient)"/>
        
        {/* Route on map */}
        <path d={path} fill="none" stroke={routeColor} strokeWidth={Math.round(W*0.008)} strokeLinecap="round" strokeLinejoin="round"/>

        {/* Stats bar */}
        <rect x="0" y={topSectionHeight + mapBlockHeight} width={W} height={statsBarHeight} fill="url(#statsGradient)"/>
        
        {/* Stats text */}
        <g transform={`translate(${W/6}, ${topSectionHeight + mapBlockHeight + Math.round(H*0.06)})`} fill={fg} fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" fontSize={Math.round(W*0.018)} fontWeight="bold">
          <text textAnchor="middle">8.85 mi</text>
          <text x={W/2} textAnchor="middle">+1,247 ft</text>
          <text x={2*W/3} textAnchor="middle">1:23:45</text>
        </g>

        {/* Footer branding */}
        <text x={W/2} y={H - Math.round(H*0.03)} textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" fontSize={Math.round(W*0.012)} fill={fg} opacity="0.6">
          TRACE PRINTS
        </text>
      </svg>
    );
  }
});

PosterSVG.displayName = 'PosterSVG';

export default PosterSVG;
