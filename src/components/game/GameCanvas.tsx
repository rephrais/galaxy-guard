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

    // Draw optimized parallax starfield
    ctx.fillStyle = '#ffffff';
    for (let layer = 0; layer < 3; layer++) {
      const depth = layer + 1;
      const parallaxOffset = -(gameState.scrollOffset * 0.1) / depth;
      
      // Reduced to 80 stars per layer for performance
      for (let i = 0; i < 80; i++) {
        const x = ((i * 127) % (settings.width * 2) + parallaxOffset) % (settings.width + 100);
        const y = (i * 73) % settings.height;
        const size = 1 + layer * 0.5;
        const alpha = 1 - layer * 0.3;
        
        ctx.globalAlpha = alpha;
        if (x >= 0 && x <= settings.width) {
          ctx.fillRect(x, y, size, size);
        }
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
      
      // Filter terrain points that are visible on screen with wider buffer
      const visibleTerrain = terrain.filter(point => {
        const screenX = point.x - parallaxOffset;
        return screenX >= -400 && screenX <= settings.width + 400;
      });
      
      // If no visible terrain, still draw a fallback to prevent blinking
      if (visibleTerrain.length === 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(0, settings.height * 0.8, settings.width, settings.height * 0.2);
        ctx.restore();
        return;
      }
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      ctx.beginPath();
      
      // Ensure we start from the left edge of screen
      const firstPoint = visibleTerrain[0];
      const firstScreenX = firstPoint.x - parallaxOffset;
      
      if (firstScreenX > 0) {
        // Extend line from left edge to first point
        ctx.moveTo(0, firstPoint.y);
        ctx.lineTo(firstScreenX, firstPoint.y);
      } else {
        ctx.moveTo(firstScreenX, firstPoint.y);
      }
      
      // Draw the terrain line
      for (let i = 1; i < visibleTerrain.length; i++) {
        const x = visibleTerrain[i].x - parallaxOffset;
        ctx.lineTo(x, visibleTerrain[i].y);
      }
      
      // Extend to right edge if needed
      const lastPoint = visibleTerrain[visibleTerrain.length - 1];
      const lastScreenX = lastPoint.x - parallaxOffset;
      if (lastScreenX < settings.width) {
        ctx.lineTo(settings.width, lastPoint.y);
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
      if (firstScreenX > 0) {
        ctx.moveTo(0, firstPoint.y);
        ctx.lineTo(firstScreenX, firstPoint.y);
      } else {
        ctx.moveTo(firstScreenX, firstPoint.y);
      }
      
      for (let i = 1; i < visibleTerrain.length; i++) {
        const x = visibleTerrain[i].x - parallaxOffset;
        ctx.lineTo(x, visibleTerrain[i].y);
      }
      
      if (lastScreenX < settings.width) {
        ctx.lineTo(settings.width, lastPoint.y);
      }
      
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    };
    
    // Draw background terrain (super slow parallax for distant mountains)
    const bgGradient = ctx.createLinearGradient(0, 250, 0, settings.height);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    drawTerrainLayer(gameState.terrain.background, 0.1, bgGradient, '#3a3a5c', 0.6);
    
    // Draw middle terrain (slow parallax)
    const midGradient = ctx.createLinearGradient(0, 400, 0, settings.height);
    midGradient.addColorStop(0, '#2d2d44');
    midGradient.addColorStop(1, '#1a1a2e');
    drawTerrainLayer(gameState.terrain.middle, 0.7, midGradient, '#4a4a6a', 1.0);
    
    // Draw foreground terrain (fastest parallax)
    const fgGradient = ctx.createLinearGradient(0, 500, 0, settings.height);
    fgGradient.addColorStop(0, '#0f0f1a');
    fgGradient.addColorStop(1, '#000000');
    drawTerrainLayer(gameState.terrain.foreground, 1.2, fgGradient, '#2a2a3a', 0.8);
    
    // Draw big obstacle trees from game state
    gameState.trees.forEach(tree => {
      const screenX = tree.x - gameState.scrollOffset;
      
      // Only draw if visible
      if (screenX >= -50 && screenX <= settings.width + 50) {
        const treeY = tree.y;
        const trunkWidth = tree.width * 0.3;
        const trunkHeight = tree.height * 0.7;
        
        // Tree trunk (thick)
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(screenX - trunkWidth / 2, treeY + tree.height - trunkHeight, trunkWidth, trunkHeight);
        
        // Tree foliage - large triangle
        ctx.fillStyle = '#2a5a2a';
        ctx.beginPath();
        ctx.moveTo(screenX, treeY);
        ctx.lineTo(screenX - tree.width / 2, treeY + tree.height - trunkHeight + 20);
        ctx.lineTo(screenX + tree.width / 2, treeY + tree.height - trunkHeight + 20);
        ctx.closePath();
        ctx.fill();
        
        // Second foliage layer
        ctx.fillStyle = '#1a4a1a';
        ctx.beginPath();
        ctx.moveTo(screenX, treeY + 15);
        ctx.lineTo(screenX - tree.width / 2.5, treeY + tree.height - trunkHeight + 10);
        ctx.lineTo(screenX + tree.width / 2.5, treeY + tree.height - trunkHeight + 10);
        ctx.closePath();
        ctx.fill();
        
        // Third foliage layer (top)
        ctx.fillStyle = '#2a5a2a';
        ctx.beginPath();
        ctx.moveTo(screenX, treeY + 5);
        ctx.lineTo(screenX - tree.width / 3.5, treeY + tree.height - trunkHeight);
        ctx.lineTo(screenX + tree.width / 3.5, treeY + tree.height - trunkHeight);
        ctx.closePath();
        ctx.fill();
      }
    });

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
      
      const { position, size, type } = rocket;
      
      if (type === 'heavy') {
        // Heavy rocket - larger with different colors
        ctx.fillStyle = '#ff4444'; // Red body
        ctx.fillRect(screenX, position.y, size.x, size.y);
        
        // Heavy rocket details
        ctx.fillStyle = '#ffaa00'; // Orange tip
        ctx.fillRect(screenX + 2, position.y, size.x - 4, 12);
        
        // Thicker exhaust trail
        ctx.fillStyle = '#ffff00'; // Yellow exhaust
        ctx.fillRect(screenX + 4, position.y + size.y, size.x - 8, 25);
        ctx.fillStyle = '#ff6600'; // Orange exhaust
        ctx.fillRect(screenX + 6, position.y + size.y + 15, size.x - 12, 20);
        
        // Side details
        ctx.fillStyle = '#666666';
        ctx.fillRect(screenX, position.y + 20, 4, 15);
        ctx.fillRect(screenX + size.x - 4, position.y + 20, 4, 15);
      } else {
        // Normal rocket
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, position.y, size.x, size.y);
        
        // Rocket tip
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(screenX + 2, position.y, size.x - 4, 8);
        
        // Exhaust trail (should be at the bottom of rocket going up)
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(screenX + 2, position.y + size.y, size.x - 4, 15);
      }
    });

    // Draw saucers (adjusted for scroll)
    gameState.saucers.forEach(saucer => {
      if (!saucer.active) return;
      
      const screenX = saucer.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -saucer.size.x || screenX > settings.width + 50) return;
      
      const { position, size } = saucer;
      
      // Draw ellipse saucer
      ctx.save();
      
      // Main saucer body (ellipse)
      ctx.beginPath();
      ctx.ellipse(screenX + size.x / 2, position.y + size.y / 2, size.x / 2, size.y / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#cccccc';
      ctx.fill();
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Saucer dome (smaller ellipse on top)
      ctx.beginPath();
      ctx.ellipse(screenX + size.x / 2, position.y + size.y / 3, size.x / 3, size.y / 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#eeeeee';
      ctx.fill();
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Lights around the saucer
      const time = Date.now() * 0.005;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + time;
        const lightX = screenX + size.x / 2 + Math.cos(angle) * (size.x / 2.5);
        const lightY = position.y + size.y / 2 + Math.sin(angle) * (size.y / 2.5);
        
        ctx.beginPath();
        ctx.arc(lightX, lightY, 2, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#00ff00' : '#ff00ff';
        ctx.fill();
      }
      
      ctx.restore();
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
      } else if (type === 'laser') {
        // Draw alien laser - red/orange beam
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(screenX - 1, position.y - size.y/2, size.x, size.y);
        
        // Add glow effect
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(screenX, position.y - size.y/2 + 2, size.x - 2, size.y - 4);
        
        // Bright center
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(screenX + 1, position.y - size.y/2 + 4, 1, size.y - 8);
      } else if (type === 'fireball') {
        // Draw boss fireball - glowing orange ball
        ctx.save();
        
        // Outer glow
        const gradient = ctx.createRadialGradient(screenX + size.x / 2, position.y + size.y / 2, 0, screenX + size.x / 2, position.y + size.y / 2, size.x);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.3, '#ff6600');
        gradient.addColorStop(0.7, '#ff3300');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX + size.x / 2, position.y + size.y / 2, size.x, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(screenX + size.x / 2, position.y + size.y / 2, size.x / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    });

    // Draw aliens (adjusted for scroll)
    gameState.aliens.forEach(alien => {
      if (!alien.active) return;
      
      const screenX = alien.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -alien.size.x || screenX > settings.width + 50) return;
      
      const { position, size, health } = alien;
      
      // Draw alien body (insect-like)
      ctx.fillStyle = '#228822';
      ctx.fillRect(screenX + 5, position.y, size.x - 10, size.y - 5);
      
      // Draw alien head
      ctx.fillStyle = '#336633';
      ctx.fillRect(screenX + 8, position.y - 8, size.x - 16, 12);
      
      // Draw eyes (red)
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(screenX + 10, position.y - 6, 3, 3);
      ctx.fillRect(screenX + size.x - 13, position.y - 6, 3, 3);
      
      // Draw legs
      ctx.fillStyle = '#114411';
      for (let i = 0; i < 4; i++) {
        const legX = screenX + 6 + i * 5;
        ctx.fillRect(legX, position.y + size.y - 5, 2, 8);
      }
      
      // Draw weapon (cannon)
      ctx.fillStyle = '#444444';
      ctx.fillRect(screenX + size.x / 2 - 2, position.y + 5, 4, 15);
      
      // Health bar above alien
      if (health < alien.health) {
        const maxHealth = 50 + Math.floor((gameState.level - 1) * 10);
        const healthPercent = health / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, position.y - 15, size.x, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX, position.y - 15, size.x * healthPercent, 3);
      }
    });

    // Draw boss rockets (adjusted for scroll)
    gameState.bossRockets.forEach(boss => {
      if (!boss.active) return;
      
      const screenX = boss.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -boss.size.x || screenX > settings.width + 200) return;
      
      const { position, size, health, maxHealth } = boss;
      
      // Draw massive rocket body
      ctx.save();
      
      // Main body - dark metallic
      ctx.fillStyle = '#444444';
      ctx.fillRect(screenX, position.y, size.x, size.y);
      
      // Nose cone - red/orange
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.moveTo(screenX, position.y + size.y / 2);
      ctx.lineTo(screenX - 30, position.y + size.y / 2 - 15);
      ctx.lineTo(screenX - 30, position.y + size.y / 2 + 15);
      ctx.closePath();
      ctx.fill();
      
      // Engine exhausts (3 streams)
      ctx.fillStyle = '#0099ff';
      ctx.fillRect(screenX + size.x - 15, position.y + 10, 15, 15);
      ctx.fillRect(screenX + size.x - 15, position.y + size.y / 2 - 7, 15, 15);
      ctx.fillRect(screenX + size.x - 15, position.y + size.y - 25, 15, 15);
      
      // Engine flames
      const time = Date.now() * 0.01;
      const flameLength = 20 + Math.sin(time) * 10;
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(screenX + size.x, position.y + 12, flameLength, 11);
      ctx.fillRect(screenX + size.x, position.y + size.y / 2 - 5, flameLength, 11);
      ctx.fillRect(screenX + size.x, position.y + size.y - 23, flameLength, 11);
      
      // Weapon ports (3 cannons)
      ctx.fillStyle = '#222222';
      for (let i = 0; i < 3; i++) {
        const portY = position.y + 20 + i * 20;
        ctx.fillRect(screenX + 10, portY, 20, 8);
      }
      
      // Boss details - rivets and panels
      ctx.fillStyle = '#666666';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(screenX + 20 + i * 18, position.y + 5, 4, 4);
        ctx.fillRect(screenX + 20 + i * 18, position.y + size.y - 9, 4, 4);
      }
      
      // Health bar above boss
      const healthPercent = health / maxHealth;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(screenX, position.y - 20, size.x, 8);
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(screenX, position.y - 20, size.x * healthPercent, 8);
      
      // Health text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${health}/${maxHealth}`, screenX + size.x / 2, position.y - 25);
      
      ctx.restore();
    });

    // Draw MEGA BOSS
    if (gameState.boss && gameState.boss.active) {
      const screenX = gameState.boss.position.x - gameState.scrollOffset;
      
      if (screenX > -500 && screenX < settings.width + 100) {
        const { position, size, health, maxHealth, tentacles, id } = gameState.boss;
        
        ctx.save();
        
        // Determine boss color based on ID (different color each minute)
        const bossNumber = parseInt(id.split('-').pop() || '1');
        const bossColors = [
          { body: '#333333', tentacle: '#2d5a2d', tentacleDark: '#1a3a1a', accent: '#00ff00' }, // Green
          { body: '#442222', tentacle: '#5a2d2d', tentacleDark: '#3a1a1a', accent: '#ff0000' }, // Red
          { body: '#222244', tentacle: '#2d2d5a', tentacleDark: '#1a1a3a', accent: '#0000ff' }, // Blue
          { body: '#443322', tentacle: '#5a4d2d', tentacleDark: '#3a2a1a', accent: '#ffaa00' }, // Orange
          { body: '#442244', tentacle: '#5a2d5a', tentacleDark: '#3a1a3a', accent: '#ff00ff' }, // Purple
          { body: '#224444', tentacle: '#2d5a5a', tentacleDark: '#1a3a3a', accent: '#00ffff' }, // Cyan
        ];
        const colorScheme = bossColors[(bossNumber - 1) % bossColors.length];
        
        // Draw tentacles first (behind body)
        tentacles.forEach((tentacle, i) => {
          const baseX = screenX + size.x / 2;
          const baseY = position.y + size.y / 2;
          const endX = baseX + Math.cos(tentacle.angle) * tentacle.length;
          const endY = baseY + Math.sin(tentacle.angle) * tentacle.length;
          
          // Tentacle gradient
          const gradient = ctx.createLinearGradient(baseX, baseY, endX, endY);
          gradient.addColorStop(0, colorScheme.tentacle);
          gradient.addColorStop(1, colorScheme.tentacleDark);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 15 - i * 1.5;
          ctx.lineCap = 'round';
          
          // Draw wavy tentacle
          ctx.beginPath();
          ctx.moveTo(baseX, baseY);
          
          const segments = 5;
          for (let j = 1; j <= segments; j++) {
            const t = j / segments;
            const x = baseX + (endX - baseX) * t;
            const y = baseY + (endY - baseY) * t + Math.sin(Date.now() * 0.005 + i + j) * 10;
            ctx.lineTo(x, y);
          }
          
          ctx.stroke();
          
          // Tentacle tip
          ctx.fillStyle = '#ff4400';
          ctx.beginPath();
          ctx.arc(endX, endY + Math.sin(Date.now() * 0.005 + i + segments) * 10, 8, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Main robot body - massive mechanical structure
        ctx.fillStyle = colorScheme.body;
        ctx.fillRect(screenX, position.y, size.x, size.y);
        
        // Robot head/cockpit
        ctx.fillStyle = '#555555';
        ctx.fillRect(screenX + size.x * 0.3, position.y + 20, size.x * 0.4, size.y * 0.25);
        
        // Eyes - glowing red
        const eyeGlow = ctx.createRadialGradient(screenX + size.x * 0.4, position.y + 80, 0, screenX + size.x * 0.4, position.y + 80, 20);
        eyeGlow.addColorStop(0, '#ff0000');
        eyeGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(screenX + size.x * 0.4, position.y + 80, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(screenX + size.x * 0.6, position.y + 80, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Core eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX + size.x * 0.4 - 5, position.y + 75, 10, 10);
        ctx.fillRect(screenX + size.x * 0.6 - 5, position.y + 75, 10, 10);
        
        // Armor plates
        ctx.fillStyle = '#444444';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(screenX + 15, position.y + 150 + i * 60, size.x - 30, 40);
        }
        
        // Weapon systems - multiple cannons
        ctx.fillStyle = '#222222';
        for (let i = 0; i < 5; i++) {
          const cannonY = position.y + 150 + i * 50;
          ctx.fillRect(screenX + 30, cannonY, 40, 15);
          
          // Cannon glow
          ctx.fillStyle = '#ff6600';
          ctx.fillRect(screenX + 70, cannonY + 5, 10, 5);
        }
        ctx.fillStyle = '#222222';
        
        // Energy core with boss color
        const coreGradient = ctx.createRadialGradient(
          screenX + size.x / 2, position.y + size.y * 0.6, 0,
          screenX + size.x / 2, position.y + size.y * 0.6, 40
        );
        coreGradient.addColorStop(0, colorScheme.accent);
        coreGradient.addColorStop(0.5, colorScheme.tentacle);
        coreGradient.addColorStop(1, colorScheme.tentacleDark);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(screenX + size.x / 2, position.y + size.y * 0.6, 30 + Math.sin(Date.now() * 0.01) * 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Rivets and details
        ctx.fillStyle = '#666666';
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 8; j++) {
            ctx.fillRect(screenX + 10 + i * 12, position.y + 10 + j * 50, 3, 3);
          }
        }
        
        // Health bar above boss
        const healthPercent = health / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, position.y - 30, size.x, 15);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(screenX, position.y - 30, size.x * healthPercent, 15);
        
        // Boss title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MEGA BOSS', screenX + size.x / 2, position.y - 40);
        
        // Health text
        ctx.font = '14px monospace';
        ctx.fillText(`${health}/${maxHealth}`, screenX + size.x / 2, position.y - 15);
        
        ctx.restore();
      }
    }

    // Draw explosions with particles (adjusted for scroll)
    gameState.explosions.forEach(explosion => {
      const screenX = explosion.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -100 || screenX > settings.width + 100) return;
      
      const { position, startTime, particles } = explosion;
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 1000; // 1000ms explosion duration
      
      if (progress < 1) {
        // Draw main explosion rings
        const radius = 30 * progress;
        const opacity = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = opacity * 0.8;
        
        // Explosion rings
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(screenX, position.y, radius + i * 8, 0, Math.PI * 2);
          ctx.strokeStyle = i === 0 ? '#ffff00' : i === 1 ? '#ff6600' : i === 2 ? '#ff0000' : '#ffffff';
          ctx.lineWidth = 4 - i;
          ctx.stroke();
        }
        
        ctx.restore();
        
        // Draw particles
        particles.forEach(particle => {
          const particleScreenX = particle.position.x - gameState.scrollOffset;
          
          // Only draw particles visible on screen
          if (particleScreenX < -20 || particleScreenX > settings.width + 20) return;
          
          ctx.save();
          ctx.globalAlpha = particle.life;
          
          // Draw particle as a small filled circle
          ctx.beginPath();
          ctx.arc(particleScreenX, particle.position.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          
          // Add glow effect
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = particle.size * 2;
          ctx.beginPath();
          ctx.arc(particleScreenX, particle.position.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          
          ctx.restore();
        });
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