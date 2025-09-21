import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameSettings, Vector2, Rocket, Projectile, TerrainPoint } from '@/types/game';

const DEFAULT_SETTINGS: GameSettings = {
  width: 1200,
  height: 800,
  scrollSpeed: 2,
  spaceshipSpeed: 5,
  bulletSpeed: 8,
  rocketLaunchFrequency: 2000, // milliseconds
  rocketSpeed: 3,
};

const generateTerrain = (width: number): TerrainPoint[] => {
  const terrain: TerrainPoint[] = [];
  let height = 600;
  
  for (let x = 0; x < width * 2; x += 20) {
    height += (Math.random() - 0.5) * 40;
    height = Math.max(500, Math.min(700, height));
    terrain.push({ x, y: height });
  }
  
  return terrain;
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    level: 1,
    score: 0,
    lives: 3,
    spaceship: {
      id: 'player',
      position: { x: 100, y: 300 },
      velocity: { x: 0, y: 0 },
      size: { x: 40, y: 20 },
      active: true,
      health: 100,
      maxHealth: 100,
      ammunition: 100,
      bombs: 5,
    },
    rockets: [],
    projectiles: [],
    terrain: generateTerrain(DEFAULT_SETTINGS.width),
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

      // Keep spaceship on screen
      newState.spaceship.position.x = Math.max(0, Math.min(settings.width - newState.spaceship.size.x, newState.spaceship.position.x));
      newState.spaceship.position.y = Math.max(0, Math.min(settings.height - newState.spaceship.size.y, newState.spaceship.position.y));

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

      // Launch rockets from terrain
      if (now - lastRocketLaunchRef.current > settings.rocketLaunchFrequency) {
        const launchPoint = newState.terrain[Math.floor(Math.random() * newState.terrain.length)];
        const rocketId = `rocket-${Date.now()}-${Math.random()}`;
        
        newState.rockets.push({
          id: rocketId,
          position: { x: launchPoint.x, y: launchPoint.y },
          velocity: { x: 0, y: -settings.rocketSpeed },
          size: { x: 8, y: 30 },
          active: true,
          launchTime: now,
          explosionRadius: 50,
        });
        
        lastRocketLaunchRef.current = now;
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
        
        rocket.position.y += rocket.velocity.y;
        
        // Remove if off screen
        if (rocket.position.y < -rocket.size.y) {
          return false;
        }
        
        return true;
      });

      // Check projectile-rocket collisions
      newState.projectiles.forEach(projectile => {
        newState.rockets.forEach(rocket => {
          if (projectile.active && rocket.active && checkCollision(projectile, rocket)) {
            // Create explosion
            newState.explosions.push({
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: { x: rocket.position.x, y: rocket.position.y },
              startTime: now,
            });
            
            // Destroy both
            projectile.active = false;
            rocket.active = false;
            
            // Add score
            newState.score += 100;
          }
        });
      });

      // Check spaceship-rocket collisions
      newState.rockets.forEach(rocket => {
        if (rocket.active && checkCollision(newState.spaceship, rocket)) {
          // Damage spaceship
          newState.spaceship.health -= 25;
          rocket.active = false;
          
          // Create explosion
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
      spaceship: {
        id: 'player',
        position: { x: 100, y: 300 },
        velocity: { x: 0, y: 0 },
        size: { x: 40, y: 20 },
        active: true,
        health: 100,
        maxHealth: 100,
        ammunition: 100,
        bombs: 5,
      },
      rockets: [],
      projectiles: [],
      terrain: generateTerrain(settings.width),
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
