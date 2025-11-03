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
      
      {/* Crazy animated corner decorations - 80s style */}
      <div className="absolute top-0 left-0 w-48 h-48 border-l-8 border-t-8 border-neon-cyan animate-pulse" 
           style={{ 
             boxShadow: '0 0 20px hsl(var(--neon-cyan)), inset 0 0 20px hsl(var(--neon-cyan))',
             animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
           }} />
      <div className="absolute top-0 right-0 w-48 h-48 border-r-8 border-t-8 border-neon-purple animate-pulse" 
           style={{ 
             boxShadow: '0 0 20px hsl(var(--neon-purple)), inset 0 0 20px hsl(var(--neon-purple))',
             animationDelay: '0.5s',
             animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s'
           }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 border-l-8 border-b-8 border-neon-orange animate-pulse" 
           style={{ 
             boxShadow: '0 0 20px hsl(var(--neon-orange)), inset 0 0 20px hsl(var(--neon-orange))',
             animationDelay: '1s',
             animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s'
           }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 border-r-8 border-b-8 border-neon-green animate-pulse" 
           style={{ 
             boxShadow: '0 0 20px hsl(var(--neon-green)), inset 0 0 20px hsl(var(--neon-green))',
             animationDelay: '1.5s',
             animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 1.5s'
           }} />
      
      {/* Extra animated borders for that 80s arcade cabinet look */}
      <div className="absolute inset-8 border-4 border-neon-yellow pointer-events-none"
           style={{ 
             boxShadow: '0 0 30px hsl(var(--neon-yellow)), inset 0 0 30px hsl(var(--neon-yellow))',
             animation: 'pulse 3s ease-in-out infinite'
           }} />
      
      <div className="relative z-10 text-center w-full max-w-2xl mx-auto px-4">
        {/* Massive 80s Game Title with crazy effects */}
        <div className="mb-8 animate-pulse">
          <div 
            className="pixel-text text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 tracking-wider"
            style={{
              background: 'linear-gradient(45deg, hsl(var(--neon-cyan)) 0%, hsl(var(--neon-purple)) 25%, hsl(var(--neon-yellow)) 50%, hsl(var(--neon-orange)) 75%, hsl(var(--neon-cyan)) 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 10px hsl(var(--neon-cyan))) drop-shadow(0 0 20px hsl(var(--neon-purple))) drop-shadow(0 0 30px hsl(var(--neon-yellow))) drop-shadow(4px 4px 0 black)',
              animation: 'retro-glow 3s ease-in-out infinite, color-splash 8s linear infinite',
              WebkitTextStroke: '2px black',
              textShadow: '4px 4px 0 black, 0 0 50px hsl(var(--neon-yellow))'
            }}
          >
            SPACE OFFENDER
          </div>
          <div className="pixel-text text-lg sm:text-xl md:text-2xl text-neon-cyan animate-pulse"
               style={{
                 filter: 'drop-shadow(0 0 10px hsl(var(--neon-cyan)))',
                 textShadow: '0 0 20px hsl(var(--neon-cyan))'
               }}>
            ⚡ Defend Against the Rocket Storm! ⚡
          </div>
        </div>

        {/* Main Menu Container with crazy border */}
        <div className="relative w-full mb-6"
             style={{
               background: 'linear-gradient(45deg, transparent 0%, rgba(0,0,0,0.5) 100%)',
               padding: '4px',
               animation: 'pulse 2s infinite'
             }}>
          <div className="absolute inset-0 border-4 sm:border-6 md:border-8 border-double animate-pulse"
               style={{
                 borderImage: 'linear-gradient(45deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)), hsl(var(--neon-yellow)), hsl(var(--neon-orange))) 1',
                 borderImageSlice: 1,
                 boxShadow: '0 0 40px hsl(var(--neon-purple)), inset 0 0 40px rgba(0,0,0,0.8)',
                 animation: 'pulse 2s ease-in-out infinite'
               }} />
          <div className="hud-panel p-6 sm:p-8 md:p-10 border-4 border-neon-yellow relative"
               style={{
                 boxShadow: '0 0 30px hsl(var(--neon-yellow)), inset 0 0 20px rgba(0,0,0,0.9)'
               }}>
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* HUGE START BUTTON */}
              <button
                onClick={onStartGame}
                className="arcade-button text-2xl sm:text-3xl md:text-4xl w-full max-w-md mx-auto py-4 sm:py-6 md:py-8 border-4 sm:border-6 md:border-8 border-neon-yellow hover:bg-neon-yellow font-black tracking-widest transform hover:scale-105 transition-all duration-200"
                style={{
                  boxShadow: '0 0 40px hsl(var(--neon-yellow)), inset 0 0 20px rgba(255,255,0,0.2)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  textShadow: '0 0 20px hsl(var(--neon-yellow)), 3px 3px 0 black'
                }}
              >
                ▶▶ START GAME ◀◀
              </button>
              
              {/* HUGE CONTINUE BUTTON */}
              {hasSavedGame && onLoadGame && (
                <button
                  onClick={onLoadGame}
                  className="arcade-button text-xl sm:text-2xl md:text-3xl w-full max-w-md mx-auto py-3 sm:py-4 md:py-6 border-4 sm:border-6 md:border-8 border-neon-green hover:bg-neon-green text-neon-green hover:text-black font-black tracking-widest transform hover:scale-105 transition-all duration-200"
                  style={{
                    boxShadow: '0 0 40px hsl(var(--neon-green)), inset 0 0 20px rgba(0,255,0,0.2)',
                    textShadow: '0 0 20px hsl(var(--neon-green)), 2px 2px 0 black'
                  }}
                >
                  ⟳ CONTINUE GAME ⟳
                </button>
              )}
              
              {/* HUGE HIGH SCORES BUTTON */}
              <button
                onClick={() => setShowLeaderboard(true)}
                className="arcade-button text-xl sm:text-2xl md:text-3xl w-full max-w-md mx-auto py-3 sm:py-4 md:py-6 border-4 sm:border-6 md:border-8 border-neon-cyan hover:bg-neon-cyan text-neon-cyan hover:text-black font-black tracking-widest transform hover:scale-105 transition-all duration-200"
                style={{
                  boxShadow: '0 0 40px hsl(var(--neon-cyan)), inset 0 0 20px rgba(0,255,255,0.2)',
                  textShadow: '0 0 20px hsl(var(--neon-cyan)), 2px 2px 0 black'
                }}
              >
                ★★ HIGH SCORES ★★
              </button>

              {/* Level Dropdown - 80s style */}
              <div className="pt-2 sm:pt-3 md:pt-4">
                <label className="pixel-text text-lg sm:text-xl md:text-2xl text-neon-purple block mb-2 sm:mb-3 font-black tracking-wider"
                       style={{
                         textShadow: '0 0 20px hsl(var(--neon-purple)), 2px 2px 0 black'
                       }}>
                  ⚙ STARTING LEVEL ⚙
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  className="w-full max-w-md mx-auto px-4 sm:px-6 py-3 sm:py-4 md:py-5 bg-background border-4 sm:border-6 md:border-8 border-neon-purple text-neon-purple pixel-text text-lg sm:text-xl md:text-2xl hover:bg-neon-purple hover:text-black transition-all cursor-pointer font-black"
                  style={{
                    boxShadow: '0 0 30px hsl(var(--neon-purple)), inset 0 0 10px rgba(255,0,255,0.2)',
                    textShadow: '0 0 10px hsl(var(--neon-purple))'
                  }}
                >
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((level) => (
                    <option key={level} value={level} className="bg-background text-foreground">
                      Level {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* HUGE HOW TO PLAY BUTTON */}
              <button
                onClick={() => setShowHowToPlay(true)}
                className="arcade-button text-xl sm:text-2xl md:text-3xl w-full max-w-md mx-auto py-3 sm:py-4 md:py-6 border-4 sm:border-6 md:border-8 border-neon-orange hover:bg-neon-orange text-neon-orange hover:text-black font-black tracking-widest transform hover:scale-105 transition-all duration-200"
                style={{
                  boxShadow: '0 0 40px hsl(var(--neon-orange)), inset 0 0 20px rgba(255,128,0,0.2)',
                  textShadow: '0 0 20px hsl(var(--neon-orange)), 2px 2px 0 black'
                }}
              >
                ? HOW TO PLAY ?
              </button>
            </div>
          </div>
        </div>

        {/* Audio Controls - 80s style */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            className="arcade-button text-base sm:text-lg md:text-xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-4 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black flex items-center justify-center gap-2 sm:gap-3 font-black transform hover:scale-105 transition-all"
            style={{
              boxShadow: '0 0 20px hsl(var(--neon-cyan))',
              textShadow: '0 0 10px hsl(var(--neon-cyan))'
            }}
          >
            <Music size={20} className={!musicEnabled ? 'opacity-30' : ''} />
            MUSIC: {musicEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="arcade-button text-base sm:text-lg md:text-xl px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-4 border-neon-green text-neon-green hover:bg-neon-green hover:text-black flex items-center justify-center gap-2 sm:gap-3 font-black transform hover:scale-105 transition-all"
            style={{
              boxShadow: '0 0 20px hsl(var(--neon-green))',
              textShadow: '0 0 10px hsl(var(--neon-green))'
            }}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            SOUND: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Footer Credits with glow */}
        <div className="pixel-text text-xs sm:text-sm text-muted-foreground px-2"
             style={{
               textShadow: '0 0 10px rgba(255,255,255,0.3)'
             }}>
          Created with ❤️ by AJ Batac (@ajbatac) - v1.0.0 (<Link to="/changelog" className="text-neon-cyan hover:text-neon-yellow transition-colors" style={{ textShadow: '0 0 10px hsl(var(--neon-cyan))' }}>changelog</Link>)
        </div>
      </div>
    </div>
  );
};