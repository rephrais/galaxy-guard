import { useCallback, useRef, useEffect } from 'react';

export const useBackgroundMusic = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const schedulerIntervalRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentNoteRef = useRef<number>(0);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Create master gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.15; // Background music volume
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Space-themed melody pattern (notes in Hz)
  const melodyPattern = [
    // Mysterious, space-like melody
    [220.00, 0.4], // A3
    [246.94, 0.2], // B3
    [277.18, 0.4], // C#4
    [329.63, 0.2], // E4
    [293.66, 0.4], // D4
    [246.94, 0.2], // B3
    [220.00, 0.4], // A3
    [196.00, 0.2], // G3
  ];

  const bassPattern = [
    // Deep bass for space atmosphere
    [110.00, 0.8], // A2
    [110.00, 0.4], // A2
    [164.81, 0.8], // E2
    [146.83, 0.4], // D2
  ];

  const tempo = 150; // BPM
  const noteLength = (60 / tempo); // Length of each beat in seconds
  const lookAhead = 0.1; // How far ahead to schedule (seconds)
  const scheduleInterval = 50; // How often to check for scheduling (ms)

  // Play a synth note
  const playNote = useCallback((frequency: number, duration: number, time: number, isBass: boolean = false) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const noteGain = audioContextRef.current.createGain();
    const filter = audioContextRef.current.createBiquadFilter();

    oscillator.type = isBass ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;

    filter.type = 'lowpass';
    filter.frequency.value = isBass ? 800 : 2000;
    filter.Q.value = 1;

    oscillator.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(gainNodeRef.current);

    // Envelope (ADSR)
    const attackTime = 0.02;
    const releaseTime = 0.1;
    const volume = isBass ? 0.3 : 0.2;

    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(volume, time + attackTime);
    noteGain.gain.setValueAtTime(volume, time + duration - releaseTime);
    noteGain.gain.linearRampToValueAtTime(0, time + duration);

    oscillator.start(time);
    oscillator.stop(time + duration);
  }, []);

  // Add ambient pad sound
  const playPad = useCallback((time: number, duration: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const frequencies = [220, 277.18, 329.63]; // A minor chord
    
    frequencies.forEach(freq => {
      const oscillator = audioContextRef.current!.createOscillator();
      const noteGain = audioContextRef.current!.createGain();
      const filter = audioContextRef.current!.createBiquadFilter();

      oscillator.type = 'sawtooth';
      oscillator.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 500;
      filter.Q.value = 5;

      oscillator.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(gainNodeRef.current!);

      noteGain.gain.setValueAtTime(0, time);
      noteGain.gain.linearRampToValueAtTime(0.05, time + 0.5);
      noteGain.gain.setValueAtTime(0.05, time + duration - 0.5);
      noteGain.gain.linearRampToValueAtTime(0, time + duration);

      oscillator.start(time);
      oscillator.stop(time + duration);
    });
  }, []);

  // Schedule notes
  const scheduler = useCallback(() => {
    if (!audioContextRef.current || !isPlayingRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + lookAhead) {
      const currentTime = nextNoteTimeRef.current;
      const melodyIndex = currentNoteRef.current % melodyPattern.length;
      const bassIndex = Math.floor(currentNoteRef.current / 2) % bassPattern.length;

      // Play melody note
      const [melodyFreq, melodyDur] = melodyPattern[melodyIndex];
      playNote(melodyFreq, melodyDur as number * noteLength, currentTime, false);

      // Play bass note (every other beat)
      if (currentNoteRef.current % 2 === 0) {
        const [bassFreq, bassDur] = bassPattern[bassIndex];
        playNote(bassFreq, bassDur as number * noteLength, currentTime, true);
      }

      // Play pad every 8 beats
      if (currentNoteRef.current % 8 === 0) {
        playPad(currentTime, noteLength * 8);
      }

      nextNoteTimeRef.current += noteLength;
      currentNoteRef.current++;
    }
  }, [melodyPattern, bassPattern, noteLength, playNote, playPad]);

  // Start background music
  const startMusic = useCallback(() => {
    if (isPlayingRef.current) return;

    initAudio();
    if (!audioContextRef.current) return;

    isPlayingRef.current = true;
    currentNoteRef.current = 0;
    nextNoteTimeRef.current = audioContextRef.current.currentTime;

    schedulerIntervalRef.current = window.setInterval(() => {
      scheduler();
    }, scheduleInterval);
  }, [initAudio, scheduler]);

  // Stop background music
  const stopMusic = useCallback(() => {
    isPlayingRef.current = false;
    if (schedulerIntervalRef.current) {
      clearInterval(schedulerIntervalRef.current);
      schedulerIntervalRef.current = null;
    }
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic]);

  return {
    startMusic,
    stopMusic,
    setVolume,
    isPlaying: () => isPlayingRef.current,
  };
};
