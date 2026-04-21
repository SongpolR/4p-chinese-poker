'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import GameTable from '@/components/GameTable';
import RoundSummary from '@/components/RoundSummary';
import GameSummary from '@/components/GameSummary';

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const autoStartTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartTriggeredRef = useRef(false);

  useEffect(() => {
    const pid = sessionStorage.getItem('playerId');
    const pname = sessionStorage.getItem('playerName');
    const rcode = sessionStorage.getItem('roomCode');
    if (!pid) {
      router.push('/');
      return;
    }
    setPlayerId(pid);
    setPlayerName(pname || '');
    setRoomCode(rcode || '');
  }, [router]);

  const { gameState, error, loading } = useGameState(roomId, playerId);

  const handleStartGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('Failed to start game');
    }
  }, [roomId, playerId]);

  const handlePlaceCards = useCallback(async (placements: { card: { rank: string; suit: string }; row: 'front' | 'middle' | 'back' }[]) => {
    try {
      const res = await fetch(`/api/game/${roomId}/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, placements }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('Failed to place cards');
    }
  }, [roomId, playerId]);

  const handleEndGame = useCallback(async () => {
    if (!confirm(t('common.confirmEndGame'))) return;
    try {
      const res = await fetch(`/api/game/${roomId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('Failed to end game');
    }
  }, [roomId, playerId, t]);

  const handleLeaveGame = useCallback(async () => {
    if (!confirm(t('common.confirmLeaveGame'))) return;
    try {
      await fetch(`/api/game/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch { /* ignore */ }
    router.push('/');
  }, [roomId, playerId, router, t]);

  const handleExtendGame = useCallback(async (addRounds: number) => {
    try {
      const res = await fetch(`/api/game/${roomId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, addRounds }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('Failed to extend game');
    }
  }, [roomId, playerId]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/join/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  // Auto-start next round countdown
  const isHost = gameState?.players.find((p: { id: string }) => p.id === playerId)?.isHost || false;

  useEffect(() => {
    // Clear previous timer
    if (autoStartTimerRef.current) {
      clearInterval(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
    }

    if (
      gameState?.phase === 'round-end' &&
      gameState?.autoStartNextRound &&
      isHost &&
      !autoStartTriggeredRef.current
    ) {
      setAutoStartCountdown(10);
      autoStartTimerRef.current = setInterval(() => {
        setAutoStartCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (autoStartTimerRef.current) clearInterval(autoStartTimerRef.current);
            autoStartTimerRef.current = null;
            // Trigger auto-start
            if (!autoStartTriggeredRef.current) {
              autoStartTriggeredRef.current = true;
              handleStartGame();
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState?.phase !== 'round-end') {
      setAutoStartCountdown(null);
      autoStartTriggeredRef.current = false;
    }

    return () => {
      if (autoStartTimerRef.current) clearInterval(autoStartTimerRef.current);
    };
  }, [gameState?.phase, gameState?.autoStartNextRound, isHost, gameState?.currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelAutoStart = useCallback(() => {
    if (autoStartTimerRef.current) {
      clearInterval(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
    }
    setAutoStartCountdown(null);
    autoStartTriggeredRef.current = true; // prevent restart
  }, []);

  // Save game to history when game ends
  useEffect(() => {
    if (gameState?.phase === 'game-end') {
      try {
        const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
        const exists = history.some((h: { roomId: string }) => h.roomId === roomId);
        if (!exists) {
          history.unshift({
            roomId,
            roomCode,
            date: new Date().toISOString(),
            players: gameState.players.map((p: { name: string; totalScore: number }) => ({
              name: p.name,
              totalScore: p.totalScore,
            })),
            myName: playerName,
            rounds: gameState.currentRound,
          });
          localStorage.setItem('gameHistory', JSON.stringify(history.slice(0, 50)));
        }
      } catch { /* ignore */ }
    }
  }, [gameState?.phase, roomId, roomCode, playerName, gameState?.players, gameState?.currentRound]);

  if (loading && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-emerald-200 text-lg animate-pulse">{t('game.loading')}</div>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-300">{error}</p>
          <button onClick={() => router.push('/')} className="text-emerald-300 hover:text-white">
            {t('join.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  // WAITING phase - lobby
  if (gameState.phase === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">{t('lobby.title')}</h1>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 space-y-3">
              <div>
                <p className="text-xs text-emerald-300/70 uppercase tracking-wider">{t('lobby.roomCode')}</p>
                <p className="text-3xl font-mono font-bold tracking-[0.3em] text-amber-400">{roomCode}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 py-2 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  {copied ? t('lobby.copied') : t('lobby.copyCode')}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  {copied ? t('lobby.copied') : t('lobby.copyLink')}
                </button>
              </div>
            </div>
          </div>

          {/* Players list */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
            <h2 className="text-sm font-medium text-emerald-200 mb-3">
              {t('create.players')} ({gameState.players.length})
            </h2>
            <div className="space-y-2">
              {gameState.players.map((p: { id: string; name: string; isHost: boolean; isConnected: boolean }) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                    p.id === playerId ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/5'
                  }`}
                >
                  <span className="font-medium">
                    {p.name} {p.id === playerId && `(${t('game.you')})`}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.isHost && (
                      <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        {t('common.host')}
                      </span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${p.isConnected ? 'bg-green-400' : 'bg-gray-500'}`} />
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 2 - gameState.players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/30 text-center text-sm">
                  {t('lobby.waitingForPlayer')}
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={gameState.players.length < 2}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {gameState.players.length < 2 ? t('lobby.waitingForPlayers') : t('lobby.startGame')}
            </button>
          )}
          {!isHost && (
            <p className="text-emerald-300/70 text-sm">{t('lobby.waitingForHost')}</p>
          )}

          <button
            onClick={isHost ? handleEndGame : handleLeaveGame}
            className="w-full py-2.5 text-red-300/70 hover:text-red-300 text-sm font-medium transition-colors"
          >
            {isHost ? t('lobby.endGame') : t('lobby.leaveGame')}
          </button>
        </div>
      </div>
    );
  }

  // PLACING phase - active gameplay
  if (gameState.phase === 'placing') {
    return (
      <div className="min-h-screen py-2">
        <GameTable
          myId={gameState.myId}
          myHand={gameState.myHand}
          players={gameState.players}
          currentRound={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          turnTimeLimit={gameState.turnTimeLimit}
          turnStartTime={gameState.turnStartTime}
          onPlaceCards={handlePlaceCards}
          phase={gameState.phase}
          isHost={isHost}
          onEndGame={handleEndGame}
          onLeaveGame={handleLeaveGame}
        />
      </div>
    );
  }

  // ROUND-END phase
  if (gameState.phase === 'round-end') {
    const lastRound = gameState.roundSummaries[gameState.roundSummaries.length - 1];
    if (!lastRound) return null;

    return (
      <div className="min-h-screen py-4">
        <RoundSummary
          roundNumber={lastRound.roundNumber}
          playerResults={lastRound.playerResults}
          payments={lastRound.payments}
          amountPerPoint={gameState.amountPerPoint}
          myId={gameState.myId}
          onContinue={handleStartGame}
          isHost={isHost}
          onEndGame={handleEndGame}
          onLeaveGame={handleLeaveGame}
          autoStartCountdown={autoStartCountdown}
          onCancelAutoStart={cancelAutoStart}
        />
      </div>
    );
  }

  // GAME-END phase
  if (gameState.phase === 'game-end') {
    return (
      <div className="min-h-screen py-4">
        <GameSummary
          players={gameState.players}
          roundSummaries={gameState.roundSummaries}
          amountPerPoint={gameState.amountPerPoint}
          myId={gameState.myId}
          onBackToHome={() => router.push('/')}
          onExtendGame={handleExtendGame}
          isHost={isHost}
        />
      </div>
    );
  }

  return null;
}
