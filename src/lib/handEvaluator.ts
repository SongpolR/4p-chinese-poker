// Hand evaluation for Chinese poker rows

import { Card, RANK_VALUES, SUIT_VALUES, Rank, Suit } from './cards';

export type HandRank =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface HandResult {
  rank: HandRank;
  value: number; // numeric value for comparison
  description: string;
  kickers: number[]; // for tiebreaking by rank
  kickerSuits: Suit[]; // suit for each kicker (Spades > Hearts > Diamonds > Clubs)
}

const HAND_RANK_VALUES: Record<HandRank, number> = {
  'high-card': 0,
  'pair': 1,
  'two-pair': 2,
  'three-of-a-kind': 3,
  'straight': 4,
  'flush': 5,
  'full-house': 6,
  'four-of-a-kind': 7,
  'straight-flush': 8,
  'royal-flush': 9,
};

interface RankGroup {
  rank: Rank;
  value: number;
  count: number;
  cards: Card[];
}

function getRankGroups(cards: Card[]): RankGroup[] {
  const map = new Map<Rank, Card[]>();
  for (const c of cards) {
    const arr = map.get(c.rank) || [];
    arr.push(c);
    map.set(c.rank, arr);
  }
  return Array.from(map.entries())
    .map(([rank, group]) => ({ rank, value: RANK_VALUES[rank], count: group.length, cards: group }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
}

function maxSuit(cards: Card[]): Suit {
  return cards.reduce((best, c) => SUIT_VALUES[c.suit] > SUIT_VALUES[best] ? c.suit : best, cards[0].suit);
}

function isFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  return cards.every(c => c.suit === cards[0].suit);
}

function isStraight(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  // A-2-3-4-5 wheel
  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    return true;
  }
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) return false;
  }
  return true;
}

function getStraightHighCard(cards: Card[]): Card {
  const sorted = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  // Wheel: A-2-3-4-5, the "high" card by straight rules is the 5
  const isWheel = RANK_VALUES[sorted[0].rank] === 14 && RANK_VALUES[sorted[1].rank] === 5;
  if (isWheel) return sorted[1];
  return sorted[0];
}

// Evaluate a 5-card hand
export function evaluateHand5(cards: Card[]): HandResult {
  if (cards.length !== 5) throw new Error('Must have exactly 5 cards');

  const groups = getRankGroups(cards);
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  const sortedByRank = [...cards].sort(
    (a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank] || SUIT_VALUES[b.suit] - SUIT_VALUES[a.suit]
  );

  if (flush && straight) {
    const high = getStraightHighCard(cards);
    if (RANK_VALUES[high.rank] === 14) {
      return {
        rank: 'royal-flush',
        value: HAND_RANK_VALUES['royal-flush'] * 100 + 14,
        description: 'Royal Flush',
        kickers: [14],
        kickerSuits: [high.suit],
      };
    }
    return {
      rank: 'straight-flush',
      value: HAND_RANK_VALUES['straight-flush'] * 100 + RANK_VALUES[high.rank],
      description: `Straight Flush (${high.rank} high)`,
      kickers: [RANK_VALUES[high.rank]],
      kickerSuits: [high.suit],
    };
  }

  if (groups[0].count === 4) {
    return {
      rank: 'four-of-a-kind',
      value: HAND_RANK_VALUES['four-of-a-kind'] * 100 + groups[0].value,
      description: `Four ${groups[0].rank}s`,
      kickers: [groups[0].value, groups[1].value],
      kickerSuits: [maxSuit(groups[0].cards), maxSuit(groups[1].cards)],
    };
  }

  if (groups[0].count === 3 && groups[1].count === 2) {
    return {
      rank: 'full-house',
      value: HAND_RANK_VALUES['full-house'] * 100 + groups[0].value * 15 + groups[1].value,
      description: `Full House (${groups[0].rank}s full of ${groups[1].rank}s)`,
      kickers: [groups[0].value, groups[1].value],
      kickerSuits: [maxSuit(groups[0].cards), maxSuit(groups[1].cards)],
    };
  }

  if (flush) {
    return {
      rank: 'flush',
      value: HAND_RANK_VALUES['flush'] * 100 + RANK_VALUES[sortedByRank[0].rank],
      description: 'Flush',
      kickers: sortedByRank.map(c => RANK_VALUES[c.rank]),
      kickerSuits: sortedByRank.map(c => c.suit),
    };
  }

  if (straight) {
    const high = getStraightHighCard(cards);
    return {
      rank: 'straight',
      value: HAND_RANK_VALUES['straight'] * 100 + RANK_VALUES[high.rank],
      description: `Straight (${high.rank} high)`,
      kickers: [RANK_VALUES[high.rank]],
      kickerSuits: [high.suit],
    };
  }

  if (groups[0].count === 3) {
    const singles = groups.filter(g => g.count === 1);
    return {
      rank: 'three-of-a-kind',
      value: HAND_RANK_VALUES['three-of-a-kind'] * 100 + groups[0].value,
      description: `Three ${groups[0].rank}s`,
      kickers: [groups[0].value, ...singles.map(g => g.value)],
      kickerSuits: [maxSuit(groups[0].cards), ...singles.map(g => g.cards[0].suit)],
    };
  }

  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = [groups[0], groups[1]].sort((a, b) => b.value - a.value);
    const kicker = groups[2];
    return {
      rank: 'two-pair',
      value: HAND_RANK_VALUES['two-pair'] * 100 + pairs[0].value * 15 + pairs[1].value,
      description: `Two Pair`,
      kickers: [pairs[0].value, pairs[1].value, kicker.value],
      kickerSuits: [maxSuit(pairs[0].cards), maxSuit(pairs[1].cards), kicker.cards[0].suit],
    };
  }

  if (groups[0].count === 2) {
    const singles = groups.filter(g => g.count === 1);
    return {
      rank: 'pair',
      value: HAND_RANK_VALUES['pair'] * 100 + groups[0].value,
      description: `Pair of ${groups[0].rank}s`,
      kickers: [groups[0].value, ...singles.map(g => g.value)],
      kickerSuits: [maxSuit(groups[0].cards), ...singles.map(g => g.cards[0].suit)],
    };
  }

  return {
    rank: 'high-card',
    value: HAND_RANK_VALUES['high-card'] * 100 + RANK_VALUES[sortedByRank[0].rank],
    description: `High Card ${sortedByRank[0].rank}`,
    kickers: sortedByRank.map(c => RANK_VALUES[c.rank]),
    kickerSuits: sortedByRank.map(c => c.suit),
  };
}

// Evaluate a 3-card front hand (only pairs and trips matter, no straights/flushes)
export function evaluateHand3(cards: Card[]): HandResult {
  if (cards.length !== 3) throw new Error('Must have exactly 3 cards');

  const groups = getRankGroups(cards);
  const sortedByRank = [...cards].sort(
    (a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank] || SUIT_VALUES[b.suit] - SUIT_VALUES[a.suit]
  );

  if (groups[0].count === 3) {
    return {
      rank: 'three-of-a-kind',
      value: HAND_RANK_VALUES['three-of-a-kind'] * 100 + groups[0].value,
      description: `Three ${groups[0].rank}s`,
      kickers: [groups[0].value],
      kickerSuits: [maxSuit(groups[0].cards)],
    };
  }

  if (groups[0].count === 2) {
    return {
      rank: 'pair',
      value: HAND_RANK_VALUES['pair'] * 100 + groups[0].value,
      description: `Pair of ${groups[0].rank}s`,
      kickers: [groups[0].value, groups[1].value],
      kickerSuits: [maxSuit(groups[0].cards), groups[1].cards[0].suit],
    };
  }

  return {
    rank: 'high-card',
    value: RANK_VALUES[sortedByRank[0].rank],
    description: `High Card`,
    kickers: sortedByRank.map(c => RANK_VALUES[c.rank]),
    kickerSuits: sortedByRank.map(c => c.suit),
  };
}

// Compare two hand results: positive if a wins, negative if b wins, 0 if tie
// Falls back to suit ranking when card values are equal (Spades > Hearts > Diamonds > Clubs)
export function compareHands(a: HandResult, b: HandResult): number {
  if (a.value !== b.value) return a.value - b.value;
  const len = Math.min(a.kickers.length, b.kickers.length);
  for (let i = 0; i < len; i++) {
    if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
    const aSuit = a.kickerSuits?.[i];
    const bSuit = b.kickerSuits?.[i];
    if (aSuit && bSuit && aSuit !== bSuit) {
      return SUIT_VALUES[aSuit] - SUIT_VALUES[bSuit];
    }
  }
  return 0;
}
