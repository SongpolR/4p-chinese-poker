// Game state management for Chinese Poker

import { Card, createDeck, shuffleDeck } from './cards';
import { PlayerBoard, evaluateBoard, calculateRoundScores, calculateHeadToHead, ScoringResult } from './scoring';

export interface RoomConfig {
  maxPlayers: 2 | 3 | 4;
  totalRounds: number;
  turnTimeLimit: number; // seconds per turn, 0 = unlimited
  gameTimeLimit: number; // total game time in minutes, 0 = unlimited
  amountPerPoint: number;
  pinCode: string; // 4-digit pin, empty = no pin
  hostName: string;
  autoStartNextRound: boolean;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  board: PlayerBoard;
  hand: Card[]; // cards in hand (not yet placed)
  isReady: boolean;
  totalScore: number;
  roundScores: number[];
}

export interface RoundSummary {
  roundNumber: number;
  playerResults: {
    playerId: string;
    playerName: string;
    board: PlayerBoard;
    scoring: ScoringResult;
    roundPoints: number;
  }[];
  payments: { from: string; to: string; fromName: string; toName: string; amount: number; points: number }[];
}

export type GamePhase =
  | 'waiting'      // waiting for players to join
  | 'dealing'      // initial 5 cards dealt
  | 'placing'      // players placing cards
  | 'round-end'    // round summary
  | 'game-end';    // final summary

export interface GameState {
  roomId: string;
  roomCode: string;
  config: RoomConfig;
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  deck: Card[];
  deckIndex: number;
  turnNumber: number; // 1-based, 1=initial 5 cards, 2-9=one card each
  turnStartTime: number | null;
  gameStartTime: number | null;
  roundSummaries: RoundSummary[];
}

export function createEmptyBoard(): PlayerBoard {
  return { front: [], middle: [], back: [] };
}

export function createGameState(roomId: string, roomCode: string, config: RoomConfig): GameState {
  return {
    roomId,
    roomCode,
    config,
    players: [],
    phase: 'waiting',
    currentRound: 0,
    deck: [],
    deckIndex: 0,
    turnNumber: 0,
    turnStartTime: null,
    gameStartTime: null,
    roundSummaries: [],
  };
}

export function addPlayer(state: GameState, id: string, name: string, isHost: boolean): GameState {
  if (state.players.length >= state.config.maxPlayers) {
    throw new Error('Room is full');
  }
  if (state.players.find(p => p.id === id)) {
    // Player already in room, just reconnect
    return {
      ...state,
      players: state.players.map(p =>
        p.id === id ? { ...p, isConnected: true } : p
      ),
    };
  }

  return {
    ...state,
    players: [
      ...state.players,
      {
        id,
        name,
        isHost,
        isConnected: true,
        board: createEmptyBoard(),
        hand: [],
        isReady: false,
        totalScore: 0,
        roundScores: [],
      },
    ],
  };
}

export function startRound(state: GameState): GameState {
  const deck = shuffleDeck(createDeck());
  const players = state.players.map(p => ({
    ...p,
    board: createEmptyBoard(),
    hand: [] as Card[],
    isReady: false,
  }));

  // Deal all 13 cards to each player at once
  let deckIndex = 0;
  for (let i = 0; i < players.length; i++) {
    players[i] = { ...players[i], hand: deck.slice(deckIndex, deckIndex + 13) };
    deckIndex += 13;
  }

  return {
    ...state,
    phase: 'placing',
    currentRound: state.currentRound + 1,
    deck,
    deckIndex,
    turnNumber: 1,
    players,
    turnStartTime: Date.now(),
    gameStartTime: state.gameStartTime || Date.now(),
  };
}

export function placeCards(
  state: GameState,
  playerId: string,
  placements: { card: Card; row: 'front' | 'middle' | 'back' }[]
): GameState {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) throw new Error('Player not found');

  const player = { ...state.players[playerIndex] };
  const board = {
    front: [...player.board.front],
    middle: [...player.board.middle],
    back: [...player.board.back],
  };
  const hand = [...player.hand];

  for (const { card, row } of placements) {
    const cardIndex = hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
    if (cardIndex === -1) throw new Error('Card not in hand');

    if (row === 'front' && board.front.length >= 3) throw new Error('Front row is full');
    if (row === 'middle' && board.middle.length >= 5) throw new Error('Middle row is full');
    if (row === 'back' && board.back.length >= 5) throw new Error('Back row is full');

    board[row].push(card);
    hand.splice(cardIndex, 1);
  }

  player.board = board;
  player.hand = hand;
  player.isReady = hand.length === 0;

  const players = [...state.players];
  players[playerIndex] = player;

  return { ...state, players };
}

export function allPlayersReady(state: GameState): boolean {
  return state.players.every(p => p.isReady);
}

export function dealNextCards(state: GameState): GameState {
  if (state.turnNumber >= 9) {
    return evaluateRound(state);
  }

  const players = state.players.map(p => ({ ...p, isReady: false }));

  // Deal 1 card to each player
  let deckIdx = state.deckIndex;
  for (let i = 0; i < players.length; i++) {
    players[i] = { ...players[i], hand: [state.deck[deckIdx]] };
    deckIdx++;
  }

  return {
    ...state,
    players,
    deckIndex: deckIdx,
    turnNumber: state.turnNumber + 1,
    turnStartTime: Date.now(),
  };
}

export function evaluateRound(state: GameState): GameState {
  const boardResults = state.players.map(p => evaluateBoard(p.board));
  const roundPoints = calculateRoundScores(boardResults);

  const playerResults = state.players.map((p, i) => ({
    playerId: p.id,
    playerName: p.name,
    board: p.board,
    scoring: boardResults[i],
    roundPoints: roundPoints[i],
  }));

  // Calculate payments between each pair
  const payments: RoundSummary['payments'] = [];
  const playerCount = state.players.length;
  for (let i = 0; i < state.players.length; i++) {
    for (let j = i + 1; j < state.players.length; j++) {
      const { aPoints } = calculateHeadToHead(boardResults[i], boardResults[j], playerCount);
      if (aPoints > 0) {
        payments.push({
          from: state.players[j].id,
          to: state.players[i].id,
          fromName: state.players[j].name,
          toName: state.players[i].name,
          points: aPoints,
          amount: aPoints * state.config.amountPerPoint,
        });
      } else if (aPoints < 0) {
        payments.push({
          from: state.players[i].id,
          to: state.players[j].id,
          fromName: state.players[i].name,
          toName: state.players[j].name,
          points: Math.abs(aPoints),
          amount: Math.abs(aPoints) * state.config.amountPerPoint,
        });
      }
    }
  }

  const roundSummary: RoundSummary = {
    roundNumber: state.currentRound,
    playerResults,
    payments,
  };

  const players = state.players.map((p, i) => ({
    ...p,
    totalScore: p.totalScore + roundPoints[i],
    roundScores: [...p.roundScores, roundPoints[i]],
  }));

  const isLastRound = state.config.totalRounds > 0 && state.currentRound >= state.config.totalRounds;
  const isTimeUp = state.config.gameTimeLimit > 0 && state.gameStartTime
    ? (Date.now() - state.gameStartTime) >= state.config.gameTimeLimit * 60 * 1000
    : false;

  return {
    ...state,
    players,
    phase: isLastRound || isTimeUp ? 'game-end' : 'round-end',
    roundSummaries: [...state.roundSummaries, roundSummary],
    turnNumber: 0,
  };
}

export function getCardCount(board: PlayerBoard): number {
  return board.front.length + board.middle.length + board.back.length;
}
