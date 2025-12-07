import React, { useRef, useEffect, useState } from 'react';
import { GameState, GameSettings, TerrainPoint } from '@/types/game';

interface GameCanvasProps {
  gameState: GameState;
  settings: GameSettings;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: settings.width, height: settings.height });
  const [stars] = useState<Star[]>(() => {
    // Initialize 200 random stars
    const starArray: Star[] = [];
    for (let i = 0; i < 200; i++) {
      starArray.push({
        x: Math.random() * settings.width,
        y: Math.random() * settings.height,
        vx: (Math.random() - 0.5) * 0.15, // Super slow random X velocity
        vy: (Math.random() - 0.5) * 0.15, // Super slow random Y velocity
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
    return starArray;
  });

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate uniform scale to preserve aspect ratio (letterboxing)
    const scale = Math.min(canvasSize.width / settings.width, canvasSize.height / settings.height);
    const offsetX = Math.floor((canvasSize.width - settings.width * scale) / 2);
    const offsetY = Math.floor((canvasSize.height - settings.height * scale) / 2);
    
    // Calculate screen shake offset
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    
    if (gameState.screenShake) {
      const shake = gameState.screenShake;
      const elapsed = Date.now() - shake.startTime;
      
      if (elapsed <= shake.duration) {
        const progress = elapsed / shake.duration;
        const decay = 1 - progress; // Linear decay
        const currentIntensity = shake.intensity * decay;
        
        // Use sine waves with different frequencies for smooth, natural shake
        shakeOffsetX = Math.sin(elapsed * 0.03) * currentIntensity * 15;
        shakeOffsetY = Math.cos(elapsed * 0.04) * currentIntensity * 10;
      }
    }
    
    // Reset any existing transforms, clear and paint full canvas background (including letterbox areas)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000003';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context state and apply world transform with shake
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX + shakeOffsetX, offsetY + shakeOffsetY);

    // Fill game world background
    ctx.fillStyle = '#000003';
    ctx.fillRect(0, 0, settings.width, settings.height);

    // Draw randomly moving stars
    stars.forEach(star => {
      // Update star position
      star.x += star.vx;
      star.y += star.vy;
      
      // Wrap around edges
      if (star.x < 0) star.x = settings.width;
      if (star.x > settings.width) star.x = 0;
      if (star.y < 0) star.y = settings.height;
      if (star.y > settings.height) star.y = 0;
      
      // Draw star
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
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
    
    // Draw flames along foreground terrain
    const parallaxOffset = gameState.scrollOffset * 1.2;
    const visibleForeground = gameState.terrain.foreground.filter(point => {
      const screenX = point.x - parallaxOffset;
      return screenX >= -50 && screenX <= settings.width + 50;
    });
    
    // Draw flames at intervals along the terrain (heavily capped for performance)
    const time = Date.now() * 0.005; // For animation
    const MAX_FLAMES = 60; // Reduced from 120 for better performance
    const step = Math.max(5, Math.ceil(visibleForeground.length / MAX_FLAMES));
    
    for (let i = 0; i < visibleForeground.length; i += step) {
      const point = visibleForeground[i];
      const screenX = point.x - parallaxOffset;
      
      // Randomly vary flame appearance (use position as seed for consistency)
      const seed = Math.sin(point.x * 0.1);
      if (seed < 0.3) continue; // Skip some positions for variety
      
      // Determine flame size based on seed
      const sizeVariant = Math.abs(Math.sin(point.x * 0.05));
      let flameHeight;
      if (sizeVariant < 0.33) {
        flameHeight = 8 + Math.sin(time + point.x * 0.1) * 2; // Small
      } else if (sizeVariant < 0.66) {
        flameHeight = 15 + Math.sin(time + point.x * 0.1) * 3; // Medium
      } else {
        flameHeight = 25 + Math.sin(time + point.x * 0.1) * 5; // Tall
      }
      
      const flameWidth = flameHeight * 0.4;
      const flameY = point.y - flameHeight;
      
      // Simplified flame rendering for better performance
      ctx.fillStyle = sizeVariant < 0.33 ? '#ff6600' : sizeVariant < 0.66 ? '#ff8800' : '#ffaa00';
      
      // Simple triangle flame
      ctx.beginPath();
      ctx.moveTo(screenX, point.y);
      ctx.lineTo(screenX - flameWidth / 2, flameY + flameHeight * 0.3);
      ctx.lineTo(screenX, flameY);
      ctx.lineTo(screenX + flameWidth / 2, flameY + flameHeight * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Bright tip
      if (sizeVariant > 0.5) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(screenX, flameY + flameHeight * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw big obstacle trees from game state
    gameState.trees.forEach(tree => {
      const screenX = tree.x - gameState.scrollOffset;
      
      // Only draw if visible
      if (screenX >= -50 && screenX <= settings.width + 50) {
        // Dynamically get terrain Y at tree position to fix floating trees
        const nearestTerrainPoint = gameState.terrain.foreground.find(p => Math.abs(p.x - tree.x) < 10);
        const treeY = nearestTerrainPoint ? nearestTerrainPoint.y - 60 : tree.y;
        
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

    // Draw trail particles (before spaceship)
    gameState.trailParticles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      
      // Radial gradient glow for particles
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(0.5, particle.color + '88');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Core particle
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
      
      ctx.restore();
    });

    // Draw spaceship  
    if (gameState.spaceship.active) {
      const { position, size } = gameState.spaceship;
      const shipCenterX = position.x + size.x / 2;
      const shipCenterY = position.y + size.y / 2;
      const time = Date.now() * 0.005;
      
      // Draw power-up auras/glows around spaceship
      gameState.activePowerUps.forEach(powerUp => {
        ctx.save();
        
        if (powerUp.type === 'speed') {
          // Cyan pulsing glow and motion blur
          const pulseSize = 50 + Math.sin(time * 3) * 10;
          ctx.globalAlpha = 0.3 + Math.sin(time * 3) * 0.1;
          
          const speedGradient = ctx.createRadialGradient(
            shipCenterX, shipCenterY, 0,
            shipCenterX, shipCenterY, pulseSize
          );
          speedGradient.addColorStop(0, '#00ffff');
          speedGradient.addColorStop(0.5, '#0088ff');
          speedGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = speedGradient;
          ctx.beginPath();
          ctx.arc(shipCenterX, shipCenterY, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Engine boost flames (larger, bluer)
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = '#00ddff';
          for (let i = 0; i < 3; i++) {
            const flameLength = 15 + Math.sin(time * 5 + i) * 8;
            ctx.beginPath();
            ctx.moveTo(position.x - 10, shipCenterY + (i - 1) * 5);
            ctx.lineTo(position.x - 10 - flameLength, shipCenterY + (i - 1) * 3);
            ctx.lineTo(position.x - 10, shipCenterY + (i - 1) * 3);
            ctx.closePath();
            ctx.fill();
          }
        } else if (powerUp.type === 'fireRate') {
          // Orange/red pulsing energy field
          const pulseSize = 45 + Math.sin(time * 4) * 8;
          ctx.globalAlpha = 0.25 + Math.sin(time * 4) * 0.1;
          
          const fireGradient = ctx.createRadialGradient(
            shipCenterX, shipCenterY, 0,
            shipCenterX, shipCenterY, pulseSize
          );
          fireGradient.addColorStop(0, '#ff6600');
          fireGradient.addColorStop(0.5, '#ff3300');
          fireGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = fireGradient;
          ctx.beginPath();
          ctx.arc(shipCenterX, shipCenterY, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Weapon glow at front of ship
          ctx.globalAlpha = 0.6 + Math.sin(time * 6) * 0.2;
          const weaponGradient = ctx.createRadialGradient(
            position.x + size.x, shipCenterY, 0,
            position.x + size.x, shipCenterY, 15
          );
          weaponGradient.addColorStop(0, '#ffaa00');
          weaponGradient.addColorStop(0.5, '#ff6600');
          weaponGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = weaponGradient;
          ctx.beginPath();
          ctx.arc(position.x + size.x, shipCenterY, 15, 0, Math.PI * 2);
          ctx.fill();
          
          // Sparks around guns
          for (let i = 0; i < 3; i++) {
            const sparkAngle = time * 3 + i * Math.PI * 0.66;
            const sparkDist = 8 + Math.sin(time * 5 + i) * 3;
            const sparkX = position.x + size.x + Math.cos(sparkAngle) * sparkDist;
            const sparkY = shipCenterY + Math.sin(sparkAngle) * sparkDist;
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (powerUp.type === 'shield') {
          // Green/cyan shield bubble with hexagonal pattern
          const shieldRadius = 35;
          ctx.globalAlpha = 0.3 + Math.sin(time * 2) * 0.1;
          
          const shieldGradient = ctx.createRadialGradient(
            shipCenterX, shipCenterY, shieldRadius * 0.7,
            shipCenterX, shipCenterY, shieldRadius
          );
          shieldGradient.addColorStop(0, 'transparent');
          shieldGradient.addColorStop(0.7, '#00ff0040');
          shieldGradient.addColorStop(1, '#00ffff80');
          
          ctx.fillStyle = shieldGradient;
          ctx.beginPath();
          ctx.arc(shipCenterX, shipCenterY, shieldRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Hexagonal shield pattern
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = '#00ffaa';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + time * 0.5;
            const x = shipCenterX + Math.cos(angle) * shieldRadius;
            const y = shipCenterY + Math.sin(angle) * shieldRadius;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.stroke();
          
          // Energy ripples
          ctx.globalAlpha = 0.4 * Math.sin(time * 3);
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(shipCenterX, shipCenterY, shieldRadius * (0.7 + Math.sin(time * 3) * 0.2), 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.restore();
      });
      
      // If multiple power-ups active, add outer ring showing all colors
      if (gameState.activePowerUps.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 2;
        
        gameState.activePowerUps.forEach((powerUp, index) => {
          const colors = {
            speed: '#00ffff',
            fireRate: '#ff6600',
            shield: '#00ff00'
          };
          
          ctx.strokeStyle = colors[powerUp.type];
          ctx.beginPath();
          ctx.arc(shipCenterX, shipCenterY, 40 + index * 5, 0, Math.PI * 2);
          ctx.stroke();
        });
        
        ctx.restore();
      }
      
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
      } else if (type === 'spread') {
        // Yellow spread shot bullets
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(screenX, position.y, size.x, size.y);
        // Glow effect
        ctx.fillStyle = '#ffff88';
        ctx.fillRect(screenX + 1, position.y, size.x - 2, size.y);
      } else if (type === 'player_laser') {
        // Player laser beam - green/cyan
        ctx.save();
        const laserGradient = ctx.createLinearGradient(screenX, position.y, screenX + size.x, position.y);
        laserGradient.addColorStop(0, '#00ff88');
        laserGradient.addColorStop(0.5, '#00ffcc');
        laserGradient.addColorStop(1, '#00ff88');
        ctx.fillStyle = laserGradient;
        ctx.fillRect(screenX, position.y, size.x, size.y);
        // Bright core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX, position.y + 1, size.x, 2);
        ctx.restore();
      } else if (type === 'missile') {
        // Homing missile with fins
        ctx.save();
        // Missile body
        ctx.fillStyle = '#aa4400';
        ctx.fillRect(screenX, position.y, size.x - 4, size.y);
        // Nose cone
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(screenX + size.x - 4, position.y + size.y / 2);
        ctx.lineTo(screenX + size.x, position.y);
        ctx.lineTo(screenX + size.x, position.y + size.y);
        ctx.closePath();
        ctx.fill();
        // Fins
        ctx.fillStyle = '#666666';
        ctx.fillRect(screenX, position.y - 2, 4, 2);
        ctx.fillRect(screenX, position.y + size.y, 4, 2);
        // Exhaust flame
        const flameLen = 4 + Math.sin(Date.now() * 0.02) * 2;
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(screenX - flameLen, position.y + 1, flameLen, size.y - 2);
        ctx.restore();
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
      } else if (type === 'fire') {
        // Draw flaming fire projectile
        ctx.save();
        
        // Outer flame
        const fireGradient = ctx.createRadialGradient(screenX + size.x / 2, position.y + size.y / 2, 0, screenX + size.x / 2, position.y + size.y / 2, size.x);
        fireGradient.addColorStop(0, '#ffff00');
        fireGradient.addColorStop(0.4, '#ff6600');
        fireGradient.addColorStop(0.7, '#ff3300');
        fireGradient.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = fireGradient;
        ctx.beginPath();
        ctx.arc(screenX + size.x / 2, position.y + size.y / 2, size.x / 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX + size.x / 2, position.y + size.y / 2, size.x / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Flickering particles
        const time = Date.now() * 0.01;
        for (let i = 0; i < 3; i++) {
          const angle = time + i * Math.PI * 0.66;
          const dist = 5 + Math.sin(time * 2 + i) * 3;
          const px = screenX + size.x / 2 + Math.cos(angle) * dist;
          const py = position.y + size.y / 2 + Math.sin(angle) * dist;
          
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
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

    // Draw crawling aliens (adjusted for scroll)
    gameState.crawlingAliens.forEach(crawlingAlien => {
      if (!crawlingAlien.active) return;
      
      const screenX = crawlingAlien.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -crawlingAlien.size.x || screenX > settings.width + 50) return;
      
      const { position, size, health } = crawlingAlien;
      
      // Draw spider-like crawling alien body
      ctx.fillStyle = '#cc4400';
      ctx.fillRect(screenX + 5, position.y + 5, size.x - 10, size.y - 10);
      
      // Draw head with mandibles
      ctx.fillStyle = '#ff5500';
      ctx.fillRect(screenX, position.y, 10, 8);
      
      // Draw eyes (glowing red)
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(screenX + 2, position.y + 2, 2, 2);
      ctx.fillRect(screenX + 6, position.y + 2, 2, 2);
      
      // Draw multiple legs (spider-like)
      ctx.fillStyle = '#883300';
      for (let i = 0; i < 6; i++) {
        const legX = screenX + 5 + i * 4;
        const legYOffset = i % 2 === 0 ? 0 : 3;
        // Upper leg
        ctx.fillRect(legX, position.y + size.y - 5 + legYOffset, 2, 5);
        // Lower leg
        ctx.fillRect(legX - 1, position.y + size.y + legYOffset, 1, 4);
      }
      
      // Draw fire cannon on back
      ctx.fillStyle = '#666666';
      ctx.fillRect(screenX + size.x / 2 - 3, position.y, 6, 8);
      
      // Flame tip
      const time = Date.now() * 0.01;
      const flameSize = 2 + Math.sin(time * 3) * 1;
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(screenX + size.x / 2 - 1, position.y - flameSize, 2, flameSize);
      
      // Health bar above crawling alien
      if (health < 60 + gameState.level * 15) {
        const maxHealth = 60 + gameState.level * 15;
        const healthPercent = health / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, position.y - 10, size.x, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX, position.y - 10, size.x * healthPercent, 3);
      }
    });

    // Draw Dive Bombers
    gameState.diveBombers.forEach(bomber => {
      if (!bomber.active) return;
      
      const screenX = bomber.position.x - gameState.scrollOffset;
      if (screenX < -bomber.size.x || screenX > settings.width + 50) return;
      
      const { position, size, health, phase } = bomber;
      
      ctx.save();
      
      // Rotate based on dive phase
      ctx.translate(screenX + size.x / 2, position.y + size.y / 2);
      if (phase === 'dive') {
        ctx.rotate(0.4);
      } else if (phase === 'retreat') {
        ctx.rotate(-0.3);
      }
      ctx.translate(-(screenX + size.x / 2), -(position.y + size.y / 2));
      
      // Main body - sleek jet-like
      ctx.fillStyle = '#cc2222';
      ctx.beginPath();
      ctx.moveTo(screenX + size.x, position.y + size.y / 2);
      ctx.lineTo(screenX, position.y);
      ctx.lineTo(screenX + 10, position.y + size.y / 2);
      ctx.lineTo(screenX, position.y + size.y);
      ctx.closePath();
      ctx.fill();
      
      // Wings
      ctx.fillStyle = '#881111';
      ctx.fillRect(screenX + 5, position.y - 8, 15, 8);
      ctx.fillRect(screenX + 5, position.y + size.y, 15, 8);
      
      // Cockpit
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(screenX + size.x - 12, position.y + size.y / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Engine glow during dive
      if (phase === 'dive') {
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(screenX - 8, position.y + size.y / 2 - 3, 8, 6);
      }
      
      ctx.restore();
      
      // Health bar
      const maxHealth = 40 + gameState.level * 8;
      if (health < maxHealth) {
        const healthPercent = health / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, position.y - 12, size.x, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX, position.y - 12, size.x * healthPercent, 3);
      }
    });

    // Draw Zigzag Fighters
    gameState.zigzagFighters.forEach(zigzag => {
      if (!zigzag.active) return;
      
      const screenX = zigzag.position.x - gameState.scrollOffset;
      if (screenX < -zigzag.size.x || screenX > settings.width + 50) return;
      
      const { position, size, health, zigzagPhase } = zigzag;
      const time = Date.now() * 0.01;
      
      ctx.save();
      
      // Slight rotation based on zigzag movement
      ctx.translate(screenX + size.x / 2, position.y + size.y / 2);
      ctx.rotate(Math.sin(zigzagPhase) * 0.2);
      ctx.translate(-(screenX + size.x / 2), -(position.y + size.y / 2));
      
      // Main body - hexagonal shape
      ctx.fillStyle = '#6622aa';
      ctx.beginPath();
      ctx.moveTo(screenX + size.x, position.y + size.y / 2);
      ctx.lineTo(screenX + size.x * 0.7, position.y);
      ctx.lineTo(screenX + size.x * 0.3, position.y);
      ctx.lineTo(screenX, position.y + size.y / 2);
      ctx.lineTo(screenX + size.x * 0.3, position.y + size.y);
      ctx.lineTo(screenX + size.x * 0.7, position.y + size.y);
      ctx.closePath();
      ctx.fill();
      
      // Glowing core
      const pulseSize = 6 + Math.sin(time) * 2;
      ctx.fillStyle = '#ff00ff';
      ctx.beginPath();
      ctx.arc(screenX + size.x / 2, position.y + size.y / 2, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX + size.x * 0.7, position.y + size.y / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // Health bar
      const maxHealth = 35 + gameState.level * 6;
      if (health < maxHealth) {
        const healthPercent = health / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, position.y - 10, size.x, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX, position.y - 10, size.x * healthPercent, 3);
      }
    });

    // Draw Splitters
    gameState.splitters.forEach(splitter => {
      if (!splitter.active) return;
      
      const screenX = splitter.position.x - gameState.scrollOffset;
      if (screenX < -splitter.size.x || screenX > settings.width + 50) return;
      
      const { position, size, health, generation } = splitter;
      const time = Date.now() * 0.008;
      
      ctx.save();
      
      // Wobble animation
      ctx.translate(screenX + size.x / 2, position.y + size.y / 2);
      ctx.rotate(Math.sin(time + position.x * 0.01) * 0.1);
      
      // Color based on generation
      const colors = ['#22cc44', '#44aa22', '#668800'];
      const baseColor = colors[generation];
      
      // Blob-like body (circle)
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(0, 0, size.x / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner pattern (shows split capability)
      if (generation < 2) {
        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.arc(-size.x / 6, 0, size.x / 6, 0, Math.PI * 2);
        ctx.arc(size.x / 6, 0, size.x / 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-size.x / 5, -size.y / 6, 3, 0, Math.PI * 2);
      ctx.arc(size.x / 5, -size.y / 6, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-size.x / 5 + 1, -size.y / 6, 1.5, 0, Math.PI * 2);
      ctx.arc(size.x / 5 + 1, -size.y / 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // Health bar
      const maxHealth = generation === 0 ? 80 + gameState.level * 10 : generation === 1 ? 40 : 20;
      if (health < maxHealth) {
        const healthPercent = health / maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, position.y - size.y / 2 - 8, size.x, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX, position.y - size.y / 2 - 8, size.x * healthPercent, 3);
      }
    });

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

    // Draw power-ups (collectibles)
    gameState.powerUps.forEach(powerUp => {
      if (!powerUp.active) return;
      
      const screenX = powerUp.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -powerUp.size.x || screenX > settings.width) return;
      
      const { position, size, powerUpType } = powerUp;
      const time = Date.now() * 0.005;
      
      // Draw power-up with pulsing glow and icon
      ctx.save();
      
      // Pulsing glow effect
      const pulseSize = 5 + Math.sin(time * 3) * 3;
      const glowGradient = ctx.createRadialGradient(
        screenX + size.x / 2, position.y + size.y / 2, 0,
        screenX + size.x / 2, position.y + size.y / 2, size.x / 2 + pulseSize
      );
      
      // Different colors for different power-up types
      let color1, color2, icon;
      if (powerUpType === 'speed') {
        color1 = '#00ffff'; // Cyan
        color2 = '#0088ff';
        icon = 'S';
      } else if (powerUpType === 'fireRate') {
        color1 = '#ff6600'; // Orange
        color2 = '#ff0000';
        icon = 'F';
      } else if (powerUpType === 'spread') {
        color1 = '#ffff00'; // Yellow
        color2 = '#ff8800';
        icon = 'W'; // Wide shot
      } else if (powerUpType === 'laser') {
        color1 = '#00ff88'; // Cyan-green
        color2 = '#00cc66';
        icon = 'L';
      } else if (powerUpType === 'missile') {
        color1 = '#ff4400'; // Red-orange
        color2 = '#cc2200';
        icon = 'M';
      } else { // shield
        color1 = '#00ff00'; // Green
        color2 = '#00aa00';
        icon = 'H';
      }
      
      glowGradient.addColorStop(0, color1);
      glowGradient.addColorStop(0.7, color2);
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(screenX + size.x / 2, position.y + size.y / 2, size.x / 2 + pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Main power-up body (rotating square)
      ctx.save();
      ctx.translate(screenX + size.x / 2, position.y + size.y / 2);
      ctx.rotate(time * 2);
      ctx.fillStyle = color1;
      ctx.fillRect(-size.x / 3, -size.y / 3, size.x / 1.5, size.y / 1.5);
      ctx.strokeStyle = color2;
      ctx.lineWidth = 2;
      ctx.strokeRect(-size.x / 3, -size.y / 3, size.x / 1.5, size.y / 1.5);
      ctx.restore();
      
      // Icon letter
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, screenX + size.x / 2, position.y + size.y / 2);
      
      ctx.restore();
    });

    // Draw explosions with particles (adjusted for scroll)
    gameState.explosions.forEach(explosion => {
      const screenX = explosion.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (screenX < -200 || screenX > settings.width + 200) return;
      
      const { position, startTime, particles, isMegaExplosion } = explosion;
      const elapsed = Date.now() - startTime;
      const duration = isMegaExplosion ? 2000 : 1000; // Mega explosions last longer
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const isMega = isMegaExplosion || false;
        
        // Draw main explosion rings
        const maxRadius = isMega ? 100 : 30;
        const radius = maxRadius * progress;
        const opacity = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = opacity * (isMega ? 0.9 : 0.8);
        
        // Explosion rings - more for mega explosions
        const ringCount = isMega ? 8 : 4;
        for (let i = 0; i < ringCount; i++) {
          ctx.beginPath();
          ctx.arc(screenX, position.y, radius + i * (isMega ? 15 : 8), 0, Math.PI * 2);
          
          // Enhanced colors for mega explosions
          if (isMega) {
            ctx.strokeStyle = i === 0 ? '#ffffff' : 
                            i === 1 ? '#ffff00' : 
                            i === 2 ? '#ffaa00' :
                            i === 3 ? '#ff6600' :
                            i === 4 ? '#ff3300' :
                            i === 5 ? '#ff0000' : '#cc0000';
          } else {
            ctx.strokeStyle = i === 0 ? '#ffff00' : i === 1 ? '#ff6600' : i === 2 ? '#ff0000' : '#ffffff';
          }
          
          ctx.lineWidth = isMega ? 6 - i * 0.5 : 4 - i;
          ctx.stroke();
        }
        
        // Add bright flash for mega explosions
        if (isMega && progress < 0.3) {
          ctx.globalAlpha = (1 - progress / 0.3) * 0.6;
          const flashGradient = ctx.createRadialGradient(screenX, position.y, 0, screenX, position.y, radius * 2);
          flashGradient.addColorStop(0, '#ffffff');
          flashGradient.addColorStop(0.5, '#ffff00');
          flashGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = flashGradient;
          ctx.beginPath();
          ctx.arc(screenX, position.y, radius * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
        
        // Draw particles
        particles.forEach(particle => {
          const particleScreenX = particle.position.x - gameState.scrollOffset;
          
          // Only draw particles visible on screen
          if (particleScreenX < -20 || particleScreenX > settings.width + 20) return;
          
          ctx.save();
          ctx.globalAlpha = particle.life;
          
          // Enhanced particle rendering for mega explosions
          if (isMega) {
            // Add glow effect
            const glowGradient = ctx.createRadialGradient(
              particleScreenX, particle.position.y, 0,
              particleScreenX, particle.position.y, particle.size * 2
            );
            glowGradient.addColorStop(0, particle.color);
            glowGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(particleScreenX, particle.position.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Core particle
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particleScreenX, particle.position.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        });
      }
    });

    // Draw score popups
    const now = Date.now();
    gameState.scorePopups.forEach(popup => {
      const popupScreenX = popup.position.x - gameState.scrollOffset;
      
      // Only draw if visible on screen
      if (popupScreenX < -100 || popupScreenX > settings.width + 100) return;
      
      const elapsed = now - popup.startTime;
      const progress = elapsed / popup.duration;
      const alpha = 1 - progress; // Fade out
      const yOffset = progress * 60; // Float up
      
      if (alpha <= 0) return;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Draw score text with glow
      const fontSize = popup.score >= 1000 ? 24 : popup.score >= 500 ? 20 : 16;
      ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Color based on score value
      const color = popup.score >= 5000 ? '#ff0000' : 
                    popup.score >= 1000 ? '#ff6600' : 
                    popup.score >= 500 ? '#ffff00' : '#00ff00';
      
      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.fillText(`+${popup.score}`, popupScreenX, popup.position.y - yOffset);
      
      // White outline for readability
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeText(`+${popup.score}`, popupScreenX, popup.position.y - yOffset);
      
      ctx.restore();
    });

    // Draw screen flash effect
    if (gameState.screenFlash) {
      const flash = gameState.screenFlash;
      const elapsed = Date.now() - flash.startTime;
      
      if (elapsed <= flash.duration) {
        const progress = elapsed / flash.duration;
        const alpha = flash.intensity * (1 - progress); // Fade out
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = flash.color;
        ctx.fillRect(0, 0, settings.width, settings.height);
        ctx.restore();
      }
    }

    // Restore context state
    ctx.restore();

  }, [gameState, settings, canvasSize]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="game-canvas border-2 border-neon-yellow w-full h-full"
        style={{ 
          background: 'linear-gradient(180deg, #000003 0%, #000008 100%)',
          imageRendering: 'pixelated',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};