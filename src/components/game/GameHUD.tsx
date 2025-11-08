import React, { useState, useEffect } from 'react';
import { GameState } from '@/types/game';

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
  onRestart: () => void;
  gameAreaDimensions: {
    scale: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
}

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, onPause, onRestart, gameAreaDimensions }) => {
  const healthPercent = (gameState.spaceship.health / gameState.spaceship.maxHealth) * 100;
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Update elapsed time
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.gameOver || gameState.startTime === 0) {
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.isPaused, gameState.gameOver, gameState.startTime]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div 
      className="absolute z-10"
      style={{
        left: `${gameAreaDimensions.offsetX}px`,
        top: `${gameAreaDimensions.offsetY}px`,
        width: `${gameAreaDimensions.width}px`,
        height: `${gameAreaDimensions.height}px`,
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
      }}
    >
      {/* Top HUD Bar */}
      <div className="hud-panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2 p-2 sm:p-3">
        <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-8 text-xs sm:text-sm md:text-base">
          <div className="pixel-text text-score-text">
            SCORE: {gameState.score.toLocaleString()}
          </div>
          <div className="pixel-text text-neon-cyan">
            LVL: {gameState.level}
          </div>
          <div className="pixel-text text-neon-green">
            LIVES: {gameState.lives}
          </div>
          <div className="pixel-text text-neon-yellow">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onPause}
            className="arcade-button text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
          >
            {gameState.isPaused ? 'RESUME' : 'PAUSE'}
          </button>
          <button 
            onClick={onRestart}
            className="arcade-button text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
          >
            RESTART
          </button>
        </div>
      </div>

      {/* Status Bars */}
      <div className="flex flex-wrap gap-2 sm:gap-4">
        {/* Health Bar */}
        <div className="hud-panel p-1 sm:p-2">
          <div className="pixel-text text-[10px] sm:text-xs text-health-bar mb-1">HEALTH</div>
          <div className="w-20 sm:w-32 h-3 sm:h-4 border-2 border-health-bar bg-space-black">
            <div 
              className="h-full transition-all duration-300"
              style={{
                width: `${healthPercent}%`,
                background: healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ffff00' : '#ff0000'
              }}
            />
          </div>
        </div>

        {/* Ammunition */}
        <div className="hud-panel p-1 sm:p-2">
          <div className="pixel-text text-[10px] sm:text-xs text-energy-bar mb-1">AMMO</div>
          <div className="pixel-text text-energy-bar text-sm sm:text-lg">{gameState.spaceship.ammunition}</div>
        </div>

        {/* Bombs */}
        <div className="hud-panel p-1 sm:p-2">
          <div className="pixel-text text-[10px] sm:text-xs text-neon-purple mb-1">BOMBS</div>
          <div className="pixel-text text-neon-purple text-sm sm:text-base">{gameState.spaceship.bombs}</div>
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-space-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="hud-panel text-center p-4 sm:p-8 max-w-sm sm:max-w-md mx-auto">
            <div className="pixel-text text-2xl sm:text-4xl text-danger-red mb-3 sm:mb-4 danger-pulse">
              GAME OVER
            </div>
            <div className="pixel-text text-lg sm:text-xl text-score-text mb-3 sm:mb-4">
              FINAL SCORE: {gameState.score.toLocaleString()}
            </div>
            <div className="pixel-text text-base sm:text-lg text-neon-cyan mb-4 sm:mb-6">
              LEVEL REACHED: {gameState.level}
            </div>
            <button 
              onClick={onRestart}
              className="arcade-button text-sm sm:text-base px-6 py-2"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {gameState.isPaused && (
        <div className="fixed inset-0 bg-space-black bg-opacity-60 flex items-center justify-center z-40 p-4">
          <div className="hud-panel text-center p-4 sm:p-8 max-w-sm mx-auto">
            <div className="pixel-text text-2xl sm:text-4xl text-neon-yellow mb-3 sm:mb-4">
              PAUSED
            </div>
            <div className="pixel-text text-sm sm:text-lg text-muted-foreground">
              Press PAUSE to continue
            </div>
          </div>
        </div>
      )}
    </div>
  );
};