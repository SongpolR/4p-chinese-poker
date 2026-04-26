// Card representation and deck management

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

// Suit ranking for tie-breaking: Spades > Hearts > Diamonds > Clubs
export const SUIT_VALUES: Record<Suit, number> = {
  spades: 4, hearts: 3, diamonds: 2, clubs: 1,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: 'text-gray-900', hearts: 'text-red-600',
  diamonds: 'text-red-600', clubs: 'text-gray-900',
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function cardToString(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function cardId(card: Card): string {
  return `${card.rank}_${card.suit}`;
}
