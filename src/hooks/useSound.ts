import { useCallback, useRef } from 'react';

// Audio context and sounds setup for future implementation
interface SoundEffects {
  shoot: () => void;
  bomb: () => void;
  explosion: () => void;
  hit: () => void;
  gameOver: () => void;
  levelUp: () => void;
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

  const hit = useCallback(() => {
    playBeep(300, 0.15, 0.07);
  }, [playBeep]);

  const gameOver = useCallback(() => {
    // Descending tone for game over
    playBeep(400, 0.2, 0.1);
    setTimeout(() => playBeep(300, 0.2, 0.1), 100);
    setTimeout(() => playBeep(200, 0.3, 0.1), 200);
  }, [playBeep]);

  const levelUp = useCallback(() => {
    // Ascending tone for level up
    playBeep(400, 0.2, 0.08);
    setTimeout(() => playBeep(500, 0.2, 0.08), 100);
    setTimeout(() => playBeep(600, 0.2, 0.08), 200);
  }, [playBeep]);

  return {
    shoot,
    bomb,
    explosion,
    hit,
    gameOver,
    levelUp,
  };
};