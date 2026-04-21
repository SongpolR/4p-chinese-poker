// POST /api/game/[roomId]/extend - Host extends game (add rounds or time)
import { NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/roomStore';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { playerId, addRounds, addMinutes } = await request.json();

  const state = getRoom(roomId);
  if (!state) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const player = state.players.find(p => p.id === playerId);
  if (!player?.isHost) {
    return NextResponse.json({ error: 'Only host can extend the game' }, { status: 403 });
  }

  const updated = { ...state };
  if (addRounds && addRounds > 0) {
    updated.config = { ...updated.config, totalRounds: updated.config.totalRounds + addRounds };
  }
  if (addMinutes && addMinutes > 0) {
    updated.config = { ...updated.config, gameTimeLimit: updated.config.gameTimeLimit + addMinutes };
  }

  // If game was ended, revert to round-end so host can continue
  if (updated.phase === 'game-end') {
    updated.phase = 'round-end';
  }

  updateRoom(roomId, updated);
  return NextResponse.json({ success: true, totalRounds: updated.config.totalRounds, gameTimeLimit: updated.config.gameTimeLimit });
}
