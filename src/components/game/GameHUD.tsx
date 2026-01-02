import React, { useState, useEffect } from 'react';
import { GameState } from '@/types/game';

interface GameHUDProps {
  gameState: GameState;
  playerName?: string;
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

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, playerName, onPause, onRestart, gameAreaDimensions }) => {
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
          {gameState.combo.count > 1 && (
            <div 
              className="pixel-text animate-pulse"
              style={{ 
                color: gameState.combo.multiplier >= 5 ? '#ff0000' : 
                       gameState.combo.multiplier >= 3 ? '#ff6600' : '#ffff00',
                textShadow: `0 0 10px ${gameState.combo.multiplier >= 5 ? '#ff0000' : 
                             gameState.combo.multiplier >= 3 ? '#ff6600' : '#ffff00'}`
              }}
            >
              {gameState.combo.count}x COMBO! ({gameState.combo.multiplier.toFixed(2)}x)
            </div>
          )}
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
        {/* Active Weapon */}
        {(() => {
          const weaponPowerUp = gameState.activePowerUps.find(p => 
            p.type === 'spread' || p.type === 'laser' || p.type === 'missile'
          );
          const weaponConfig = {
            spread: { bg: '#ffff00', name: 'SPREAD', icon: '⟨⟩' },
            laser: { bg: '#00ffcc', name: 'LASER', icon: '═' },
            missile: { bg: '#ff4400', name: 'MISSILE', icon: '◈' },
            normal: { bg: '#4488ff', name: 'NORMAL', icon: '•' }
          };
          const activeWeapon = weaponPowerUp?.type as 'spread' | 'laser' | 'missile' | undefined;
          const config = activeWeapon ? weaponConfig[activeWeapon] : weaponConfig.normal;
          const remaining = weaponPowerUp ? Math.ceil((weaponPowerUp.expiresAt - Date.now()) / 1000) : null;
          
          return (
            <div className="hud-panel p-1 sm:p-2">
              <div className="pixel-text text-[10px] sm:text-xs text-neon-purple mb-1">WEAPON</div>
              <div 
                className="flex items-center gap-2 px-2 py-1 rounded"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: `2px solid ${config.bg}`,
                  boxShadow: `0 0 8px ${config.bg}40, inset 0 0 8px ${config.bg}20`
                }}
              >
                <span 
                  className="pixel-text text-sm sm:text-base font-bold"
                  style={{ color: config.bg, textShadow: `0 0 6px ${config.bg}` }}
                >
                  {config.icon}
                </span>
                <span 
                  className="pixel-text text-xs sm:text-sm font-bold"
                  style={{ color: config.bg }}
                >
                  {config.name}
                </span>
                {remaining !== null && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-12 sm:w-16 h-2 bg-space-black rounded-full overflow-hidden"
                      style={{ border: `1px solid ${config.bg}40` }}
                    >
                      <div 
                        className="h-full transition-all duration-200"
                        style={{ 
                          width: `${Math.min(100, (remaining / 15) * 100)}%`,
                          backgroundColor: config.bg,
                          boxShadow: `0 0 4px ${config.bg}`
                        }}
                      />
                    </div>
                    <span 
                      className="pixel-text text-[10px] sm:text-xs"
                      style={{ color: config.bg }}
                    >
                      {remaining}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Active Power-Ups (non-weapon) */}
        {gameState.activePowerUps.filter(p => 
          p.type !== 'spread' && p.type !== 'laser' && p.type !== 'missile'
        ).length > 0 && (
          <div className="hud-panel p-1 sm:p-2">
            <div className="pixel-text text-[10px] sm:text-xs text-neon-yellow mb-1">POWER-UPS</div>
            <div className="flex gap-1">
              {gameState.activePowerUps
                .filter(p => p.type !== 'spread' && p.type !== 'laser' && p.type !== 'missile')
                .map((powerUp, index) => {
                const remaining = Math.ceil((powerUp.expiresAt - Date.now()) / 1000);
                const colors: Record<string, { bg: string; text: string }> = {
                  speed: { bg: '#00ffff', text: 'S' },
                  fireRate: { bg: '#ff6600', text: 'F' },
                  shield: { bg: '#00ff00', text: 'H' }
                };
                const color = colors[powerUp.type] || { bg: '#ffffff', text: '?' };
                
                return (
                  <div 
                    key={`${powerUp.type}-${index}`}
                    className="flex flex-col items-center gap-0.5"
                    style={{ 
                      padding: '2px 4px',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      border: `1px solid ${color.bg}`,
                      borderRadius: '2px'
                    }}
                  >
                    <span 
                      className="pixel-text text-xs font-bold"
                      style={{ color: color.bg }}
                    >
                      {color.text}
                    </span>
                    <span className="pixel-text text-[8px]" style={{ color: color.bg }}>
                      {remaining}s
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
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
            {playerName && (
              <div className="pixel-text text-sm sm:text-base text-neon-cyan mb-2">
                PLAYER: {playerName}
              </div>
            )}
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