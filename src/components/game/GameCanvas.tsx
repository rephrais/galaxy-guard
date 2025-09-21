import React, { useRef, useEffect } from 'react';
import { GameState, GameSettings } from '@/types/game';

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

    // Draw terrain with parallax scrolling
    if (gameState.terrain.length > 0) {
      ctx.beginPath();
      
      // Find visible terrain points
      const visibleTerrain = gameState.terrain.filter(point => 
        point.x >= gameState.scrollOffset - 100 && 
        point.x <= gameState.scrollOffset + settings.width + 100
      );
      
      if (visibleTerrain.length > 0) {
        // Adjust first point for screen coordinates
        const firstPoint = {
          x: visibleTerrain[0].x - gameState.scrollOffset,
          y: visibleTerrain[0].y
        };
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < visibleTerrain.length; i++) {
          const screenX = visibleTerrain[i].x - gameState.scrollOffset;
          ctx.lineTo(screenX, visibleTerrain[i].y);
        }
        
        ctx.lineTo(settings.width, settings.height);
        ctx.lineTo(0, settings.height);
        ctx.closePath();
        
        // Create terrain pattern
        const gradient = ctx.createLinearGradient(0, 500, 0, settings.height);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(0.5, '#0066ff');
        gradient.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw spaceship
    if (gameState.spaceship.active) {
      const { position, size } = gameState.spaceship;
      
      // Spaceship body
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(position.x, position.y, size.x, size.y);
      
      // Spaceship details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(position.x + size.x - 8, position.y + 4, 8, 4);
      ctx.fillRect(position.x + size.x - 8, position.y + size.y - 8, 8, 4);
      
      // Engine glow
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(position.x - 6, position.y + 6, 6, 8);
      
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

    // Draw projectiles (adjusted for scroll)
    gameState.projectiles.forEach(projectile => {
      if (!projectile.active) return;
      
      const screenX = projectile.position.x - gameState.scrollOffset;
      
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