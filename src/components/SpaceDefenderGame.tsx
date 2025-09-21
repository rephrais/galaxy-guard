import React, { useState, useEffect, useCallback } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSound } from '@/hooks/useSound';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameHUD } from '@/components/game/GameHUD';
import { StartMenu } from '@/components/game/StartMenu';
import { SaveData } from '@/types/game';

export const SpaceDefenderGame: React.FC = () => {
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [playerName, setPlayerName] = useState('PLAYER');
  
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

  // Handle pause with keyboard
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' && !showStartMenu) {
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
  }, [gameState.score, gameState.level, gameState.lives, gameState.isPlaying, settings, saveGame]);

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
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Background starfield */}
      <div className="starfield" />
      
      {/* Game Canvas */}
      <div className="flex items-center justify-center w-full h-full">
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

      {/* Debug Info (can be removed in final version) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-black bg-opacity-50 p-2 rounded">
          <div>Rockets: {gameState.rockets.length}</div>
          <div>Projectiles: {gameState.projectiles.length}</div>
          <div>Explosions: {gameState.explosions.length}</div>
          <div>Spaceship Health: {gameState.spaceship.health}</div>
        </div>
      )}
    </div>
  );
};