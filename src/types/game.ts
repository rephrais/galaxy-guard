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

export type WeaponType = 'normal' | 'spread' | 'laser' | 'missile';

export interface Projectile extends GameObject {
  damage: number;
  type: 'bullet' | 'bomb' | 'laser' | 'fireball' | 'fire' | 'spread' | 'player_laser' | 'missile';
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

export interface DiveBomber extends GameObject {
  lastFireTime: number;
  fireRate: number;
  health: number;
  phase: 'approach' | 'dive' | 'retreat';
  diveStartY: number;
  diveTargetY: number;
}

export interface ZigzagFighter extends GameObject {
  lastFireTime: number;
  fireRate: number;
  health: number;
  zigzagPhase: number;
  zigzagAmplitude: number;
  zigzagSpeed: number;
}

export interface Splitter extends GameObject {
  lastFireTime: number;
  fireRate: number;
  health: number;
  generation: number; // 0 = large, 1 = medium, 2 = small (no more splits)
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
  powerUpType: 'speed' | 'fireRate' | 'shield' | 'spread' | 'laser' | 'missile';
  expiresAt?: number; // Timestamp when the power-up effect expires (for active effects)
}

export interface ActivePowerUp {
  type: 'speed' | 'fireRate' | 'shield' | 'spread' | 'laser' | 'missile';
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

export interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

export interface ScreenFlash {
  color: string;
  intensity: number;
  startTime: number;
  duration: number;
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastKillTime: number;
  comboTimeout: number; // ms before combo resets
}

export interface ScorePopup {
  id: string;
  position: Vector2;
  score: number;
  startTime: number;
  duration: number;
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
  diveBombers: DiveBomber[];
  zigzagFighters: ZigzagFighter[];
  splitters: Splitter[];
  bossRockets: BossRocket[];
  boss: Boss | null;
  terrain: TerrainLayers;
  explosions: Explosion[];
  trees: Tree[];
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  trailParticles: TrailParticle[];
  screenShake: ScreenShake | null;
  screenFlash: ScreenFlash | null;
  combo: ComboState;
  scorePopups: ScorePopup[];
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