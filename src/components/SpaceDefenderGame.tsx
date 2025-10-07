import React, { useState, useEffect, useCallback } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSound } from '@/hooks/useSound';
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

export const SpaceDefenderGame: React.FC = () => {
  const [showStartMenu, setShowStartMenu] = useState(true);
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

  // Handle game start
  const handleStartGame = useCallback(() => {
    setShowStartMenu(false);
    startGame();
  }, [startGame]);

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
      // Add to leaderboard
      const entry = {
        name: playerName,
        score: gameState.score,
        level: gameState.level,
        date: new Date().toISOString(),
      };
      addToLeaderboard(entry);
      
      // Clear saved game
      deleteSavedGame();
      
      // Play game over sound
      sounds.gameOver();
    }
  }, [gameState.gameOver, gameState.score, gameState.level, playerName, addToLeaderboard, deleteSavedGame, sounds]);

  // Handle load game
  const handleLoadGame = useCallback(() => {
    if (savedGame) {
      // In a real implementation, we'd restore the full game state
      // For now, just start a new game
      setShowStartMenu(false);
      startGame();
    }
  }, [savedGame, startGame]);

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
      sounds.explosion();
    }
    setPrevExplosions(gameState.explosions.length);
  }, [gameState.explosions.length, prevExplosions, sounds]);

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

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col">
      {/* Background starfield */}
      <div className="starfield" />
      
      {/* Taunt Display */}
      {gameState.isPlaying && !gameState.isPaused && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
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