import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameSettings, Vector2, Rocket, Projectile, TerrainPoint, TerrainLayers, Explosion, ExplosionParticle, Saucer, Alien, BossRocket, Boss, Tree, CrawlingAlien } from '@/types/game';

const DEFAULT_SETTINGS: GameSettings = {
  width: 1200,
  height: 800,
  scrollSpeed: 2,
  spaceshipSpeed: 5,
  bulletSpeed: 8,
  rocketLaunchFrequency: 1200, // milliseconds - more frequent
  rocketSpeed: 4,
};

// Generate infinite terrain segments
const generateTerrainSegment = (startX: number, segmentWidth: number = 1200): TerrainLayers => {
  const points = Math.floor(segmentWidth / 30);
  
  const background: TerrainPoint[] = [];
  const middle: TerrainPoint[] = [];
  const foreground: TerrainPoint[] = [];
  
  for (let i = 0; i < points; i++) {
    const x = startX + i * 30;
    const seedOffset = x * 0.001; // Use x position as seed for consistent terrain
    
    // Background terrain (higher, visual only)
    background.push({
      x,
      y: 300 + Math.sin(seedOffset * 0.5) * 30 + Math.sin(seedOffset * 2) * 10,
    });
    
    // Middle terrain (solid, affects gameplay)
    middle.push({
      x,
      y: 450 + Math.sin(seedOffset * 0.8) * 40 + Math.sin(seedOffset * 3) * 15,
    });
    
    // Foreground terrain (lower, visual only)
    foreground.push({
      x,
      y: 520 + Math.sin(seedOffset * 1.2) * 25 + Math.sin(seedOffset * 4) * 10,
    });
  }
  
  return { background, middle, foreground };
};

// Optimized explosion particles - fewer particles for better performance
const generateExplosionParticles = (centerX: number, centerY: number, particleCount: number = 6): ExplosionParticle[] => {
  const particles: ExplosionParticle[] = [];
  const colors = ['#ffff00', '#ff6600', '#ff0000'];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = 2 + Math.random() * 2;
    
    particles.push({
      position: { x: centerX, y: centerY },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
      size: 2,
      color: colors[i % colors.length],
      life: 1.0
    });
  }
  
  return particles;
};

// Initial terrain generation
const generateInitialTerrain = (): TerrainLayers => {
  return generateTerrainSegment(0, 3600); // Start with 3 segments
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    level: 1,
    score: 0,
    lives: 5,
    scrollOffset: 0,
    startTime: 0,
    spaceship: {
      id: 'player',
      position: { x: 100, y: 300 },
      velocity: { x: 0, y: 0 },
      size: { x: 40, y: 20 },
      active: true,
      health: 100,
      maxHealth: 100,
      ammunition: 1000,
      bombs: 5,
    },
    rockets: [],
    projectiles: [],
    saucers: [],
    aliens: [],
    crawlingAliens: [],
    bossRockets: [],
    boss: null,
    terrain: generateInitialTerrain(),
    explosions: [],
    trees: [],
  });

  const [settings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const gameLoopRef = useRef<number>();
  const lastRocketLaunchRef = useRef<number>(0);
  const lastSaucerSpawnRef = useRef<number>(0);
  const lastAlienSpawnRef = useRef<number>(0);
  const lastCrawlingAlienSpawnRef = useRef<number>(0);
  const lastBossSpawnRef = useRef<number>(0);
  const lastMegaBossSpawnRef = useRef<number>(0);
  const bossSpawnedRef = useRef<boolean>(false);
  const keysRef = useRef<Set<string>>(new Set());

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Collision detection
  const checkCollision = useCallback((obj1: any, obj2: any): boolean => {
    return (
      obj1.position.x < obj2.position.x + obj2.size.x &&
      obj1.position.x + obj1.size.x > obj2.position.x &&
      obj1.position.y < obj2.position.y + obj2.size.y &&
      obj1.position.y + obj1.size.y > obj2.position.y
    );
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.gameOver) {
      return;
    }

    setGameState(prevState => {
      const newState = { ...prevState };
      const now = Date.now();

      // Update world scroll - speed increases with level
      const currentScrollSpeed = settings.scrollSpeed + (newState.level - 1) * 0.5;
      newState.scrollOffset += currentScrollSpeed;
      
      // Generate new terrain if needed (infinite scrolling)
      const lastTerrainX = Math.max(
        ...newState.terrain.middle.map(p => p.x)
      );
      
      if (lastTerrainX < newState.scrollOffset + settings.width * 2) {
        const newSegment = generateTerrainSegment(lastTerrainX, 1200);
        newState.terrain.background.push(...newSegment.background);
        newState.terrain.middle.push(...newSegment.middle);
        newState.terrain.foreground.push(...newSegment.foreground);
        
        // Generate trees on the foreground terrain
        for (let x = lastTerrainX; x < lastTerrainX + 1200; x += 200 + Math.floor(Math.sin(x * 0.01) * 100)) {
          const terrainY = newState.terrain.foreground.find(p => Math.abs(p.x - x) < 20)?.y || 650;
          newState.trees.push({
            x: x,
            y: terrainY - 60, // Position tree above terrain
            width: 40,
            height: 80,
          });
        }
      }
      
      // Aggressive cleanup for better performance - keep only visible terrain
      const minX = newState.scrollOffset - settings.width * 0.2;
      newState.terrain.background = newState.terrain.background.filter(p => p.x > minX);
      newState.terrain.middle = newState.terrain.middle.filter(p => p.x > minX);
      newState.terrain.foreground = newState.terrain.foreground.filter(p => p.x > minX);
      newState.trees = newState.trees.filter(t => t.x > minX);
      
      // Cleanup old explosions (keep only active ones)
      newState.explosions = newState.explosions.filter(exp => now - exp.startTime < 500);

      // Handle spaceship movement (Arrow keys or WASD)
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) {
        newState.spaceship.velocity.y = -settings.spaceshipSpeed;
      } else if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) {
        newState.spaceship.velocity.y = settings.spaceshipSpeed;
      } else {
        newState.spaceship.velocity.y = 0;
      }

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
        newState.spaceship.velocity.x = -settings.spaceshipSpeed;
      } else if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
        newState.spaceship.velocity.x = settings.spaceshipSpeed;
      } else {
        newState.spaceship.velocity.x = 0;
      }

      // Update spaceship position
      newState.spaceship.position.x += newState.spaceship.velocity.x;
      newState.spaceship.position.y += newState.spaceship.velocity.y;

      // Check edge collision - ship explodes if touching edges
      const hitLeftEdge = newState.spaceship.position.x <= 0;
      const hitRightEdge = newState.spaceship.position.x >= settings.width - newState.spaceship.size.x;
      const hitTopEdge = newState.spaceship.position.y <= 0;
      const hitBottomEdge = newState.spaceship.position.y >= settings.height - newState.spaceship.size.y;
      
      if (hitLeftEdge || hitRightEdge || hitTopEdge || hitBottomEdge) {
        // Damage spaceship for hitting edges
        newState.spaceship.health -= 50;
        
        // Create explosion at spaceship position
        newState.explosions.push({
          id: `explosion-${Date.now()}-${Math.random()}`,
          position: { x: newState.spaceship.position.x + newState.scrollOffset, y: newState.spaceship.position.y },
          startTime: now,
          particles: generateExplosionParticles(
            newState.spaceship.position.x + newState.scrollOffset, 
            newState.spaceship.position.y + newState.spaceship.size.y / 2,
            8 // Reduced particle count
          )
        });
        
        if (newState.spaceship.health <= 0) {
          newState.lives--;
          if (newState.lives <= 0) {
            newState.gameOver = true;
          } else {
            // Reset spaceship
            newState.spaceship.health = newState.spaceship.maxHealth;
            newState.spaceship.position = { x: 100, y: 300 };
          }
        } else {
          // Push ship back from edge
          if (hitLeftEdge) newState.spaceship.position.x = 1;
          if (hitRightEdge) newState.spaceship.position.x = settings.width - newState.spaceship.size.x - 1;
          if (hitTopEdge) newState.spaceship.position.y = 1;
          if (hitBottomEdge) newState.spaceship.position.y = settings.height - newState.spaceship.size.y - 1;
        }
      }

      // Handle shooting
      if (keysRef.current.has('Space') && newState.spaceship.ammunition > 0) {
        const bulletId = `bullet-${Date.now()}-${Math.random()}`;
        newState.projectiles.push({
          id: bulletId,
          position: { 
            x: newState.spaceship.position.x + newState.spaceship.size.x, 
            y: newState.spaceship.position.y + newState.spaceship.size.y / 2 
          },
          velocity: { x: settings.bulletSpeed, y: 0 },
          size: { x: 8, y: 2 },
          active: true,
          damage: 25,
          type: 'bullet',
        });
        newState.spaceship.ammunition--;
        keysRef.current.delete('Space'); // Prevent auto-fire
      }

      // Handle bombing
      if (keysRef.current.has('KeyB') && newState.spaceship.bombs > 0) {
        const bombId = `bomb-${Date.now()}-${Math.random()}`;
        newState.projectiles.push({
          id: bombId,
          position: { 
            x: newState.spaceship.position.x + newState.spaceship.size.x, 
            y: newState.spaceship.position.y + newState.spaceship.size.y 
          },
          velocity: { x: settings.bulletSpeed * 0.7, y: 2 },
          size: { x: 12, y: 8 },
          active: true,
          damage: 100,
          type: 'bomb',
        });
        newState.spaceship.bombs--;
        keysRef.current.delete('KeyB'); // Prevent auto-bomb
      }

      // Launch rockets from terrain (adjusted for scroll and difficulty) - capped for performance
      const rocketFreq = Math.max(600, settings.rocketLaunchFrequency - (newState.level - 1) * 80);
      const maxRockets = Math.min(5, 3 + Math.floor(newState.level / 2));
      
      if (now - lastRocketLaunchRef.current > rocketFreq && newState.rockets.length < maxRockets) {
        // Find visible terrain points to launch from - broader search range
        const visibleTerrain = newState.terrain.middle.filter(point => 
          point.x >= newState.scrollOffset + settings.width * 0.5 && 
          point.x <= newState.scrollOffset + settings.width * 2.0
        );
        
        // Fallback: if no visible terrain, create a launch point
        let launchPoint;
        if (visibleTerrain.length > 0) {
          launchPoint = visibleTerrain[Math.floor(Math.random() * visibleTerrain.length)];
        } else {
          // Create emergency launch point
          launchPoint = {
            x: newState.scrollOffset + settings.width * 0.8 + Math.random() * settings.width * 0.4,
            y: 450 + Math.random() * 50
          };
        }
        
        const rocketId = `rocket-${Date.now()}-${Math.random()}`;
        
        // Randomly choose rocket type (70% normal, 30% heavy)
        const isHeavy = Math.random() < 0.3 + (newState.level - 1) * 0.05; // More heavy rockets at higher levels
        
        if (isHeavy) {
          // Heavy rocket - bigger and slower
          newState.rockets.push({
            id: rocketId,
            position: { x: launchPoint.x, y: launchPoint.y },
            velocity: { x: 0, y: -2 }, // Slower speed
            size: { x: 16, y: 50 }, // Bigger size
            active: true,
            launchTime: now,
            explosionRadius: 80, // Bigger explosion
            type: 'heavy'
          });
        } else {
          // Normal rocket
          newState.rockets.push({
            id: rocketId,
            position: { x: launchPoint.x, y: launchPoint.y },
            velocity: { x: 0, y: -settings.rocketSpeed },
            size: { x: 8, y: 30 },
            active: true,
            launchTime: now,
            explosionRadius: 40,
            type: 'normal'
          });
        }
        
        lastRocketLaunchRef.current = now;
      }

      // Spawn saucers from the right side - capped for performance
      const saucerFreq = Math.max(3000, 5000 - (newState.level - 1) * 150);
      const maxSaucers = Math.min(3, 2 + Math.floor(newState.level / 3));
      
      if (now - lastSaucerSpawnRef.current > saucerFreq && newState.saucers.length < maxSaucers) {
        const saucerId = `saucer-${Date.now()}-${Math.random()}`;
        const spawnY = 100 + Math.random() * (settings.height - 300); // Random Y position in upper area
        const targetY = newState.spaceship.position.y + (Math.random() - 0.5) * 200; // Drift towards ship area
        
        newState.saucers.push({
          id: saucerId,
          position: { 
            x: newState.scrollOffset + settings.width + 100, // Spawn off right edge 
            y: spawnY 
          },
          velocity: { x: -1 - Math.random() * 0.5, y: 0 }, // Slow leftward movement
          size: { x: 60, y: 25 }, // Ellipse dimensions
          active: true,
          targetY,
          driftSpeed: 0.5 + Math.random() * 0.3,
          lastFireTime: now,
          fireRate: 2000 + Math.random() * 1000 // 2-3 seconds between shots
        });
        
        lastSaucerSpawnRef.current = now;
      }

      // Spawn aliens on terrain - capped for performance
      const alienSpawnFreq = 12000;
      const maxAliens = Math.min(4, 3 + Math.floor(newState.level / 2));
      
      if (now - lastAlienSpawnRef.current > alienSpawnFreq && newState.aliens.length < maxAliens) {
        // Find a terrain point to spawn alien on
        const visibleTerrain = newState.terrain.middle.filter(point => 
          point.x >= newState.scrollOffset + settings.width * 0.3 && 
          point.x <= newState.scrollOffset + settings.width * 1.8
        );
        
        if (visibleTerrain.length > 0) {
          const spawnPoint = visibleTerrain[Math.floor(Math.random() * visibleTerrain.length)];
          const alienId = `alien-${Date.now()}-${Math.random()}`;
          
          newState.aliens.push({
            id: alienId,
            position: { 
              x: spawnPoint.x, 
              y: spawnPoint.y - 40 // Above ground level
            },
            velocity: { x: 0, y: 0 },
            size: { x: 30, y: 35 },
            active: true,
            lastFireTime: now,
            fireRate: 1500 + Math.random() * 1000, // 1.5-2.5 seconds between shots
            health: 50 + newState.level * 10
          });
          
          lastAlienSpawnRef.current = now;
        }
      }

      // Spawn crawling aliens on foreground terrain - capped for performance
      const crawlingAlienSpawnFreq = 10000;
      const maxCrawlingAliens = Math.min(3, 2 + Math.floor(newState.level / 3));
      
      if (now - lastCrawlingAlienSpawnRef.current > crawlingAlienSpawnFreq && newState.crawlingAliens.length < maxCrawlingAliens) {
        // Find a foreground terrain point to spawn crawling alien on
        const visibleTerrain = newState.terrain.foreground.filter(point => 
          point.x >= newState.scrollOffset + settings.width * 0.5 && 
          point.x <= newState.scrollOffset + settings.width * 1.5
        );
        
        if (visibleTerrain.length > 0) {
          const spawnPoint = visibleTerrain[Math.floor(Math.random() * visibleTerrain.length)];
          const crawlingAlienId = `crawling-alien-${Date.now()}-${Math.random()}`;
          
          newState.crawlingAliens.push({
            id: crawlingAlienId,
            position: { 
              x: spawnPoint.x, 
              y: spawnPoint.y - 25
            },
            velocity: { x: 0, y: 0 },
            size: { x: 35, y: 20 },
            active: true,
            lastFireTime: now,
            fireRate: 2000 + Math.random() * 1000,
            health: 60 + newState.level * 15,
            targetX: newState.spaceship.position.x + newState.scrollOffset,
            moveSpeed: 0.8 + Math.random() * 0.4
          });
          
          lastCrawlingAlienSpawnRef.current = now;
        }
      }

      const bossSpawnFreq = 10000; // 10 seconds
      const maxBosses = 1; // Only one boss at a time
      
      if (now - lastBossSpawnRef.current > bossSpawnFreq && newState.bossRockets.length < maxBosses) {
        const bossId = `boss-${Date.now()}-${Math.random()}`;
        const spawnY = settings.height / 2 + (Math.random() - 0.5) * 200; // Center-ish vertical position
        
        newState.bossRockets.push({
          id: bossId,
          position: { 
            x: newState.scrollOffset + settings.width + 200, // Spawn off right edge 
            y: spawnY 
          },
          velocity: { x: -0.5, y: 0 }, // Slow leftward movement
          size: { x: 120, y: 80 }, // Massive size
          active: true,
          lastFireTime: now,
          fireRate: 800, // Fire every 0.8 seconds
          health: 20,
          maxHealth: 20
        });
        
        lastBossSpawnRef.current = now;
      }

      // Spawn MEGA BOSS at 0:30 and every 30 seconds thereafter
      const gameTime = now - newState.startTime;
      const timeSinceLastMega = lastMegaBossSpawnRef.current === 0 ? gameTime : now - lastMegaBossSpawnRef.current;
      
      // Spawn boss every 30 seconds if no boss is currently active
      if (gameTime >= 30000 && !newState.boss && timeSinceLastMega >= 30000) {
        // Create tentacles
        const tentacles = [];
        for (let i = 0; i < 6; i++) {
          tentacles.push({
            angle: (Math.PI * 2 * i) / 6,
            length: 80 + Math.random() * 40
          });
        }
        
        const bossNumber = Math.floor(gameTime / 30000);
        
        newState.boss = {
          id: `mega-boss-${bossNumber}-${now}`,
          position: { 
            x: newState.scrollOffset + settings.width + 50,
            y: settings.height / 2 - 200
          },
          velocity: { x: -0.3, y: 0 },
          size: { x: 250, y: 400 },
          active: true,
          lastFireTime: now,
          fireRate: 1200,
          health: 100,
          maxHealth: 100,
          tentacles
        };
        
        lastMegaBossSpawnRef.current = now;
      }

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        if (!projectile.active) return false;
        
        projectile.position.x += projectile.velocity.x;
        projectile.position.y += projectile.velocity.y;
        
        // Remove if off screen (all edges for boss fireballs)
        if (projectile.position.x < -100 || projectile.position.x > settings.width + 100 || 
            projectile.position.y < -100 || projectile.position.y > settings.height + 100) {
          return false;
        }
        
        return true;
      });

      // Update rockets (move upward and cull off-screen)
      newState.rockets = newState.rockets.filter(rocket => {
        if (!rocket.active) return false;
        
        rocket.position.y += rocket.velocity.y;
        
        // Remove if rocket goes above the screen or far below
        if (rocket.position.y + rocket.size.y < 0 || rocket.position.y > settings.height + 200) {
          return false;
        }
        
        return true;
      });

      // Update saucers and make them shoot
      newState.saucers = newState.saucers.filter(saucer => {
        if (!saucer.active) return false;
        
        saucer.position.x += saucer.velocity.x;
        
        // Drift towards target Y position
        const yDiff = saucer.targetY - saucer.position.y;
        if (Math.abs(yDiff) > 5) {
          saucer.position.y += Math.sign(yDiff) * saucer.driftSpeed;
        }
        
        // Fire at spaceship
        if (now - saucer.lastFireTime > saucer.fireRate) {
          const saucerScreenX = saucer.position.x - newState.scrollOffset;
          
          // Only fire if saucer is visible on screen
          if (saucerScreenX > -100 && saucerScreenX < settings.width + 100) {
            const dx = newState.spaceship.position.x + newState.spaceship.size.x / 2 - (saucerScreenX + saucer.size.x / 2);
            const dy = newState.spaceship.position.y + newState.spaceship.size.y / 2 - (saucer.position.y + saucer.size.y / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const laserSpeed = 7;
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            const laserId = `saucer-laser-${Date.now()}-${Math.random()}`;
            newState.projectiles.push({
              id: laserId,
              position: { 
                x: saucerScreenX + saucer.size.x / 2, 
                y: saucer.position.y + saucer.size.y / 2 
              },
              velocity: { 
                x: normalizedDx * laserSpeed, 
                y: normalizedDy * laserSpeed 
              },
              size: { x: 3, y: 12 },
              active: true,
              damage: 20 + newState.level * 2,
              type: 'laser'
            });
            
            saucer.lastFireTime = now;
          }
        }
        
        // Remove if off screen (left edge)
        if (saucer.position.x < newState.scrollOffset - 200) {
          return false;
        }
        
        return true;
      });

      // Update aliens and make them fire lasers
      newState.aliens = newState.aliens.filter(alien => {
        if (!alien.active) return false;
        
        // Check if alien should fire at spaceship
        if (now - alien.lastFireTime > alien.fireRate) {
          // Calculate angle to spaceship (convert alien world position to screen position)
          const alienScreenX = alien.position.x - newState.scrollOffset;
          const dx = newState.spaceship.position.x + newState.spaceship.size.x / 2 - (alienScreenX + alien.size.x / 2);
          const dy = newState.spaceship.position.y + newState.spaceship.size.y / 2 - (alien.position.y + alien.size.y / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only fire if spaceship is within range and visible
          if (distance < 600 && alienScreenX > -100 && alienScreenX < settings.width + 100) {
            const laserSpeed = 6;
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            const laserId = `laser-${Date.now()}-${Math.random()}`;
            newState.projectiles.push({
              id: laserId,
              position: { 
                x: alienScreenX + alien.size.x / 2, 
                y: alien.position.y + alien.size.y / 2 
              },
              velocity: { 
                x: normalizedDx * laserSpeed, 
                y: normalizedDy * laserSpeed 
              },
              size: { x: 3, y: 12 },
              active: true,
              damage: 15 + newState.level * 2,
              type: 'laser'
            });
            
            alien.lastFireTime = now;
          }
        }
        
        // Remove aliens that are too far off screen
        const alienScreenX = alien.position.x - newState.scrollOffset;
        if (alienScreenX < -300 || alienScreenX > settings.width + 300) {
          return false;
        }
        
        return true;
      });

      // Update crawling aliens - they crawl on terrain and shoot fire
      newState.crawlingAliens = newState.crawlingAliens.filter(crawlingAlien => {
        if (!crawlingAlien.active) return false;
        
        // Find the terrain point beneath the alien
        const nearestTerrainPoint = newState.terrain.foreground.reduce((closest, point) => {
          const distToCurrent = Math.abs(point.x - crawlingAlien.position.x);
          const distToClosest = Math.abs(closest.x - crawlingAlien.position.x);
          return distToCurrent < distToClosest ? point : closest;
        }, newState.terrain.foreground[0]);
        
        // Update target to spaceship position
        crawlingAlien.targetX = newState.spaceship.position.x + newState.scrollOffset;
        
        // Move towards spaceship (crawl on terrain)
        const dx = crawlingAlien.targetX - crawlingAlien.position.x;
        if (Math.abs(dx) > 10) {
          crawlingAlien.position.x += Math.sign(dx) * crawlingAlien.moveSpeed;
        }
        
        // Keep alien on terrain
        if (nearestTerrainPoint) {
          crawlingAlien.position.y = nearestTerrainPoint.y - 25;
        }
        
        // Check if alien should fire at spaceship
        if (now - crawlingAlien.lastFireTime > crawlingAlien.fireRate) {
          const crawlingAlienScreenX = crawlingAlien.position.x - newState.scrollOffset;
          const dx = newState.spaceship.position.x + newState.spaceship.size.x / 2 - (crawlingAlienScreenX + crawlingAlien.size.x / 2);
          const dy = newState.spaceship.position.y + newState.spaceship.size.y / 2 - (crawlingAlien.position.y + crawlingAlien.size.y / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Fire flaming fire projectiles if in range and visible
          if (distance < 700 && crawlingAlienScreenX > -100 && crawlingAlienScreenX < settings.width + 100) {
            const fireSpeed = 4;
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            const fireId = `fire-${Date.now()}-${Math.random()}`;
            newState.projectiles.push({
              id: fireId,
              position: { 
                x: crawlingAlienScreenX + crawlingAlien.size.x / 2, 
                y: crawlingAlien.position.y + 5
              },
              velocity: { 
                x: normalizedDx * fireSpeed, 
                y: normalizedDy * fireSpeed 
              },
              size: { x: 15, y: 15 },
              active: true,
              damage: 50, // 50% of spaceship's life
              type: 'fire'
            });
            
            crawlingAlien.lastFireTime = now;
          }
        }
        
        // Remove crawling aliens that are too far off screen
        const crawlingAlienScreenX = crawlingAlien.position.x - newState.scrollOffset;
        if (crawlingAlienScreenX < -400 || crawlingAlienScreenX > settings.width + 400) {
          return false;
        }
        
        return true;
      });

      // Update boss rockets and make them shoot photons
      newState.bossRockets = newState.bossRockets.filter(boss => {
        if (!boss.active) return false;
        
        boss.position.x += boss.velocity.x;
        
        // Fire 3 streams of photons
        if (now - boss.lastFireTime > boss.fireRate) {
          const bossScreenX = boss.position.x - newState.scrollOffset;
          
          // Only fire if boss is visible on screen
          if (bossScreenX > -200 && bossScreenX < settings.width + 200) {
            const photonSpeed = 3; // Slow photons
            
            // Fire 3 photons in slightly random directions
            for (let i = 0; i < 3; i++) {
              const angleVariation = (Math.random() - 0.5) * 0.6; // Random spread
              const dx = -1 + angleVariation; // Generally leftward
              const dy = (Math.random() - 0.5) * 1.5; // Random vertical component
              const magnitude = Math.sqrt(dx * dx + dy * dy);
              
              const photonId = `photon-${Date.now()}-${Math.random()}-${i}`;
              newState.projectiles.push({
                id: photonId,
                position: { 
                  x: bossScreenX + boss.size.x / 4, 
                  y: boss.position.y + boss.size.y / 2 + (i - 1) * 20 // Spread vertically
                },
                velocity: { 
                  x: (dx / magnitude) * photonSpeed, 
                  y: (dy / magnitude) * photonSpeed 
                },
                size: { x: 6, y: 6 },
                active: true,
                damage: 30,
                type: 'laser'
              });
            }
            
            boss.lastFireTime = now;
          }
        }
        
        // Remove if off screen (left edge)
        if (boss.position.x < newState.scrollOffset - 300) {
          return false;
        }
        
        return true;
      });

      // Update MEGA BOSS
      if (newState.boss && newState.boss.active) {
        const bossScreenX = newState.boss.position.x - newState.scrollOffset;
        
        // Stop boss at right edge of screen and keep it there
        const targetScreenX = settings.width - newState.boss.size.x - 50;
        
        if (bossScreenX > targetScreenX) {
          // Move boss leftward until it reaches target position
          newState.boss.position.x += newState.boss.velocity.x;
        } else {
          // Boss has reached position, match scroll speed to stay in place
          newState.boss.position.x += currentScrollSpeed;
        }
        
        // Animate tentacles
        const animTime = now * 0.003;
        newState.boss.tentacles.forEach((tentacle, i) => {
          tentacle.angle = (Math.PI * 2 * i) / 6 + Math.sin(animTime + i) * 0.3;
        });
        
        // Fire 5 fireballs randomly
        if (now - newState.boss.lastFireTime > newState.boss.fireRate) {
          const currentBossScreenX = newState.boss.position.x - newState.scrollOffset;
          
          for (let i = 0; i < 5; i++) {
            // Random angle towards left side
            const angleToPlayer = Math.atan2(
              newState.spaceship.position.y - newState.boss.position.y - newState.boss.size.y / 2,
              newState.spaceship.position.x - currentBossScreenX - newState.boss.size.x / 2
            );
            const angleVariation = (Math.random() - 0.5) * 1.2;
            const finalAngle = angleToPlayer + angleVariation;
            
            const fireballSpeed = 2 + Math.random() * 2;
            
            newState.projectiles.push({
              id: `fireball-${Date.now()}-${Math.random()}-${i}`,
              position: {
                x: currentBossScreenX + newState.boss.size.x / 2,
                y: newState.boss.position.y + newState.boss.size.y / 2 + (Math.random() - 0.5) * 100
              },
              velocity: {
                x: Math.cos(finalAngle) * fireballSpeed,
                y: Math.sin(finalAngle) * fireballSpeed
              },
              size: { x: 20, y: 20 },
              active: true,
              damage: 40,
              type: 'fireball'
            });
          }
          
          newState.boss.lastFireTime = now;
        }
      }

      // Check projectile-rocket collisions
      newState.projectiles.forEach(projectile => {
        newState.rockets.forEach(rocket => {
          // Convert rocket to screen space for collision (spaceship/projectiles are in screen space)
          const rocketScreen = {
            ...rocket,
            position: { ...rocket.position, x: rocket.position.x - newState.scrollOffset },
          };
          if (projectile.active && rocket.active && checkCollision(projectile, rocketScreen)) {
          // Create explosion at world position
          newState.explosions.push({
            id: `explosion-${Date.now()}-${Math.random()}`,
            position: { x: rocket.position.x, y: rocket.position.y },
            startTime: now,
            particles: generateExplosionParticles(rocket.position.x, rocket.position.y, 8)
          });
            
            // Destroy both
            projectile.active = false;
            rocket.active = false;
            
            // Add score and level progression
            newState.score += projectile.type === 'bomb' ? 150 : 100; // More points for bomb hits
            if (rocket.type === 'heavy') {
              newState.score += 100; // Bonus for destroying heavy rockets
            }
            
            // Ammo rewards for small kills
            newState.spaceship.ammunition += 100;
            newState.spaceship.bombs += 5;
            
            // Level up every 1000 points
            const newLevel = Math.floor(newState.score / 1000) + 1;
            if (newLevel > newState.level) {
              newState.level = newLevel;
              newState.spaceship.ammunition += 20; // Bonus ammo on level up
              newState.spaceship.bombs += 1; // Bonus bomb on level up
            }
          }
        });
      });

      // Check projectile-saucer collisions (only player projectiles)
      newState.projectiles.forEach(projectile => {
        if (projectile.type === 'laser') return; // Skip laser projectiles (fired by enemies)
        
        newState.saucers.forEach(saucer => {
          // Convert saucer to screen space for collision
          const saucerScreen = {
            ...saucer,
            position: { ...saucer.position, x: saucer.position.x - newState.scrollOffset },
          };
          if (projectile.active && saucer.active && checkCollision(projectile, saucerScreen)) {
            // Create explosion at world position
            newState.explosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { x: saucer.position.x, y: saucer.position.y },
              startTime: now,
              particles: generateExplosionParticles(saucer.position.x, saucer.position.y, 8)
            });
            
            // Destroy both
            projectile.active = false;
            saucer.active = false;
            
            // Add score and ammo rewards
            newState.score += projectile.type === 'bomb' ? 300 : 200; // Good points for saucers
            newState.spaceship.ammunition += 100;
            newState.spaceship.bombs += 5;
          }
        });
      });

      // Check projectile-alien collisions
      newState.projectiles.forEach(projectile => {
        if (projectile.type === 'laser') return; // Alien lasers don't hit aliens
        
        newState.aliens.forEach(alien => {
          // Convert alien to screen space for collision
          const alienScreen = {
            ...alien,
            position: { ...alien.position, x: alien.position.x - newState.scrollOffset },
          };
          if (projectile.active && alien.active && checkCollision(projectile, alienScreen)) {
            // Damage alien
            alien.health -= projectile.damage;
            projectile.active = false;
            
            if (alien.health <= 0) {
              // Create explosion at world position
              newState.explosions.push({
                id: `explosion-${Date.now()}-${Math.random()}`,
                position: { x: alien.position.x, y: alien.position.y },
                startTime: now,
                particles: generateExplosionParticles(alien.position.x, alien.position.y, 8)
              });
              
              alien.active = false;
              newState.score += projectile.type === 'bomb' ? 400 : 250; // Good points for aliens
              newState.spaceship.ammunition += 100;
              newState.spaceship.bombs += 5;
            }
          }
        });
      });

      // Check projectile-crawling alien collisions
      newState.projectiles.forEach(projectile => {
        if (projectile.type === 'fire') return; // Fire doesn't hit crawling aliens
        
        newState.crawlingAliens.forEach(crawlingAlien => {
          const crawlingAlienScreen = {
            ...crawlingAlien,
            position: { ...crawlingAlien.position, x: crawlingAlien.position.x - newState.scrollOffset },
          };
          if (projectile.active && crawlingAlien.active && checkCollision(projectile, crawlingAlienScreen)) {
            crawlingAlien.health -= projectile.damage;
            projectile.active = false;
            
            if (crawlingAlien.health <= 0) {
              newState.explosions.push({
                id: `explosion-${Date.now()}-${Math.random()}`,
                position: { x: crawlingAlien.position.x, y: crawlingAlien.position.y },
                startTime: now,
                particles: generateExplosionParticles(crawlingAlien.position.x, crawlingAlien.position.y, 8)
              });
              
              crawlingAlien.active = false;
              newState.score += projectile.type === 'bomb' ? 450 : 300;
              newState.spaceship.ammunition += 100;
              newState.spaceship.bombs += 5;
            }
          }
        });
      });

      newState.projectiles.forEach(projectile => {
        if (projectile.type === 'laser') return; // Boss lasers don't hit boss
        
        newState.bossRockets.forEach(boss => {
          // Convert boss to screen space for collision
          const bossScreen = {
            ...boss,
            position: { ...boss.position, x: boss.position.x - newState.scrollOffset },
          };
          if (projectile.active && boss.active && checkCollision(projectile, bossScreen)) {
            // Damage boss
            boss.health -= 1; // Each hit reduces by 1 (needs 20 hits)
            projectile.active = false;
            
            // Small explosion on hit
            newState.explosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { x: boss.position.x + (Math.random() - 0.5) * boss.size.x, y: boss.position.y + (Math.random() - 0.5) * boss.size.y },
              startTime: now,
              particles: generateExplosionParticles(
                boss.position.x + (Math.random() - 0.5) * boss.size.x, 
                boss.position.y + (Math.random() - 0.5) * boss.size.y, 
                8
              )
            });
            
            if (boss.health <= 0) {
              // Create massive explosion at world position
              newState.explosions.push({
                id: `explosion-${Date.now()}-${Math.random()}`,
                position: { x: boss.position.x, y: boss.position.y },
                startTime: now,
                particles: generateExplosionParticles(boss.position.x, boss.position.y, 15)
              });
              
              boss.active = false;
              newState.score += 1000;
              newState.spaceship.ammunition += 200; // 200 ammo bonus for destroying boss rocket (big kill)
              newState.spaceship.bombs += 10;
            }
          }
        });
      });

      // Check projectile-MEGA BOSS collisions
      if (newState.boss && newState.boss.active) {
        newState.projectiles.forEach(projectile => {
          if (projectile.type === 'laser' || projectile.type === 'fireball') return;
          
          const bossScreen = {
            ...newState.boss!,
            position: { ...newState.boss!.position, x: newState.boss!.position.x - newState.scrollOffset },
          };
          
          if (projectile.active && checkCollision(projectile, bossScreen)) {
            newState.boss!.health -= 1;
            projectile.active = false;
            
            // Hit explosion
            newState.explosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { 
                x: newState.boss!.position.x + (Math.random() - 0.5) * newState.boss!.size.x, 
                y: newState.boss!.position.y + (Math.random() - 0.5) * newState.boss!.size.y 
              },
              startTime: now,
              particles: generateExplosionParticles(
                newState.boss!.position.x + (Math.random() - 0.5) * newState.boss!.size.x,
                newState.boss!.position.y + (Math.random() - 0.5) * newState.boss!.size.y,
                12
              )
            });
            
            if (newState.boss!.health <= 0) {
              // Massive boss destruction
              for (let i = 0; i < 8; i++) {
                newState.explosions.push({
                  id: `explosion-${Date.now()}-${Math.random()}-${i}`,
                  position: { 
                    x: newState.boss!.position.x + (Math.random() - 0.5) * newState.boss!.size.x,
                    y: newState.boss!.position.y + (Math.random() - 0.5) * newState.boss!.size.y
                  },
                  startTime: now + i * 100,
                  particles: generateExplosionParticles(
                    newState.boss!.position.x + (Math.random() - 0.5) * newState.boss!.size.x,
                    newState.boss!.position.y + (Math.random() - 0.5) * newState.boss!.size.y,
                    30
                  )
                });
              }
              
              newState.boss.active = false;
              newState.boss = null;
              newState.score += 5000;
              newState.spaceship.ammunition += 200; // 200 ammo bonus for destroying mega boss (big kill)
              newState.spaceship.bombs += 10;
              lastMegaBossSpawnRef.current = now; // Reset mega boss timer for next spawn
            }
          }
        });
      }

      // Check laser/fireball/fire-spaceship collisions
      newState.projectiles.forEach(projectile => {
        if (projectile.type !== 'laser' && projectile.type !== 'fireball' && projectile.type !== 'fire') return;
        
        if (projectile.active && checkCollision(projectile, newState.spaceship)) {
          // Damage spaceship
          newState.spaceship.health -= projectile.damage;
          projectile.active = false;
          
          // Create small explosion at spaceship
          newState.explosions.push({
            id: `explosion-${Date.now()}-${Math.random()}`,
            position: { 
              x: newState.spaceship.position.x + newState.scrollOffset, 
              y: newState.spaceship.position.y 
            },
            startTime: now,
            particles: generateExplosionParticles(
              newState.spaceship.position.x + newState.scrollOffset, 
              newState.spaceship.position.y,
              10
            )
          });
          
          if (newState.spaceship.health <= 0) {
            newState.lives--;
            if (newState.lives <= 0) {
              newState.gameOver = true;
            } else {
              // Reset spaceship
              newState.spaceship.health = newState.spaceship.maxHealth;
              newState.spaceship.position = { x: 100, y: 300 };
            }
          }
        }
      });

      // Check spaceship-rocket collisions
      newState.rockets.forEach(rocket => {
        // Convert rocket to screen space for collision
        const rocketScreen = {
          ...rocket,
          position: { ...rocket.position, x: rocket.position.x - newState.scrollOffset },
        };
        if (rocket.active && checkCollision(newState.spaceship, rocketScreen)) {
          // Damage spaceship - heavy rockets do more damage
          const damage = rocket.type === 'heavy' ? 50 : 25;
          newState.spaceship.health -= damage;
          rocket.active = false;
          
            // Create explosion at world position
            newState.explosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { x: rocket.position.x, y: rocket.position.y },
              startTime: now,
              particles: generateExplosionParticles(rocket.position.x, rocket.position.y, 6)
            });
          
          if (newState.spaceship.health <= 0) {
            newState.lives--;
            if (newState.lives <= 0) {
              newState.gameOver = true;
            } else {
              // Reset spaceship
              newState.spaceship.health = newState.spaceship.maxHealth;
              newState.spaceship.position = { x: 100, y: 300 };
            }
          }
        }
      });

      // Check spaceship-saucer collisions
      newState.saucers.forEach(saucer => {
        // Convert saucer to screen space for collision
        const saucerScreen = {
          ...saucer,
          position: { ...saucer.position, x: saucer.position.x - newState.scrollOffset },
        };
        if (saucer.active && checkCollision(newState.spaceship, saucerScreen)) {
          // Damage spaceship
          newState.spaceship.health -= 30;
          saucer.active = false;
          
          // Create explosion at world position
          newState.explosions.push({
            id: `explosion-${Date.now()}-${Math.random()}`,
            position: { x: saucer.position.x, y: saucer.position.y },
            startTime: now,
            particles: generateExplosionParticles(saucer.position.x, saucer.position.y, 6)
          });
          
          if (newState.spaceship.health <= 0) {
            newState.lives--;
            if (newState.lives <= 0) {
              newState.gameOver = true;
            } else {
              // Reset spaceship
              newState.spaceship.health = newState.spaceship.maxHealth;
              newState.spaceship.position = { x: 100, y: 300 };
            }
          }
        }
      });

      // Check spaceship-tree collisions (instant death)
      newState.trees.forEach(tree => {
        const treeScreenX = tree.x - newState.scrollOffset;
        const treeCollider = {
          position: { x: treeScreenX, y: tree.y },
          size: { x: tree.width, y: tree.height }
        };
        
        if (checkCollision(newState.spaceship, treeCollider)) {
          // Instant kill - lose a life
          newState.lives--;
          
          // Create big explosion
          newState.explosions.push({
            id: `explosion-${Date.now()}-${Math.random()}`,
            position: { x: tree.x, y: tree.y + tree.height / 2 },
            startTime: now,
            particles: generateExplosionParticles(tree.x, tree.y + tree.height / 2, 10)
          });
          
          if (newState.lives <= 0) {
            newState.gameOver = true;
          } else {
            // Reset spaceship
            newState.spaceship.health = newState.spaceship.maxHealth;
            newState.spaceship.position = { x: 100, y: 300 };
          }
        }
      });

      // Clean up explosions and update particles
      newState.explosions = newState.explosions.filter(explosion => {
        const elapsed = now - explosion.startTime;
        if (elapsed > 1000) return false; // Remove after 1 second
        
        // Update particles
        explosion.particles = explosion.particles.filter(particle => {
          particle.position.x += particle.velocity.x;
          particle.position.y += particle.velocity.y;
          particle.velocity.y += 0.1; // Gravity effect on particles
          particle.life -= 0.02; // Fade particles
          return particle.life > 0;
        });
        
        return true;
      });

      // Filter out inactive objects
      newState.projectiles = newState.projectiles.filter(p => p.active);
      newState.rockets = newState.rockets.filter(r => r.active);
      newState.saucers = newState.saucers.filter(s => s.active);
      newState.aliens = newState.aliens.filter(a => a.active);
      newState.bossRockets = newState.bossRockets.filter(b => b.active);

      return newState;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.isPaused, gameState.gameOver, settings, checkCollision]);

  // Start game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && !gameState.gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  const startGame = useCallback(() => {
    // Reset refs when starting game
    lastRocketLaunchRef.current = Date.now();
    lastSaucerSpawnRef.current = Date.now();
    lastAlienSpawnRef.current = Date.now();
    lastBossSpawnRef.current = Date.now(); // boss rockets timer
    lastMegaBossSpawnRef.current = 0; // allow first mega boss at 0:30
    bossSpawnedRef.current = false;
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      gameOver: false,
      startTime: Date.now(),
    }));
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      isPlaying: false,
      isPaused: false,
      gameOver: false,
      level: 1,
      score: 0,
      lives: 3,
      scrollOffset: 0,
      startTime: 0,
      spaceship: {
        id: 'player',
        position: { x: 100, y: 300 },
        velocity: { x: 0, y: 0 },
        size: { x: 40, y: 20 },
        active: true,
        health: 100,
        maxHealth: 100,
        ammunition: 1000,
        bombs: 5,
      },
      rockets: [],
      projectiles: [],
      saucers: [],
      aliens: [],
      crawlingAliens: [],
      bossRockets: [],
      boss: null,
      terrain: generateInitialTerrain(),
      explosions: [],
      trees: [],
    });
    lastRocketLaunchRef.current = Date.now();
    lastSaucerSpawnRef.current = Date.now();
    lastBossSpawnRef.current = Date.now(); // boss rockets timer
    lastMegaBossSpawnRef.current = 0; // allow first mega boss at 0:30
    bossSpawnedRef.current = false;
  }, []);

  return {
    gameState,
    settings,
    startGame,
    pauseGame,
    resetGame,
  };
};
