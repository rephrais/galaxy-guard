import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LeaderboardEntry, SaveData } from '@/types/game';
import { Volume2, VolumeX, Music } from 'lucide-react';

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
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  const renderAnimatedSpaceships = () => {
    const colors = ['neon-yellow', 'neon-cyan', 'neon-purple', 'neon-green', 'neon-orange', 'neon-red'];
    return (
      <>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute spaceship-float"
            style={{
              top: `${10 + i * 12}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${12 + i * 2}s`,
            }}
          >
            <div className={`text-${colors[i % colors.length]} text-2xl opacity-30`}>
              ▶
            </div>
          </div>
        ))}
      </>
    );
  };

  if (showLeaderboard) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="starfield" />
        <div className="aurora">
          <div className="aurora-layer-1" />
          <div className="aurora-layer-2" />
          <div className="aurora-layer-3" />
        </div>
        {renderAnimatedSpaceships()}
        <div className="hud-panel max-w-2xl w-full mx-4 relative z-10">
          <div className="pixel-text text-4xl text-center color-splash mb-8">
            HIGH SCORES
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 border-2"
                  style={{
                    borderColor: `hsl(var(--neon-${['yellow', 'cyan', 'purple', 'green', 'orange'][index % 5]}))`
                  }}
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

  if (showHowToPlay) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="starfield" />
        <div className="aurora">
          <div className="aurora-layer-1" />
          <div className="aurora-layer-2" />
          <div className="aurora-layer-3" />
        </div>
        {renderAnimatedSpaceships()}
        <div className="hud-panel max-w-2xl w-full mx-4 relative z-10">
          <div className="pixel-text text-4xl text-center color-splash mb-8">
            HOW TO PLAY
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="border-2 border-neon-cyan p-4">
              <div className="pixel-text text-xl text-neon-cyan mb-4">CONTROLS:</div>
              <div className="pixel-text text-sm text-foreground space-y-2">
                <div>↑↓←→ or WASD - Move Spaceship</div>
                <div>SPACE - Shoot Bullets</div>
                <div>B - Drop Bombs</div>
                <div>P - Pause Game</div>
              </div>
            </div>
            <div className="border-2 border-neon-purple p-4">
              <div className="pixel-text text-xl text-neon-purple mb-4">OBJECTIVE:</div>
              <div className="pixel-text text-sm text-foreground space-y-2">
                <div>• Avoid rocket launches</div>
                <div>• Shoot rockets to destroy them</div>
                <div>• Survive as long as possible</div>
                <div>• Defeat bosses every minute!</div>
              </div>
            </div>
            <div className="border-2 border-neon-green p-4">
              <div className="pixel-text text-xl text-neon-green mb-4">REWARDS:</div>
              <div className="pixel-text text-sm text-foreground space-y-2">
                <div>• Big Ships: +100 Ammo</div>
                <div>• Boss: +1000 Ammo</div>
                <div>• Higher levels = More points</div>
              </div>
            </div>
            <div className="border-2 border-neon-orange p-4">
              <div className="pixel-text text-xl text-neon-orange mb-4">ENEMIES:</div>
              <div className="pixel-text text-sm text-foreground space-y-2">
                <div>• Small Rockets: Fast & Deadly</div>
                <div>• Big Ships: Tough but Rewarding</div>
                <div>• Mega Boss: Every Minute!</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowHowToPlay(false)}
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
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden">
      <div className="starfield" />
      <div className="aurora">
        <div className="aurora-layer-1" />
        <div className="aurora-layer-2" />
        <div className="aurora-layer-3" />
      </div>
      {renderAnimatedSpaceships()}
      
      {/* Colorful corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-neon-cyan opacity-50" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-neon-purple opacity-50" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-neon-orange opacity-50" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-neon-green opacity-50" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Game Title */}
        <div className="mb-8">
          <div 
            className="pixel-text text-7xl md:text-8xl mb-4"
            style={{
              background: 'linear-gradient(180deg, hsl(120, 100%, 50%) 0%, hsl(51, 100%, 50%) 50%, hsl(120, 100%, 50%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(4px 4px 0px black) drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 10px white) drop-shadow(0 0 20px white) drop-shadow(0 0 40px rgba(255, 255, 255, 0.8))',
              WebkitTextStroke: '6px black',
              paintOrder: 'stroke fill',
            }}
          >
            SPACE OFFENDER
          </div>
          <div className="pixel-text text-xl md:text-2xl text-neon-cyan">
            Defend Against the Rocket Storm!
          </div>
        </div>

        {/* Main Menu Container */}
        <div className="hud-panel inline-block p-8 mb-6 border-4">
          <div className="space-y-4">
            <button
              onClick={onStartGame}
              className="arcade-button text-xl w-72 border-neon-yellow hover:bg-neon-yellow"
            >
              ▶ START GAME
            </button>
            
            {hasSavedGame && onLoadGame && (
              <button
                onClick={onLoadGame}
                className="arcade-button text-xl w-72 border-neon-green hover:bg-neon-green text-neon-green hover:text-black"
              >
                ⟳ CONTINUE GAME
              </button>
            )}
            
            <button
              onClick={() => setShowLeaderboard(true)}
              className="arcade-button text-xl w-72 border-neon-cyan hover:bg-neon-cyan text-neon-cyan hover:text-black"
            >
              ★ HIGH SCORES
            </button>

            {/* Level Dropdown */}
            <div className="pt-2">
              <label className="pixel-text text-sm text-neon-purple block mb-2">
                STARTING LEVEL
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                className="w-72 px-4 py-3 bg-background border-2 border-neon-purple text-neon-purple pixel-text text-lg hover:bg-neon-purple hover:text-black transition-all cursor-pointer"
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map((level) => (
                  <option key={level} value={level} className="bg-background text-foreground">
                    Level {level}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowHowToPlay(true)}
              className="arcade-button text-xl w-72 border-neon-orange hover:bg-neon-orange text-neon-orange hover:text-black"
            >
              ? HOW TO PLAY
            </button>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            className="arcade-button text-sm px-6 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black flex items-center gap-2"
          >
            <Music size={18} className={!musicEnabled ? 'opacity-30' : ''} />
            MUSIC: {musicEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="arcade-button text-sm px-6 border-neon-green text-neon-green hover:bg-neon-green hover:text-black flex items-center gap-2"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            SOUND: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Footer Credits */}
        <div className="pixel-text text-xs text-muted-foreground">
          Created with ❤️ by AJ Batac (@ajbatac) - v1.0.0 (<Link to="/changelog" className="text-neon-cyan hover:text-neon-yellow transition-colors">changelog</Link>)
        </div>
      </div>
    </div>
  );
};