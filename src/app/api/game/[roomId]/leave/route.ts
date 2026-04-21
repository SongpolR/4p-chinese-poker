// POST /api/game/[roomId]/leave - Player leaves the game
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
  if (!player) {
    return NextResponse.json({ error: 'Player not in room' }, { status: 404 });
  }

  // Mark player as disconnected
  const updated = {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, isConnected: false } : p
    ),
  };

  // If all players disconnected, end the game
  const connectedPlayers = updated.players.filter(p => p.isConnected);
  if (connectedPlayers.length < 2) {
    updated.phase = 'game-end';
  }

  updateRoom(roomId, updated);
  return NextResponse.json({ success: true });
}
