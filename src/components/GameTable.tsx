'use client';

import { useState, useCallback, useEffect, useRef, useMemo, DragEvent } from 'react';
import PlayingCard, { EmptySlot } from './PlayingCard';
import PlayerBoard from './PlayerBoard';
import { RANK_VALUES, SUITS } from '@/lib/cards';
import { evaluateHand3, evaluateHand5 } from '@/lib/handEvaluator';
import { getFrontRoyalty, getMiddleRoyalty, getBackRoyalty, isFouled as checkFouled } from '@/lib/scoring';
import { useI18n } from '@/lib/i18n';

interface Card {
  rank: string;
  suit: string;
}

interface PlayerData {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  totalScore: number;
  board: { front: Card[]; middle: Card[]; back: Card[] };
  cardCount: number;
}

type Row = 'front' | 'middle' | 'back';
type SortMode = 'rank' | 'suit' | 'ranksuit';

interface GameTableProps {
  myId: string;
  myHand: Card[];
  players: PlayerData[];
  currentRound: number;
  totalRounds: number;
  turnTimeLimit: number;
  turnStartTime: number | null;
  onPlaceCards: (placements: { card: Card; row: Row }[]) => void;
  phase: string;
  isHost: boolean;
  onEndGame?: () => void;
  onLeaveGame?: () => void;
}

const ROW_MAX: Record<Row, number> = { front: 3, middle: 5, back: 5 };
const ROW_LABELS: Record<Row, string> = { front: 'Top (3)', middle: 'Mid (5)', back: 'Bot (5)' };
const SUIT_ORDER: Record<string, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };

function cardKey(c: Card) {
  return `${c.rank}_${c.suit}`;
}

function sameCard(a: Card, b: Card) {
  return a.rank === b.rank && a.suit === b.suit;
}

export default function GameTable({
  myId,
  myHand,
  players,
  currentRound,
  totalRounds,
  turnTimeLimit,
  turnStartTime,
  onPlaceCards,
  phase,
  isHost,
  onEndGame,
  onLeaveGame,
}: GameTableProps) {
  const { t } = useI18n();
  const me = players.find(p => p.id === myId);
  const others = players.filter(p => p.id !== myId);
  const amReady = me?.isReady;

  // Local placement state
  const [localBoard, setLocalBoard] = useState<Record<Row, Card[]>>({ front: [], middle: [], back: [] });
  const [localHand, setLocalHand] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedFrom, setSelectedFrom] = useState<'hand' | Row>('hand');
  const [dragOverRow, setDragOverRow] = useState<Row | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('sortMode') as SortMode) || 'ranksuit';
    }
    return 'ranksuit';
  });

  const [autoSort, setAutoSort] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autoSort') === 'true';
    }
    return false;
  });

  // Sort functions for different modes
  const sortCardsByMode = useCallback((cards: Card[], mode: SortMode) => {
    return [...cards].sort((a, b) => {
      const rankA = RANK_VALUES[a.rank as keyof typeof RANK_VALUES] || 0;
      const rankB = RANK_VALUES[b.rank as keyof typeof RANK_VALUES] || 0;
      const suitA = SUIT_ORDER[a.suit] ?? 0;
      const suitB = SUIT_ORDER[b.suit] ?? 0;

      if (mode === 'rank') {
        if (rankA !== rankB) return rankA - rankB;
        return suitA - suitB;
      }
      if (mode === 'suit') {
        if (suitA !== suitB) return suitA - suitB;
        return rankA - rankB;
      }
      // ranksuit
      if (rankA !== rankB) return rankA - rankB;
      return suitA - suitB;
    });
  }, []);

  // Sort for display of placed cards (always rank then suit)
  const sortForDisplay = useCallback((cards: Card[]) => {
    return [...cards].sort((a, b) => {
      const rankDiff = (RANK_VALUES[a.rank as keyof typeof RANK_VALUES] || 0) - (RANK_VALUES[b.rank as keyof typeof RANK_VALUES] || 0);
      if (rankDiff !== 0) return rankDiff;
      return (SUIT_ORDER[a.suit] ?? 0) - (SUIT_ORDER[b.suit] ?? 0);
    });
  }, []);

  // Sync local hand from server when hand changes (new round / reconnect)
  useEffect(() => {
    if (myHand.length > 0 && !amReady) {
      const totalLocal = localHand.length + localBoard.front.length + localBoard.middle.length + localBoard.back.length;
      if (totalLocal === 0 || totalLocal !== myHand.length) {
        setLocalHand(autoSort ? sortCardsByMode(myHand, sortMode) : [...myHand]);
        setLocalBoard({ front: [], middle: [], back: [] });
        setSelectedCard(null);
      }
    }
  }, [myHand, amReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPlacing = phase === 'placing' && !amReady && localHand.length + localBoard.front.length + localBoard.middle.length + localBoard.back.length > 0;

  const handleSortHand = useCallback((mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem('sortMode', mode);
    setLocalHand(prev => sortCardsByMode(prev, mode));
  }, [sortCardsByMode]);

  const toggleAutoSort = useCallback(() => {
    setAutoSort(prev => {
      const next = !prev;
      localStorage.setItem('autoSort', String(next));
      if (next) {
        setLocalHand(h => sortCardsByMode(h, sortMode));
      }
      return next;
    });
  }, [sortCardsByMode, sortMode]);

  // --- Auto-submit on timer expiry ---
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    autoSubmittedRef.current = false;
  }, [turnStartTime]);

  useEffect(() => {
    if (!turnTimeLimit || !turnStartTime || amReady || autoSubmittedRef.current) return;

    const elapsed = (Date.now() - turnStartTime) / 1000;
    const remaining = turnTimeLimit - elapsed;

    if (remaining <= 0) {
      autoSubmittedRef.current = true;

      let hand = [...localHand];
      const board = { ...localBoard, front: [...localBoard.front], middle: [...localBoard.middle], back: [...localBoard.back] };

      for (const row of ['back', 'middle', 'front'] as Row[]) {
        while (board[row].length < ROW_MAX[row] && hand.length > 0) {
          board[row].push(hand.shift()!);
        }
      }

      if (hand.length === 0) {
        const placements: { card: Card; row: Row }[] = [];
        for (const row of ['front', 'middle', 'back'] as Row[]) {
          for (const card of board[row]) {
            placements.push({ card, row });
          }
        }
        onPlaceCards(placements);
      }
      return;
    }

    const timer = setTimeout(() => {
      if (autoSubmittedRef.current || amReady) return;
      autoSubmittedRef.current = true;

      let hand = [...localHand];
      const board = { ...localBoard, front: [...localBoard.front], middle: [...localBoard.middle], back: [...localBoard.back] };

      for (const row of ['back', 'middle', 'front'] as Row[]) {
        while (board[row].length < ROW_MAX[row] && hand.length > 0) {
          board[row].push(hand.shift()!);
        }
      }

      if (hand.length === 0) {
        const placements: { card: Card; row: Row }[] = [];
        for (const row of ['front', 'middle', 'back'] as Row[]) {
          for (const card of board[row]) {
            placements.push({ card, row });
          }
        }
        onPlaceCards(placements);
      }
    }, remaining * 1000);

    return () => clearTimeout(timer);
  }, [turnTimeLimit, turnStartTime, amReady, localHand, localBoard, onPlaceCards]);

  // --- Card placement logic ---

  const placeCardInRow = useCallback((card: Card, fromSource: 'hand' | Row, toRow: Row) => {
    if (localBoard[toRow].length >= ROW_MAX[toRow]) return;

    setLocalBoard(prev => {
      const next = { ...prev };
      if (fromSource !== 'hand' && fromSource !== toRow) {
        next[fromSource] = prev[fromSource].filter(c => !sameCard(c, card));
      }
      next[toRow] = [...prev[toRow], card];
      return next;
    });

    if (fromSource === 'hand') {
      setLocalHand(prev => {
        const idx = prev.findIndex(c => sameCard(c, card));
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
    }

    setSelectedCard(null);
  }, [localBoard]);

  const removeCardFromRow = useCallback((card: Card, row: Row) => {
    setLocalBoard(prev => ({
      ...prev,
      [row]: prev[row].filter(c => !sameCard(c, card)),
    }));
    setLocalHand(prev => autoSort ? sortCardsByMode([...prev, card], sortMode) : [...prev, card]);
    setSelectedCard(null);
  }, [autoSort, sortCardsByMode, sortMode]);

  const handleCardClick = useCallback((card: Card, source: 'hand' | Row) => {
    if (amReady) return;

    if (source !== 'hand') {
      removeCardFromRow(card, source);
      return;
    }

    if (selectedCard && sameCard(selectedCard, card)) {
      setSelectedCard(null);
      return;
    }

    setSelectedCard(card);
    setSelectedFrom(source);
  }, [selectedCard, amReady, removeCardFromRow]);

  const handleRowClick = useCallback((row: Row) => {
    if (!selectedCard || amReady) return;
    placeCardInRow(selectedCard, selectedFrom, row);
  }, [selectedCard, selectedFrom, amReady, placeCardInRow]);

  // --- Drag and Drop ---

  const handleDragStart = useCallback((e: DragEvent, card: Card, source: 'hand' | Row) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ card, source }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: DragEvent, row: Row) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRow(row);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverRow(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent, toRow: Row) => {
    e.preventDefault();
    setDragOverRow(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const card: Card = data.card;
      const source: 'hand' | Row = data.source;
      placeCardInRow(card, source, toRow);
    } catch { /* ignore */ }
  }, [placeCardInRow]);

  const handleDropToHand = useCallback((e: DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const card: Card = data.card;
      const source: 'hand' | Row = data.source;
      if (source !== 'hand') {
        removeCardFromRow(card, source);
      }
    } catch { /* ignore */ }
  }, [removeCardFromRow]);

  // --- Actions ---

  const handleConfirm = useCallback(() => {
    if (localHand.length > 0) return;
    if (localBoard.front.length !== 3 || localBoard.middle.length !== 5 || localBoard.back.length !== 5) return;

    const placements: { card: Card; row: Row }[] = [];
    for (const row of ['front', 'middle', 'back'] as Row[]) {
      for (const card of localBoard[row]) {
        placements.push({ card, row });
      }
    }
    onPlaceCards(placements);
  }, [localHand, localBoard, onPlaceCards]);

  const handleClearAll = useCallback(() => {
    const allCards = [
      ...localBoard.front,
      ...localBoard.middle,
      ...localBoard.back,
    ];
    setLocalHand(prev => autoSort ? sortCardsByMode([...prev, ...allCards], sortMode) : [...prev, ...allCards]);
    setLocalBoard({ front: [], middle: [], back: [] });
    setSelectedCard(null);
  }, [localBoard, autoSort, sortCardsByMode, sortMode]);

  const allPlaced = localHand.length === 0 &&
    localBoard.front.length === 3 &&
    localBoard.middle.length === 5 &&
    localBoard.back.length === 5;

  // Display board = server board + local placements, sorted for display
  const displayBoard = {
    front: sortForDisplay(me ? [...me.board.front, ...localBoard.front] : localBoard.front),
    middle: sortForDisplay(me ? [...me.board.middle, ...localBoard.middle] : localBoard.middle),
    back: sortForDisplay(me ? [...me.board.back, ...localBoard.back] : localBoard.back),
  };

  // Calculate royalties for complete rows
  const rowRoyalties = useMemo(() => {
    const result: Record<Row, { royalty: number; desc: string }> = {
      front: { royalty: 0, desc: '' },
      middle: { royalty: 0, desc: '' },
      back: { royalty: 0, desc: '' },
    };

    try {
      const frontCards = displayBoard.front;
      const middleCards = displayBoard.middle;
      const backCards = displayBoard.back;

      if (frontCards.length === 3) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hand = evaluateHand3(frontCards as any);
        result.front = { royalty: getFrontRoyalty(hand, frontCards as any), desc: hand.description };
      }
      if (middleCards.length === 5) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hand = evaluateHand5(middleCards as any);
        result.middle = { royalty: getMiddleRoyalty(hand), desc: hand.description };
      }
      if (backCards.length === 5) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hand = evaluateHand5(backCards as any);
        result.back = { royalty: getBackRoyalty(hand), desc: hand.description };
      }
    } catch { /* incomplete rows */ }

    return result;
  }, [displayBoard.front, displayBoard.middle, displayBoard.back]);

  // Check foul when all rows are complete
  const isBoardFouled = useMemo(() => {
    if (displayBoard.front.length !== 3 || displayBoard.middle.length !== 5 || displayBoard.back.length !== 5) return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const front = evaluateHand3(displayBoard.front as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const middle = evaluateHand5(displayBoard.middle as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const back = evaluateHand5(displayBoard.back as any);
      return checkFouled({ front, middle, back });
    } catch { return false; }
  }, [displayBoard.front, displayBoard.middle, displayBoard.back]);

  // Sort mode label
  const sortModeLabel = (mode: SortMode) => {
    if (mode === 'rank') return t('game.sortRank');
    if (mode === 'suit') return t('game.sortSuit');
    return t('game.sortRankSuit');
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto gap-2 sm:gap-3 p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-emerald-200">
          {t('game.round')} {currentRound}/{totalRounds}
        </span>
        <span className="text-emerald-300/60">
          {localHand.length} {t('game.cardsInHand')}
        </span>
        <div className="flex items-center gap-2">
          {turnTimeLimit > 0 && turnStartTime && (
            <Timer startTime={turnStartTime} limit={turnTimeLimit} />
          )}
          <button
            onClick={() => setShowMenu(m => !m)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 text-lg transition-colors"
          >
            &#8942;
          </button>
        </div>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden text-sm">
          {isHost && onEndGame && (
            <button
              onClick={() => { setShowMenu(false); onEndGame(); }}
              className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors"
            >
              {t('game.endGame')}
            </button>
          )}
          {!isHost && onLeaveGame && (
            <button
              onClick={() => { setShowMenu(false); onLeaveGame(); }}
              className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors"
            >
              {t('game.leaveGame')}
            </button>
          )}
          <button
            onClick={() => setShowMenu(false)}
            className="w-full text-left px-4 py-3 text-gray-400 hover:bg-gray-700 transition-colors"
          >
            {t('game.cancel')}
          </button>
        </div>
      )}

      {/* Other players boards — face-down during placing phase */}
      <div className={`grid gap-2 ${others.length === 1 ? 'grid-cols-1' : others.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {others.map(p => (
          <PlayerBoard
            key={p.id}
            playerName={p.name}
            isMe={false}
            front={p.board.front}
            middle={p.board.middle}
            back={p.board.back}
            isReady={p.isReady}
            totalScore={p.totalScore}
            small={others.length > 1}
            faceDown={phase === 'placing'}
          />
        ))}
      </div>

      {/* My board — interactive drop zones */}
      {me && (
        <div className="space-y-1">
          <div className={`
            rounded-xl border-2 p-2 sm:p-3 space-y-1.5
            ${isBoardFouled ? 'border-red-400 bg-red-500/20' : 'border-blue-500 bg-blue-500/20'}
          `}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-blue-400">
                  {me.name} ({t('game.you')})
                </span>
                {isBoardFouled && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                    {t('game.foul')}
                  </span>
                )}
              </div>
              <span className={`font-mono font-bold text-sm ${me.totalScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {me.totalScore > 0 ? '+' : ''}{me.totalScore} {t('game.pts')}
              </span>
            </div>

            {/* Interactive rows with royalties */}
            {(['front', 'middle', 'back'] as Row[]).map(row => {
              const maxCards = ROW_MAX[row];
              const cards = displayBoard[row];
              const isFull = cards.length >= maxCards;
              const isDropTarget = dragOverRow === row && !isFull;
              const canClick = !!selectedCard && !isFull;
              const royaltyInfo = rowRoyalties[row];

              return (
                <div
                  key={row}
                  onClick={() => canClick && handleRowClick(row)}
                  onDragOver={(e) => !isFull && handleDragOver(e, row)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => !isFull && handleDrop(e, row)}
                  className={`
                    flex items-center gap-1 rounded-lg p-1 transition-all
                    ${isDropTarget ? 'bg-yellow-500/20 ring-2 ring-yellow-400' : ''}
                    ${canClick ? 'cursor-pointer hover:bg-blue-500/20' : ''}
                  `}
                >
                  <span className="text-[10px] sm:text-xs w-10 text-white/50 font-medium shrink-0">
                    {ROW_LABELS[row].split(' ')[0]}
                    <span className="text-white/40 ml-0.5">
                      {cards.length}/{maxCards}
                    </span>
                  </span>
                  <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: maxCards }).map((_, i) => {
                      if (i < cards.length) {
                        const card = cards[i];
                        const isLocalCard = localBoard[row].some(c => sameCard(c, card));
                        return (
                          <PlayingCard
                            key={cardKey(card)}
                            rank={card.rank}
                            suit={card.suit}
                            small={false}
                            onClick={isLocalCard && !amReady ? () => handleCardClick(card, row) : undefined}
                            draggable={isLocalCard && !amReady}
                            onDragStart={isLocalCard ? (e) => handleDragStart(e, card, row) : undefined}
                          />
                        );
                      }
                      return (
                        <EmptySlot
                          key={`empty-${i}`}
                          highlight={isDropTarget || canClick}
                        />
                      );
                    })}
                  </div>
                  {/* Row royalty and hand description */}
                  {royaltyInfo.royalty > 0 && (
                    <span className="text-[10px] sm:text-xs text-amber-400 font-bold ml-1 shrink-0">+{royaltyInfo.royalty}</span>
                  )}
                  {royaltyInfo.desc && isFull && (
                    <span className="text-[9px] text-white/40 ml-1 hidden sm:inline truncate">{royaltyInfo.desc}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My hand */}
      {isPlacing && (
        <div
          className="bg-white/10 backdrop-blur rounded-xl p-3 space-y-2 border border-white/20"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={handleDropToHand}
        >
          <div className="text-xs text-white/50 font-medium text-center">
            {selectedCard
              ? `${t('game.selectedCard')} ${selectedCard.rank} — ${t('game.tapRowToPlace')}`
              : localHand.length > 0
                ? t('game.tapOrDrag')
                : t('game.allPlaced')
            }
          </div>

          {localHand.length > 0 && (
            <>
              <div className="flex gap-1 justify-center items-center flex-wrap">
                {/* Sort mode buttons */}
                {(['rank', 'suit', 'ranksuit'] as SortMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleSortHand(mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs active:scale-95 transition-all ${
                      sortMode === mode
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    {sortModeLabel(mode)}
                  </button>
                ))}
                <span className="text-white/20">|</span>
                {/* Auto-sort toggle */}
                <button
                  onClick={toggleAutoSort}
                  className={`px-2.5 py-1 rounded-lg text-xs active:scale-95 transition-all ${
                    autoSort
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : 'bg-white/10 text-white/40 hover:bg-white/20'
                  }`}
                >
                  {t('game.autoSortLabel')} {autoSort ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex gap-1 sm:gap-1.5 justify-center flex-wrap">
                {localHand.map((card) => (
                  <PlayingCard
                    key={cardKey(card)}
                    rank={card.rank}
                    suit={card.suit}
                    selected={selectedCard ? sameCard(selectedCard, card) : false}
                    onClick={() => handleCardClick(card, 'hand')}
                    draggable={!amReady}
                    onDragStart={(e) => handleDragStart(e, card, 'hand')}
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-center">
            {(localBoard.front.length > 0 || localBoard.middle.length > 0 || localBoard.back.length > 0) && (
              <button
                onClick={handleClearAll}
                className="px-4 py-1.5 rounded-lg text-sm bg-white/10 text-white/70 hover:bg-white/20 active:scale-95 transition-all"
              >
                {t('game.clearAll')}
              </button>
            )}
            {allPlaced && (
              <button
                onClick={handleConfirm}
                className="px-8 py-2 rounded-lg text-sm bg-green-600 text-white font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg"
              >
                {t('game.confirmPlacement')}
              </button>
            )}
          </div>
        </div>
      )}

      {amReady && phase === 'placing' && (
        <div className="text-center text-green-400 font-medium text-sm py-3 bg-green-500/20 rounded-xl">
          {t('game.waitingForOthers')}
        </div>
      )}
    </div>
  );
}

function Timer({ startTime, limit }: { startTime: number; limit: number }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = Math.max(0, limit - elapsed);
  const isLow = remaining <= 10;

  return (
    <span className={`font-mono text-sm font-bold ${isLow ? 'text-red-600 animate-pulse' : 'text-emerald-200'}`}>
      {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
    </span>
  );
}
