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

    // Draw starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 127) % settings.width;
      const y = (i * 73) % settings.height;
      const size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }

    // Draw terrain
    if (gameState.terrain.length > 0) {
      ctx.beginPath();
      ctx.moveTo(gameState.terrain[0].x, gameState.terrain[0].y);
      
      for (let i = 1; i < gameState.terrain.length; i++) {
        ctx.lineTo(gameState.terrain[i].x, gameState.terrain[i].y);
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

    // Draw rockets
    gameState.rockets.forEach(rocket => {
      if (!rocket.active) return;
      
      const { position, size } = rocket;
      
      // Rocket body
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(position.x, position.y, size.x, size.y);
      
      // Rocket tip
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(position.x + 2, position.y, size.x - 4, 8);
      
      // Exhaust trail
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(position.x + 2, position.y + size.y, size.x - 4, 20);
    });

    // Draw projectiles
    gameState.projectiles.forEach(projectile => {
      if (!projectile.active) return;
      
      const { position, size, type } = projectile;
      
      if (type === 'bullet') {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(position.x, position.y, size.x, size.y);
      } else if (type === 'bomb') {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(position.x, position.y, size.x, size.y);
        
        // Bomb trail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(position.x - 4, position.y + 2, 4, 4);
      }
    });

    // Draw explosions
    gameState.explosions.forEach(explosion => {
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
          ctx.arc(position.x, position.y, radius + i * 5, 0, Math.PI * 2);
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