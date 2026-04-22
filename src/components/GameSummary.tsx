'use client';

import { useI18n } from '@/lib/i18n';

interface GameSummaryProps {
  players: {
    id: string;
    name: string;
    totalScore: number;
    roundScores: number[];
    isHost?: boolean;
  }[];
  roundSummaries: {
    roundNumber: number;
    payments: {
      from: string;
      to: string;
      fromName: string;
      toName: string;
      points: number;
      amount: number;
    }[];
  }[];
  amountPerPoint: number;
  myId: string;
  onBackToHome: () => void;
  onExtendGame?: (addRounds: number) => void;
  isHost?: boolean;
}

export default function GameSummary({
  players,
  roundSummaries,
  amountPerPoint,
  myId,
  onBackToHome,
  onExtendGame,
  isHost,
}: GameSummaryProps) {
  const { t } = useI18n();
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];

  // Calculate total payments per player
  const netPayments = new Map<string, number>();
  players.forEach(p => netPayments.set(p.id, 0));

  for (const round of roundSummaries) {
    for (const payment of round.payments) {
      netPayments.set(payment.from, (netPayments.get(payment.from) || 0) - payment.amount);
      netPayments.set(payment.to, (netPayments.get(payment.to) || 0) + payment.amount);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">{t('summary.gameOver')}</h1>
        <div className="text-4xl">&#127942;</div>
        <p className="text-xl font-bold text-amber-400">{winner.name} {t('summary.wins')}</p>
        <p className="text-sm text-white/50">{winner.totalScore} {t('summary.totalPoints')}</p>
      </div>

      {/* Final standings */}
      <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 overflow-hidden">
        <div className="bg-white/5 px-4 py-2 font-bold text-sm text-emerald-200">{t('summary.finalStandings')}</div>
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 border-t border-white/10 ${
              p.id === myId ? 'bg-blue-500/20' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`
                w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm
                ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : 'bg-white/10 text-white/50'}
              `}>
                {i + 1}
              </span>
              <span className="font-medium text-white">{p.name} {p.id === myId && `(${t('game.you')})`}</span>
            </div>
            <div className="text-right">
              <div className={`font-bold ${p.totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {p.totalScore > 0 ? '+' : ''}{p.totalScore} {t('game.pts')}
              </div>
              {amountPerPoint > 0 && (
                <div className={`text-xs ${(netPayments.get(p.id) || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(netPayments.get(p.id) || 0) >= 0 ? '+' : ''}{t('common.currency')}{(netPayments.get(p.id) || 0).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Round-by-round breakdown */}
      <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 overflow-hidden">
        <div className="bg-white/5 px-4 py-2 font-bold text-sm text-emerald-200">{t('summary.roundBreakdown')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left text-white/50">{t('summary.player')}</th>
                {sorted[0].roundScores.map((_, i) => (
                  <th key={i} className="px-2 py-2 text-center text-white/50">R{i + 1}</th>
                ))}
                <th className="px-3 py-2 text-right text-white/50">{t('summary.total')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id} className={`border-b border-white/10 last:border-0 ${p.id === myId ? 'bg-blue-500/20' : ''}`}>
                  <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                  {p.roundScores.map((s, i) => (
                    <td key={i} className={`px-2 py-2 text-center font-mono ${s >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {s > 0 ? '+' : ''}{s}
                    </td>
                  ))}
                  <td className={`px-3 py-2 text-right font-bold ${p.totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {p.totalScore > 0 ? '+' : ''}{p.totalScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total payment settlement */}
      {amountPerPoint > 0 && (
        <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-4 space-y-2">
          <h3 className="font-bold text-sm text-amber-400 text-center">{t('summary.settlement')}</h3>
          {sorted.map(p => {
            const net = netPayments.get(p.id) || 0;
            if (net === 0) return null;
            return (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="font-medium text-white">{p.name}</span>
                <span className={`font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {net >= 0 ? t('summary.receives') : t('summary.pays')} {t('common.currency')}{Math.abs(net).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isHost && onExtendGame && (
        <div className="bg-white/10 rounded-xl p-4 space-y-2">
          <p className="text-sm text-emerald-200 text-center font-medium">{t('summary.keepPlaying')}</p>
          <div className="flex gap-2">
            {[3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => onExtendGame(n)}
                className="flex-1 py-2 bg-amber-500 text-gray-900 rounded-xl font-bold text-sm hover:bg-amber-400 active:scale-95 transition-all"
              >
                +{n} {t('summary.rounds')}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onBackToHome}
        className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 active:scale-[0.98] transition-all"
      >
        {t('summary.backToHome')}
      </button>
    </div>
  );
}
