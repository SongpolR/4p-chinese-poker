// POST /api/game/[roomId]/end - Host ends the game early
import { NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/roomStore';

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
    return NextResponse.json({ error: 'Only host can end the game' }, { status: 403 });
  }

  updateRoom(roomId, { ...state, phase: 'game-end' });
  return NextResponse.json({ success: true });
}
