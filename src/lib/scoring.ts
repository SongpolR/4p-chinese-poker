// Chinese Poker scoring: royalties and point calculation

import { Card, RANK_VALUES } from './cards';
import { evaluateHand3, evaluateHand5, compareHands, HandResult } from './handEvaluator';

export interface PlayerBoard {
  front: Card[];  // 3 cards (Top)
  middle: Card[]; // 5 cards (Middle)
  back: Card[];   // 5 cards (Bottom)
}

export interface RowResults {
  front: HandResult;
  middle: HandResult;
  back: HandResult;
}

export interface ScoringResult {
  fouled: boolean;
  dragon: boolean;
  rows: RowResults;
  frontRoyalty: number;
  middleRoyalty: number;
  backRoyalty: number;
  dragonBonus: number;
  totalRoyalty: number;
}

// Top hand royalties (3 cards):
//   Three Aces → +10, Three of a Kind → +5, Pair of Aces → +2
export function getFrontRoyalty(hand: HandResult, cards: Card[]): number {
  if (hand.rank === 'three-of-a-kind') {
    return cards[0].rank === 'A' ? 10 : 5;
  }
  if (hand.rank === 'pair') {
    // First kicker is the pair value
    if (hand.kickers[0] === RANK_VALUES['A']) return 2;
  }
  return 0;
}

// Middle hand royalties (5 cards):
//   RSF → +20, SF → +14, Four Aces → +14, 4OAK → +12, Full House (Three Aces) → +4
export function getMiddleRoyalty(hand: HandResult): number {
  if (hand.rank === 'royal-flush') return 20;
  if (hand.rank === 'straight-flush') return 14;
  if (hand.rank === 'four-of-a-kind') {
    return hand.kickers[0] === RANK_VALUES['A'] ? 14 : 12;
  }
  if (hand.rank === 'full-house') {
    return hand.kickers[0] === RANK_VALUES['A'] ? 4 : 0;
  }
  return 0;
}

// Bottom hand royalties (5 cards):
//   RSF → +10, SF → +7, Four Aces → +7, 4OAK → +6, Full House (Three Aces) → +2
export function getBackRoyalty(hand: HandResult): number {
  if (hand.rank === 'royal-flush') return 10;
  if (hand.rank === 'straight-flush') return 7;
  if (hand.rank === 'four-of-a-kind') {
    return hand.kickers[0] === RANK_VALUES['A'] ? 7 : 6;
  }
  if (hand.rank === 'full-house') {
    return hand.kickers[0] === RANK_VALUES['A'] ? 2 : 0;
  }
  return 0;
}

// Dragon: all 13 cards form a complete sequence 2..A (i.e. one of each rank).
export function isDragon(board: PlayerBoard): boolean {
  const all = [...board.front, ...board.middle, ...board.back];
  if (all.length !== 13) return false;
  const ranks = new Set(all.map(c => c.rank));
  return ranks.size === 13;
}

export const DRAGON_BONUS = 40;

// Check if board is fouled (rows not in ascending strength order)
export function isFouled(rows: RowResults): boolean {
  if (compareHands(rows.back, rows.middle) < 0) return true;
  if (compareHands(rows.middle, rows.front) < 0) return true;
  return false;
}

// Evaluate a complete player board
export function evaluateBoard(board: PlayerBoard): ScoringResult {
  const front = evaluateHand3(board.front);
  const middle = evaluateHand5(board.middle);
  const back = evaluateHand5(board.back);
  const rows = { front, middle, back };
  const fouled = isFouled(rows);
  const dragon = isDragon(board);

  if (fouled) {
    return {
      fouled: true,
      dragon,
      rows,
      frontRoyalty: 0,
      middleRoyalty: 0,
      backRoyalty: 0,
      dragonBonus: 0,
      totalRoyalty: 0,
    };
  }

  const frontRoyalty = getFrontRoyalty(front, board.front);
  const middleRoyalty = getMiddleRoyalty(middle);
  const backRoyalty = getBackRoyalty(back);
  const dragonBonus = dragon ? DRAGON_BONUS : 0;

  return {
    fouled: false,
    dragon,
    rows,
    frontRoyalty,
    middleRoyalty,
    backRoyalty,
    dragonBonus,
    totalRoyalty: frontRoyalty + middleRoyalty + backRoyalty + dragonBonus,
  };
}

// Calculate points between two players using row-by-row scoring.
// playerCount is used for the Derby multiplier (winning all 3 rows multiplies the head-to-head total by N).
export function calculateHeadToHead(
  a: ScoringResult,
  b: ScoringResult,
  playerCount: number = 2
): { aPoints: number; bPoints: number; derby: boolean } {
  // Both foul → no exchange
  if (a.fouled && b.fouled) return { aPoints: 0, bPoints: 0, derby: false };

  // Foul: opponent gets a flat penalty plus their own royalties (no Derby on foul).
  const FOUL_PENALTY = 6;
  if (a.fouled) {
    const pts = FOUL_PENALTY + b.totalRoyalty;
    return { aPoints: -pts, bPoints: pts, derby: false };
  }
  if (b.fouled) {
    const pts = FOUL_PENALTY + a.totalRoyalty;
    return { aPoints: pts, bPoints: -pts, derby: false };
  }

  let aRowWins = 0;
  let bRowWins = 0;

  const frontCmp = compareHands(a.rows.front, b.rows.front);
  if (frontCmp > 0) aRowWins++;
  else if (frontCmp < 0) bRowWins++;

  const middleCmp = compareHands(a.rows.middle, b.rows.middle);
  if (middleCmp > 0) aRowWins++;
  else if (middleCmp < 0) bRowWins++;

  const backCmp = compareHands(a.rows.back, b.rows.back);
  if (backCmp > 0) aRowWins++;
  else if (backCmp < 0) bRowWins++;

  // 1 point per row won, plus royalty difference
  let aPoints = (aRowWins - bRowWins) + (a.totalRoyalty - b.totalRoyalty);
  let bPoints = -aPoints;

  // Derby: winning all 3 rows multiplies the head-to-head total by playerCount
  let derby = false;
  if (aRowWins === 3 || bRowWins === 3) {
    derby = true;
    aPoints *= playerCount;
    bPoints *= playerCount;
  }

  return { aPoints, bPoints, derby };
}

// Calculate round scores for all players
export function calculateRoundScores(boards: ScoringResult[]): number[] {
  const scores = new Array(boards.length).fill(0);
  const playerCount = boards.length;

  for (let i = 0; i < boards.length; i++) {
    for (let j = i + 1; j < boards.length; j++) {
      const { aPoints, bPoints } = calculateHeadToHead(boards[i], boards[j], playerCount);
      scores[i] += aPoints;
      scores[j] += bPoints;
    }
  }

  return scores;
}
