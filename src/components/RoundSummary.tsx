'use client';

import PlayerBoard from './PlayerBoard';
import { useI18n } from '@/lib/i18n';

interface RoundSummaryProps {
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
      frontRoyalty: number;
      middleRoyalty: number;
      backRoyalty: number;
      totalRoyalty: number;
      fantasyland: boolean;
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
  amountPerPoint: number;
  myId: string;
  onContinue?: () => void;
  isHost: boolean;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
  autoStartCountdown?: number | null;
  onCancelAutoStart?: () => void;
}

export default function RoundSummary({
  roundNumber,
  playerResults,
  payments,
  amountPerPoint,
  myId,
  onContinue,
  isHost,
  onEndGame,
  onLeaveGame,
  autoStartCountdown,
  onCancelAutoStart,
}: RoundSummaryProps) {
  const { t } = useI18n();
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold text-center text-white">
        {t('round.results', { n: roundNumber })}
      </h2>

      {/* Player boards with scoring */}
      <div className="space-y-3">
        {playerResults
          .sort((a, b) => b.roundPoints - a.roundPoints)
          .map((result) => (
          <div key={result.playerId} className="space-y-1">
            <PlayerBoard
              playerName={result.playerName}
              isMe={result.playerId === myId}
              front={result.board.front}
              middle={result.board.middle}
              back={result.board.back}
              isReady={false}
              totalScore={result.roundPoints}
              scoring={result.scoring}
            />
            {result.scoring.fantasyland && (
              <div className="text-center text-amber-400 font-bold text-xs bg-amber-500/20 rounded-lg py-1">
                {t('round.fantasyland')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment summary */}
      {amountPerPoint > 0 && payments.length > 0 && (
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 space-y-2 border border-white/20">
          <h3 className="font-bold text-sm text-emerald-200 text-center">{t('round.payments')}</h3>
          {payments.map((p, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                p.from === myId ? 'bg-red-500/20' : p.to === myId ? 'bg-green-500/20' : 'bg-white/5'
              }`}
            >
              <span>
                <span className="font-medium text-white">{p.fromName}</span>
                <span className="text-white/40 mx-2">&rarr;</span>
                <span className="font-medium text-white">{p.toName}</span>
              </span>
              <span className="font-bold text-white">
                {p.points} {t('game.pts')} = {amountPerPoint > 0 ? `$${p.amount.toFixed(2)}` : `${p.points} ${t('game.pts')}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Points summary (when no money) */}
      {(amountPerPoint === 0 || payments.length === 0) && (
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 space-y-2 border border-white/20">
          <h3 className="font-bold text-sm text-emerald-200 text-center">{t('round.roundPoints')}</h3>
          {playerResults
            .sort((a, b) => b.roundPoints - a.roundPoints)
            .map((r) => (
            <div key={r.playerId} className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
              r.playerId === myId ? 'bg-blue-500/20' : 'bg-white/5'
            }`}>
              <span className="font-medium text-white">{r.playerName}</span>
              <span className={`font-bold ${r.roundPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {r.roundPoints > 0 ? '+' : ''}{r.roundPoints}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Auto-start countdown */}
      {autoStartCountdown != null && (
        <div className="flex items-center justify-center gap-3 py-2">
          <span className="text-amber-400 font-medium text-sm animate-pulse">
            {t('round.autoStart', { n: autoStartCountdown })}
          </span>
          {onCancelAutoStart && (
            <button
              onClick={onCancelAutoStart}
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white/70 transition-colors"
            >
              {t('round.cancelAutoStart')}
            </button>
          )}
        </div>
      )}

      {/* Continue button (host only) */}
      {isHost && onContinue && !autoStartCountdown && (
        <button
          onClick={onContinue}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          {t('round.nextRound')}
        </button>
      )}
      {!isHost && onContinue && !autoStartCountdown && (
        <p className="text-center text-gray-500 text-sm">{t('round.waitingForHost')}</p>
      )}

      {/* End / Leave game */}
      <button
        onClick={isHost ? onEndGame : onLeaveGame}
        className="w-full py-2.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
      >
        {isHost ? t('game.endGame') : t('game.leaveGame')}
      </button>
    </div>
  );
}
