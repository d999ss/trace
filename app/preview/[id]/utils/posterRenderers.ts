import { PosterState } from '../hooks/usePosterState';
import { drawEnhancedMapTiles } from './mapTiles';

export function renderClassicPoster(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  scaleFactor: number, 
  posterState: PosterState
) {
  // Create beautiful gradient background that fills the entire poster
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#f8fafc');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // TOP SECTION: Beautiful title area with subtle background
  const topSectionHeight = Math.floor(100 * scaleFactor);
  const topGradient = ctx.createLinearGradient(0, 0, 0, topSectionHeight);
  topGradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
  topGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, width, topSectionHeight);

  // Title: Beautiful, modern typography
  const titleY = Math.floor(30 * scaleFactor);
  const displayTitle = posterState.title || 'YOUR ACTIVITY';
  
  // Title shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.font = `bold ${Math.floor(48 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(displayTitle.toUpperCase(), width / 2 + 2, titleY + 2);
  
  // Main title
  ctx.fillStyle = '#1e293b';
  ctx.fillText(displayTitle.toUpperCase(), width / 2, titleY);

  // Subtitle: Elegant secondary text
  const subtitleY = titleY + Math.floor(60 * scaleFactor);
  const displaySubtitle = posterState.subtitle || 'Strava Activity';
  ctx.fillStyle = '#64748b';
  ctx.font = `${Math.floor(24 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(displaySubtitle, width / 2, subtitleY);

  // MIDDLE SECTION: Hero Map Block
  const mapBlockTop = subtitleY + Math.floor(30 * scaleFactor);
  const mapBlockHeight = Math.floor(380 * scaleFactor);
  const mapBlockX = 0;
  const mapBlockY = mapBlockTop;
  const mapBlockWidth = width;

  // Map background with theme-appropriate colors
  let mapGradient;
  if (posterState.theme === 'dark') {
    mapGradient = ctx.createLinearGradient(mapBlockX, mapBlockY, mapBlockX, mapBlockY + mapBlockHeight);
    mapGradient.addColorStop(0, '#1e293b');
    mapGradient.addColorStop(1, '#0f172a');
  } else if (posterState.theme === 'accent') {
    mapGradient = ctx.createLinearGradient(mapBlockX, mapBlockY, mapBlockX, mapBlockY + mapBlockHeight);
    mapGradient.addColorStop(0, '#f0f9ff');
    mapGradient.addColorStop(1, '#e0f2fe');
  } else {
    mapGradient = ctx.createLinearGradient(mapBlockX, mapBlockY, mapBlockX, mapBlockY + mapBlockHeight);
    mapGradient.addColorStop(0, '#ffffff');
    mapGradient.addColorStop(1, '#f1f5f9');
  }
  
  // Draw map container
  ctx.fillStyle = mapGradient;
  ctx.fillRect(mapBlockX, mapBlockY, mapBlockWidth, mapBlockHeight);

  // Draw enhanced map tiles for terrain
  drawEnhancedMapTiles(ctx, mapBlockX, mapBlockY, mapBlockWidth, mapBlockHeight, posterState.theme);

  // Draw the GPS route with beautiful styling
  if (posterState.coordinates.length > 1) {
    drawRoute(ctx, mapBlockX, mapBlockY, mapBlockWidth, mapBlockHeight, posterState);
  }

  // BOTTOM SECTION: Beautiful stats bar
  const statsBarTop = mapBlockY + mapBlockHeight;
  const statsBarHeight = Math.floor(80 * scaleFactor);
  const statsBarY = statsBarTop;
  
  // Stats container with beautiful background
  const statsGradient = ctx.createLinearGradient(0, statsBarY, 0, statsBarY + statsBarHeight);
  statsGradient.addColorStop(0, '#f8fafc');
  statsGradient.addColorStop(1, '#e2e8f0');
  
  ctx.fillStyle = statsGradient;
  ctx.fillRect(0, statsBarY, width, statsBarHeight);
  
  // Draw stats
  drawStats(ctx, statsBarY, width, scaleFactor);

  // FOOTER: Beautiful branding
  const footerY = height - Math.floor(30 * scaleFactor);
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${Math.floor(14 * scaleFactor)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${posterState.selectedSize.toUpperCase()} • TRACE PRINTS`, width / 2, footerY);
}

export function renderArtPrintPoster(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  scaleFactor: number, 
  posterState: PosterState
) {
  // Pure white background for minimalist aesthetic
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // ROUTE SECTION: Upper two-thirds with minimal margins
  const routeMargin = Math.floor(20 * scaleFactor);
  const routeWidth = width - (routeMargin * 2);
  const routeHeight = Math.floor(420 * scaleFactor);
  const routeX = routeMargin;
  const routeY = Math.floor(20 * scaleFactor);

  // Route background with very light gray
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(routeX, routeY, routeWidth, routeHeight);

  // Draw enhanced terrain tiles for the route area
  drawEnhancedMapTiles(ctx, routeX, routeY, routeWidth, routeHeight, 'light');

  // Draw the GPS route with thin, neutral styling
  if (posterState.coordinates.length > 1) {
    drawRoute(ctx, routeX, routeY, routeWidth, routeHeight, posterState, true);
  }

  // TITLE SECTION: Bottom third, centered
  const titleY = routeY + routeHeight + Math.floor(30 * scaleFactor);
  const displayTitle = posterState.title || 'YOUR ACTIVITY';
  
  // Title in serif typeface, sentence case
  ctx.fillStyle = '#2a2a2a';
  ctx.font = `${Math.floor(42 * scaleFactor)}px "Times New Roman", Times, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(displayTitle, width / 2, titleY);

  // Subtitle
  const subtitleY = titleY + Math.floor(50 * scaleFactor);
  const displaySubtitle = posterState.subtitle || 'Strava Activity';
  ctx.fillStyle = '#6b7280';
  ctx.font = `${Math.floor(24 * scaleFactor)}px "Times New Roman", Times, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(displaySubtitle, width / 2, subtitleY);

  // FOOTER ROW: Stats with micro charts
  const footerY = height - Math.floor(60 * scaleFactor);
  drawStats(ctx, footerY, width, scaleFactor, true);

  // Branding at very bottom
  const brandY = height - Math.floor(20 * scaleFactor);
  ctx.fillStyle = '#9ca3af';
  ctx.font = `${Math.floor(12 * scaleFactor)}px "Times New Roman", Times, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${posterState.selectedSize.toUpperCase()} • TRACE PRINTS`, width / 2, brandY);
}

function drawRoute(
  ctx: CanvasRenderingContext2D, 
  mapX: number, 
  mapY: number, 
  mapWidth: number, 
  mapHeight: number, 
  posterState: PosterState,
  isArtPrint = false
) {
  // Calculate bounds of the route
  let minLat = posterState.coordinates[0][0], maxLat = posterState.coordinates[0][0];
  let minLng = posterState.coordinates[0][1], maxLng = posterState.coordinates[0][1];
  
  posterState.coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord[0]);
    maxLat = Math.max(maxLat, coord[0]);
    minLng = Math.min(minLng, coord[1]);
    maxLng = Math.max(maxLng, coord[1]);
  });

  // Add padding to bounds
  const latPadding = (maxLat - minLat) * 0.15;
  const lngPadding = (maxLng - minLng) * 0.15;
  minLat -= latPadding;
  maxLat += latPadding;
  minLng -= lngPadding;
  maxLng += lngPadding;

  // Function to convert GPS coordinates to canvas coordinates within map block
  const gpsToCanvas = (lat: number, lng: number) => {
    const x = mapX + ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = mapY + ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    return { x, y };
  };

  if (isArtPrint) {
    // Thin, neutral route line for art print
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  } else {
    // Beautiful route styling for classic
    let routeColor, routeGradient;
    if (posterState.theme === 'dark') {
      routeColor = '#60a5fa';
      routeGradient = ctx.createLinearGradient(0, 0, 0, mapHeight);
      routeGradient.addColorStop(0, '#60a5fa');
      routeGradient.addColorStop(1, '#3b82f6');
    } else if (posterState.theme === 'accent') {
      routeColor = '#f97316';
      routeGradient = ctx.createLinearGradient(0, 0, 0, mapHeight);
      routeGradient.addColorStop(0, '#f97316');
      routeGradient.addColorStop(1, '#ea580c');
    } else {
      routeColor = '#3b82f6';
      routeGradient = ctx.createLinearGradient(0, 0, 0, mapHeight);
      routeGradient.addColorStop(0, '#3b82f6');
      routeGradient.addColorStop(1, '#2563eb');
    }
    
    // Route glow effect
    ctx.shadowColor = routeColor;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.strokeStyle = routeGradient;
    ctx.lineWidth = 12;
  }
  
  ctx.beginPath();
  const startPoint = gpsToCanvas(posterState.coordinates[0][0], posterState.coordinates[0][1]);
  ctx.moveTo(startPoint.x, startPoint.y);
  
  // Draw each segment of the route
  for (let i = 1; i < posterState.coordinates.length; i++) {
    const point = gpsToCanvas(posterState.coordinates[i][0], posterState.coordinates[i][1]);
    ctx.lineTo(point.x, point.y);
  }
  
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Add start and end markers
  const start = gpsToCanvas(posterState.coordinates[0][0], posterState.coordinates[0][1]);
  const end = gpsToCanvas(posterState.coordinates[posterState.coordinates.length - 1][0], posterState.coordinates[posterState.coordinates.length - 1][1]);
  
  if (isArtPrint) {
    // Subtle markers for art print
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(end.x, end.y, 4, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    // Beautiful markers for classic
    // Start marker (green with glow)
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // End marker (red with glow)
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
}

function drawStats(
  ctx: CanvasRenderingContext2D, 
  statsY: number, 
  width: number, 
  scaleFactor: number,
  isArtPrint = false
) {
  const statSpacing = width / 3;
  const statTextSize = isArtPrint ? 20 : 22;
  const statLabelSize = isArtPrint ? 12 : 12;
  const fontFamily = isArtPrint ? '"Times New Roman", Times, serif' : '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';
  
  // Distance stat
  const distanceX = statSpacing * 0.5;
  ctx.fillStyle = isArtPrint ? '#2a2a2a' : '#1e293b';
  ctx.font = `bold ${Math.floor(statTextSize * scaleFactor)}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('8.85 mi', distanceX, statsY + Math.floor(25 * scaleFactor));
  
  // Distance icon
  ctx.strokeStyle = isArtPrint ? '#2a2a2a' : '#64748b';
  ctx.lineWidth = isArtPrint ? 1 : 3;
  ctx.beginPath();
  ctx.moveTo(distanceX - Math.floor(18 * scaleFactor), statsY + Math.floor(55 * scaleFactor));
  ctx.lineTo(distanceX + Math.floor(18 * scaleFactor), statsY + Math.floor(55 * scaleFactor));
  ctx.stroke();
  
  // Distance label
  ctx.fillStyle = isArtPrint ? '#6b7280' : '#64748b';
  ctx.font = `${Math.floor(statLabelSize * scaleFactor)}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('DISTANCE', distanceX, statsY + Math.floor(70 * scaleFactor));
  
  // Elevation stat
  const elevationX = statSpacing * 1.5;
  ctx.fillStyle = isArtPrint ? '#2a2a2a' : '#1e293b';
  ctx.font = `bold ${Math.floor(statTextSize * scaleFactor)}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('+1,247 ft', elevationX, statsY + Math.floor(25 * scaleFactor));
  
  // Elevation icon
  ctx.strokeStyle = isArtPrint ? '#2a2a2a' : '#64748b';
  ctx.lineWidth = isArtPrint ? 1 : 3;
  ctx.beginPath();
  ctx.moveTo(elevationX - Math.floor(18 * scaleFactor), statsY + Math.floor(55 * scaleFactor));
  ctx.lineTo(elevationX, statsY + Math.floor(45 * scaleFactor));
  ctx.lineTo(elevationX + Math.floor(18 * scaleFactor), statsY + Math.floor(55 * scaleFactor));
  ctx.stroke();
  
  // Elevation label
  ctx.fillStyle = isArtPrint ? '#6b7280' : '#64748b';
  ctx.font = `${Math.floor(statLabelSize * scaleFactor)}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('ELEVATION', elevationX, statsY + Math.floor(70 * scaleFactor));
  
  // Duration stat
  const durationX = statSpacing * 2.5;
  ctx.fillStyle = isArtPrint ? '#2a2a2a' : '#1e293b';
  ctx.font = `bold ${Math.floor(statTextSize * scaleFactor)}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('1:23:45', durationX, statsY + Math.floor(25 * scaleFactor));
  
  // Duration icon
  ctx.strokeStyle = isArtPrint ? '#2a2a2a' : '#64748b';
  ctx.lineWidth = isArtPrint ? 1 : 3;
  ctx.beginPath();
  ctx.arc(durationX, statsY + Math.floor(50 * scaleFactor), Math.floor(10 * scaleFactor), 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(durationX, statsY + Math.floor(50 * scaleFactor));
  ctx.lineTo(durationX + Math.floor(6 * scaleFactor), statsY + Math.floor(50 * scaleFactor));
  ctx.stroke();
  
  // Duration label
  ctx.fillStyle = isArtPrint ? '#6b7280' : '#64748b';
  ctx.font = `${Math.floor(statLabelSize * scaleFactor)}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('DURATION', durationX, statsY + Math.floor(70 * scaleFactor));
}
