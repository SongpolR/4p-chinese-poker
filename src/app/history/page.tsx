'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

interface GameRecord {
  roomId: string;
  roomCode: string;
  date: string;
  players: { name: string; totalScore: number }[];
  myName: string;
  rounds: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [history, setHistory] = useState<GameRecord[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('gameHistory') || '[]');
      setHistory(stored);
    } catch {
      setHistory([]);
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('gameHistory');
    setHistory([]);
  };

  return (
    <div className="min-h-screen p-4 pt-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <button onClick={() => router.push('/')} className="text-emerald-300/70 text-sm hover:text-white mb-4 inline-block">
            &larr; {t('create.back')}
          </button>
          <h1 className="text-2xl font-bold">{t('history.title')}</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center text-emerald-300/50 py-12">
            <p className="text-lg">{t('history.noGames')}</p>
            <p className="text-sm mt-2">{t('history.noGamesDesc')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {history.map((game, i) => {
                const sorted = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
                const winner = sorted[0];
                const myResult = game.players.find(p => p.name === game.myName);

                return (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-300/60">
                        {new Date(game.date).toLocaleDateString()} - Room {game.roomCode}
                      </span>
                      <span className="text-xs text-emerald-300/60">
                        {game.rounds} {t('history.rounds')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-amber-400">
                        {t('history.winner')}: {winner.name}
                      </span>
                      {myResult && (
                        <span className={`font-mono font-bold ${myResult.totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {myResult.totalScore > 0 ? '+' : ''}{myResult.totalScore} pts
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {sorted.map((p, j) => (
                        <span
                          key={j}
                          className={`text-xs px-2 py-1 rounded-full ${
                            p.name === game.myName ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {p.name}: {p.totalScore > 0 ? '+' : ''}{p.totalScore}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={clearHistory}
              className="w-full py-2 text-red-300/60 hover:text-red-300 text-sm transition-colors"
            >
              {t('history.clearHistory')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
