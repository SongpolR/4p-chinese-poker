'use client';

import PlayingCard, { EmptySlot } from './PlayingCard';
import { RANK_VALUES } from '@/lib/cards';
import { useI18n } from '@/lib/i18n';

interface Card {
  rank: string;
  suit: string;
}

const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };

function sortByRankThenSuit(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const rankDiff = (RANK_VALUES[a.rank as keyof typeof RANK_VALUES] || 0) - (RANK_VALUES[b.rank as keyof typeof RANK_VALUES] || 0);
    if (rankDiff !== 0) return rankDiff;
    return (SUIT_ORDER[a.suit] || 0) - (SUIT_ORDER[b.suit] || 0);
  });
}

interface PlayerBoardProps {
  playerName: string;
  isMe: boolean;
  front: Card[];
  middle: Card[];
  back: Card[];
  isReady: boolean;
  totalScore: number;
  small?: boolean;
  faceDown?: boolean;
  scoring?: {
    fouled: boolean;
    frontRoyalty: number;
    middleRoyalty: number;
    backRoyalty: number;
    rows: {
      front: { description: string };
      middle: { description: string };
      back: { description: string };
    };
  };
}

function Row({
  cards,
  maxCards,
  label,
  small,
  faceDown,
  royalty,
  handDesc,
}: {
  cards: Card[];
  maxCards: number;
  label: string;
  small?: boolean;
  faceDown?: boolean;
  royalty?: number;
  handDesc?: string;
}) {
  const sortedCards = sortByRankThenSuit(cards);
  const slots = [];
  for (let i = 0; i < maxCards; i++) {
    if (i < sortedCards.length) {
      slots.push(
        <PlayingCard key={i} rank={sortedCards[i].rank} suit={sortedCards[i].suit} small={small} faceDown={faceDown} />
      );
    } else {
      slots.push(<EmptySlot key={i} small={small} />);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className={`${small ? 'text-[9px] w-6' : 'text-[10px] sm:text-xs w-10'} text-white/50 font-medium shrink-0`}>
        {label}
      </span>
      <div className="flex gap-0.5 sm:gap-1">
        {slots}
      </div>
      {royalty !== undefined && royalty > 0 && (
        <span className="text-[10px] sm:text-xs text-amber-400 font-bold ml-1">+{royalty}</span>
      )}
      {handDesc && (
        <span className="text-[9px] text-white/50 ml-1 hidden sm:inline">{handDesc}</span>
      )}
    </div>
  );
}

export default function PlayerBoard({
  playerName,
  isMe,
  front,
  middle,
  back,
  isReady,
  totalScore,
  small,
  faceDown,
  scoring,
}: PlayerBoardProps) {
  const { t } = useI18n();
  return (
    <div className={`
      rounded-xl border-2 p-2 sm:p-3 space-y-1
      ${isMe ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 bg-white/10'}
      ${scoring?.fouled ? 'border-red-400 bg-red-500/20' : ''}
    `}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${small ? 'text-xs' : 'text-sm sm:text-base'} ${isMe ? 'text-blue-400' : 'text-white'}`}>
            {playerName} {isMe && `(${t('game.you')})`}
          </span>
          {isReady && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-medium">
              {t('game.ready')}
            </span>
          )}
          {scoring?.fouled && (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
              {t('game.foul')}
            </span>
          )}
        </div>
        <span className={`font-mono font-bold ${small ? 'text-xs' : 'text-sm'} ${totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalScore > 0 ? '+' : ''}{totalScore} {t('game.pts')}
        </span>
      </div>

      <Row cards={front} maxCards={3} label="Top" small={small} faceDown={faceDown}
        royalty={scoring?.frontRoyalty} handDesc={scoring?.rows.front.description} />
      <Row cards={middle} maxCards={5} label="Mid" small={small} faceDown={faceDown}
        royalty={scoring?.middleRoyalty} handDesc={scoring?.rows.middle.description} />
      <Row cards={back} maxCards={5} label="Bot" small={small} faceDown={faceDown}
        royalty={scoring?.backRoyalty} handDesc={scoring?.rows.back.description} />
    </div>
  );
}
