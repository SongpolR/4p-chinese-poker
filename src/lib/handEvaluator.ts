// Hand evaluation for OFC poker rows

import { Card, RANK_VALUES, Rank } from './cards';

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
  kickers: number[]; // for tiebreaking
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

function getRankCounts(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}

function getSortedValues(cards: Card[]): number[] {
  return cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
}

function isFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  return cards.every(c => c.suit === cards[0].suit);
}

function isStraight(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  const values = getSortedValues(cards);
  // Check A-2-3-4-5 (wheel)
  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    return true;
  }
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) return false;
  }
  return true;
}

function getStraightHighCard(cards: Card[]): number {
  const values = getSortedValues(cards);
  // Wheel: A-2-3-4-5, high card is 5
  if (values[0] === 14 && values[1] === 5) return 5;
  return values[0];
}

// Evaluate a 5-card hand
export function evaluateHand5(cards: Card[]): HandResult {
  if (cards.length !== 5) throw new Error('Must have exactly 5 cards');

  const counts = getRankCounts(cards);
  const values = getSortedValues(cards);
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  const groups = Array.from(counts.entries())
    .map(([rank, count]) => ({ rank, count, value: RANK_VALUES[rank] }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  if (flush && straight) {
    const high = getStraightHighCard(cards);
    if (high === 14) {
      return { rank: 'royal-flush', value: HAND_RANK_VALUES['royal-flush'] * 100 + 14, description: 'Royal Flush', kickers: [14] };
    }
    return { rank: 'straight-flush', value: HAND_RANK_VALUES['straight-flush'] * 100 + high, description: `Straight Flush (${high} high)`, kickers: [high] };
  }

  if (groups[0].count === 4) {
    return {
      rank: 'four-of-a-kind',
      value: HAND_RANK_VALUES['four-of-a-kind'] * 100 + groups[0].value,
      description: `Four ${groups[0].rank}s`,
      kickers: [groups[0].value, groups[1].value],
    };
  }

  if (groups[0].count === 3 && groups[1].count === 2) {
    return {
      rank: 'full-house',
      value: HAND_RANK_VALUES['full-house'] * 100 + groups[0].value * 15 + groups[1].value,
      description: `Full House (${groups[0].rank}s full of ${groups[1].rank}s)`,
      kickers: [groups[0].value, groups[1].value],
    };
  }

  if (flush) {
    return { rank: 'flush', value: HAND_RANK_VALUES['flush'] * 100 + values[0], description: 'Flush', kickers: values };
  }

  if (straight) {
    const high = getStraightHighCard(cards);
    return { rank: 'straight', value: HAND_RANK_VALUES['straight'] * 100 + high, description: `Straight (${high} high)`, kickers: [high] };
  }

  if (groups[0].count === 3) {
    const kickers = groups.filter(g => g.count === 1).map(g => g.value).sort((a, b) => b - a);
    return {
      rank: 'three-of-a-kind',
      value: HAND_RANK_VALUES['three-of-a-kind'] * 100 + groups[0].value,
      description: `Three ${groups[0].rank}s`,
      kickers: [groups[0].value, ...kickers],
    };
  }

  if (groups[0].count === 2 && groups[1].count === 2) {
    const highPair = Math.max(groups[0].value, groups[1].value);
    const lowPair = Math.min(groups[0].value, groups[1].value);
    const kicker = groups[2].value;
    return {
      rank: 'two-pair',
      value: HAND_RANK_VALUES['two-pair'] * 100 + highPair * 15 + lowPair,
      description: `Two Pair`,
      kickers: [highPair, lowPair, kicker],
    };
  }

  if (groups[0].count === 2) {
    const kickers = groups.filter(g => g.count === 1).map(g => g.value).sort((a, b) => b - a);
    return {
      rank: 'pair',
      value: HAND_RANK_VALUES['pair'] * 100 + groups[0].value,
      description: `Pair of ${groups[0].rank}s`,
      kickers: [groups[0].value, ...kickers],
    };
  }

  return {
    rank: 'high-card',
    value: HAND_RANK_VALUES['high-card'] * 100 + values[0],
    description: `High Card ${values[0]}`,
    kickers: values,
  };
}

// Evaluate a 3-card front hand (only pairs and trips matter, no straights/flushes)
export function evaluateHand3(cards: Card[]): HandResult {
  if (cards.length !== 3) throw new Error('Must have exactly 3 cards');

  const counts = getRankCounts(cards);
  const values = getSortedValues(cards);
  const groups = Array.from(counts.entries())
    .map(([rank, count]) => ({ rank, count, value: RANK_VALUES[rank] }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  if (groups[0].count === 3) {
    return {
      rank: 'three-of-a-kind',
      value: HAND_RANK_VALUES['three-of-a-kind'] * 100 + groups[0].value,
      description: `Three ${groups[0].rank}s`,
      kickers: [groups[0].value],
    };
  }

  if (groups[0].count === 2) {
    return {
      rank: 'pair',
      value: HAND_RANK_VALUES['pair'] * 100 + groups[0].value,
      description: `Pair of ${groups[0].rank}s`,
      kickers: [groups[0].value, groups[1].value],
    };
  }

  return {
    rank: 'high-card',
    value: values[0],
    description: `High Card`,
    kickers: values,
  };
}

// Compare two hand results: positive if a wins, negative if b wins, 0 if tie
export function compareHands(a: HandResult, b: HandResult): number {
  if (a.value !== b.value) return a.value - b.value;
  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
  }
  return 0;
}
