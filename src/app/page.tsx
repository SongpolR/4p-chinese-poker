'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoin = async () => {
    if (joinCode.length !== 6) return;

    setJoinLoading(true);
    setJoinError('');

    try {
      const res = await fetch(`/api/rooms/lookup?code=${joinCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          setJoinError(t('home.roomNotFound'));
        } else {
          const data = await res.json();
          setJoinError(data.error || 'Something went wrong');
        }
        return;
      }

      const data = await res.json();
      if (data.phase !== 'waiting') {
        setJoinError(t('home.gameInProgress'));
        return;
      }
      if (data.currentPlayers >= data.maxPlayers) {
        setJoinError(t('home.roomFull'));
        return;
      }

      router.push(`/join/${joinCode}`);
    } catch {
      setJoinError(t('home.connectionError'));
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            <span className="text-red-500">Chinese</span>{' '}
            <span className="text-white">Poker</span>
          </h1>
          <p className="text-sm text-emerald-400/70 mt-1">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Decorative cards */}
        <div className="flex justify-center gap-2 py-4">
          {['A♠', 'K♥', 'Q♦', 'J♣'].map((card, i) => (
            <div
              key={i}
              className="w-14 h-20 bg-white rounded-lg shadow-xl flex items-center justify-center font-bold text-lg border-2 border-gray-100 transform hover:scale-110 transition-transform"
              style={{ transform: `rotate(${(i - 1.5) * 8}deg)` }}
            >
              <span className={card.includes('♥') || card.includes('♦') ? 'text-red-600' : 'text-gray-900'}>
                {card}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/room/create')}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
          >
            {t('home.createGame')}
          </button>

          {!showJoin ? (
            <button
              onClick={() => { setShowJoin(true); setJoinError(''); }}
              className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg backdrop-blur border border-white/20 active:scale-[0.98] transition-all"
            >
              {t('home.joinGame')}
            </button>
          ) : (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 space-y-3">
              <input
                type="text"
                placeholder={t('home.enterCode')}
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  setJoinError('');
                }}
                maxLength={6}
                className={`w-full py-3 px-4 bg-white/10 rounded-xl text-white placeholder-white/50 text-center text-xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 ${
                  joinError ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-amber-400'
                }`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && joinCode.length === 6 && handleJoin()}
              />
              {joinError && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-3 py-2 rounded-xl">
                  {joinError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowJoin(false); setJoinError(''); setJoinCode(''); }}
                  className="flex-1 py-2.5 bg-white/10 text-white/70 rounded-xl font-medium"
                >
                  {t('home.cancel')}
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length !== 6 || joinLoading}
                  className="flex-1 py-2.5 bg-amber-500 text-gray-900 rounded-xl font-bold disabled:opacity-40 hover:bg-amber-400 active:scale-[0.98] transition-all"
                >
                  {joinLoading ? t('home.checking') : t('home.join')}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/history')}
            className="w-full py-3 text-emerald-300/70 hover:text-emerald-200 text-sm font-medium transition-colors"
          >
            {t('home.viewHistory')}
          </button>
        </div>
      </div>
    </div>
  );
}
