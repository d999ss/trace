export function drawEnhancedMapTiles(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  theme: string
) {
  if (theme === 'accent') {
    // For satellite theme, create a realistic aerial appearance
    // that mimics actual satellite imagery rather than abstract tiles
    
    // Base aerial color
    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(x, y, width, height);
    
    // Create realistic aerial terrain patterns
    const tileSize = 8; // Smaller tiles for more detail
    
    for (let tileX = x; tileX < x + width; tileX += tileSize) {
      for (let tileY = y; tileY < y + height; tileY += tileSize) {
        const rand = Math.random();
        
        if (rand > 0.75) {
          // Dense forest - dark green clusters
          ctx.fillStyle = 'rgba(21, 128, 61, 0.8)';
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        } else if (rand > 0.6) {
          // Grass/meadow - light green patches
          ctx.fillStyle = 'rgba(134, 239, 172, 0.7)';
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        } else if (rand > 0.45) {
          // Water - blue with varying opacity
          ctx.fillStyle = `rgba(59, 130, 246, ${0.4 + Math.random() * 0.4})`;
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        } else if (rand > 0.3) {
          // Rock/mountain - gray-brown variations
          ctx.fillStyle = `rgba(148, 163, 184, ${0.5 + Math.random() * 0.4})`;
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        } else if (rand > 0.2) {
          // Urban areas - light gray
          ctx.fillStyle = 'rgba(245, 245, 244, 0.6)';
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        } else if (rand > 0.15) {
          // Agricultural - tan/brown
          ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        }
      }
    }
    
    // Add aerial texture overlay for realism
    for (let tileX = x; tileX < x + width; tileX += tileSize * 3) {
      for (let tileY = y; tileY < y + height; tileY += tileSize * 3) {
        if (Math.random() > 0.7) {
          // Subtle aerial texture variations
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.15})`;
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        }
      }
    }
    
    // Add very subtle grid lines for map reference (barely visible)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.03)';
    ctx.lineWidth = 0.2;
    
    // Draw minimal grid
    for (let tileX = x; tileX <= x + width; tileX += tileSize * 4) {
      ctx.beginPath();
      ctx.moveTo(tileX, y);
      ctx.lineTo(tileX, y + height);
      ctx.stroke();
    }
    
    for (let tileY = y; tileY <= y + height; tileY += tileSize * 4) {
      ctx.beginPath();
      ctx.moveTo(x, tileY);
      ctx.lineTo(x + width, tileY);
      ctx.stroke();
    }
    
  } else {
    // For non-satellite themes, use terrain logic
    const tileSize = 12;
    
    // Base terrain colors based on theme
    let baseColor, gridColor;
    if (theme === 'dark') {
      baseColor = '#0f172a';
      gridColor = 'rgba(148, 163, 184, 0.15)';
    } else {
      baseColor = '#f8fafc';
      gridColor = 'rgba(148, 163, 184, 0.1)';
    }
    
    // Fill base terrain
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, width, height);
    
    // Draw subtle grid for map reference
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.3;
    
    // Draw vertical lines
    for (let tileX = x; tileX <= x + width; tileX += tileSize) {
      ctx.beginPath();
      ctx.moveTo(tileX, y);
      ctx.lineTo(tileX, y + height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let tileY = y; tileY <= y + height; tileY += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, tileY);
      ctx.lineTo(x + width, tileY);
      ctx.stroke();
    }
    
    // Add terrain features for non-satellite themes
    if (theme === 'dark') {
      // Dark theme - add subtle terrain variation
      for (let tileX = x; tileX < x + width; tileX += tileSize) {
        for (let tileY = y; tileY < y + height; tileY += tileSize) {
          const rand = Math.random();
          
          if (rand > 0.7) {
            // Subtle elevation changes
            ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.6) {
            // Darker areas
            ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.5) {
            // Very subtle variations
            ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    } else {
      // Light theme - add natural terrain features
      for (let tileX = x; tileX < x + width; tileX += tileSize) {
        for (let tileY = y; tileY < y + height; tileY += tileSize) {
          const rand = Math.random();
          
          if (rand > 0.8) {
            // Trees - more visible
            ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.65) {
            // Grass - more prominent
            ctx.fillStyle = 'rgba(134, 239, 172, 0.3)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.5) {
            // Water - more visible
            ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.35) {
            // Paths/trails - subtle but visible
            ctx.fillStyle = 'rgba(245, 245, 244, 0.4)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (rand > 0.25) {
            // Very subtle elevation changes
            ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    }
  }
}
