// POST /api/game/[roomId]/start - Start game / next round
import { NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/roomStore';
import { startRound } from '@/lib/gameState';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { playerId } = await request.json();

  const state = getRoom(roomId);
  if (!state) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const player = state.players.find(p => p.id === playerId);
  if (!player?.isHost) {
    return NextResponse.json({ error: 'Only host can start the game' }, { status: 403 });
  }

  if (state.phase !== 'waiting' && state.phase !== 'round-end') {
    return NextResponse.json({ error: 'Cannot start round in current phase' }, { status: 400 });
  }

  if (state.players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 });
  }

  const updated = startRound(state);
  updateRoom(roomId, updated);

  return NextResponse.json({ success: true, round: updated.currentRound });
}
