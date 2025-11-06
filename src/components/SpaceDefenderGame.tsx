import React, { useState, useEffect, useCallback } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSound } from '@/hooks/useSound';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameHUD } from '@/components/game/GameHUD';
import { StartMenu } from '@/components/game/StartMenu';
import { SaveData } from '@/types/game';

const TAUNTS = [
  "It's a good day to die!",
  "Wololo!",
  "Correctus!",
  "Charge!",
  "Light some fire!",
  "You must construct additional pylons!",
  "All your base are belong to us!",
  "Get over here!",
  "Finish him!",
  "The cake is a lie!",
  "War never changes!",
  "Fatality!",
  "Toasty!",
  "Hadoken!",
  "Show me your moves!",
  "I need healing!",
  "Enemy spotted!",
  "Fire in the hole!",
  "Headshot!",
  "Double kill!",
  "Triple kill!",
  "Killtacular!",
  "Killimanjaro!",
  "Killing spree!",
  "Rampage!",
  "Unstoppable!",
  "Godlike!",
  "Stay frosty!",
  "Tango down!",
  "Fox 2!",
  "Going vertical!",
  "Splash one!",
  "Good effect on target!",
  "Target destroyed!",
  "Nice shot!",
  "Smooth moves!",
  "Impressive!",
  "Fantastic!",
  "Magnificent!",
  "Outstanding!",
  "Legendary!",
  "Epic!",
  "Insane!",
  "Ludicrous!",
  "Prepare for trouble!",
  "Make it double!",
  "Gotta go fast!",
  "Do a barrel roll!",
  "It's super effective!",
  "Critical hit!",
  "BOOM! Headshot!",
  "Leroy Jenkins!",
  "Need backup!",
  "Reloading!",
  "Grenade out!",
  "Rocket incoming!",
  "Take cover!",
  "Man down!",
  "Medic!",
  "Affirmative!",
  "Negative!",
  "Roger that!",
  "Copy that!",
  "I'm on it!",
  "Moving out!",
  "In position!",
  "Hold the line!",
  "Push forward!",
  "Fall back!",
  "Flanking!",
  "They're everywhere!",
  "Multiple contacts!",
  "Watch your six!",
  "Incoming!",
  "Get some!",
  "Payback time!",
  "Revenge!",
  "That's gotta hurt!",
  "Ouch!",
  "Close one!",
  "Lucky shot!",
  "Pure skill!",
  "Can't touch this!",
  "Too easy!",
  "Bring it on!",
  "Is that all you got?",
  "Come get some!",
  "You want some?",
  "Not today!",
  "Denied!",
  "Blocked!",
  "Dodged!",
  "Nope!",
  "Better luck next time!",
  "Try harder!",
  "Git gud!",
  "Respawn in 3... 2... 1...",
  "Rekt!",
  "Pwned!",
  "Owned!",
  "Dominated!",
  "Humiliation!",
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'RU', name: 'Russia' },
];

const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const SpaceDefenderGame: React.FC = () => {
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [playerName, setPlayerName] = useState('PLAYER');
  const [currentTaunt, setCurrentTaunt] = useState(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
  
  const { gameState, settings, startGame, pauseGame, resetGame } = useGameEngine();
  const { 
    savedGame, 
    leaderboard, 
    saveGame, 
    deleteSavedGame, 
    addToLeaderboard, 
    hasSavedGame 
  } = useLocalStorage();
  const sounds = useSound();
  const music = useBackgroundMusic();

  // Handle game start
  const handleStartGame = useCallback(() => {
    setShowStartMenu(false);
    startGame();
    music.startMusic();
  }, [startGame, music]);

  // Handle game restart
  const handleRestart = useCallback(() => {
    resetGame();
    setShowStartMenu(true);
  }, [resetGame]);

  // Rotate taunts during gameplay
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || showStartMenu) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
    }, 5000); // Change taunt every 5 seconds

    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.isPaused, showStartMenu]);

  // Handle pause with keyboard
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.code === 'KeyP' || e.code === 'Escape') && !showStartMenu) {
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pauseGame, showStartMenu]);

  // Handle music pause/resume
  useEffect(() => {
    if (gameState.isPlaying) {
      if (gameState.isPaused) {
        music.stopMusic();
      } else if (!music.isPlaying()) {
        music.startMusic();
      }
    }
  }, [gameState.isPaused, gameState.isPlaying, music]);

  // Auto-save game progress
  useEffect(() => {
    if (gameState.isPlaying && gameState.score > 0) {
      const saveData: SaveData = {
        level: gameState.level,
        score: gameState.score,
        lives: gameState.lives,
        settings,
        timestamp: new Date().toISOString(),
      };
      saveGame(saveData);
    }
  }, [gameState.score, gameState.level, gameState.lives, gameState.isPlaying, settings]);

  // Handle game over
  useEffect(() => {
    if (gameState.gameOver && gameState.score > 0) {
      // Stop music
      music.stopMusic();
      
      // Show country selection dialog
      setShowCountrySelect(true);
      
      // Play game over sound
      sounds.gameOver();
    }
  }, [gameState.gameOver, gameState.score, sounds, music]);

  // Submit score with country
  const handleSubmitScore = useCallback(() => {
    const entry = {
      name: playerName,
      score: gameState.score,
      level: gameState.level,
      date: new Date().toISOString(),
      country: selectedCountry,
    };
    addToLeaderboard(entry);
    
    // Clear saved game
    deleteSavedGame();
    
    // Close dialog and show menu
    setShowCountrySelect(false);
    setShowStartMenu(true);
  }, [playerName, gameState.score, gameState.level, selectedCountry, addToLeaderboard, deleteSavedGame]);

  // Handle load game
  const handleLoadGame = useCallback(() => {
    if (savedGame) {
      // In a real implementation, we'd restore the full game state
      // For now, just start a new game
      setShowStartMenu(false);
      startGame();
      music.startMusic();
    }
  }, [savedGame, startGame, music]);

  // Sound effects based on game state changes
  const [prevRockets, setPrevRockets] = useState(gameState.rockets.length);
  const [prevProjectiles, setPrevProjectiles] = useState(gameState.projectiles.length);
  const [prevExplosions, setPrevExplosions] = useState(gameState.explosions.length);
  const [prevHealth, setPrevHealth] = useState(gameState.spaceship.health);
  const [prevLives, setPrevLives] = useState(gameState.lives);

  useEffect(() => {
    // Play shoot sound when projectiles are added
    if (gameState.projectiles.length > prevProjectiles) {
      const newProjectile = gameState.projectiles[gameState.projectiles.length - 1];
      if (newProjectile.type === 'bullet') {
        sounds.shoot();
      } else if (newProjectile.type === 'bomb') {
        sounds.bomb();
      }
    }
    setPrevProjectiles(gameState.projectiles.length);
  }, [gameState.projectiles.length, prevProjectiles, sounds]);

  useEffect(() => {
    // Play explosion sound when explosions are added
    if (gameState.explosions.length > prevExplosions) {
      // Check if it's a mega boss explosion
      const latestExplosion = gameState.explosions[gameState.explosions.length - 1];
      if (latestExplosion?.isMegaExplosion) {
        // Only play the mega boom sound once for the first mega explosion
        const megaExplosionsCount = gameState.explosions.filter(e => e.isMegaExplosion).length;
        if (megaExplosionsCount === 1) {
          sounds.megaBossExplosion();
        }
      } else {
        sounds.explosion();
      }
    }
    setPrevExplosions(gameState.explosions.length);
  }, [gameState.explosions, prevExplosions, sounds]);

  useEffect(() => {
    // Play hit sound when ship takes damage
    if (gameState.spaceship.health < prevHealth) {
      sounds.hit();
    }
    setPrevHealth(gameState.spaceship.health);
  }, [gameState.spaceship.health, prevHealth, sounds]);

  useEffect(() => {
    // Play crash sound when ship loses a life (dies and respawns)
    if (gameState.lives < prevLives) {
      // Play both explosion and hit sound for dramatic effect
      sounds.explosion();
      setTimeout(() => sounds.hit(), 100);
    }
    setPrevLives(gameState.lives);
  }, [gameState.lives, prevLives, sounds]);

  if (showStartMenu) {
    return (
      <StartMenu 
        onStartGame={handleStartGame}
        onLoadGame={handleLoadGame}
        hasSavedGame={hasSavedGame}
      />
    );
  }

  // Country selection dialog
  if (showCountrySelect) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="starfield" />
        <div className="aurora">
          <div className="aurora-layer-1" />
          <div className="aurora-layer-2" />
          <div className="aurora-layer-3" />
        </div>
        <div className="hud-panel max-w-2xl w-full mx-4 relative z-10">
          <div className="pixel-text text-4xl text-center color-splash mb-6">
            GAME OVER!
          </div>
          <div className="pixel-text text-2xl text-center text-score-text mb-8">
            Score: {gameState.score.toLocaleString()}
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="pixel-text text-xl text-center text-neon-cyan">
              Select Your Country:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.code)}
                  className={`arcade-button text-sm px-3 py-2 border-2 flex items-center gap-2 justify-center transition-all ${
                    selectedCountry === country.code
                      ? 'border-neon-yellow bg-neon-yellow text-black'
                      : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black'
                  }`}
                  style={{
                    boxShadow: selectedCountry === country.code 
                      ? '0 0 20px hsl(var(--neon-yellow))' 
                      : '0 0 10px hsl(var(--neon-cyan))'
                  }}
                >
                  <span className="text-xl">{getCountryFlag(country.code)}</span>
                  <span className="pixel-text">{country.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleSubmitScore}
              className="arcade-button text-xl px-8 py-4 border-3 border-neon-green text-neon-green hover:bg-neon-green hover:text-black"
              style={{
                boxShadow: '0 0 30px hsl(var(--neon-green))',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            >
              SUBMIT SCORE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col">
      {/* Background starfield */}
      <div className="starfield" />
      
      {/* Taunt Display - moved to bottom to avoid covering HUD */}
      {gameState.isPlaying && !gameState.isPaused && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
          <div className="hud-panel px-8 py-3">
            <div className="pixel-text text-2xl color-splash animate-pulse">
              {currentTaunt}
            </div>
          </div>
        </div>
      )}
      
      {/* Game Canvas */}
      <div className="flex items-center justify-center flex-1">
        <div className="relative">
          <GameCanvas gameState={gameState} settings={settings} />
        </div>
      </div>

      {/* Game HUD Overlay */}
      <GameHUD 
        gameState={gameState}
        onPause={pauseGame}
        onRestart={handleRestart}
      />
      
      {/* Controls Help Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="hud-panel text-xs px-6 py-2">
          <div className="pixel-text text-muted-foreground">
            ARROWS/WASD: Move | SPACE: Shoot | B: Bomb | P/ESC: Pause
          </div>
        </div>
      </div>

      {/* Debug Info (can be removed in final version) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-16 left-4 text-xs text-muted-foreground bg-black bg-opacity-50 p-2 rounded">
          <div>Rockets: {gameState.rockets.length}</div>
          <div>Projectiles: {gameState.projectiles.length}</div>
          <div>Explosions: {gameState.explosions.length}</div>
          <div>Spaceship Health: {gameState.spaceship.health}</div>
        </div>
      )}
    </div>
  );
};