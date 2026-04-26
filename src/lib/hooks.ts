'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GameStateResponse {
  roomId: string;
  roomCode: string;
  phase: string;
  currentRound: number;
  totalRounds: number;
  turnNumber: number;
  turnStartTime: number | null;
  turnTimeLimit: number;
  gameStartTime: number | null;
  gameTimeLimit: number;
  amountPerPoint: number;
  autoStartNextRound: boolean;
  myHand: { rank: string; suit: string }[];
  myId: string;
  players: {
    id: string;
    name: string;
    isHost: boolean;
    isReady: boolean;
    isConnected: boolean;
    totalScore: number;
    roundScores: number[];
    board: {
      front: { rank: string; suit: string }[];
      middle: { rank: string; suit: string }[];
      back: { rank: string; suit: string }[];
    };
    cardCount: number;
  }[];
  roundSummaries: {
    roundNumber: number;
    playerResults: {
      playerId: string;
      playerName: string;
      board: {
        front: { rank: string; suit: string }[];
        middle: { rank: string; suit: string }[];
        back: { rank: string; suit: string }[];
      };
      scoring: {
        fouled: boolean;
        dragon: boolean;
        frontRoyalty: number;
        middleRoyalty: number;
        backRoyalty: number;
        dragonBonus: number;
        totalRoyalty: number;
        rows: {
          front: { rank: string; description: string };
          middle: { rank: string; description: string };
          back: { rank: string; description: string };
        };
      };
      roundPoints: number;
    }[];
    payments: {
      from: string;
      to: string;
      fromName: string;
      toName: string;
      points: number;
      amount: number;
    }[];
  }[];
}

export function useGameState(roomId: string | null, playerId: string | null) {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    if (!roomId || !playerId) return;

    try {
      const res = await fetch(`/api/game/${roomId}/state?playerId=${playerId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch game state');
      }
      const data = await res.json();
      setGameState(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [roomId, playerId]);

  useEffect(() => {
    fetchState();
    // Poll every 1.5 seconds for real-time updates
    intervalRef.current = setInterval(fetchState, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchState]);

  return { gameState, error, loading, refresh: fetchState };
}

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [key]);

  const setAndStore = useCallback((newValue: T) => {
    setValue(newValue);
    try {
      sessionStorage.setItem(key, JSON.stringify(newValue));
    } catch { /* ignore */ }
  }, [key]);

  return [value, setAndStore] as const;
}
