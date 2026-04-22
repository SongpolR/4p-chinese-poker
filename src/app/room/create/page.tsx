'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function CreateRoom() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [hostName, setHostName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [totalRounds, setTotalRounds] = useState(0);
  const [turnTimeLimit, setTurnTimeLimit] = useState(0);
  const [gameTimeLimitHours, setGameTimeLimitHours] = useState(1);
  const [amountPerPoint, setAmountPerPoint] = useState(0);
  const [pinCode, setPinCode] = useState('');
  const [autoStartNextRound, setAutoStartNextRound] = useState(false);

  const handleCreate = async () => {
    if (!hostName.trim()) {
      setError(t('create.nameRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: hostName.trim(),
          maxPlayers,
          totalRounds,
          turnTimeLimit,
          gameTimeLimit: gameTimeLimitHours * 60,
          amountPerPoint,
          pinCode,
          autoStartNextRound,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem('playerId', data.playerId);
      sessionStorage.setItem('playerName', hostName.trim());
      sessionStorage.setItem('roomId', data.roomId);
      sessionStorage.setItem('roomCode', data.roomCode);

      router.push(`/game/${data.roomId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8 sm:pt-16">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <button onClick={() => router.push('/')} className="text-emerald-300/70 text-sm hover:text-white mb-4 inline-block">
            &larr; {t('create.back')}
          </button>
          <h1 className="text-2xl font-bold">{t('create.title')}</h1>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 space-y-4">
          {/* Host name */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1">{t('create.yourName')}</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder={t('create.enterName')}
              maxLength={20}
              className="w-full py-2.5 px-4 bg-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
          </div>

          {/* Number of players */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1">{t('create.players')}</label>
            <div className="flex gap-2">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                    maxPlayers === n
                      ? 'bg-amber-500 text-gray-900'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Number of rounds */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1">
              {t('create.rounds')}: {totalRounds === 0 ? t('create.unlimited') : totalRounds}
            </label>
            <input
              type="range"
              min={0}
              max={20}
              value={totalRounds}
              onChange={(e) => setTotalRounds(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>{t('create.noLimit')}</span><span>10</span><span>20</span>
            </div>
          </div>

          {/* Turn time limit */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1">
              {t('create.turnTimeLimit')}: {turnTimeLimit === 0 ? t('create.unlimited') : `${turnTimeLimit}s`}
            </label>
            <input
              type="range"
              min={0}
              max={120}
              step={10}
              value={turnTimeLimit}
              onChange={(e) => setTurnTimeLimit(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>{t('create.noLimit')}</span><span>60s</span><span>120s</span>
            </div>
          </div>

          {/* Game time limit */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1">
              {t('create.gameTimeLimit')}: {gameTimeLimitHours === 0 ? t('create.unlimited') : `${gameTimeLimitHours} ${t('create.hours')}`}
            </label>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={gameTimeLimitHours}
              onChange={(e) => setGameTimeLimitHours(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>{t('create.noLimit')}</span><span>4 {t('create.hours')}</span><span>8 {t('create.hours')}</span>
            </div>
          </div>

          {/* Amount per point */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1">{t('create.amountPerPoint')}</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={amountPerPoint}
              onChange={(e) => setAmountPerPoint(parseFloat(e.target.value) || 0)}
              placeholder={t('create.justForFun')}
              className="w-full py-2.5 px-4 bg-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Auto-start next round */}
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setAutoStartNextRound(!autoStartNextRound)}
          >
            <div>
              <p className="text-sm font-medium text-emerald-200">{t('create.autoStart')}</p>
              <p className="text-xs text-white/40">{t('create.autoStartDesc')}</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${autoStartNextRound ? 'bg-amber-500' : 'bg-white/20'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoStartNextRound ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>

          {/* PIN code */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1">{t('create.pinCode')}</label>
            <input
              type="text"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={t('create.pinPlaceholder')}
              maxLength={4}
              inputMode="numeric"
              className="w-full py-2.5 px-4 bg-white/10 rounded-xl text-white placeholder-white/40 text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-2 rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? t('create.creating') : t('create.createRoom')}
        </button>
      </div>
    </div>
  );
}
