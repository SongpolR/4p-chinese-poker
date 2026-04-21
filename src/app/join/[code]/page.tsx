'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

interface RoomInfo {
  roomCode: string;
  hostName: string;
  maxPlayers: number;
  currentPlayers: number;
  requiresPin: boolean;
  phase: string;
}

export default function JoinRoom({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [playerName, setPlayerName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [checkingRoom, setCheckingRoom] = useState(true);

  useEffect(() => {
    async function checkRoom() {
      setCheckingRoom(true);
      try {
        const res = await fetch(`/api/rooms/lookup?code=${code}`);
        if (!res.ok) {
          setRoomNotFound(true);
          return;
        }
        const data: RoomInfo = await res.json();
        setRoomInfo(data);

        if (data.phase !== 'waiting') {
          setError(t('home.gameInProgress'));
        } else if (data.currentPlayers >= data.maxPlayers) {
          setError(t('home.roomFull'));
        }
      } catch {
        setRoomNotFound(true);
      } finally {
        setCheckingRoom(false);
      }
    }
    checkRoom();
  }, [code, t]);

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError(t('create.nameRequired'));
      return;
    }
    if (roomInfo?.requiresPin && pinCode.length !== 4) {
      setPinError(t('join.enterPinFull'));
      return;
    }

    setLoading(true);
    setError('');
    setPinError('');

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          playerName: playerName.trim(),
          pinCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setPinError(t('join.incorrectPin'));
          setPinCode('');
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setRoomNotFound(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      sessionStorage.setItem('playerId', data.playerId);
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('roomId', data.roomId);
      sessionStorage.setItem('roomCode', data.roomCode);

      router.push(`/game/${data.roomId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  if (roomNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-6 space-y-3">
            <div className="text-4xl">&#10060;</div>
            <h1 className="text-xl font-bold text-red-200">{t('join.roomNotFound')}</h1>
            <p className="text-red-300/80 text-sm">
              {t('join.roomNotFoundDesc')} <span className="font-mono font-bold text-white tracking-wider">{code}</span>.
              {' '}{t('join.checkCode')}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
          >
            {t('join.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  if (checkingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-emerald-200 text-lg animate-pulse">{t('join.checkingRoom')}</div>
      </div>
    );
  }

  const canJoin = roomInfo && roomInfo.phase === 'waiting' && roomInfo.currentPlayers < roomInfo.maxPlayers;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div>
          <button onClick={() => router.push('/')} className="text-emerald-300/70 text-sm hover:text-white mb-4 inline-block">
            &larr; {t('create.back')}
          </button>
          <h1 className="text-2xl font-bold">{t('join.title')}</h1>
          <p className="text-emerald-300/70 mt-1">
            {t('join.room')}: <span className="font-mono font-bold text-white tracking-wider">{code}</span>
          </p>
        </div>

        {roomInfo && (
          <div className="bg-white/5 rounded-xl p-3 text-sm text-emerald-200/80 space-y-1">
            <p>{t('join.host')}: <span className="text-white font-medium">{roomInfo.hostName}</span></p>
            <p>{t('join.playerCount')}: <span className="text-white font-medium">{roomInfo.currentPlayers}/{roomInfo.maxPlayers}</span></p>
            {roomInfo.requiresPin && (
              <p className="text-amber-300/80">{t('join.pinRequired')}</p>
            )}
          </div>
        )}

        {canJoin && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 space-y-4">
            <div>
              <label className="block text-sm font-medium text-emerald-200 mb-1">{t('create.yourName')}</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                placeholder={t('create.enterName')}
                maxLength={20}
                className="w-full py-2.5 px-4 bg-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            {roomInfo.requiresPin && (
              <div>
                <label className="block text-sm font-medium text-emerald-200 mb-1">{t('join.accessPin')}</label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => {
                    setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinError('');
                  }}
                  placeholder={t('join.enterPin')}
                  maxLength={4}
                  inputMode="numeric"
                  className={`w-full py-2.5 px-4 bg-white/10 rounded-xl text-white placeholder-white/40 text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 ${
                    pinError ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-amber-400'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                {pinError && (
                  <p className="text-red-300 text-sm mt-1.5">{pinError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-2 rounded-xl">
            {error}
          </div>
        )}

        {canJoin && (
          <button
            onClick={handleJoin}
            disabled={loading || !playerName.trim() || (roomInfo.requiresPin && pinCode.length !== 4)}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? t('join.joining') : t('join.joinRoom')}
          </button>
        )}

        {!canJoin && !checkingRoom && (
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
          >
            {t('join.backToHome')}
          </button>
        )}
      </div>
    </div>
  );
}
