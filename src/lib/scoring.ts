// Chinese Poker scoring: royalties and point calculation

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
}

// Front row royalties (3-card hand)
// Per Wikipedia Chinese poker rules: three-of-a-kind = 3
export function getFrontRoyalty(hand: HandResult, cards: Card[]): number {
  if (hand.rank === 'three-of-a-kind') return 3;
  return 0;
}

// Middle row royalties (5-card hand)
// Per Wikipedia: full-house = 1, four-of-a-kind = 3, straight-flush = 4
export function getMiddleRoyalty(hand: HandResult): number {
  const royalties: Record<string, number> = {
    'full-house': 1,
    'four-of-a-kind': 3,
    'straight-flush': 4,
    'royal-flush': 4,
  };
  return royalties[hand.rank] || 0;
}

// Back row royalties (5-card hand)
// Per Wikipedia: four-of-a-kind = 2, straight-flush = 3
export function getBackRoyalty(hand: HandResult): number {
  const royalties: Record<string, number> = {
    'four-of-a-kind': 2,
    'straight-flush': 3,
    'royal-flush': 3,
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
