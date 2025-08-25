import { geoMercator, geoPath } from 'd3-geo';

interface PosterOptions {
  coords: [number, number][];
  theme: 'light' | 'dark' | 'accent';
  title?: string;
  subtitle?: string;
}

export async function generatePoster({
  coords,
  theme,
  title,
  subtitle
}: PosterOptions): Promise<string> {
  const width = 5400;
  const height = 7200;
  const margin = 400;
  
  // Bounds calculated automatically by d3-geo fitExtent
  
  // Create Mercator projection
  const projection = geoMercator()
    .fitExtent(
      [[margin, margin], [width - margin, height - margin]],
      {
        type: 'LineString',
        coordinates: coords
      }
    );
  
  // Create path generator
  const pathGenerator = geoPath(projection);
  
  // Get path string
  const pathData = pathGenerator({
    type: 'LineString',
    coordinates: coords
  });
  
  // Define colors based on theme
  const backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';
  const strokeColor = theme === 'dark' ? '#ffffff' : '#000000';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  
  // Build SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  
  // Add title if provided
  if (title) {
    svg += `
  <text x="${width / 2}" y="${height - 600}" font-family="Arial, sans-serif" font-size="180" font-weight="bold" text-anchor="middle" fill="${textColor}">
    ${escapeXml(title)}
  </text>`;
  }
  
  // Add subtitle if provided
  if (subtitle) {
    svg += `
  <text x="${width / 2}" y="${height - 400}" font-family="Arial, sans-serif" font-size="120" text-anchor="middle" fill="${textColor}">
    ${escapeXml(subtitle)}
  </text>`;
  }
  
  svg += '\n</svg>';
  
  // Return SVG for now - we'll implement proper PNG conversion later
  return svg;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}