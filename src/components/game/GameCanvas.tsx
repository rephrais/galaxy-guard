import React, { useRef, useEffect } from 'react';
import { GameState, GameSettings, TerrainPoint } from '@/types/game';

interface GameCanvasProps {
  gameState: GameState;
  settings: GameSettings;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000003';
    ctx.fillRect(0, 0, settings.width, settings.height);

    // Draw parallax starfield
    ctx.fillStyle = '#ffffff';
    for (let layer = 0; layer < 3; layer++) {
      const depth = layer + 1;
      const parallaxOffset = (gameState.scrollOffset * 0.1) / depth;
      
      for (let i = 0; i < 50; i++) {
        const x = ((i * 127) % (settings.width * 2) - parallaxOffset) % (settings.width + 100);
        const y = (i * 73) % settings.height;
        const size = Math.random() * (2 - layer * 0.3);
        const alpha = 1 - layer * 0.3;
        
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, size, size);
      }
    }
    ctx.globalAlpha = 1;

    // Draw multi-layer terrain with parallax
    const drawTerrainLayer = (
      terrain: TerrainPoint[], 
      scrollMultiplier: number, 
      color: string | CanvasGradient, 
      strokeColor: string,
      alpha: number = 1
    ) => {
      if (!terrain || terrain.length === 0) return;
      
      const parallaxOffset = gameState.scrollOffset * scrollMultiplier;
      const terrainWidth = terrain[terrain.length - 1].x - terrain[0].x;
      
      // Create looping terrain by drawing multiple segments
      for (let segment = -1; segment <= 2; segment++) {
        const segmentOffset = segment * terrainWidth;
        const visibleTerrain = terrain.filter(point => {
          const worldX = point.x + segmentOffset;
          return worldX >= parallaxOffset - 200 && worldX <= parallaxOffset + settings.width + 200;
        });
        
        if (visibleTerrain.length > 0) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          ctx.beginPath();
          const startX = (visibleTerrain[0].x + segmentOffset) - parallaxOffset;
          ctx.moveTo(startX, visibleTerrain[0].y);
          
          for (let i = 1; i < visibleTerrain.length; i++) {
            const x = (visibleTerrain[i].x + segmentOffset) - parallaxOffset;
            ctx.lineTo(x, visibleTerrain[i].y);
          }
          
          // Complete the shape to bottom
          ctx.lineTo(settings.width, settings.height);
          ctx.lineTo(0, settings.height);
          ctx.closePath();
          
          // Fill
          ctx.fillStyle = color;
          ctx.fill();
          
          // Stroke the terrain line only
          ctx.beginPath();
          ctx.moveTo(startX, visibleTerrain[0].y);
          for (let i = 1; i < visibleTerrain.length; i++) {
            const x = (visibleTerrain[i].x + segmentOffset) - parallaxOffset;
            ctx.lineTo(x, visibleTerrain[i].y);
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.restore();
        }
      }
    };
    
    // Draw background terrain (slowest parallax)
    const bgGradient = ctx.createLinearGradient(0, 250, 0, settings.height);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    drawTerrainLayer(gameState.terrain.background, 0.2, bgGradient, '#3a3a5c', 0.6);
    
    // Draw middle terrain (medium parallax, solid)
    const midGradient = ctx.createLinearGradient(0, 400, 0, settings.height);
    midGradient.addColorStop(0, '#2d2d44');
    midGradient.addColorStop(1, '#1a1a2e');
    drawTerrainLayer(gameState.terrain.middle, 1.0, midGradient, '#4a4a6a', 1.0);
    
    // Draw foreground terrain (fastest parallax)
    const fgGradient = ctx.createLinearGradient(0, 500, 0, settings.height);
    fgGradient.addColorStop(0, '#0f0f1a');
    fgGradient.addColorStop(1, '#000000');
    drawTerrainLayer(gameState.terrain.foreground, 1.5, fgGradient, '#2a2a3a', 0.8);

    // Draw spaceship  
    if (gameState.spaceship.active) {
      const { position, size } = gameState.spaceship;
      const pixelSize = 2; // Scale up the pixel art
      
      // Define the pixel art pattern matching the reference image
      const spaceshipPattern = [
        // Detailed pixel art spaceship (32x16)
        '                                ',
        '                                ',
        '                    RRRR        ',
        '                 RRROOOO        ',
        '               RRROOOOOOO       ',
        '             RRROOOOOOOOOO      ',
        '           GRRROOOGGGOOOOOOB    ',
        '         GRRROOOOGGGGOOOOOOBB   ',
        '       GGRRROOOOGGGGGOOOOOOBBBB ',
        '     GGRRRROOOOGGGGGGOOOOOOBBBBB',
        '   GGRRRROOOOGGGGGGGGOOOOOOBBBB ',
        ' GGRRRROOOOGGGGGGGGGGOOOOOOOBB  ',
        'GRRROOOOGGGGGGGGGGGGGOOOOOOB    ',
        '  RROOGGGGGGGGGGGGGGOOOOOO      ',
        '    GGGGGGGGGGGGGGOOOO          ',
        '      GGGGGGGGGGOO              '
      ];
      
      // Color mapping for realistic spaceship colors
      const colors: { [key: string]: string } = {
        'G': '#666666', // Dark gray for cockpit/body
        'O': '#ff8800', // Orange for main body
        'R': '#ff4400', // Red-orange for wing tips  
        'B': '#0099ff', // Blue for engines
        ' ': 'transparent'
      };
      
      // Draw the pixel art spaceship
      for (let row = 0; row < spaceshipPattern.length; row++) {
        for (let col = 0; col < spaceshipPattern[row].length; col++) {
          const pixel = spaceshipPattern[row][col];
          if (pixel !== ' ') {
            ctx.fillStyle = colors[pixel];
            const x = position.x + col * pixelSize;
            const y = position.y + row * pixelSize;
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
        }
      }
      
      // Health indicator
      const healthPercent = gameState.spaceship.health / gameState.spaceship.maxHealth;
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(position.x, position.y - 8, size.x * healthPercent, 4);
    }

    // Draw rockets (adjusted for scroll)
    gameState.rockets.forEach(rocket => {
      if (!rocket.active) return;
      
      const screenX = rocket.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -rocket.size.x || screenX > settings.width) return;
      
      const { position, size } = rocket;
      
      // Rocket body
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(screenX, position.y, size.x, size.y);
      
      // Rocket tip
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(screenX + 2, position.y, size.x - 4, 8);
      
      // Exhaust trail
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(screenX + 2, position.y + size.y, size.x - 4, 20);
    });

    // Draw projectiles (no scroll adjustment - they move independently)
    gameState.projectiles.forEach(projectile => {
      if (!projectile.active) return;
      
      const screenX = projectile.position.x;
      
      // Only draw if visible on screen
      if (screenX < -projectile.size.x || screenX > settings.width) return;
      
      const { position, size, type } = projectile;
      
      if (type === 'bullet') {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX, position.y, size.x, size.y);
      } else if (type === 'bomb') {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(screenX, position.y, size.x, size.y);
        
        // Bomb trail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX - 4, position.y + 2, 4, 4);
      }
    });

    // Draw explosions (adjusted for scroll)
    gameState.explosions.forEach(explosion => {
      const screenX = explosion.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -50 || screenX > settings.width + 50) return;
      
      const { position, startTime } = explosion;
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 500; // 500ms explosion duration
      
      if (progress < 1) {
        const radius = 25 * progress;
        const opacity = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        // Explosion rings
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(screenX, position.y, radius + i * 5, 0, Math.PI * 2);
          ctx.strokeStyle = i === 0 ? '#ffff00' : i === 1 ? '#ff6600' : '#ff0000';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        ctx.restore();
      }
    });

  }, [gameState, settings]);

  return (
    <canvas
      ref={canvasRef}
      width={settings.width}
      height={settings.height}
      className="game-canvas border-2 border-neon-yellow"
      style={{ 
        background: 'linear-gradient(180deg, #000003 0%, #000008 100%)',
        imageRendering: 'pixelated' 
      }}
    />
  );
};