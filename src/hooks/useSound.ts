import { useCallback, useRef } from 'react';

// Audio context and sounds setup for future implementation
interface SoundEffects {
  shoot: () => void;
  bomb: () => void;
  explosion: () => void;
  megaBossExplosion: () => void;
  hit: () => void;
  gameOver: () => void;
  levelUp: () => void;
  powerUp: () => void;
  collision: () => void;
}

export const useSound = (): SoundEffects => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Generate simple beep sounds using Web Audio API
  const playBeep = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    initAudio();
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, [initAudio]);

  const shoot = useCallback(() => {
    playBeep(800, 0.1, 0.05);
  }, [playBeep]);

  const bomb = useCallback(() => {
    playBeep(200, 0.3, 0.1);
  }, [playBeep]);

  const explosion = useCallback(() => {
    // Multiple frequencies for explosion effect
    playBeep(150, 0.2, 0.08);
    setTimeout(() => playBeep(100, 0.15, 0.06), 50);
    setTimeout(() => playBeep(80, 0.1, 0.04), 100);
  }, [playBeep]);

  const megaBossExplosion = useCallback(() => {
    // MASSIVE BOOM sound effect - cascading explosions
    // Initial deep BOOM
    playBeep(50, 0.5, 0.15);
    playBeep(80, 0.5, 0.12);
    
    // Secondary explosions cascade
    setTimeout(() => {
      playBeep(120, 0.4, 0.1);
      playBeep(60, 0.4, 0.12);
    }, 100);
    
    setTimeout(() => {
      playBeep(100, 0.3, 0.09);
      playBeep(70, 0.35, 0.11);
    }, 250);
    
    setTimeout(() => {
      playBeep(90, 0.3, 0.08);
      playBeep(55, 0.3, 0.1);
    }, 400);
    
    setTimeout(() => {
      playBeep(80, 0.25, 0.07);
    }, 600);
    
    setTimeout(() => {
      playBeep(70, 0.2, 0.06);
    }, 800);
    
    // Final rumble
    setTimeout(() => {
      playBeep(40, 0.6, 0.08);
    }, 1000);
  }, [playBeep]);

  const hit = useCallback(() => {
    playBeep(300, 0.15, 0.07);
  }, [playBeep]);

  const gameOver = useCallback(() => {
    // Soft descending tone for game over
    playBeep(300, 0.4, 0.01);
    setTimeout(() => playBeep(250, 0.4, 0.008), 200);
    setTimeout(() => playBeep(200, 0.5, 0.005), 400);
  }, [playBeep]);

  const levelUp = useCallback(() => {
    // Ascending tone for level up
    playBeep(400, 0.2, 0.08);
    setTimeout(() => playBeep(500, 0.2, 0.08), 100);
    setTimeout(() => playBeep(600, 0.2, 0.08), 200);
  }, [playBeep]);

  const powerUp = useCallback(() => {
    // Magical ascending chime for power-up collection
    playBeep(600, 0.15, 0.08);
    setTimeout(() => playBeep(800, 0.15, 0.08), 80);
    setTimeout(() => playBeep(1000, 0.2, 0.1), 160);
    setTimeout(() => playBeep(1200, 0.25, 0.08), 240);
  }, [playBeep]);

  const collision = useCallback(() => {
    // Heavy thud for collisions
    playBeep(80, 0.25, 0.12);
    setTimeout(() => playBeep(60, 0.2, 0.1), 50);
  }, [playBeep]);

  return {
    shoot,
    bomb,
    explosion,
    megaBossExplosion,
    hit,
    gameOver,
    levelUp,
    powerUp,
    collision,
  };
};