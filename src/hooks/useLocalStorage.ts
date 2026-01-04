import { useState, useEffect, useCallback } from 'react';
import { SaveData, LeaderboardEntry } from '@/types/game';

export const useLocalStorage = () => {
  const [savedGame, setSavedGame] = useState<SaveData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Load saved game
    const saved = localStorage.getItem('spaceship-save-data');
    if (saved) {
      try {
        setSavedGame(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved game:', error);
      }
    }

    // Load leaderboard
    const scores = localStorage.getItem('spaceship-leaderboard');
    if (scores) {
      try {
        setLeaderboard(JSON.parse(scores));
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      }
    }
  }, []);

  const saveGame = useCallback((data: SaveData) => {
    try {
      localStorage.setItem('spaceship-save-data', JSON.stringify(data));
      setSavedGame(data);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, []);

  const deleteSavedGame = useCallback(() => {
    localStorage.removeItem('spaceship-save-data');
    setSavedGame(null);
  }, []);

  const addToLeaderboard = useCallback((entry: LeaderboardEntry) => {
    try {
      // Ensure name is not empty - use default if needed
      const sanitizedEntry = {
        ...entry,
        name: entry.name?.trim() || 'ANONYMOUS'
      };
      
      // Get current leaderboard directly from localStorage to avoid stale state issues
      const currentLeaderboard = localStorage.getItem('spaceship-leaderboard');
      const existingLeaderboard: LeaderboardEntry[] = currentLeaderboard 
        ? JSON.parse(currentLeaderboard) 
        : [];
      
      const newLeaderboard = [...existingLeaderboard, sanitizedEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Keep top 10
      
      localStorage.setItem('spaceship-leaderboard', JSON.stringify(newLeaderboard));
      setLeaderboard(newLeaderboard);
    } catch (error) {
      console.error('Failed to save to leaderboard:', error);
    }
  }, []);

  const clearLeaderboard = useCallback(() => {
    localStorage.removeItem('spaceship-leaderboard');
    setLeaderboard([]);
  }, []);

  return {
    savedGame,
    leaderboard,
    saveGame,
    deleteSavedGame,
    addToLeaderboard,
    clearLeaderboard,
    hasSavedGame: savedGame !== null,
  };
};