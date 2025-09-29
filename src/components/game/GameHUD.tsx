import React, { useState, useEffect } from 'react';
import { GameState } from '@/types/game';

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, onPause, onRestart }) => {
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
    <div className="absolute top-0 left-0 w-full z-10 p-4">
      {/* Top HUD Bar */}
      <div className="hud-panel flex justify-between items-center mb-4">
        <div className="flex space-x-8">
          <div className="pixel-text text-score-text">
            SCORE: {gameState.score.toLocaleString()}
          </div>
          <div className="pixel-text text-neon-cyan">
            LEVEL: {gameState.level}
          </div>
          <div className="pixel-text text-neon-green">
            LIVES: {gameState.lives}
          </div>
          <div className="pixel-text text-neon-yellow">
            TIME: {formatTime(elapsedTime)}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={onPause}
            className="arcade-button text-sm"
          >
            {gameState.isPaused ? 'RESUME' : 'PAUSE'}
          </button>
          <button 
            onClick={onRestart}
            className="arcade-button text-sm"
          >
            RESTART
          </button>
        </div>
      </div>

      {/* Status Bars */}
      <div className="flex space-x-4 mb-4">
        {/* Health Bar */}
        <div className="hud-panel">
          <div className="pixel-text text-xs text-health-bar mb-1">HEALTH</div>
          <div className="w-32 h-4 border-2 border-health-bar bg-space-black">
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
        <div className="hud-panel">
          <div className="pixel-text text-xs text-energy-bar mb-1">AMMO</div>
          <div className="pixel-text text-energy-bar text-lg">{gameState.spaceship.ammunition}</div>
        </div>

        {/* Bombs */}
        <div className="hud-panel">
          <div className="pixel-text text-xs text-neon-purple mb-1">BOMBS</div>
          <div className="pixel-text text-neon-purple">{gameState.spaceship.bombs}</div>
        </div>
      </div>


      {/* Game Over Overlay */}
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-space-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="hud-panel text-center p-8">
            <div className="pixel-text text-4xl text-danger-red mb-4 danger-pulse">
              GAME OVER
            </div>
            <div className="pixel-text text-xl text-score-text mb-4">
              FINAL SCORE: {gameState.score.toLocaleString()}
            </div>
            <div className="pixel-text text-lg text-neon-cyan mb-6">
              LEVEL REACHED: {gameState.level}
            </div>
            <button 
              onClick={onRestart}
              className="arcade-button"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {gameState.isPaused && (
        <div className="fixed inset-0 bg-space-black bg-opacity-60 flex items-center justify-center z-40">
          <div className="hud-panel text-center p-8">
            <div className="pixel-text text-4xl text-neon-yellow mb-4">
              PAUSED
            </div>
            <div className="pixel-text text-lg text-muted-foreground">
              Press PAUSE to continue
            </div>
          </div>
        </div>
      )}
    </div>
  );
};