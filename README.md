# Chinese Poker

A real-time multiplayer Chinese Poker web app for 2-4 players built with Next.js.

## Features

- **2-4 Player Support** - Create rooms and invite friends via room code or link
- **Real-time Gameplay** - Automatic state polling for live updates
- **Drag & Drop / Tap to Place** - Arrange 13 cards into front (3), middle (5), and back (5) rows
- **Card Sorting** - Sort hand by rank, suit, or both (rank then suit) with auto-sort option
- **Realistic Card UI** - Cards with pip layouts, face card designs, and corner indices
- **Scoring & Royalties** - 1-6 point system with royalties per Wikipedia Chinese Poker rules
- **Foul Detection** - Warns when rows violate back >= middle >= front strength rule
- **Game Timer** - Configurable game time limit and per-turn timer
- **Bilingual** - English and Thai language support
- **Room PIN** - Optional PIN code for private rooms
- **Game History** - Completed games saved locally

## Game Rules

Each player receives 13 cards and arranges them into three rows:

| Row | Cards | Position |
|-----|-------|----------|
| Front | 3 | Top (weakest) |
| Middle | 5 | Middle |
| Back | 5 | Bottom (strongest) |

Rows must be in ascending strength: **back >= middle >= front**. Violating this is a foul.

### Scoring (1-6 Method)

- +1 point per row won against each opponent
- +3 bonus for winning all 3 rows (scoop)
- Foul: pay 6 + opponent's royalties to each non-fouled opponent

### Royalties

| Hand | Front | Middle | Back |
|------|-------|--------|------|
| Three-of-a-kind | 3 | - | - |
| Full House | - | 1 | - |
| Four-of-a-kind | - | 3 | 2 |
| Straight Flush | - | 4 | 3 |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **State**: In-memory server-side store with 1.5s client polling
- **Styling**: Tailwind CSS with dark theme

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Project Structure

```
src/
  app/              # Next.js pages and API routes
    api/game/       # Game actions (start, place, state, end, leave, extend)
    api/rooms/      # Room management (create, join, lookup)
    game/[roomId]/  # Game page
    room/create/    # Room creation page
  components/       # React components
    PlayingCard.tsx  # Card rendering with pip layouts
    GameTable.tsx    # Main game UI with drag-drop placement
    PlayerBoard.tsx  # Player board display
    RoundSummary.tsx # Round results
    GameSummary.tsx  # Final game results
  lib/              # Game logic
    cards.ts        # Card types, deck, shuffling
    handEvaluator.ts# Hand ranking (5-card and 3-card)
    scoring.ts      # Royalties, foul detection, point calculation
    gameState.ts    # Game state management
    hooks.ts        # React hooks (useGameState polling)
    i18n.tsx        # Internationalization (EN/TH)
```
