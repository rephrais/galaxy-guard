# CHANGELOG - Galaxy Guard

Internal technical documentation of all changes, updates, and fixes.

---

## [v1.2.0] - December 10, 2025

### Cinematic Visual Effects System

**Summary**: Added immersive screen shake, camera zoom, and slow-motion effects to enhance gameplay impact during explosions and critical hits.

#### Technical Changes

**1. Screen Shake System - Differentiated Intensity**
- **File**: `src/hooks/useGameEngine.ts`
- **Lines**: Collision detection blocks (multiple locations)
- **Changes**:
  - Modified `triggerScreenShake` calls to differentiate bomb explosions from regular hits
  - Bomb-induced shakes: 0.4-0.75 intensity, 200-400ms duration
  - Regular projectile shakes: 0.15-0.5 intensity, 100-250ms duration
  - Applied to: rockets, saucers, aliens, crawling aliens, trees, boss rockets, mega boss

**2. Camera Zoom Effect**
- **File**: `src/types/game.ts`
- **Lines**: New `ScreenZoom` interface added
- **Interface**: `{ scale: number, startTime: number, duration: number, centerX: number, centerY: number }`
- **File**: `src/hooks/useGameEngine.ts`
- **Lines**: `triggerScreenZoom` helper function
- **Changes**:
  - Added `screenZoom: ScreenZoom | null` to `GameState`
  - Implemented `triggerScreenZoom(scale, duration, centerX, centerY)` function
  - Priority system: only triggers if no existing zoom or new zoom is larger
  - Auto-cleanup when duration expires
- **Zoom triggers**:
  - Mega Boss destruction: 1.15 scale, 500ms
  - Boss Rocket (bomb): 1.08 scale, 300ms
  - Splitter Gen-0 (bomb): 1.06 scale, 250ms
  - Saucer (bomb): 1.05 scale, 200ms
- **File**: `src/components/game/GameCanvas.tsx`
- **Lines**: Rendering loop transformation
- **Changes**:
  - Calculate `zoomScale` with ease-out curve for zoom-in, quick zoom-out
  - Apply `ctx.setTransform` with zoom scale and offset adjustments
  - Combines with existing shake offsets

**3. Slow-Motion Effect**
- **File**: `src/types/game.ts`
- **Lines**: New `SlowMotion` interface added
- **Interface**: `{ timeScale: number, startTime: number, duration: number }`
- **File**: `src/hooks/useGameEngine.ts`
- **Lines**: `triggerSlowMotion` helper and physics scaling
- **Changes**:
  - Added `slowMotion: SlowMotion | null` to `GameState`
  - Implemented `triggerSlowMotion(timeScale, duration)` function
  - Priority: new slower effects override existing
  - Applied `timeScale` to all physics:
    - World scroll speed
    - Player projectiles
    - Enemy rockets
    - Saucer movement/drift
    - DiveBomber phases
    - ZigzagFighter patterns
    - Splitter movement/bounce
    - Boss/Mega Boss movement
    - Explosion particles (gravity, fade)
    - Power-up movement
    - CrawlingAlien horizontal movement
    - TrailParticle fading/drift
- **Slow-motion triggers**:
  - Mega Boss destruction: 0.25 timeScale, 800ms
  - Boss Rocket (bomb): 0.4 timeScale, 400ms
  - Boss Rocket (regular): 0.5 timeScale, 300ms
  - Every 5th combo kill: 0.5 timeScale, 250ms

#### Architecture Improvements
- Unified effect system with priority handling
- Smooth easing curves for natural visual transitions
- Effects combine properly (shake + zoom + slow-mo)
- Minimal performance impact through efficient state checks

---

## [v1.1.0] - November 7, 2025

### Mobile & Tablet Responsive Improvements

**Summary**: Comprehensive responsive design overhaul to fix mobile and iPad layout distortion issues. Implemented uniform scaling with letterboxing to preserve aspect ratio across all devices.

#### Technical Changes

**1. Canvas Rendering System - Uniform Scaling Implementation**
- **File**: `src/components/game/GameCanvas.tsx`
- **Lines**: 45-65 (rendering loop)
- **Changes**:
  - Replaced distorting `scaleX`/`scaleY` with uniform `scale` calculation
  - Added letterbox rendering with centered game area
  - Implemented `offsetX` and `offsetY` for proper canvas centering
  - Canvas background fill: `#000003` for letterbox areas
  - Scale calculation: `Math.min(rect.width / settings.width, rect.height / settings.height)`

**2. HUD Positioning & Safe Area Support**
- **File**: `src/components/SpaceDefenderGame.tsx`
- **Lines**: 152-154, 166-184, 440, 445-449
- **Changes**:
  - Added `gameAreaDimensions` state to track scaled game area
  - Implemented `containerRef` for canvas container measurements
  - Created `useEffect` to calculate and update game area dimensions on resize
  - Dimension calculation includes: `scale`, `offsetX`, `offsetY`, `width`, `height`
  - Passed `gameAreaDimensions` prop to `GameHUD` component

**3. HUD Component Refactoring**
- **File**: `src/components/game/GameHUD.tsx`
- **Lines**: 8-16 (props interface), 43-56 (positioning styles)
- **Changes**:
  - Added `gameAreaDimensions` to `GameHUDProps` interface
  - Replaced viewport-based positioning with game-area-constrained absolute positioning
  - Implemented inline styles for precise HUD positioning within scaled game area
  - Added safe-area-inset padding: `max(0.5rem, env(safe-area-inset-*))`
  - Applied safe-area padding to all four edges (top, right, bottom, left)

**4. Global Mobile Optimization**
- **File**: `src/index.css`
- **Lines**: Body and #root selectors
- **Changes**:
  - Added `padding: env(safe-area-inset-*)` to body for notched devices
  - Ensured `touch-action: none` and `overscroll-behavior: none` on root
  - Fixed viewport height: `100%` and `position: fixed` on html/body
  - Prevented unwanted scrolling and zooming behaviors

**5. Viewport Meta Tags Enhancement**
- **File**: `index.html`
- **Lines**: 5-8
- **Changes**:
  - Enhanced viewport meta: `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`
  - Added `mobile-web-app-capable` and `apple-mobile-web-app-capable`
  - Set `apple-mobile-web-app-status-bar-style` to `black-translucent`

#### Architecture Improvements
- Separation of concerns: Canvas scaling logic independent of HUD positioning
- Reactive design: Game area dimensions update automatically on window resize
- Safe area support: Proper spacing on devices with notches/islands
- Performance: Single uniform scale calculation vs multiple non-uniform scales

#### Browser Compatibility
- iOS Safari: Full safe-area-inset support
- Android Chrome: Touch and scroll behavior optimized
- iPad Safari: Letterbox rendering for all orientations
- Desktop browsers: Centered game area with maintained aspect ratio

---

## [v1.0.0] - January 2025

### Initial Release

**Core Game Engine**
- **Files**: `src/hooks/useGameEngine.ts`, `src/types/game.ts`
- Implemented main game loop with 60 FPS rendering
- Collision detection system
- Score and level progression logic
- Enemy spawning algorithms

**Rendering System**
- **File**: `src/components/game/GameCanvas.tsx`
- HTML5 Canvas-based rendering
- Sprite drawing and animation system
- Particle effects for explosions
- Background starfield parallax

**Game Features**
- **File**: `src/components/SpaceDefenderGame.tsx`
- 100 playable levels with difficulty scaling
- Boss encounters every 60 seconds
- Ammo management system (+100 for big ships, +1000 for bosses)
- Bullet and bomb weapon systems
- Health and damage mechanics

**UI Components**
- **Files**: `src/components/game/StartMenu.tsx`, `src/components/game/GameHUD.tsx`
- Start menu with country selection
- Player name input system
- Live HUD showing score, level, time, ammo, health
- Pause and game over screens
- Leaderboard display

**Audio System**
- **Files**: `src/hooks/useSound.ts`, `src/hooks/useBackgroundMusic.ts`
- Background music management
- Sound effects for shooting, explosions, hits
- Toggle controls for music and SFX

**Persistence Layer**
- **File**: `src/hooks/useLocalStorage.ts`
- High score tracking (top 10)
- Save/load game state
- Settings persistence (music, sound toggles)

**Routing & Pages**
- **Files**: `src/App.tsx`, `src/pages/Index.tsx`, `src/pages/Changelog.tsx`, `src/pages/NotFound.tsx`
- React Router setup
- Home page with game
- Changelog page
- 404 error page

**Design System**
- **Files**: `src/index.css`, `tailwind.config.ts`
- Neon color palette (cyan, purple, yellow, green, orange)
- Retro pixel font styling
- Animated starfield and aurora backgrounds
- HUD panel and arcade button components
- Responsive breakpoints for mobile/tablet/desktop

**SEO & Meta**
- **File**: `index.html`
- OpenGraph meta tags
- Twitter Card integration
- Descriptive title and meta description
- Favicon and branding

---

## Development Notes

### Project Structure
```
src/
├── components/
│   ├── SpaceDefenderGame.tsx (main game orchestrator)
│   ├── game/
│   │   ├── GameCanvas.tsx (rendering engine)
│   │   ├── GameHUD.tsx (heads-up display)
│   │   └── StartMenu.tsx (menu & leaderboard)
│   └── ui/ (shadcn components)
├── hooks/
│   ├── useGameEngine.ts (game logic)
│   ├── useSound.ts (audio effects)
│   ├── useBackgroundMusic.ts (music control)
│   └── useLocalStorage.ts (persistence)
├── pages/
│   ├── Index.tsx (home)
│   ├── Changelog.tsx (version history)
│   └── NotFound.tsx (404)
├── types/
│   └── game.ts (TypeScript interfaces)
└── index.css (global styles)
```

### Key Technologies
- **React 18.3.1**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS 3.x**: Styling
- **React Router DOM 6.30.1**: Navigation
- **Radix UI**: Accessible components
- **Lucide React**: Icon library

---

**Maintained by**: AJ Batac (@ajbatac)  
**Last Updated**: December 10, 2025
