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
  type: 'normal' | 'heavy';
}

export interface Projectile extends GameObject {
  damage: number;
  type: 'bullet' | 'bomb' | 'laser' | 'fireball' | 'fire';
}

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface TerrainLayers {
  background: TerrainPoint[];
  middle: TerrainPoint[];
  foreground: TerrainPoint[];
}

export interface ExplosionParticle {
  position: Vector2;
  velocity: Vector2;
  size: number;
  color: string;
  life: number;
}

export interface Explosion {
  id: string;
  position: Vector2;
  startTime: number;
  particles: ExplosionParticle[];
  isMegaExplosion?: boolean; // Special flag for boss death explosions
}

export interface Saucer extends GameObject {
  targetY: number;
  driftSpeed: number;
  lastFireTime: number;
  fireRate: number;
}

export interface Alien extends GameObject {
  lastFireTime: number;
  fireRate: number;
  health: number;
}

export interface CrawlingAlien extends GameObject {
  lastFireTime: number;
  fireRate: number;
  health: number;
  targetX: number;
  moveSpeed: number;
}

export interface BossRocket extends GameObject {
  lastFireTime: number;
  fireRate: number;
  health: number;
  maxHealth: number;
}

export interface Boss extends GameObject {
  lastFireTime: number;
  fireRate: number;
  health: number;
  maxHealth: number;
  tentacles: Array<{ angle: number; length: number }>;
  bossType: number; // 0-5 for different boss variants
}

export interface Tree {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PowerUp extends GameObject {
  powerUpType: 'speed' | 'fireRate' | 'shield';
  expiresAt?: number; // Timestamp when the power-up effect expires (for active effects)
}

export interface ActivePowerUp {
  type: 'speed' | 'fireRate' | 'shield';
  expiresAt: number;
}

export interface TrailParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  level: number;
  score: number;
  lives: number;
  scrollOffset: number;
  startTime: number;
  spaceship: Spaceship;
  rockets: Rocket[];
  projectiles: Projectile[];
  saucers: Saucer[];
  aliens: Alien[];
  crawlingAliens: CrawlingAlien[];
  bossRockets: BossRocket[];
  boss: Boss | null;
  terrain: TerrainLayers;
  explosions: Explosion[];
  trees: Tree[];
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  trailParticles: TrailParticle[];
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
  country?: string; // ISO country code (e.g., 'US', 'GB', 'JP')
}

export interface SaveData {
  level: number;
  score: number;
  lives: number;
  settings: GameSettings;
  timestamp: string;
}