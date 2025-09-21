export interface Vector2 {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2;
  velocity: Vector2;
  size: Vector2;
  active: boolean;
}

export interface Spaceship extends GameObject {
  health: number;
  maxHealth: number;
  ammunition: number;
  bombs: number;
}

export interface Rocket extends GameObject {
  launchTime: number;
  explosionRadius: number;
}

export interface Projectile extends GameObject {
  damage: number;
  type: 'bullet' | 'bomb';
}

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  level: number;
  score: number;
  lives: number;
  spaceship: Spaceship;
  rockets: Rocket[];
  projectiles: Projectile[];
  terrain: TerrainPoint[];
  explosions: Array<{
    id: string;
    position: Vector2;
    startTime: number;
  }>;
}

export interface GameSettings {
  width: number;
  height: number;
  scrollSpeed: number;
  spaceshipSpeed: number;
  bulletSpeed: number;
  rocketLaunchFrequency: number;
  rocketSpeed: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}

export interface SaveData {
  level: number;
  score: number;
  lives: number;
  settings: GameSettings;
  timestamp: string;
}