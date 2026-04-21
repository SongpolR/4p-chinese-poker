// POST /api/game/[roomId]/place - Place cards on board
import { NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/roomStore';
import { placeCards, allPlayersReady, evaluateRound } from '@/lib/gameState';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { playerId, placements } = await request.json();

  let state = getRoom(roomId);
  if (!state) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  if (state.phase !== 'placing') {
    return NextResponse.json({ error: 'Not in placing phase' }, { status: 400 });
  }

  try {
    state = placeCards(state, playerId, placements);

    // All 13 cards dealt at once — when all players are ready, evaluate the round
    if (allPlayersReady(state)) {
      state = evaluateRound(state);
    }

    updateRoom(roomId, state);
    return NextResponse.json({ success: true, phase: state.phase });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to place cards';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
