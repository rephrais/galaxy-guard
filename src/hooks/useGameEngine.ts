import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameSettings, Vector2, Rocket, Projectile, TerrainPoint, TerrainLayers } from '@/types/game';

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
    lives: 3,
    scrollOffset: 0,
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
    terrain: generateInitialTerrain(),
    explosions: [],
  });

  const [settings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const gameLoopRef = useRef<number>();
  const lastRocketLaunchRef = useRef<number>(0);
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
      }
      
      // Clean up old terrain points to prevent memory issues
      const minX = newState.scrollOffset - settings.width;
      newState.terrain.background = newState.terrain.background.filter(p => p.x > minX);
      newState.terrain.middle = newState.terrain.middle.filter(p => p.x > minX);
      newState.terrain.foreground = newState.terrain.foreground.filter(p => p.x > minX);

      // Handle spaceship movement
      if (keysRef.current.has('ArrowUp')) {
        newState.spaceship.velocity.y = -settings.spaceshipSpeed;
      } else if (keysRef.current.has('ArrowDown')) {
        newState.spaceship.velocity.y = settings.spaceshipSpeed;
      } else {
        newState.spaceship.velocity.y = 0;
      }

      if (keysRef.current.has('ArrowLeft')) {
        newState.spaceship.velocity.x = -settings.spaceshipSpeed;
      } else if (keysRef.current.has('ArrowRight')) {
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

      // Launch rockets from terrain (adjusted for scroll and difficulty)
      const rocketFreq = Math.max(400, settings.rocketLaunchFrequency - (newState.level - 1) * 100);
      const maxRockets = 3 + Math.floor(newState.level / 2);
      
      if (now - lastRocketLaunchRef.current > rocketFreq && newState.rockets.length < maxRockets) {
        // Find visible terrain points to launch from 
        const visibleTerrain = newState.terrain.middle.filter(point => 
          point.x >= newState.scrollOffset + settings.width * 0.7 && 
          point.x <= newState.scrollOffset + settings.width * 1.5
        );
        
        if (visibleTerrain.length > 0) {
          const launchPoint = visibleTerrain[Math.floor(Math.random() * visibleTerrain.length)];
          const rocketId = `rocket-${Date.now()}-${Math.random()}`;
          const rocketSpeed = settings.rocketSpeed + (newState.level - 1) * 0.5;
          
          newState.rockets.push({
            id: rocketId,
            position: { x: launchPoint.x, y: launchPoint.y },
            velocity: { x: 0, y: -rocketSpeed }, // Straight up
            size: { x: 8, y: 30 },
            active: true,
            launchTime: now,
            explosionRadius: 50,
          });
          
          lastRocketLaunchRef.current = now;
        }
      }

      // Update projectiles
      newState.projectiles = newState.projectiles.filter(projectile => {
        if (!projectile.active) return false;
        
        projectile.position.x += projectile.velocity.x;
        projectile.position.y += projectile.velocity.y;
        
        // Remove if off screen
        if (projectile.position.x > settings.width || projectile.position.y > settings.height) {
          return false;
        }
        
        return true;
      });

      // Update rockets
      newState.rockets = newState.rockets.filter(rocket => {
        if (!rocket.active) return false;
        
        rocket.position.x += rocket.velocity.x;
        rocket.position.y += rocket.velocity.y;
        
        // Remove if off screen (going up and away)
        if (rocket.position.y < -rocket.size.y || 
            rocket.position.x < newState.scrollOffset - 200) {
          return false;
        }
        
        return true;
      });

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
            });
            
            // Destroy both
            projectile.active = false;
            rocket.active = false;
            
            // Add score and level progression
            newState.score += 100;
            
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

      // Check spaceship-rocket collisions
      newState.rockets.forEach(rocket => {
        // Convert rocket to screen space for collision
        const rocketScreen = {
          ...rocket,
          position: { ...rocket.position, x: rocket.position.x - newState.scrollOffset },
        };
        if (rocket.active && checkCollision(newState.spaceship, rocketScreen)) {
          // Damage spaceship
          newState.spaceship.health -= 25;
          rocket.active = false;
          
          // Create explosion at world position
          newState.explosions.push({
            id: `explosion-${Date.now()}-${Math.random()}`,
            position: { x: rocket.position.x, y: rocket.position.y },
            startTime: now,
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

      // Clean up explosions
      newState.explosions = newState.explosions.filter(explosion => 
        now - explosion.startTime < 500
      );

      // Filter out inactive objects
      newState.projectiles = newState.projectiles.filter(p => p.active);
      newState.rockets = newState.rockets.filter(r => r.active);

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
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      gameOver: false,
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
      terrain: generateInitialTerrain(),
      explosions: [],
    });
    lastRocketLaunchRef.current = 0;
  }, [settings.width]);

  return {
    gameState,
    settings,
    startGame,
    pauseGame,
    resetGame,
  };
};
