// OFC Poker scoring: royalties and point calculation

import { Card, RANK_VALUES } from './cards';
import { evaluateHand3, evaluateHand5, compareHands, HandResult } from './handEvaluator';

export interface PlayerBoard {
  front: Card[];  // 3 cards
  middle: Card[]; // 5 cards
  back: Card[];   // 5 cards
}

export interface RowResults {
  front: HandResult;
  middle: HandResult;
  back: HandResult;
}

export interface ScoringResult {
  fouled: boolean;
  rows: RowResults;
  frontRoyalty: number;
  middleRoyalty: number;
  backRoyalty: number;
  totalRoyalty: number;
  fantasyland: boolean;
}

// Front row royalties (3-card hand)
export function getFrontRoyalty(hand: HandResult, cards: Card[]): number {
  if (hand.rank === 'three-of-a-kind') {
    const val = RANK_VALUES[cards[0].rank];
    // 222=10, 333=11, ..., AAA=22
    return 10 + (val - 2);
  }
  if (hand.rank === 'pair') {
    const pairValue = hand.kickers[0];
    // 66=1, 77=2, 88=3, 99=4, 1010=5, JJ=6, QQ=7, KK=8, AA=9
    if (pairValue >= 6) return pairValue - 5;
  }
  return 0;
}

// Middle row royalties (5-card hand)
export function getMiddleRoyalty(hand: HandResult): number {
  const royalties: Record<string, number> = {
    'three-of-a-kind': 2,
    'straight': 4,
    'flush': 8,
    'full-house': 12,
    'four-of-a-kind': 20,
    'straight-flush': 30,
    'royal-flush': 50,
  };
  return royalties[hand.rank] || 0;
}

// Back row royalties (5-card hand)
export function getBackRoyalty(hand: HandResult): number {
  const royalties: Record<string, number> = {
    'straight': 2,
    'flush': 4,
    'full-house': 6,
    'four-of-a-kind': 10,
    'straight-flush': 15,
    'royal-flush': 25,
  };
  return royalties[hand.rank] || 0;
}

// Check if board is fouled (rows not in ascending strength order)
export function isFouled(rows: RowResults): boolean {
  // back >= middle >= front
  if (compareHands(rows.back, rows.middle) < 0) return true;
  if (compareHands(rows.middle, rows.front) < 0) return true;
  return false;
}

// Check if player qualifies for fantasyland
export function qualifiesForFantasyland(rows: RowResults, front: Card[]): boolean {
  // QQ or better in front, without fouling
  if (rows.front.rank === 'pair' && rows.front.kickers[0] >= RANK_VALUES['Q']) return true;
  if (rows.front.rank === 'three-of-a-kind') return true;
  return false;
}

// Check if player stays in fantasyland
export function staysInFantasyland(rows: RowResults): boolean {
  // Any trips on top, full house+ in middle, quads+ on bottom
  if (rows.front.rank === 'three-of-a-kind') return true;
  const middleKeepers = ['full-house', 'four-of-a-kind', 'straight-flush', 'royal-flush'];
  if (middleKeepers.includes(rows.middle.rank)) return true;
  const backKeepers = ['four-of-a-kind', 'straight-flush', 'royal-flush'];
  if (backKeepers.includes(rows.back.rank)) return true;
  return false;
}

// Evaluate a complete player board
export function evaluateBoard(board: PlayerBoard): ScoringResult {
  const front = evaluateHand3(board.front);
  const middle = evaluateHand5(board.middle);
  const back = evaluateHand5(board.back);
  const rows = { front, middle, back };
  const fouled = isFouled(rows);

  if (fouled) {
    return {
      fouled: true,
      rows,
      frontRoyalty: 0,
      middleRoyalty: 0,
      backRoyalty: 0,
      totalRoyalty: 0,
      fantasyland: false,
    };
  }

  const frontRoyalty = getFrontRoyalty(front, board.front);
  const middleRoyalty = getMiddleRoyalty(middle);
  const backRoyalty = getBackRoyalty(back);

  return {
    fouled: false,
    rows,
    frontRoyalty,
    middleRoyalty,
    backRoyalty,
    totalRoyalty: frontRoyalty + middleRoyalty + backRoyalty,
    fantasyland: qualifiesForFantasyland(rows, board.front),
  };
}

// Calculate points between two players using 1-6 scoring
export function calculateHeadToHead(
  a: ScoringResult,
  b: ScoringResult
): { aPoints: number; bPoints: number } {
  // If both foul, 0-0
  if (a.fouled && b.fouled) return { aPoints: 0, bPoints: 0 };

  // If one fouls, other gets 6 + their royalties
  if (a.fouled) return { aPoints: -(6 + b.totalRoyalty), bPoints: 6 + b.totalRoyalty };
  if (b.fouled) return { aPoints: 6 + a.totalRoyalty, bPoints: -(6 + a.totalRoyalty) };

  let aRowWins = 0;
  let bRowWins = 0;

  // Compare each row
  const frontCmp = compareHands(a.rows.front, b.rows.front);
  if (frontCmp > 0) aRowWins++;
  else if (frontCmp < 0) bRowWins++;

  const middleCmp = compareHands(a.rows.middle, b.rows.middle);
  if (middleCmp > 0) aRowWins++;
  else if (middleCmp < 0) bRowWins++;

  const backCmp = compareHands(a.rows.back, b.rows.back);
  if (backCmp > 0) aRowWins++;
  else if (backCmp < 0) bRowWins++;

  // Basic points: +1 per row won, -1 per row lost
  let aPoints = aRowWins - bRowWins;
  let bPoints = bRowWins - aRowWins;

  // Scoop bonus: +3 for winning all 3 rows
  if (aRowWins === 3) { aPoints += 3; bPoints -= 3; }
  if (bRowWins === 3) { bPoints += 3; aPoints -= 3; }

  // Add royalties
  aPoints += a.totalRoyalty - b.totalRoyalty;
  bPoints += b.totalRoyalty - a.totalRoyalty;

  return { aPoints, bPoints };
}

// Calculate round scores for all players
export function calculateRoundScores(
  boards: ScoringResult[]
): number[] {
  const scores = new Array(boards.length).fill(0);

  for (let i = 0; i < boards.length; i++) {
    for (let j = i + 1; j < boards.length; j++) {
      const { aPoints, bPoints } = calculateHeadToHead(boards[i], boards[j]);
      scores[i] += aPoints;
      scores[j] += bPoints;
    }
  }

  return scores;
}
