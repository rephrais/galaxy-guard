import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Changelog = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center overflow-y-auto">
      <div className="starfield" />
      <div className="aurora">
        <div className="aurora-layer-1" />
        <div className="aurora-layer-2" />
        <div className="aurora-layer-3" />
      </div>
      
      {/* Colorful corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-neon-cyan opacity-50" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-neon-purple opacity-50" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-neon-orange opacity-50" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-neon-green opacity-50" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Back to Home Button */}
        <Link 
          to="/" 
          className="arcade-button mb-8 inline-flex items-center gap-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black"
        >
          <ArrowLeft size={20} />
          BACK TO HOME
        </Link>

        {/* Title */}
        <div className="text-center mb-12">
          <div 
            className="pixel-text text-6xl mb-4"
            style={{
              background: 'linear-gradient(180deg, hsl(120, 100%, 50%) 0%, hsl(51, 100%, 50%) 50%, hsl(120, 100%, 50%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 10px white) drop-shadow(0 0 20px white)',
              WebkitTextStroke: '2px black',
              paintOrder: 'stroke fill',
            }}
          >
            CHANGELOG
          </div>
          <div className="pixel-text text-xl text-neon-cyan">
            Version History & Updates
          </div>
        </div>

        {/* Changelog Entries */}
        <div className="space-y-8">
          {/* Version 1.0.0 */}
          <div className="hud-panel p-6 border-4 border-neon-yellow">
            <div className="flex items-center justify-between mb-4">
              <div className="pixel-text text-3xl text-neon-yellow">
                v1.0.0
              </div>
              <div className="pixel-text text-sm text-muted-foreground">
                January 2025
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="pixel-text text-lg text-neon-green mb-2">✨ NEW FEATURES</div>
                <ul className="pixel-text text-sm text-foreground space-y-1 list-disc list-inside">
                  <li>Retro arcade-style space shooter gameplay</li>
                  <li>Infinite scrolling terrain with rocket enemies</li>
                  <li>Boss fights every minute with unique colors</li>
                  <li>100 playable levels with increasing difficulty</li>
                  <li>Ammo system: +100 for big ships, +1000 for bosses</li>
                  <li>High score leaderboard system</li>
                  <li>Save/load game progress</li>
                  <li>Music and sound effect toggles</li>
                </ul>
              </div>

              <div>
                <div className="pixel-text text-lg text-neon-cyan mb-2">🎮 GAMEPLAY</div>
                <ul className="pixel-text text-sm text-foreground space-y-1 list-disc list-inside">
                  <li>Arrow keys for movement</li>
                  <li>SPACE to shoot bullets</li>
                  <li>B to drop bombs</li>
                  <li>P to pause</li>
                </ul>
              </div>

              <div>
                <div className="pixel-text text-lg text-neon-purple mb-2">🎨 DESIGN</div>
                <ul className="pixel-text text-sm text-foreground space-y-1 list-disc list-inside">
                  <li>Vibrant neon color palette</li>
                  <li>Animated starfield background</li>
                  <li>Retro pixel-perfect graphics</li>
                  <li>Smooth animations and effects</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Future Updates Placeholder */}
          <div className="hud-panel p-6 border-4 border-neon-cyan">
            <div className="pixel-text text-2xl text-neon-cyan mb-4">
              🚀 COMING SOON
            </div>
            <ul className="pixel-text text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Power-up system</li>
              <li>Multiple weapon types</li>
              <li>Online multiplayer</li>
              <li>More boss varieties</li>
              <li>Achievement system</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="pixel-text text-xs text-muted-foreground">
            Created with ❤️ by AJ Batac (@ajbatac)
          </div>
        </div>
      </div>
    </div>
  );
};

export default Changelog;
