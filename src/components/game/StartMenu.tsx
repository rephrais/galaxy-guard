import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, SaveData } from '@/types/game';

interface StartMenuProps {
  onStartGame: () => void;
  onLoadGame?: () => void;
  hasSavedGame: boolean;
}

export const StartMenu: React.FC<StartMenuProps> = ({ 
  onStartGame, 
  onLoadGame, 
  hasSavedGame 
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(1);

  useEffect(() => {
    // Load leaderboard from localStorage
    const savedLeaderboard = localStorage.getItem('spaceship-leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
  };

  const renderLevelSelect = () => {
    const levels = [];
    for (let i = 1; i <= 100; i++) {
      levels.push(
        <button
          key={i}
          onClick={() => handleLevelSelect(i)}
          className={`arcade-button text-sm ${
            selectedLevel === i ? 'bg-primary text-black' : ''
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-10 gap-2 max-h-60 overflow-y-auto">
        {levels}
      </div>
    );
  };

  if (showLeaderboard) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="starfield" />
        <div className="hud-panel max-w-2xl w-full mx-4 relative z-10">
          <div className="pixel-text text-4xl text-center text-score-text mb-8">
            HIGH SCORES
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 border border-neon-blue rounded"
                >
                  <div className="flex items-center space-x-4">
                    <div className="pixel-text text-xl text-neon-yellow w-8">
                      {index + 1}
                    </div>
                    <div className="pixel-text text-lg text-foreground">
                      {entry.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="pixel-text text-lg text-score-text">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="pixel-text text-sm text-neon-cyan">
                      Level {entry.level}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center pixel-text text-lg text-muted-foreground">
                No scores yet!
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="arcade-button"
            >
              BACK TO MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="starfield" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Game Title */}
        <div className="mb-12">
          <div className="pixel-text text-8xl text-neon-yellow mb-4" style={{
            textShadow: '0 0 20px currentColor, 0 0 40px currentColor'
          }}>
            SPACE DEFENDER
          </div>
          <div className="pixel-text text-2xl text-neon-cyan">
            Defend Against the Rocket Storm!
          </div>
        </div>

        {/* Main Menu */}
        <div className="hud-panel inline-block p-8 mb-8">
          <div className="space-y-6">
            <button
              onClick={onStartGame}
              className="arcade-button text-xl w-64"
            >
              START GAME
            </button>
            
            {hasSavedGame && onLoadGame && (
              <button
                onClick={onLoadGame}
                className="arcade-button text-xl w-64"
              >
                CONTINUE GAME
              </button>
            )}
            
            <button
              onClick={() => setShowLeaderboard(true)}
              className="arcade-button text-xl w-64"
            >
              HIGH SCORES
            </button>
          </div>
        </div>

        {/* Level Selection */}
        <div className="hud-panel mb-8 p-6">
          <div className="pixel-text text-xl text-neon-green mb-4">
            SELECT STARTING LEVEL: {selectedLevel}
          </div>
          {renderLevelSelect()}
        </div>

        {/* Instructions */}
        <div className="hud-panel p-6">
          <div className="pixel-text text-lg text-neon-yellow mb-4">
            HOW TO PLAY
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <div className="pixel-text text-sm text-neon-cyan mb-2">CONTROLS:</div>
              <div className="pixel-text text-xs text-foreground space-y-1">
                <div>↑↓←→ - Move Spaceship</div>
                <div>SPACE - Shoot Bullets</div>
                <div>B - Drop Bombs</div>
                <div>P - Pause Game</div>
              </div>
            </div>
            <div>
              <div className="pixel-text text-sm text-neon-purple mb-2">OBJECTIVE:</div>
              <div className="pixel-text text-xs text-foreground space-y-1">
                <div>• Avoid rocket launches from the ground</div>
                <div>• Shoot rockets to destroy them</div>
                <div>• Survive as long as possible</div>
                <div>• Reach higher levels for more points</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};